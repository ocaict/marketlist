import { Router } from 'express';
import { createSale, getSale, getSales } from '../controllers/salesController';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.use(authenticateToken);
router.post('/', asyncHandler(createSale));
router.get('/', asyncHandler(getSales));
router.get('/:id', asyncHandler(getSale));

export default router;
