import type { ElementSpec } from '../../element-spec';

export const listingBoardSpec: ElementSpec = {
  elementId: 'listing-board',
  name: 'Listing Board',
  category: 'action',
  dataSource: 'none',
  config: {
    title: { type: 'string', description: 'Board title', default: 'Listings', required: false },
    listingFields: {
      type: 'object[]',
      description: 'Fields for each listing (title, description, price, category, image)',
      default: [
        { key: 'title', label: 'Title', type: 'text', required: true },
        { key: 'description', label: 'Description', type: 'textarea', required: false },
        { key: 'price', label: 'Price', type: 'number', required: false },
        { key: 'category', label: 'Category', type: 'select', required: false },
        { key: 'image', label: 'Image URL', type: 'text', required: false },
      ],
      required: false,
    },
    categories: { type: 'string[]', description: 'Available categories for listings', default: ['General'], required: false },
    claimBehavior: { type: 'string', description: 'How items are claimed: first-come, request, contact', default: 'first-come', required: false },
    allowImages: { type: 'boolean', description: 'Allow image URLs on listings', default: true, required: false },
    maxListingsPerUser: { type: 'number', description: 'Max active listings per user', default: 10, required: false },
  },
  connection: {
    minDepth: 'standalone',
    levels: [
      { depth: 'standalone', provides: 'Basic listing board with post/browse/claim', requiredContext: [] },
      { depth: 'space', provides: 'Member-only posting, auto-fill user info', requiredContext: ['spaceId'] },
      { depth: 'campus', provides: 'Campus-wide visibility, verified student badges', requiredContext: ['campusId'] },
    ],
  },
  permissions: { create: 'anyone', interact: 'authenticated' },
  executeActions: ['post_listing', 'claim_listing', 'unclaim', 'mark_done', 'flag', 'delete_listing'],
  state: { shared: ['counters', 'collections'], personal: ['participation'] },
  aliases: ['listing-board-element'],
};
