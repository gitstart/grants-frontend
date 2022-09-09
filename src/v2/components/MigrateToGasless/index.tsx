import React, { useContext, useEffect, useState } from 'react'
import { Box, Button, Flex, Image, Modal, ModalCloseButton, ModalContent, ModalOverlay, Text, useToast } from '@chakra-ui/react'
import { ApiClientsContext, WebwalletContext } from 'pages/_app'
import { defaultChainId } from 'src/constants/chains'
import { useGetWorkspacesOwnedQuery } from 'src/generated/graphql'
import SupportedChainId from 'src/generated/SupportedChainId'
import useQBContract from 'src/hooks/contracts/useQBContract'
import { useMultiChainQuery } from 'src/hooks/useMultiChainQuery'
import { getExplorerUrlForTxHash } from 'src/utils/formattingUtils'
import { delay } from 'src/utils/generics'
import logger from 'src/utils/logger'
import ConnectWalletModal from 'src/v2/components/ConnectWalletModal'
import NetworkTransactionModal from 'src/v2/components/NetworkTransactionModal'
import { useAccount, useNetwork, useSigner } from 'wagmi'

interface Props {
    isOpen: boolean
    onClose: () => void
}

const POINTERS = ['Zero gas fee across the app', 'Secure transactions', 'Seamless user experience']

