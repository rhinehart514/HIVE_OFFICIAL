import type { ElementSpec } from '../../element-spec';

export const matchMakerSpec: ElementSpec = {
  elementId: 'match-maker',
  name: 'Match Maker',
  category: 'action',
  dataSource: 'none',
  config: {
    title: { type: 'string', description: 'Matcher title', default: 'Find Your Match', required: false },
    preferenceFields: {
      type: 'object[]',
      description: 'Preference fields for matching (interests, availability, experience level)',
      default: [
        { key: 'interests', label: 'Interests', type: 'multi-select', options: [] },
        { key: 'availability', label: 'Availability', type: 'multi-select', options: ['Morning', 'Afternoon', 'Evening'] },
      ],
      required: false,
    },
    matchCriteria: { type: 'string', description: 'How matches are computed: compatibility, random, manual', default: 'compatibility', required: false },
    groupSize: { type: 'number', description: 'Group size for matching (2 = pairs)', default: 2, required: false },
    allowRematch: { type: 'boolean', description: 'Allow users to request a rematch', default: true, required: false },
    matchDeadline: { type: 'string', description: 'ISO date when matching closes', default: '', required: false },
  },
  connection: {
    minDepth: 'standalone',
    levels: [
      { depth: 'standalone', provides: 'Basic preference collection and matching', requiredContext: [] },
      { depth: 'space', provides: 'Match within space members, show member profiles', requiredContext: ['spaceId'] },
      { depth: 'campus', provides: 'Campus-wide matching pool, verified students', requiredContext: ['campusId'] },
    ],
  },
  permissions: { create: 'anyone', interact: 'authenticated' },
  executeActions: ['submit_preferences', 'accept_match', 'reject_match', 'rematch'],
  state: { shared: ['counters', 'collections'], personal: ['selections', 'participation'] },
  aliases: ['match-maker-element'],
};
