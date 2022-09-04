import { Fragment, JsonFragment } from '@ethersproject/abi/src.ts/fragments'
import axios from 'axios'
import { Contract, ethers, Wallet } from 'ethers'
import { BiconomyContext } from 'pages/_app'
import { WORKSPACE_REGISTRY_ADDRESS } from 'src/constants/addresses'
import SupportedChainId from 'src/generated/SupportedChainId'
import { BiconomyWalletClient } from 'src/types/gasless'
import { TransactionReceipt } from 'web3-core'

const EIP712_WALLET_TX_TYPE = {
	WalletTx: [
		{ type: 'address', name: 'to' },
		{ type: 'uint256', name: 'value' },
		{ type: 'bytes', name: 'data' },
		{ type: 'uint8', name: 'operation' },
		{ type: 'uint256', name: 'targetTxGas' },
		{ type: 'uint256', name: 'baseGas' },
		{ type: 'uint256', name: 'gasPrice' },
		{ type: 'address', name: 'gasToken' },
		{ type: 'address', name: 'refundReceiver' },
		{ type: 'uint256', name: 'nonce' },
	],
}

export const jsonRpcProviders: { [key: string]: ethers.providers.JsonRpcProvider } =
	{
		'80001': new ethers.providers.JsonRpcProvider('https://polygon-mumbai.g.alchemy.com/v2/X6pnQlJfJq00b8MT53QihWBINEgHZHGp'),
		'5': new ethers.providers.JsonRpcProvider('https://eth-goerli.g.alchemy.com/v2/Hr6VkBfmbJIhEW3fHJnl0ujE0xmWxcqH'),
		'137': new ethers.providers.JsonRpcProvider('https://polygon-mainnet.g.alchemy.com/v2/mmBX0eNrvs0k7UpEMwi0eIH6hC4Dqoss'),
		'10': new ethers.providers.JsonRpcProvider('https://opt-mainnet.g.alchemy.com/v2/Frv-KL7os-J7EV9e34WA0b0ayG5i1vNN')
	}

export const bicoDapps: { [key: string]: { apiKey: string, webHookId: string } } = {
	'5': {
		apiKey: 'cCEUGyH2y.37cd0d5e-704c-49e6-9f3d-e20fe5bb13d5',
		webHookId: '7726ab3f-2b4b-4a80-bfdd-c8ebb2d5ea2f',
	},
	'137': {
		apiKey: 'kcwSbypnqq.f5fe6fbd-10e3-4dfe-a731-5eb4b6d85445',
		webHookId: '202501f8-639f-495a-a1ec-d52d86db8b2d',
	},
	'10': {
		apiKey: 'xc_x_i8x3.7002d254-03f5-427e-b25f-400b52d1d4c9',
		webHookId: '105f79a9-eab0-4f8c-aa44-877ffc3f9c67'
	}
}

export const networksMapping: { [key: string]: string } = {
	'137': '137',
	'10': '10',

	// goerli 
	'5': '5',
	'4': '5',
	'900001': '5', // This is for solana.
	'1': '5',
	'100': '5',
	'42161': '5',
	'43114': '5',
	'1313161554': '5',
	'56': '5',
	'246': '5',
}

export const signNonce = async(webwallet: Wallet, nonce: string) => {
	const nonceHash = ethers.utils.hashMessage(nonce)
	const nonceSigString: string = await webwallet.signMessage(nonce)
	const nonceSig: ethers.Signature = ethers.utils.splitSignature(nonceSigString)

	return { v: nonceSig.v, r: nonceSig.r, s: nonceSig.s, transactionHash: nonceHash }
}

export const getNonce = async(webwallet: Wallet | undefined) => {
	if(!webwallet) {
		return
	}

	const response = await axios.post('https://2j6v8c5ee6.execute-api.ap-south-1.amazonaws.com/v0/refresh_nonce',
		{
			webwallet_address: webwallet.address,
		})
	if(response.data && response.data.nonce !== 'Token expired') {
		return response.data.nonce
	}

	return false
}

