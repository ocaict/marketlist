import { Router } from 'express';
import healthRoutes from './healthRoutes';
import authRoutes from './authRoutes';
import categoryRoutes from './categoryRoutes';
import productRoutes from './productRoutes';
import saleRoutes from './saleRoutes';
import { getDashboard } from '../controllers/dashboardController';
import { getReportSummary } from '../controllers/reportsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/sales', saleRoutes);
router.get('/dashboard', authenticateToken, getDashboard);
router.get('/reports/summary', authenticateToken, getReportSummary);

export default router;
