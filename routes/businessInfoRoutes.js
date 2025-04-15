import express from 'express';
import { createBusinessInfo, getBusinessInfo, updateBusinessInfo } from '../controllers/businessInfoController.js';


const router = express.Router();



router.post(
    '/',
    createBusinessInfo
);

router.put(
    '/',

    updateBusinessInfo
);

router.get('/', getBusinessInfo);

export default router;