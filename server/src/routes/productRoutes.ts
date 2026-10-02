import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  getProduct,
  getProducts,
  updateProduct,
} from '../controllers/productController';
import { authenticateToken } from '../middleware/auth';
import { adjustStock, getLowStockProducts, getStockAdjustments } from '../controllers/inventoryController';

const router = Router();

router.use(authenticateToken);
router.get('/', getProducts);
router.get('/low-stock', getLowStockProducts);
router.get('/:id', getProduct);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.post('/:id/adjust', adjustStock);
router.get('/:id/adjustments', getStockAdjustments);

export default router;
