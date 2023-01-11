import { useContext } from 'react'
import useFunctionCall from 'src/libraries/hooks/useFunctionCall'
import logger from 'src/libraries/logger'
import { validateAndUploadToIpfs } from 'src/libraries/validator'
import { ApiClientsContext, GrantsProgramContext } from 'src/pages/_app'
import { ReviewType } from 'src/types'
import { RubricItem } from 'src/types/gen'

interface Props {
	setNetworkTransactionModalStep: (step: number | undefined) => void
	setTransactionHash: (hash: string) => void
}

function useSetRubrics({ setNetworkTransactionModalStep, setTransactionHash }: Props) {
	const { workspace, chainId } = useContext(ApiClientsContext)!
	const { grant } = useContext(GrantsProgramContext)!

	const { call, isBiconomyInitialised } = useFunctionCall({ chainId, contractName: 'reviews', setTransactionStep: setNetworkTransactionModalStep, setTransactionHash })

	const setRubrics =
		async(reviewType: ReviewType, isPrivate: boolean, items: RubricItem[]) => {
			if(!grant || !workspace) {
				return
			}

			logger.info(reviewType, 'RubricSetRequest reviewType')
			logger.info(isPrivate, 'RubricSetRequest isPrivate')
			logger.info(items, 'RubricSetRequest items')

			const rubric: {[_ in string]: {
				title: string
				details: string
				maximumPoints: number
			}} = {}

			if(reviewType === ReviewType.Rubrics) {
				for(let i = 0; i < items.length; i++) {
					rubric[i] = {
						title: items[i].title,
						details: items[i].details ?? '',
						maximumPoints: items[i].maximumPoints,
					}
				}
			} else if(reviewType === ReviewType.Voting) {
				rubric[0] = {
					title: 'Vote for',
					details: '',
					maximumPoints: 1,
				}
			} else {
				return
			}

			logger.info(rubric, 'RubricSetRequest')

			const rubricJson = {
				reviewType: reviewType === ReviewType.Rubrics ? 'rubrics' : 'voting',
				rubric: {
					isPrivate,
					rubric,
				},
			}

			logger.info(rubricJson, 'RubricSetRequest json')

			const { hash } = await validateAndUploadToIpfs('RubricSetRequest', rubricJson)

			logger.info(hash, 'RubricSetRequest hash')

			await call({
				method: 'setRubrics',
				args: [workspace.id, grant.id, hash]
			})
		}

	return {
		setRubrics, isBiconomyInitialised
	}
}

export default useSetRubrics
