import { useContext, useEffect, useRef, useState } from 'react'
import { ToastId, useToast } from '@chakra-ui/react'
import { Wallet } from 'ethers'
import { useRouter } from 'next/router'
import { ApiClientsContext } from 'pages/_app'
import { WebwalletContext } from 'pages/_app'
import ErrorToast from 'src/components/ui/toasts/errorToast'
import { WORKSPACE_REGISTRY_ADDRESS } from 'src/constants/addresses'
import WorkspaceRegistryAbi from 'src/contracts/abi/WorkspaceRegistryAbi.json'
import useQBContract from 'src/hooks/contracts/useQBContract'
import { useBiconomy } from 'src/hooks/gasless/useBiconomy'
import { useQuestbookAccount } from 'src/hooks/gasless/useQuestbookAccount'
import getErrorMessage from 'src/utils/errorUtils'
import {
	apiKey,
	getTransactionReceipt,
	sendGaslessTransaction,
	webHookId
} from 'src/utils/gaslessUtils'
import { uploadToIPFS } from 'src/utils/ipfsUtils'
import { getSupportedValidatorNetworkFromChainId } from 'src/utils/validationUtils'
import CreateDaoFinal from 'src/v2/components/Onboarding/CreateDao/CreateDaoFinal'
import CreateDaoNameInput from 'src/v2/components/Onboarding/CreateDao/CreateDaoNameInput'
import CreateDaoNetworkSelect from 'src/v2/components/Onboarding/CreateDao/CreateDaoNetworkSelect'
import { NetworkSelectOption } from 'src/v2/components/Onboarding/SupportedNetworksData'
import CreateDaoModal from 'src/v2/components/Onboarding/UI/CreateDaoModal'
import BackgroundImageLayout from 'src/v2/components/Onboarding/UI/Layout/BackgroundImageLayout'
import OnboardingCard from 'src/v2/components/Onboarding/UI/Layout/OnboardingCard'
import { useNetwork } from 'src/hooks/gasless/useNetwork'

