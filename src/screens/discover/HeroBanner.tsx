import { Button, Flex, Image, Text } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { ArrowRight } from 'src/generated/icons'

function HeroBanner() {
	const buildComponent = () => (
		<Flex
			direction='row'
			w='100%'
			alignItems='stretch'
			alignContent='stretch'
			h='460px'>
			<Flex
				bgColor='black.1'
				padding={24}
				flexDirection='column'
				textColor='white'
				width='600px'>
				<Text
					fontWeight='500'
					fontSize='40px'
					lineHeight='48px'
					color='white'>
					Home for
					<Text
						fontWeight='500'
						fontSize='40px'
						lineHeight='48px'
						color='#FFE900'
						as='span'>
						{' '}
						high quality
						{' '}
					</Text>
					{' '}
					builders
				</Text>

				<Text
					mt={2}
					fontSize='16px'
					lineHeight='24px'
					fontWeight='400'
					color='white'>
					Invite proposals from builders. Review and fund proposals with milestones - all on chain.
				</Text>

				<Flex>
					<Button
						variant='primaryLarge'
						mt={8}
						rightIcon={<ArrowRight color='white' />}
						onClick={
							() => router.push({
								pathname: '/request_proposal',
							})
						}>
						Start a grant program
					</Button>
				</Flex>

			</Flex>
			<Flex
				bgColor='brand.green'
				flexGrow={1}
				justifyContent='center'>
				<Image
					mt={10}
					src='/illustrations/Browsers.svg' />
			</Flex>
		</Flex>
	)

	const router = useRouter()

	return buildComponent()
}

export default HeroBanner