import { Router } from 'express';
import {
  loginUser,
  generateNewAccessToken,
  registerUser,
  loginGuestUser,
} from '../controllers/auth.controller';

const router = Router();
//  /api/v1/auth
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/iamguest', loginGuestUser);
router.post('/token/refresh', generateNewAccessToken);
export default router;
