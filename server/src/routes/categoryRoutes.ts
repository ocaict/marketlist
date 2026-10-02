import { Router } from 'express';
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from '../controllers/categoryController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.get('/', getCategories);
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;