export const addAuthorizedOwner = async(workspaceId: number, webwalletAddress: string, scwAddress: string,
	chainId: string, safeAddress: string) => {

	const response = await axios.post('https://2j6v8c5ee6.execute-api.ap-south-1.amazonaws.com/v0/add_workspace_owner',
		{
			'workspace_id': workspaceId,
			'webwallet_address': webwalletAddress,
			'scw_address': scwAddress,
			'chain_id': chainId,
			'safe_address': safeAddress,
		})

	return !!response.data?.status
}

export const addAuthorizedUser = async(webwalletAddress: string) => {

	const response = await axios.post('https://2j6v8c5ee6.execute-api.ap-south-1.amazonaws.com/v0/add_user',
		{
			'webwallet_address': webwalletAddress,
		})

	return !!response.data?.authorize
}

export const chargeGas = async(workspaceId: number, amount: number) => {
	const response = await axios.post('https://2j6v8c5ee6.execute-api.ap-south-1.amazonaws.com/v0/charge_gas',
		{
			'workspace_id': workspaceId,
			amount,
		})
	return !!response.data?.status
}

export const deploySCW = async(webwallet: Wallet, biconomyWalletClient: BiconomyWalletClient, chainId: string, nonce: string) => {
	const signedNonce = await signNonce(webwallet, nonce)

	const webHookAttributes = {
		'webHookId': bicoDapps[chainId].webHookId, // received from the webhook register API
		'webHookData': { // whatever data object to be passed to the webhook
			'signedNonce': signedNonce,
			'nonce': nonce,
			'to': WORKSPACE_REGISTRY_ADDRESS[parseInt(chainId) as SupportedChainId],
			'chain_id': chainId,
		},
	}

	const { doesWalletExist, walletAddress } = await biconomyWalletClient.checkIfWalletExists({ eoa: webwallet.address })
	let scwAddress

	if(!doesWalletExist) {
		// console.log("deploying scw ...", biconomyWalletClient)
		const { walletAddress, txHash } = await biconomyWalletClient.checkIfWalletExistsAndDeploy({
			eoa: webwallet.address,
			webHookAttributes,
		}) // default index(salt) 0

		await getTransactionReceipt(txHash, chainId)

		scwAddress = walletAddress
	} else {
		scwAddress = walletAddress
	}

	return scwAddress
}

export const sendGaslessTransaction = async(biconomy: typeof BiconomyContext, targetContractObject: Contract, targetContractMethod: string,
	targetContractArgs: Array<string | Uint8Array | number | number[]>, targetContractAddress: string, biconomyWalletClient: BiconomyWalletClient,
	scwAddress: string, webwallet: Wallet | undefined, chainId: string, webHookId: string, nonce: string | undefined) => {

	if(!biconomy) {
		alert('Biconomy is not ready! Please wait.')
		return false
	}

	if(!webwallet) {
		alert('WebWallet is not ready! Please wait.')
		return false
	}

	if(!nonce) {
		alert('Please log in with GitHub first!')
		return false
	}

	if(nonce === 'Token expired') {
		alert('Your Session has terminated. Please log in again.')
		return false
	}

	const { data } = await targetContractObject.populateTransaction[targetContractMethod](...targetContractArgs)
	const safeTxBody = await biconomyWalletClient.buildExecTransaction({
		data,
		to: targetContractAddress,
		walletAddress: scwAddress,
	})

	const signature = await webwallet._signTypedData({
		verifyingContract: scwAddress,
		chainId: ethers.BigNumber.from(chainId),
	}, EIP712_WALLET_TX_TYPE, safeTxBody)
	// console.log('HERE4')

	let newSignature = '0x'
	newSignature += signature.slice(2)

	const signedNonce = await signNonce(webwallet, nonce)

	const webHookAttributes = {
		'webHookId': webHookId, // received from the webhook register API
		'webHookData': { // whatever data object to be passed to the webhook
			'signedNonce': signedNonce,
			'nonce': nonce,
			'to': targetContractAddress,
			'chain_id': chainId,
		},
	}

	// signature appended
	return await biconomyWalletClient.sendBiconomyWalletTransaction({
		execTransactionBody: safeTxBody,
		walletAddress: scwAddress,
		signature: newSignature,
		webHookAttributes,
	})
}

