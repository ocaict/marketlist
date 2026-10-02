import { Router } from 'express';
import healthRoutes from './healthRoutes';
import authRoutes from './authRoutes';
import categoryRoutes from './categoryRoutes';
import productRoutes from './productRoutes';
import saleRoutes from './saleRoutes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/sales', saleRoutes);

export default router;