const OnboardingCreateDao = () => {
	const router = useRouter()
	const { data: accountData, nonce } = useQuestbookAccount()

	const [step, setStep] = useState(0)
	const [daoName, setDaoName] = useState<string>()
	const [daoNetwork, setDaoNetwork] = useState<NetworkSelectOption>()
	const [daoImageFile, setDaoImageFile] = useState<File | null>(null)
	const [callOnContractChange, setCallOnContractChange] = useState(false)
	const [currentStep, setCurrentStep] = useState<number>()
	const { network } = useNetwork();

	const { webwallet, setWebwallet } = useContext(WebwalletContext)!
	console.log("THIS IS WEBWALLRT", webwallet);
	const { switchNetwork } = useNetwork();
	// console.log(daoNetwork?.id.toString())

	const { biconomyDaoObj: biconomy, biconomyWalletClient, scwAddress } = useBiconomy({
		apiKey: apiKey,
		targetContractABI: WorkspaceRegistryAbi,
		chainId: network
	})

	const [isBiconomyInitialised, setIsBiconomyInitialised] = useState('not ready')

	useEffect(() => {
		if(biconomy && biconomyWalletClient && scwAddress) {
			setIsBiconomyInitialised('ready')
		}
	}, [biconomy, biconomyWalletClient, scwAddress])


	const targetContractObject = useQBContract('workspace', daoNetwork?.id)

	const { validatorApi } = useContext(ApiClientsContext)!
	const toastRef = useRef<ToastId>()
	const toast = useToast()

	const createWorkspace = async() => {
		setCallOnContractChange(false)
		setCurrentStep(0)
		try {
			// if(activeChain?.id !== daoNetwork?.id) {
			// 	console.log('switching')
			// 	// await switchNetworkAsync!(daoNetwork?.id)
			// 	console.log('create workspace again on contract object update')
			// 	setCallOnContractChange(true)
			// 	setTimeout(() => {
			// 		if(callOnContractChange && activeChain?.id !== daoNetwork?.id) {
			// 			setCallOnContractChange(false)
			// 			throw new Error('Error switching network')
			// 		}
			// 	}, 60000)
			// 	return
			// }

			console.log('creating workspace')
			setCurrentStep(1)
			const uploadedImageHash = (await uploadToIPFS(daoImageFile)).hash
			const {
				data: { ipfsHash },
			} = await validatorApi.validateWorkspaceCreate({
				title: daoName!,
				about: '',
				logoIpfsHash: uploadedImageHash,
				creatorId: accountData!.address,
				socials: [],
				supportedNetworks: [
					getSupportedValidatorNetworkFromChainId(daoNetwork!.id),
				],
			})
			if(!ipfsHash) {
				throw new Error('Error validating grant data')
			}

			if(!daoNetwork) {

				throw new Error('No network specified')
			}

			setCurrentStep(2)


			if(typeof biconomyWalletClient === 'string' || !biconomyWalletClient || !scwAddress) {
				return
			}

			const transactionHash = await sendGaslessTransaction(
				biconomy,
				targetContractObject,
				'createWorkspace',
				[ipfsHash, new Uint8Array(32), 0],
				WORKSPACE_REGISTRY_ADDRESS[daoNetwork.id],
				biconomyWalletClient,
				scwAddress,
				webwallet,
				`${daoNetwork.id}`,
				webHookId,
				nonce
			)

			await getTransactionReceipt(transactionHash, daoNetwork.id.toString())

			setCurrentStep(3)

			setCurrentStep(5)
			setTimeout(() => {
				router.push({ pathname: '/your_grants' })
			}, 2000)
		} catch(e) {
			setCurrentStep(undefined)
			const message = getErrorMessage(e)
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

	// useEffect(() => {

	// 	if(isBiconomyInitialised === "ready" && daoNetwork){
	// 		setCallOnContractChange(false)
	// 		createWorkspace()
	// 		.then(() => {setIsBiconomyInitialised("done")})
	// 	}

	// }, [targetContractObject, isBiconomyInitialised, daoNetwork])


	// Removed for implementing gasless wallet instead of injected connectors.
	// const { data: signer } = useSigner()
	// useEffect(() => {
	// 	if (!signer) {
	// 		const connector = connectors.find((x) => x.id === 'injected')
	// 		connect(connector)
	// 	}
	// }, [signer])

	const steps = [
		<CreateDaoNameInput
			key={'createdao-onboardingstep-0'}
			daoName={daoName}
			onSubmit={
				(name) => {
					setDaoName(name)
					nextClick()
				}
			}
		/>,
		<CreateDaoNetworkSelect
			key={'createdao-onboardingstep-1'}
			daoNetwork={daoNetwork}
			onSubmit={
				(network) => {
					setDaoNetwork(network);
					switchNetwork(network.id);
					console.log("NETWORK", network)
					nextClick()
				}
			}
		/>,
		<CreateDaoFinal
			key={'createdao-onboardingstep-2'}
			daoNetwork={daoNetwork!}
			daoName={daoName!}
			daoImageFile={daoImageFile}
			onImageFileChange={(image) => setDaoImageFile(image)}
			isBiconomyInitialised={isBiconomyInitialised}
			onSubmit={() => createWorkspace()}
		// 		activeChain?.id &&
		// daoNetwork?.id &&
		// ((activeChain.id !== daoNetwork.id && switchNetworkAsync) ||
		//   activeChain.id === daoNetwork.id)
		// 			? () => createWorkspace()
		// 			: null
		// 	}
		/>,
	]

	const nextClick = () => {
		if(step === 0) {
			setStep(1)
			return
		}

		if(step === 1) {
			setStep(2)
			return
		}

		router.push({
			pathname: '/',
		})
	}

	const backClick = () => {
		if(step === 2) {
			setStep(1)
			return
		}

		if(step === 1) {
			setStep(0)
			return
		}

		router.back()
	}

	return (
		<>
			<BackgroundImageLayout
				imageSrc={'/onboarding-create-dao.png'}
				imageBackgroundColor={'#C2E7DA'}
				imageProps={
					{
						mixBlendMode: 'color-dodge'
					}
				}
			>
				<OnboardingCard onBackClick={backClick}>
					{steps[step]}
				</OnboardingCard>
			</BackgroundImageLayout>
			<CreateDaoModal
				isOpen={currentStep !== undefined}
				onClose={() => { }}
				daoName={daoName}
				daoNetwork={daoNetwork}
				daoImageFile={daoImageFile}
				steps={
					[
						'Connect your wallet',
						'Uploading data to IPFS',
						'Sign transaction',
						'Waiting for transaction to complete',
						'DAO created on-chain',
					]
				}
				currentStep={currentStep}
			/>
		</>
	)
}

export default OnboardingCreateDao
