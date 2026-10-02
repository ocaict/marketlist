import { Router } from 'express';
import { createSale, getSale, getSales } from '../controllers/salesController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.post('/', createSale);
router.get('/', getSales);
router.get('/:id', getSale);

export default router;
