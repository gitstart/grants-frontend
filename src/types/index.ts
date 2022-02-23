import {
  GetAllGrantsForADaoQuery,
  GetApplicationMilestonesQuery,
  GetFundSentForApplicationQuery,
  GetWorkspaceDetailsQuery,
  GetWorkspaceMembersQuery,
} from 'src/generated/graphql';

export type Grant = GetAllGrantsForADaoQuery['grants'][number];
export type ApplicationMilestone = GetApplicationMilestonesQuery['grantApplications'][number]['milestones'][number];
export type FundTransfer = GetFundSentForApplicationQuery['fundsTransfers'][number];
export type MinimalWorkspace = GetWorkspaceMembersQuery['workspaceMembers'][number]['workspace'];
export type Workspace = Exclude<GetWorkspaceDetailsQuery['workspace'], null | undefined>;