export const getTransactionReceipt = async(transactionHash: string | undefined, chainId: string) => {
	if(typeof (transactionHash) === 'undefined' || transactionHash === undefined) {
		return false
	}

	await jsonRpcProviders[chainId].waitForTransaction(transactionHash, 1)
	return await jsonRpcProviders[chainId].getTransactionReceipt(transactionHash)
}

export const getTransactionDetails = async(transactionHash: string, chainId: string) => {
	const receipt = await getTransactionReceipt(transactionHash, chainId)

	if(!receipt) {
		throw new Error('Couldn\'t fetch transaction receipt!')
	}

	const gasPrice = (await jsonRpcProviders[chainId].getTransaction(transactionHash)).gasPrice

	if(!gasPrice) {
		throw new Error('Couldn\'t fetch gas price!')
	}

	const txFeeBigInt = gasPrice?.toBigInt() * receipt.gasUsed.toBigInt()
	const txFeeEther = ethers.utils.formatEther(txFeeBigInt)
	const txFee = Number(txFeeEther).toFixed(4).toString()

	return { receipt, txFee }
}

export const getEventData = async(receipt: ethers.providers.TransactionReceipt, eventName: string, contractABI: string | ReadonlyArray<Fragment | JsonFragment | string>) => {

	const isValidEvent = (item: ethers.utils.Fragment) => {
		const fragmentItem = ethers.utils.Fragment.from(item)
		if(!fragmentItem.name || !fragmentItem.type) {
			return false
		}

		return fragmentItem.name === eventName && fragmentItem.type === 'event'
	}

	const isValidEventInReceipt = (item: TransactionReceipt['logs'][number]) => {
		try {
			eventInterface.parseLog(item)
			return true
		} catch{
			return false
		}
	}

	const abiInterface = new ethers.utils.Interface(contractABI) // this is contract's ABI
	const humanReadableABI: string | string[] = abiInterface.format(ethers.utils.FormatTypes.full) // convert to human readable ABI
	if(typeof (humanReadableABI) === 'string') {
		return false
	}

	const abiFragments = humanReadableABI.map(item => ethers.utils.Fragment.from(item))

	const eventFragment = abiFragments.filter(isValidEvent)

	if(eventFragment.length !== 1) {
		throw Error('Invalid Given Event!')
	}

	const eventInterface = new ethers.utils.Interface(eventFragment)

	const eventLogs = receipt.logs.filter(isValidEventInReceipt)

	if(eventLogs.length !== 1) {
		throw Error('Invalid Given Event!')
	}

	return eventInterface.parseLog(eventLogs[0])
}

export const registerWebHook = async (authToken: string | undefined, apiKey: string) => {
	
	if(!authToken) {
		throw new Error("No bico auth token found");
	}

	const url = 'https://api.biconomy.io/api/v1/dapp/register-webhook'

	const formData = new URLSearchParams({
		'webHook': 'https://2j6v8c5ee6.execute-api.ap-south-1.amazonaws.com/v0/check',
		'requestType': 'post', // post or get
	})

	const requestOptions = {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'authToken': authToken, 'apiKey': apiKey },
		body: formData
	}

	const response = await fetch(url, requestOptions)
	const responseJSON = await response.json()

	let webHookId = "Couldn't register webhook on workspace!"
	console.log(responseJSON)
	try {
		webHookId = responseJSON.data.webHookId
	} catch {
		throw Error("Couldn't register webhook for your app!")
	}

	return webHookId
}

export const addDapp = async(dappName: string, networkId: string, authToken: string | undefined) => {
	console.log('AUTH TOKEN', authToken)
	if(!authToken) {
		throw new Error("No bico auth token found");
	}

	const url = 'https://api.biconomy.io/api/v1/dapp/public-api/create-dapp'

	const formData = new URLSearchParams({
		'dappName': dappName,
		'networkId': networkId,
		'enableBiconomyWallet': 'true'
	})

	const requestOptions = {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'authToken': authToken },
		body: formData
	}

	const res = await fetch(url, requestOptions)
	const resJson = await res.json()

	console.log(resJson.data)

	return { apiKey: resJson.data.apiKey, fundingKey: resJson.data.fundingKey.toString() }
}