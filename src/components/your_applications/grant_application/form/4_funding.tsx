import React from 'react'
import {
	Box, Flex, Image,
	Text, } from '@chakra-ui/react'
import Dropdown from 'src/components/ui/forms/dropdown'
import MultiLineInput from 'src/components/ui/forms/multiLineInput'
import SingleLineInput from 'src/components/ui/forms/singleLineInput'
import Tooltip from 'src/components/ui/tooltip'

function Funding({
	fundingAsk,
	setFundingAsk,
	fundingAskError,
	setFundingAskError,

	fundingBreakdown,
	setFundingBreakdown,
	fundingBreakdownError,
	setFundingBreakdownError,

	rewardAmount,
	rewardCurrency,
	rewardCurrencyCoin,

	readOnly,
	grantRequiredFields,
}: {
  fundingAsk: string
  setFundingAsk: (fundingAsk: string) => void
  fundingAskError: boolean
  setFundingAskError: (fundingAskError: boolean) => void

  fundingBreakdown: string
  setFundingBreakdown: (fundingBreakdown: string) => void
  fundingBreakdownError: boolean
  setFundingBreakdownError: (fundingBreakdownError: boolean) => void

  rewardAmount: string
  rewardCurrency: string
  rewardCurrencyCoin: string

  readOnly?: boolean
  grantRequiredFields: string[]
}) {
	return (
		<>
			<Text
				fontWeight='700'
				fontSize='16px'
				lineHeight='20px'
				color='#8850EA'>
				Funding & Budget Breakdown
				<Tooltip
					icon='/ui_icons/tooltip_questionmark_brand.svg'
					label='How much funding in total would you need and explain how you would spend the money if your application is accepted.'
					placement='bottom-start'
				/>
			</Text>

			<Box mt={8} />

			<Flex
				direction='row'
				alignItems='flex-start'
				mt='24px'>
				<Image
					ml='auto'
					h='45px'
					w='45px'
					src={rewardCurrencyCoin}
				/>
				<Flex
					flex={1}
					direction='column'
					ml={3}>
					<Text fontWeight='500'>
						Grant Reward
					</Text>
					<Text
						mt='1px'
						lineHeight='20px'
						fontSize='14px'
						fontWeight='400'>
						{`${rewardAmount} ${rewardCurrency}`}
						{' '}
					</Text>
				</Flex>
			</Flex>

			<Box mt={8} />

			<Flex
				alignItems='flex-start'
				display={grantRequiredFields.includes('fundingBreakdown') ? 'flex' : 'none'}>
				<Box
					minW='160px'
					flex={1}>
					<SingleLineInput
						label='Funding Ask'
						placeholder='100'
						value={fundingAsk}
						onChange={
							(e) => {
								if(fundingAskError) {
									setFundingAskError(false)
								}

								setFundingAsk(e.target.value)
							}
						}
						isError={fundingAskError}
						errorText='Required'
						type='number'
						disabled={readOnly}
					/>
				</Box>
				<Box
					mt={5}
					ml={4}
					minW='132px'
					flex={0}>
					<Dropdown
						listItemsMinWidth='132px'
						listItems={
							[
								{
									icon: rewardCurrencyCoin,
									label: rewardCurrency,
								},
							]
						}
					/>
				</Box>
			</Flex>

			<Box mt={8} />

			<MultiLineInput
				placeholder='Write about how you plan to use the funds for your project - hiring, marketing etc.'
				label='Funding Breakdown'
				maxLength={1000}
				value={fundingBreakdown}
				onChange={
					(e) => {
						if(fundingBreakdownError) {
							setFundingBreakdownError(false)
						}

						setFundingBreakdown(e.target.value)
					}
				}
				disabled={readOnly}
				isError={fundingBreakdownError}
				errorText='Required'
				tooltip='Details on how the project will use funding to achieve goals.'
				visible={grantRequiredFields.includes('fundingBreakdown')}
			/>

		</>
	)
}

Funding.defaultProps = {
	readOnly: false,
}
export default Funding
