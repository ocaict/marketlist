import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/profileController';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.use(authenticateToken);
router.get('/', asyncHandler(getProfile));
router.put('/', asyncHandler(updateProfile));

export default router;
