import type { ElementSpec } from '../../element-spec';

export const pollElementSpec: ElementSpec = {
  elementId: 'poll-element',
  name: 'Poll / Voting',
  category: 'action',
  dataSource: 'none',
  config: {
    question: { type: 'string', description: 'The poll question', default: 'What do you think?', required: true },
    options: { type: 'string[]', description: 'Answer options (min 2)', default: ['Option A', 'Option B'], required: true },
    allowMultipleVotes: { type: 'boolean', description: 'Allow selecting multiple options', default: false, required: false },
    showResults: { type: 'boolean', description: 'Show live results', default: true, required: false },
    showResultsBeforeVoting: { type: 'boolean', description: 'Show results before user votes', default: false, required: false },
    anonymousVoting: { type: 'boolean', description: 'Hide voter identity', default: false, required: false },
    allowChangeVote: { type: 'boolean', description: 'Allow changing vote after submission', default: false, required: false },
    deadline: { type: 'string', description: 'ISO date string for voting deadline', required: false },
  },
  connection: {
    minDepth: 'standalone',
    levels: [
      { depth: 'standalone', provides: 'Basic poll with voting and results', requiredContext: [] },
      { depth: 'space', provides: 'Voter identity from space members, member-only voting', requiredContext: ['spaceId'] },
    ],
  },
  permissions: { create: 'anyone', interact: 'anyone' },
  executeActions: ['vote', 'unvote'],
  state: { shared: ['counters'], personal: ['selections', 'participation'] },
};
