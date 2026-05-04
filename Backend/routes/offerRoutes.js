import { Router } from "express";
import { createOfferController, getShopOffersController, updateOfferDataController, getOfferByIdController, deleteOfferController } from "../controllers/offerController.js";
import { shopAuthMiddleware } from "../middleware/shopauth.js";

const offerRouter = Router();

// Only authenticated shops can get their own offers
offerRouter.get("/shop", shopAuthMiddleware, getShopOffersController);

// Public routes
offerRouter.get("/:id", getOfferByIdController);

// Only authenticated shops can create offers
offerRouter.post("/create", shopAuthMiddleware, createOfferController);
offerRouter.delete("/:id", shopAuthMiddleware, deleteOfferController);
offerRouter.patch("/:id/update", updateOfferDataController); // Open for now, or add middleware if needed

export default offerRouter;
