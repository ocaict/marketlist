import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  getProduct,
  getProducts,
  updateProduct,
} from '../controllers/productController';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { adjustStock, getLowStockProducts, getStockAdjustments } from '../controllers/inventoryController';

const router = Router();

router.use(authenticateToken);
router.get('/', asyncHandler(getProducts));
router.get('/low-stock', asyncHandler(getLowStockProducts));
router.get('/:id', asyncHandler(getProduct));
router.post('/', asyncHandler(createProduct));
router.put('/:id', asyncHandler(updateProduct));
router.delete('/:id', asyncHandler(deleteProduct));
router.post('/:id/adjust', asyncHandler(adjustStock));
router.get('/:id/adjustments', asyncHandler(getStockAdjustments));

export default router;