function MigrateToGasless({ isOpen, onClose }: Props) {
	const toast = useToast()
	const { waitForScwAddress } = useContext(WebwalletContext)!
	const { subgraphClients } = useContext(ApiClientsContext)!

	const { address: walletAddress } = useAccount()
	const { data: signer } = useSigner()
	const { chain: walletChain } = useNetwork()

	const [isConnectWalletModalOpen, setIsConnectWalletModalOpen] = useState(false)
	const [hasDAO, setHasDAO] = useState(false)

	const workspaceContract = useQBContract('workspace', walletChain?.id as SupportedChainId, false)

	const [networkModalStep, setNetworkModalStep] = useState<number>()
	const [transactionHash, setTransactionHash] = useState<string>()

	const { results, fetchMore } = useMultiChainQuery({
		useQuery: useGetWorkspacesOwnedQuery,
		options: {
			variables: {
				actorId: walletAddress ?? ''
			}
		},
		chains: [walletChain?.id! in SupportedChainId ? walletChain?.id! : defaultChainId]
	})

	useEffect(() => {
		if(walletAddress && walletChain?.id) {
			setHasDAO(results.length > 0)
		}
	}, [results])

	useEffect(() => {
		if(walletAddress && walletChain?.id) {
			fetchMore({
				actorId: walletAddress ?? ''
			}, true)
		}
	}, [walletAddress, walletChain?.id])

	useEffect(() => {
		if(walletAddress) {
			setIsConnectWalletModalOpen(false)
		}
	}, [walletAddress])

	const migrate = async() => {
		try {
			if(!walletAddress) {
				setIsConnectWalletModalOpen(true)
				return
			}

			if(!hasDAO) {
				throw new Error('No DAO on this network! Try switching network')
			}

			if(!walletChain) {
				return
			}

			if(!(walletChain?.id in SupportedChainId)) {
				throw new Error('Connected chain not supported!')
			}

			setNetworkModalStep(0)

			while(!signer) {
				delay(2000)
			}

			const scwAddress = await waitForScwAddress
			setNetworkModalStep(1)

			logger.info({ wallet: walletAddress, scwAddress }, 'migrating to gasless')
			logger.info({ signerFromWagmi: signer, signerFromContract: workspaceContract.signer }, 'Signer')
			logger.info({ walletChain }, 'Current Chain')
			const transaction = await workspaceContract.migrateWallet(walletAddress, scwAddress)

			setNetworkModalStep(2)
			const transactionData = await transaction.wait()
			setTransactionHash(transactionData.transactionHash)

			setNetworkModalStep(3)
			await subgraphClients[walletChain?.id].waitForBlock(transactionData.blockNumber)

			setNetworkModalStep(5)

			// set to ensure ensure migration doesn't occur again
			localStorage.setItem('didMigrate', 'true')
			onClose()
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch(err: any) {
			setNetworkModalStep(undefined)
			logger.error({ err }, 'Error migrating wallet')
			toast({
				title: `Migration error "${(err as Error)?.message}"`,
				status: 'error',
				duration: 9000,
				isClosable: true,
			})
		}
	}

	return (
		<>
			<Modal
				isCentered={true}
				isOpen={isOpen}
				size='3xl'
				onClose={onClose}
			>
				<ModalOverlay />
				<ModalContent>
					<ModalCloseButton />
					<Flex>
						<Image
							w='40%'
							objectFit='cover'
							src='/accept-invite-side.png' />
						<Flex
							w='60%'
							direction='column'
							m={6}>
							<Text
								fontWeight='500'
								variant='v2_heading_3'>
								Hey, 👋
								{' '}
							</Text>
							<Text
								fontWeight='500'
								variant='v2_heading_3'>
								We have an update for you!
							</Text>
							<Text
								mt={6}
								variant='v2_title'
								fontWeight='500'>
								Questbook has launched a new Zero wallet
							</Text>
							<Flex
								direction='column'
								mt={2}
								p={4}
								boxShadow='inset 1px 1px 0px #F0F0F7, inset -1px -1px 0px #F0F0F7'
								borderRadius='4px'>
								<Text
									variant='v2_body'
									color='black.2'>
									What it means to you:
								</Text>
								{
									POINTERS.map((pointer, index) => (
										<Flex
											align='center'
											key={index}
											mt={2}>
											<Image
												src={`/ui_icons/migrate-to-gasless/${index + 1}.svg`}
												boxSize='28px' />
											<Text
												variant='v2_body'
												color='black.2'
												fontWeight='500'
												ml={3}>
												{pointer}
											</Text>
										</Flex>
									))
								}
							</Flex>
							<Flex
								bg='lightBlue.1'
								borderLeft='4px solid'
								borderColor='lightBlue.2'
								p={4}
								mt={6}>
								<Image
									src='/ui_icons/migrate-to-gasless/info.svg'
									boxSize='24px' />
								<Text
									variant='v2_body'
									ml={4}>
									To access Questbook, move your Questbook data from connected wallet to Zero wallet. You will no longer need your wallet to access Questbook. This is a secure transaction.
								</Text>
							</Flex>
							<Box mt={6} />

							<Button
								ml='auto'
								px={4}
								py={2}
								variant='primaryV2'
								rightIcon={
									<Image
										src='/ui_icons/arrow-right-fill.svg'
										boxSize='20px' />
								}
								mt='auto'
								onClick={migrate}>
								Migrate to Gasless
							</Button>
						</Flex>
					</Flex>
				</ModalContent>
			</Modal>
			<ConnectWalletModal
				isOpen={isConnectWalletModalOpen}
				onClose={() => setIsConnectWalletModalOpen(false)} />
			<NetworkTransactionModal
				currentStepIndex={networkModalStep || 0}
				isOpen={networkModalStep !== undefined}
				subtitle='Migrating your profile'
				description={
					<Flex
						direction='column'
						align='start'
						maxW='100%'>
						<Text
							fontWeight='bold'
							color='#3F8792'>
							Migrating wallet for
						</Text>
						<Text
							noOfLines={1}
							fontSize='sm'
							color='#3F8792'>
							{walletAddress ?? 'Not connected'}
						</Text>
					</Flex>
				}
				steps={
					[
						'Setting up ZeroWallet',
						'Sign Migration Transaction',
						'Waiting for confirmation',
						'Wait for indexing to complete',
						'Migration successful'
					]
				}
				viewLink={getExplorerUrlForTxHash(walletChain?.id, transactionHash)}
				onClose={() => setNetworkModalStep(undefined)}
			/>
		</>
	)
}

export default MigrateToGasless