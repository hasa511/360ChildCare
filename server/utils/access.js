import Child from '../models/Child.js';
import { ApiError, sameId } from './helpers.js';

/** IDs of children linked to a parent account. */
export const getParentChildIds = async (parentId) => Child.find({ parents: parentId }).distinct('_id');

/** Throws 403 if a parent tries to access a child that is not theirs. */
export const ensureChildAccess = (user, child) => {
  if (!child) throw new ApiError(404, 'Child not found');
  if (user.role === 'parent' && !child.parents.some((p) => sameId(p, user._id))) {
    throw new ApiError(403, 'You do not have access to this child');
  }
};

/**
 * Builds a `child` filter for list queries.
 * Parents are always restricted to their own children; a requested child must be one of them.
 */
export const buildChildFilter = async (user, requestedChildId) => {
  if (user.role === 'parent') {
    const ids = await getParentChildIds(user._id);
    if (requestedChildId) {
      if (!ids.some((id) => sameId(id, requestedChildId))) {
        throw new ApiError(403, 'You do not have access to this child');
      }
      return { child: requestedChildId };
    }
    return { child: { $in: ids } };
  }
  return requestedChildId ? { child: requestedChildId } : {};
};