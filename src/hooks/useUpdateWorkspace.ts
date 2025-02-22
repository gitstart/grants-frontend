import React, { useContext, useEffect } from 'react'
import { ToastId, useToast } from '@chakra-ui/react'
import { WorkspaceUpdateRequest } from '@questbook/service-validator-client'
import ErrorToast from 'src/components/ui/toasts/errorToast'
import { WORKSPACE_REGISTRY_ADDRESS } from 'src/constants/addresses'
import useQBContract from 'src/hooks/contracts/useQBContract'
import { useBiconomy } from 'src/hooks/gasless/useBiconomy'
import { useNetwork } from 'src/hooks/gasless/useNetwork'
import { useQuestbookAccount } from 'src/hooks/gasless/useQuestbookAccount'
import useChainId from 'src/hooks/utils/useChainId'
import { ApiClientsContext, WebwalletContext } from 'src/pages/_app'
import getErrorMessage from 'src/utils/errorUtils'
import { getExplorerUrlForTxHash } from 'src/utils/formattingUtils'
import { bicoDapps, chargeGas, getTransactionDetails, sendGaslessTransaction } from 'src/utils/gaslessUtils'
import logger from 'src/utils/logger'
import {
	getSupportedChainIdFromWorkspace,
} from 'src/utils/validationUtils'

export default function useUpdateWorkspace(
	data: WorkspaceUpdateRequest,
	setCurrentStep: (step: number | undefined) => void
) {
	const [error, setError] = React.useState<string>()
	const [loading, setLoading] = React.useState(false)
	const [incorrectNetwork, setIncorrectNetwork] = React.useState(false)
	const [transactionData, setTransactionData] = React.useState<any>()
	const { data: accountData, nonce } = useQuestbookAccount()
	const { data: networkData, switchNetwork } = useNetwork()

	const apiClients = useContext(ApiClientsContext)!
	const { validatorApi, workspace, subgraphClients } = apiClients

	const currentChainId = useChainId()
	const chainId = getSupportedChainIdFromWorkspace(workspace)
	const workspaceRegistryContract = useQBContract('workspace', chainId)

	const toastRef = React.useRef<ToastId>()
	const toast = useToast()

	const { webwallet } = useContext(WebwalletContext)!

	const { biconomyDaoObj: biconomy, biconomyWalletClient, scwAddress, loading: biconomyLoading } = useBiconomy({
		chainId: chainId?.toString()
	})

	const [isBiconomyInitialised, setIsBiconomyInitialised] = React.useState(false)

	useEffect(() => {
		if(biconomy && biconomyWalletClient && scwAddress && !biconomyLoading && chainId && biconomy.networkId &&
			biconomy.networkId.toString() === chainId.toString()) {
			setIsBiconomyInitialised(true)
		}
	}, [biconomy, biconomyWalletClient, scwAddress, biconomyLoading, isBiconomyInitialised, chainId])

	useEffect(() => {
		if(data) {
			setError(undefined)
			setIncorrectNetwork(false)
			setTransactionData(undefined)
		}
	}, [data])

	useEffect(() => {
		if(incorrectNetwork) {
			setIncorrectNetwork(false)
		}

	}, [workspaceRegistryContract])

	useEffect(() => {
		if(incorrectNetwork) {
			return
		}

		if(error) {
			return
		}

		if(loading) {
			return
		}
		// // console.log('calling createGrant');

		async function validate() {
			setLoading(true)
			// console.log(data)
			try {
				setCurrentStep(0)
				if(!biconomyWalletClient || typeof biconomyWalletClient === 'string' || !scwAddress) {
					throw new Error('Zero wallet is not ready')
				}

				const {
					data: { ipfsHash },
				} = await validatorApi.validateWorkspaceUpdate(data)
				if(!ipfsHash) {
					throw new Error('Error validating grant data')
				}

				logger.info({ ipfsHash }, 'UpdateWorkspace IPFS')

				setCurrentStep(1)

				// const updateTransaction1 = await workspaceRegistryContract.updateWorkspaceMetadata(
				// 	+workspace!.id,
				// 	ipfsHash,
				// )
				// const updateTransactionData1 = await updateTransaction1.wait()

				const response = await sendGaslessTransaction(
					biconomy,
					workspaceRegistryContract,
					'updateWorkspaceMetadata',
					[+workspace!.id,
						ipfsHash, ],
					WORKSPACE_REGISTRY_ADDRESS[currentChainId],
					biconomyWalletClient,
					scwAddress,
					webwallet,
					`${currentChainId}`,
					bicoDapps[currentChainId].webHookId,
					nonce
				)

				setCurrentStep(2)

				if(response) {
					const { receipt, txFee } = await getTransactionDetails(response, currentChainId.toString())
					setTransactionData(receipt)

					setCurrentStep(3)

					await subgraphClients[currentChainId].waitForBlock(receipt?.blockNumber)

					setCurrentStep(4)
					await chargeGas(Number(workspace?.id), Number(txFee), chainId)
				}

				setCurrentStep(5)

				setLoading(false)
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} catch(e: any) {
				setCurrentStep(undefined)
				const message = getErrorMessage(e)
				setError(message)
				setLoading(false)
				toastRef.current = toast({
					position: 'top',
					render: () => ErrorToast({
						content: message,
						close: () => {
							if(toastRef.current) {
								toast.close(toastRef.current)
							}
						},
					}),
				})
			}
		}

		try {
			if(!data) {
				return
			}

			if(transactionData) {
				return
			}

			if(!accountData || !accountData.address) {
				throw new Error('not connected to wallet')
			}

			if(!workspace) {
				throw new Error('not connected to workspace')
			}

			if(!currentChainId) {
				if(switchNetwork && chainId) {
					logger.info('SWITCH NETWORK (use-update-workspace.tsx 1): ', chainId)
					switchNetwork(chainId)
				}

				setIncorrectNetwork(true)
				setLoading(false)
				return
			}

			if(chainId !== currentChainId) {
				if(switchNetwork && chainId) {
					logger.info('SWITCH NETWORK (use-update-workspace.tsx 1): ', chainId)
					switchNetwork(chainId)
				}

				setIncorrectNetwork(true)
				setLoading(false)
				return
			}

			if(!validatorApi) {
				throw new Error('validatorApi or workspaceId is not defined')
			}

			if(
				!workspaceRegistryContract
				|| workspaceRegistryContract.address
				=== '0x0000000000000000000000000000000000000000'
			) {
				return
			}

			validate()
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch(e: any) {
			const message = getErrorMessage(e)
			setError(message)
			setLoading(false)
			toastRef.current = toast({
				position: 'top',
				render: () => ErrorToast({
					content: message,
					close: () => {
						if(toastRef.current) {
							toast.close(toastRef.current)
						}
					},
				}),
			})
		}

	}, [
		error,
		loading,
		toast,
		transactionData,
		workspaceRegistryContract,
		validatorApi,
		workspace,
		accountData,
		networkData,
		currentChainId,
		data,
		incorrectNetwork,
		chainId,
	])

	return [
		transactionData,
		getExplorerUrlForTxHash(currentChainId, transactionData?.transactionHash),
		loading,
		isBiconomyInitialised,
		error,
	]
}
