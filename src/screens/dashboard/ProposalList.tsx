// This renders the list of proposals that show up as the first column

import { useContext } from 'react'
import { Checkbox, Flex, Text } from '@chakra-ui/react'
import logger from 'src/libraries/logger'
import ProposalCard from 'src/screens/dashboard/_components/ProposalCard'
import { DashboardContext } from 'src/screens/dashboard/Context'

function ProposalList() {
	const buildComponent = () => (
		<Flex
			w='25%'
			bg='white'
			direction='column'
			px={5}
			py={4}>
			<Text
				fontWeight='700'
				color='black.1'>
				Proposals
				<Text
					ml={1}
					display='inline-block'
					color='black.3'>
					{`(${proposals?.length})`}
				</Text>

				{/* TODO - Search Box */}

				<Flex mt={4}>
					<Checkbox
						isChecked={selectedProposals.length > 0 && selectedProposals.every((_) => _)}
						onChange={
							(e) => {
								logger.info({ value: e.target.checked }, '(Proposal List) Select All Checkbox')
								setSelectedProposals(Array(proposals.length).fill(e.target.checked))
							}
						}>
						<Text
							variant='body'
							fontWeight='400'>
							Select All
						</Text>
					</Checkbox>

					{/* TODO - Filter (Latest,..., etc) */}
				</Flex>
			</Text>
			{
				proposals.map((proposal, index) => {
					return (
						<ProposalCard
							key={proposal.id}
							proposal={proposal}
							index={index} />
					)
				})
			}
		</Flex>
	)

	const { proposals, selectedProposals, setSelectedProposals } = useContext(DashboardContext)!

	return buildComponent()
}

export default ProposalList