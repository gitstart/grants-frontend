import {
  Link,
  Divider,
  Flex, IconButton, Image, Text, useToast,
} from '@chakra-ui/react';
import React from 'react';
import { useGetDaoDetailsLazyQuery } from 'src/generated/graphql';
import NavbarLayout from 'src/layout/navbarLayout';
import { getUrlForIPFSHash } from 'src/utils/ipfsUtils';
import { DAOGrant, DAOWorkspace } from 'src/types';
import supportedCurrencies from 'src/constants/supportedCurrencies';
import BrowseGrantCard from 'src/components/profile/grantCard';
import { formatAmount } from 'src/utils/formattingUtils';
import { BigNumber } from 'ethers';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import SeeMore from 'src/components/profile/see_more';
import supportedNetworks from '../src/constants/supportedNetworks.json';
import { ApiClientsContext } from './_app';

function Profile() {
  const router = useRouter();
  const toast = useToast();
  const { daoID } = router.query;

  const subgraphClient = React.useContext(ApiClientsContext)?.subgraphClient.client;
  const [getDaoDetailsQuery] = useGetDaoDetailsLazyQuery({ client: subgraphClient });

  // const [data, setData] = React.useState();
  const [workspaceData, setWorkspaceData] = React.useState<DAOWorkspace>();
  const [chainID, setChainID] = React.useState<keyof typeof supportedNetworks>();
  const [grantData, setGrantData] = React.useState<DAOGrant>();

  const [{ data: accountData }] = useAccount();

  const getDaoDetails = async () => {
    if (!subgraphClient || !daoID || typeof daoID !== 'string') return;

    try {
      const { data } = await getDaoDetailsQuery({
        variables: {
          workspaceID: daoID,
          daoID,
        },
      });
      if (data) {
        setWorkspaceData(data?.workspace!);
        setGrantData(data?.grants);
        console.log(`Supported Network: ${data?.workspace?.supportedNetworks}`);
        setChainID(parseInt(
          data?.workspace?.supportedNetworks[0].slice(6)!,
          10,
        ).toString() as keyof typeof supportedNetworks);

        console.log(supportedNetworks[chainID!]);
      }
    } catch (e) {
      // console.log(e);
      toast({
        title: 'Error loading grants',
        status: 'error',
      });
    }
  };

  React.useEffect(() => {
    getDaoDetails();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daoID]);

  const getIcon = (currency: string) => {
    if (currency === 'DAI') return '/ui_icons/brand/currency/dai.svg';
    if (currency === 'WMATIC') return '/ui_icons/brand/currency/wmatic.svg';
    return '/ui_icons/brand/currency/weth.svg';
  };

  return (
    <Flex
      direction="column"
      w={{
        base: '100%',
        sm: '70%',
        lg: '52%',
      }}
      mx="auto"
    >
      <Flex direction="column" w="100%" h="300px" align="end" pos="relative">
        <Flex
          w="100%"
          h="210px"
          bg={workspaceData?.coverImageIpfsHash ? 'white' : 'brand.500'}
        >
          {workspaceData?.coverImageIpfsHash && (
            <Image
              w="100%"
              h="210px"
              src={getUrlForIPFSHash(workspaceData?.coverImageIpfsHash)}
            />
          )}
        </Flex>

        <Flex direction="row">
          {workspaceData?.socials.map((social) => (
            <IconButton
              as={Link}
              aria-label={social.name}
              ml={3}
              mt={3}
              p={3}
              border="1px solid #E8E9E9"
              borderRadius="10px"
              icon={<Image boxSize="24px" src={`/ui_icons/profile_${social.name}.svg`} />}
              bg="white"
              boxSize="48px"
              href={social.value}
              isExternal
            />
          ))}
        </Flex>

        <Flex pos="absolute" left="5%" bottom={0} w="100%">
          <Flex direction="row" w="100%" align="end">
            <Image
              src={getUrlForIPFSHash(workspaceData?.logoIpfsHash!)}
              w="120px"
              h="120px"
            />
            <Flex direction="column" align="start" ml={5}>
              <Text variant="heading">{workspaceData?.title}</Text>
              {chainID && chainID in supportedNetworks && (
              <Flex
                direction="row"
                align="center"
                bg="#F3F4F4"
                border="1px solid #E8E9E9"
                borderRadius="8px"
                py={2}
                pr={4}
                pl={2}
              >
                <Image mr={3} boxSize="18px" src={supportedNetworks[chainID].icon} />
                <Text
                  variant="applicationText"
                  fontWeight="500"
                  color="#717A7C"
                >
                  {supportedNetworks[chainID].name}
                </Text>
              </Flex>
              )}
            </Flex>
          </Flex>
        </Flex>
      </Flex>

      {workspaceData?.about && <SeeMore text={workspaceData?.about} />}

      <Divider />

      <Text my={4} variant="heading">Browse Grants</Text>

      <Divider />

      {grantData && grantData.length > 0
          && grantData.map((grant) => {
            const grantCurrency = supportedCurrencies.find(
              (currency) => currency.id.toLowerCase()
                === grant.reward.asset.toString().toLowerCase(),
            );
            return (
              <BrowseGrantCard
                key={grant.id}
                daoIcon={getUrlForIPFSHash(grant.workspace.logoIpfsHash)}
                daoName={grant.workspace.title}
                isDaoVerified={false}
                grantTitle={grant.title}
                grantDesc={grant.summary}
                numOfApplicants={grant.numberOfApplications}
                endTimestamp={new Date(grant.deadline!).getTime()}
                grantAmount={formatAmount(grant.reward.committed)}
                grantCurrency={grantCurrency?.label ?? 'LOL'}
                grantCurrencyIcon={grantCurrency?.label ? getIcon(grantCurrency.label) : '/images/dummy/Ethereum Icon.svg'}
                isGrantVerified={BigNumber.from(grant.funding).gt(0)}
                onClick={() => {
                  if (!(accountData && accountData.address)) {
                    router.push({
                      pathname: '/connect_wallet',
                      query: { flow: '/' },
                    });
                    return;
                  }
                  router.push({
                    pathname: '/explore_grants/about_grant',
                    query: { grantID: grant.id },
                  });
                }}
              />
            );
          })}
    </Flex>
  );
}

Profile.getLayout = function getLayout(page: React.ReactElement) {
  return <NavbarLayout renderGetStarted>{page}</NavbarLayout>;
};

export default Profile;
