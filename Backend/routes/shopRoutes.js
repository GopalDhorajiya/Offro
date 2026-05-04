import { Router } from "express";
import { registerShopController , loginShopController } from "../controllers/shopController.js";

const shopRouter = Router();

shopRouter.post('/register', registerShopController);
shopRouter.post('/login', loginShopController);

export default shopRouter;