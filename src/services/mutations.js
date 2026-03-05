/**
 * Queued Mutations
 * 
 * Pre-configured mutations that queue when backend is initializing.
 * Import and use in components with useQueuedMutation hook.
 * 
 * Usage:
 *   const { mutate } = useQueuedMutation(mutations.moveItem);
 *   mutate({ listId, itemId, location });
 */

import { listsApi } from './lists';
import { itemsApi } from './items';

/**
 * Move item to new location (pantry)
 */
export const moveItem = {
  mutationFn: async ({ listId, itemId, location }) => {
    return await listsApi.updateItem(listId, itemId, { location });
  },
  // Optimistic update should be handled by component since it has local state
};

/**
 * Add item to grocery list
 */
export const addToGrocery = {
  mutationFn: async ({ listId, itemId, quantity = 1 }) => {
    return await listsApi.addItem(listId, { itemId, quantity });
  },
};

/**
 * Add item to pantry
 */
export const addToPantry = {
  mutationFn: async ({ listId, itemId, quantity = 1, location = 'pantry' }) => {
    return await listsApi.addItem(listId, { itemId, quantity, location });
  },
};

/**
 * Update list item (any field)
 */
export const updateListItem = {
  mutationFn: async ({ listId, itemId, data }) => {
    return await listsApi.updateItem(listId, itemId, data);
  },
};

/**
 * Remove item from list
 */
export const removeListItem = {
  mutationFn: async ({ listId, itemId }) => {
    return await listsApi.removeItem(listId, itemId);
  },
};

/**
 * Done shopping (atomic checkout)
 */
export const doneShopping = {
  mutationFn: async ({ listId, cart }) => {
    return await listsApi.doneShopping(listId, cart);
  },
};

/**
 * Use item (decrement uses)
 */
export const useItem = {
  mutationFn: async ({ listId, itemId, amount = 1, addToGrocery = false }) => {
    return await listsApi.useItem(listId, itemId, { amount, addToGrocery });
  },
};

/**
 * Archive item (finished/expired/trashed)
 */
export const archiveItem = {
  mutationFn: async ({ listId, itemId, reason, addToGrocery = false }) => {
    return await listsApi.archiveItem(listId, itemId, { reason, addToGrocery });
  },
};

/**
 * Edit catalog item (creates override for global items)
 */
export const editItem = {
  mutationFn: async ({ itemId, podId, data }) => {
    return await itemsApi.update(itemId, { ...data, podId });
  },
};

/**
 * Create new catalog item
 */
export const createItem = {
  mutationFn: async ({ podId, name, category, ...rest }) => {
    return await itemsApi.create({ podId, name, category, ...rest });
  },
};

export default {
  moveItem,
  addToGrocery,
  addToPantry,
  updateListItem,
  removeListItem,
  doneShopping,
  useItem,
  archiveItem,
  editItem,
  createItem,
};
