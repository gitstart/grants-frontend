import React from 'react'
import { AlertDialogOverlay, Button, Flex, Image, Modal, ModalBody, ModalContent, Text } from '@chakra-ui/react'
import { useRouter } from 'next/router'

const SuccessfulDomainCreationModal = ({
	isOpen,
	onClose,
	domainName,
}: {
	isOpen: boolean
	onClose: () => void
	redirect?: () => void
	domainName?: string
}) => {
	const router = useRouter()
	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			isCentered
			scrollBehavior='outside'
			size='2xl'
		>
			<AlertDialogOverlay
				background='rgba(240, 240, 247, 0.7)'
				backdropFilter='blur(10px)'
			/>

			<ModalContent
				boxShadow='none'
				filter='drop-shadow(2px 4px 40px rgba(31, 31, 51, 0.05))'
				borderRadius='base'
				fontFamily='Neue-Haas-Grotesk-Display, sans-serif'
				fontSize='1rem'
			>
				<ModalBody
					p={0}
				>
					<Image
						src='/ui_icons/domain-created-top.svg'
						w='100%'
						h='23%' />
					<Image
						src='/ui_icons/domain-created-illustration.png'
						mt='-5%'
						w='45%'
						mx='auto'
					/>
					<Text
						mt='-5%'
						variant='v2_subheading'
						fontWeight='500'
						textAlign='center'>
						Success! Your Domain is created
					</Text>
					<Flex
						align='center'
						justify='center'
						w='100%'
						mt={2}>
						<Button
							variant='link'
							onClick={
								() => {
									router.replace({ pathname: '/your_grants' })
								}
							}>
							<Text
								variant='v2_body'
								fontWeight='500'>
								{domainName ?? 'Unknown'}
								{' '}
								DAO
							</Text>
						</Button>
						<Text
							ml={1}
							variant='v2_body'
							color='black.2'>
							is now on-chain.
						</Text>
					</Flex>
					<Text
						mt={12}
						textAlign='center'>
						Next create a grant or bounty to attract builders
					</Text>
					<Flex
						align='center'
						justify='center'
						w='100%'
						my={6}>
						<Button
							variant='secondaryV2'
							onClick={
								() => {
									router.push({ pathname: '/your_grants' })
								}
							}>
							I’ll do it later
						</Button>
						<Button
							variant='primaryV2'
							ml={4}
							onClick={
								() => {
									router.push({
										pathname: '/signup',
										query: { createGrant: true },
									})
								}
							}>
							Create a grant
						</Button>
					</Flex>
				</ModalBody>
			</ModalContent>

		</Modal>
	)
}

export default SuccessfulDomainCreationModal

// height: 291px;
// width: 388.836181640625px;
// left: 591px;
// top: 53.54833984375px;
// border-radius: 0px;
