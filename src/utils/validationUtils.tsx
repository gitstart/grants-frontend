import { SupportedNetwork as SupportedValidatorNetwork } from '@questbook/service-validator-client/dist/api'
import { PublicKey } from '@solana/web3.js'
import { ethers } from 'ethers'
import { defaultChainId, SupportedChainId } from 'src/constants/chains'
import { SupportedNetwork } from 'src/generated/graphql'
import { MinimalWorkspace } from 'src/types'

const isValidEthereumAddress = (address: string) => {
	return ethers.utils.isAddress(address)
}

const isValidSolanaAddress = (address: string) => {
	try {
		//@todo: isOnCurve is not the right check here, it returns false even with right address
		return PublicKey.isOnCurve(address)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch(e: any) {
		return false
	}
}

const isValidEmail = (email: string) => {
	// noinspection RegExpRedundantEscape,RegExpSimplifiable
	const regexp = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
	return regexp.test(email)
}

/**
 * Get the numeric chain ID from the GraphQL supported network type.
 * @param chain GraphQL supported network, eg. "chain_245022926", "chain_4"
 * @returns the numeric chain ID, eg. 245022926, 4
 */
const getSupportedChainIdFromSupportedNetwork = (chain: SupportedNetwork | undefined): SupportedChainId => {
	if(chain) {
		const [, chainIdStr] = chain?.split('_')
		const chainId = +chainIdStr
		// if the chain ID is valid -- then it would be converted to a regular, non-NaN number
		// otherwise -- it's invalid and we simply return the default chain
		if(!Number.isNaN(chainId)) {
			return chainId
		}
	}

	// if the chain ID failed to decode -- return the default chain
	return defaultChainId
}

const getSupportedValidatorNetworkFromChainId = (chainId: SupportedChainId) => (
	chainId.toString() as SupportedValidatorNetwork
)

const getSupportedChainIdFromWorkspace = (workspace?: Pick<MinimalWorkspace, 'supportedNetworks'>) => {
	if(!workspace) {
		return undefined
	}

	const chainId = workspace.supportedNetworks[0] as SupportedNetwork
	return getSupportedChainIdFromSupportedNetwork(chainId)
}

export {
	isValidEthereumAddress,
	isValidSolanaAddress,
	isValidEmail,
	getSupportedChainIdFromWorkspace,
	getSupportedValidatorNetworkFromChainId,
	getSupportedChainIdFromSupportedNetwork,
}
