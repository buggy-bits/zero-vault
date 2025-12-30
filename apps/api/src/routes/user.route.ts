import { Router } from 'express';
import { verifyToken } from '../middlewares/token.middleware';
import { getSinglUser } from '../controllers/user.controller';

const router = Router();

router.get('/me', verifyToken, getSinglUser);

export default router;
