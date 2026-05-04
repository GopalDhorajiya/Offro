import express from 'express';
import { firebaseAuth } from '../controllers/authController.js';

const router = express.Router();

router.post('/firebase', firebaseAuth);

export default router;
