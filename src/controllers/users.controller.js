import logger from '#config/logger.js';
import {
  deleteUser as deleteUserService,
  getAllUsers,
  getUserById as getUserByIdService,
  updateUser as updateUserService,
} from '#services/users.service.js';
import {
  updateUserSchema,
  userIdSchema,
} from '#validations/users.validation.js';
import { formatValidationError } from '#utils/format.js';
import { cookies } from '#utils/cookies.js';
import { jwttoken } from '#utils/jwt.js';

const getAuthenticatedUser = req => {
  if (req.user?.id) {
    return req.user;
  }

  const token = cookies.get(req, 'token');
  if (!token) {
    return null;
  }

  try {
    return jwttoken.verify(token);
  } catch (_e) {
    return null;
  }
};

export const fetchAllUsers = async (req, res, next) => {
  try {
    logger.info('Getting users...');

    const allUsers = await getAllUsers();

    res.json({
      message: 'Successfully retrieved users.',
      users: allUsers,
      count: allUsers.length,
    });
  } catch (e) {
    logger.error(e);
    next(e);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const validationResult = userIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;
    logger.info(`Getting user by id: ${id}`);

    const user = await getUserByIdService(id);

    return res.status(200).json({
      message: 'Successfully retrieved user.',
      user,
    });
  } catch (e) {
    logger.error('Error getting user by id', e);

    if (e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }

    next(e);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const idValidationResult = userIdSchema.safeParse(req.params);

    if (!idValidationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(idValidationResult.error),
      });
    }

    const updateValidationResult = updateUserSchema.safeParse(req.body);

    if (!updateValidationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(updateValidationResult.error),
      });
    }

    const authenticatedUser = getAuthenticatedUser(req);

    if (!authenticatedUser) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = idValidationResult.data;
    const updates = updateValidationResult.data;
    const isAdmin = authenticatedUser.role === 'admin';
    const isOwnAccount = Number(authenticatedUser.id) === id;

    if (!isAdmin && !isOwnAccount) {
      return res
        .status(403)
        .json({ error: 'You can only update your own information' });
    }

    if (updates.role && !isAdmin) {
      return res
        .status(403)
        .json({ error: 'Only admin users can update roles' });
    }

    const user = await updateUserService(id, updates);

    logger.info(
      `User ${id} updated successfully by user ${authenticatedUser.id}`
    );

    return res.status(200).json({
      message: 'User updated successfully.',
      user,
    });
  } catch (e) {
    logger.error('Error updating user', e);

    if (e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }

    if (e.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' });
    }

    next(e);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const validationResult = userIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const authenticatedUser = getAuthenticatedUser(req);

    if (!authenticatedUser) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = validationResult.data;
    const isAdmin = authenticatedUser.role === 'admin';
    const isOwnAccount = Number(authenticatedUser.id) === id;

    if (!isAdmin && !isOwnAccount) {
      return res
        .status(403)
        .json({ error: 'You can only delete your own account' });
    }

    const deletedUser = await deleteUserService(id);

    logger.info(
      `User ${id} deleted successfully by user ${authenticatedUser.id}`
    );

    return res.status(200).json({
      message: 'User deleted successfully.',
      user: deletedUser,
    });
  } catch (e) {
    logger.error('Error deleting user', e);

    if (e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }

    next(e);
  }
};
