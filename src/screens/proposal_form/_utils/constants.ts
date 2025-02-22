import { EditorState } from 'draft-js'
import { Form } from 'src/screens/proposal_form/_utils/types'

export const DEFAULT_FORM: Form = { fields: [], milestones: [], members: [], details: EditorState.createEmpty() }
export const DEFAULT_MILESTONE = { index: 0, title: '', amount: 0 }
export const MILESTONE_INPUT_STYLE = [{ placeholder: 'Add milestone', maxLength: 1024 }, { placeholder: 'Funding ask for this milestone', type: 'number' }]

export const customStepsHeader = ['Creating your proposal on chain']
export const customSteps = ['Submitting transaction on chain', 'Uploading data to decentralized storage', 'Indexing the data to a subgraph']