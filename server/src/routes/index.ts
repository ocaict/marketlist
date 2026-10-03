import { Router } from 'express';
import healthRoutes from './healthRoutes';
import authRoutes from './authRoutes';
import categoryRoutes from './categoryRoutes';
import productRoutes from './productRoutes';
import saleRoutes from './saleRoutes';
import profileRoutes from './profileRoutes';
import { getDashboard } from '../controllers/dashboardController';
import { getReportSummary } from '../controllers/reportsController';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/sales', saleRoutes);
router.use('/profile', profileRoutes);
router.get('/dashboard', authenticateToken, asyncHandler(getDashboard));
router.get('/reports/summary', authenticateToken, asyncHandler(getReportSummary));

export default router;
