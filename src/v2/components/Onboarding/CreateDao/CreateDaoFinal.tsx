import { useEffect, useState } from 'react'
import { Box, Flex, Heading, Skeleton, Text } from '@chakra-ui/react'
import { formatEther } from 'ethers/lib/utils'
import { CHAIN_INFO } from 'src/constants/chains'
import useQBContract from 'src/hooks/contracts/useQBContract'
import { GasStation } from 'src/v2/assets/custom chakra icons/GasStation'
import { useProvider } from 'wagmi'
import { NetworkSelectOption } from '../SupportedNetworksData'
import ContinueButton from '../UI/Misc/ContinueButton'
import DaoImageUpload from '../UI/Misc/DaoImageUpload'

const CreateDaoFinal = ({
	daoName,
	daoNetwork,
	daoImageFile,
	onImageFileChange,
	onSubmit,
	isBiconomyInitialised
}: {
  daoName: string,
  daoNetwork: NetworkSelectOption,
	daoImageFile: File | null,
	onImageFileChange: (image: File | null) => void,
	onSubmit: (() => Promise<void>) | null,
	isBiconomyInitialised: string
}) => {
	console.log('HHHH', isBiconomyInitialised, onSubmit)
	const provider = useProvider()
	const [ gasEstimate, setGasEstimate ] = useState<string>()
	const [newDaoImageFile, setNewDaoImageFile] = useState<File | null>(null)

	const workspaceRegistryContract = useQBContract(
		'workspace',
		daoNetwork.id,
	)

	useEffect(() => {
		if(daoImageFile && !newDaoImageFile) {
			setNewDaoImageFile(daoImageFile)
		}
	}, [daoImageFile])

	const estimateCreateWorkspace = async(hash: string) => {
		setGasEstimate(undefined)
		try {
			const estimate = await workspaceRegistryContract.estimateGas.createWorkspace(hash, new Uint8Array(32), 0)
			const gasPrice = await provider.getGasPrice()
			setGasEstimate(formatEther(estimate.mul(gasPrice)))
		} catch(e) {
			// console.log(e)
			// console.log('error', Date.now())
			// console.log(workspaceRegistryContract)

			// @TODO
			// getting cannot estimate gas error unpredictably
		}
	}

	useEffect(() => {
		if(workspaceRegistryContract.signer !== null && provider !== null) {
			estimateCreateWorkspace('0000000000000000000000000000000000000000000000')
		}
	}, [workspaceRegistryContract, provider])

	useEffect(() => {
		onImageFileChange(newDaoImageFile)
	}, [newDaoImageFile])

	return (
		<>
			<Heading variant={'small'}>
        My DAO
			</Heading>
			<Flex mt={6}>

				<DaoImageUpload
					daoImageFile={newDaoImageFile}
					setDaoImageFile={setNewDaoImageFile} />

				<Flex
					ml={4}
					direction={'column'}>
					<Text
						fontWeight={'500'}
						fontSize={'2xl'}
					>
						{daoName}
					</Text>
					<Box
						display={'inline-flex'}
						alignItems={'center'}
						p={0}
						m={0}
						mt={'10.32px'}
					>
						<Box boxSize={5}>
							{daoNetwork.icon}
						</Box>
						<Text
							ml={1}
							mt={'1.5px'}
							fontWeight={'700'}
							fontSize={'sm'}
							color={'brandSubtext'}
						>
							{daoNetwork.label}
						</Text>
					</Box>
				</Flex>
			</Flex>

			<Flex
				mt={14}
				justifyContent={'center'}
			>
				<Skeleton isLoaded={gasEstimate !== undefined}>
					<Flex
						bg={'#F0F0F7'}
						borderRadius={'base'}
						px={3}>
						<GasStation
							color={'#89A6FB'}
							boxSize={5} />
						<Text
							ml={2}
							mt={'1.5px'}
							fontSize={'xs'}>
              Network Fee -
							{' '}
							{gasEstimate}
							{' '}
							{CHAIN_INFO[daoNetwork.id].nativeCurrency.symbol}
						</Text>
					</Flex>
				</Skeleton>
			</Flex>

			<Flex
				mt={4}
				justifyContent={'center'}
			>
				<ContinueButton
					onClick={() => onSubmit!()}
					disabled={onSubmit === null || isBiconomyInitialised !== 'ready'}
					props={
						{
							minW: '343px',
							variant: 'primaryLightV2'
						}
					}
					content={
						<>
            Create Dao
						</>
					}
				/>
			</Flex>
		</>
	)
}

export default CreateDaoFinal