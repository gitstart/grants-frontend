import React, { useContext } from 'react'
import {
	Button,
	Image,
	Menu,
	MenuButton,
	MenuItem,
	MenuList,
	Text,
} from '@chakra-ui/react'
import { Wallet } from 'ethers'
import { useRouter } from 'next/router'
import { ApiClientsContext, GitHubTokenContext, NonceContext, ScwAddressContext, WebwalletContext } from 'pages/_app'
import { useQuestbookAccount } from 'src/hooks/gasless/useQuestbookAccount'
import { useConnect, useDisconnect } from 'wagmi'

function AccountDetails() {
	const isOnline = true
	const { data: accountData, nonce, setNonce } = useQuestbookAccount()
	const { webwallet, setWebwallet } = useContext(WebwalletContext)!
	const { scwAddress, setScwAddress } = useContext(ScwAddressContext)!
	const { isDisconnected } = useConnect() // @TODO: change the way we see if a user is connect or not
	// cause now it's only with metmask
	const { disconnect } = useDisconnect()
	const { connected, setConnected } = useContext(ApiClientsContext)!
	const { isLoggedIn, setIsLoggedIn } = useContext(GitHubTokenContext)!
	const router = useRouter()

	const formatAddress = (address: string) => `${address.substring(0, 4)}......${address.substring(address.length - 4)}`

	const buttonRef = React.useRef<HTMLButtonElement>(null)
	console.log('GITHUB TOKEN', isLoggedIn, nonce)

	React.useEffect(() => {
		console.log('SCW Address: ', scwAddress)
	}, [scwAddress])
	return (
		<Menu>
			{
				!isLoggedIn && (
					<Button
						px={2.5}
						borderRadius="2px"
						marginLeft="12px"
						onClick={
							() => {
								if(!webwallet) {
									setWebwallet(Wallet.createRandom())
								}

								window.location.href = `https://github.com/login/oauth/authorize?client_id=${process.env.CLIENT_ID}`
							}
						}
					>
						GitHub Login
					</Button>
				)
			}
			{/* {
				isLoggedIn && (
					<Button
						px={2.5}
						borderRadius="2px"
						marginLeft="12px"
						onClick={
							() => {
								setIsLoggedIn(false)
								setNonce(undefined)
							}
						}
					>
				GitHub Logout
					</Button>
				)
			} */}

			{
				isLoggedIn &&
				(
					<MenuButton
						ref={buttonRef}
						as={Button}
						variant="solid"
						px={2.5}
						py={2}
						ml={3}
						borderRadius="2px"
						rightIcon={
							!(connected && isDisconnected) && (
								<Image
									mr={2}
									src="/ui_icons/arrow-drop-down-line.svg"
									alt="options" />
							)
						}
						w={connected && isDisconnected ? buttonRef.current?.offsetWidth : 'auto'}
					>
						{
						// @TODO-gasless: FIX HERE
						// connected && isDisconnected  ? (
						// 	<Loader />
						// ) : (
						// 	<Text
						// 		color="#122224"
						// 		fontWeight="500"
						// 		fontSize="14px"
						// 		lineHeight="20px"
						// 	>
						// 		{formatAddress(scwAddress ?? (accountData?.address ?? ''))}
						// 	</Text>
						// )
							(
								<Text
									color="#122224"
									fontWeight="500"
									fontSize="14px"
									lineHeight="20px"
								>
									{formatAddress(scwAddress!)}
								</Text>
							)
						}
					</MenuButton>
				)
			}
			{
				(!(connected && isDisconnected) || (isLoggedIn)) && (
					<MenuList>
						<MenuItem
							onClick={
								() => {
									setConnected(false)
									disconnect()
									setIsLoggedIn(false)
									setNonce(undefined)
									router.replace('/')
								}
							}
							icon={<Image src="/ui_icons/logout.svg" />}
						>
							Logout
						</MenuItem>
					</MenuList>
				)
			}
		</Menu>
	)
}

export default AccountDetails
