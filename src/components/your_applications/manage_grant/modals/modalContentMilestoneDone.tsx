import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
	Box, Button, Flex, Image, ModalBody, Text, } from '@chakra-ui/react'
import MultiLineInput from 'src/components/ui/forms/multiLineInput'
import Loader from 'src/components/ui/loader'
import { SupportedChainId } from 'src/constants/chains'
import useRequestMilestoneApproval from 'src/hooks/useRequestMilestoneApproval'
import useCustomToast from 'src/hooks/utils/useCustomToast'
import { ApplicationMilestone } from 'src/types'
import { getMilestoneMetadata } from 'src/utils/formattingUtils'

interface Props {
  chainId: SupportedChainId | undefined
  milestone: ApplicationMilestone | undefined
  onClose: () => void
}

function ModalContent({ milestone, onClose, chainId }: Props) {
	const [details, setDetails] = useState('')
	const [detailsError, setDetailsError] = useState(false)

	const { milestoneIndex, applicationId } = getMilestoneMetadata(milestone)!
	const [milestoneUpdate, setMilestoneUpdate] = useState<any>()
	const [txn, txnLink, loading, isBiconomyInitialised] = useRequestMilestoneApproval(
		milestoneUpdate,
		chainId,
		applicationId,
		milestoneIndex,
	)

	const { setRefresh } = useCustomToast(txnLink)

	const { t } = useTranslation()

	useEffect(() => {
		if(txn) {
			setMilestoneUpdate(undefined)
			onClose()
			setRefresh(true)
		}

	}, [txn])

	const markAsDone = async() => {
		if(!details) {
			setDetailsError(true)
			return
		}

		setMilestoneUpdate({ text: details })
	}

	return (
		<ModalBody maxW='521px'>
			<Flex
				direction='column'
				justify='start'
				align='center'>
				<Text
					textAlign='center'
					variant='applicationText'
					mt={6}>
					{t('/your_applications/manage_grant.mark_as_done_description')}
				</Text>
				<Flex
					mt={6}
					w='100%'>
					<MultiLineInput
						label='Milestone Summary'
						placeholder='Write the milestone summary as detailed as possible.'
						value={details}
						isError={detailsError}
						onChange={
							(e) => {
								if(detailsError) {
									setDetailsError(false)
								}

								setDetails(e.target.value)
							}
						}
						errorText='Required'
						maxLength={300}
					/>
				</Flex>
				{/* <Flex
					direction='row'
					w='100%'
					align='start'
					mt={2}>
					<Image
						mt={1}
						src='/ui_icons/info.svg' />
					<Box mr={2} />
					<Text variant='footer'>
						By pressing Mark as done you’ll have to approve this transaction in
						your wallet.
						{' '}
						<Button
							variant='link'
							color='brand.500'
							rightIcon={
								<Image
									ml={1}
									src='/ui_icons/link.svg'
									display='inline-block' />
							}
						>
							<Text
								variant='footer'
								color='brand.500'>
								Learn More
							</Text>
						</Button>
					</Text>
				</Flex> */}
				<Button
					disabled={!isBiconomyInitialised}
					w='100%'
					variant='primary'
					mt={8}
					py={loading ? 2 : 0}
					onClick={loading ? () => {} : markAsDone}>
					{loading ? <Loader /> : t('/your_applications/manage_grant.mark_as_done')}
				</Button>
				<Box mb={4} />
			</Flex>
		</ModalBody>
	)
}

export default ModalContent
