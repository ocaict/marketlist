import { Router } from 'express';
import { uploadProductImage } from '../controllers/uploadController';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.use(authenticateToken);
router.post('/product-image', asyncHandler(uploadProductImage));

export default router;
