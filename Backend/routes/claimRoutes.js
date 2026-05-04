import express from "express";
import { createClaim, getUserClaims, verifyClaim, getClaimById } from "../controllers/claimController.js";
import { userAuthMiddleware } from "../middleware/userauth.js";
import { shopAuthMiddleware } from "../middleware/shopauth.js";

const router = express.Router();

router.post("/create", userAuthMiddleware, createClaim);
router.get("/my-claims", userAuthMiddleware, getUserClaims);
router.get("/:id", userAuthMiddleware, getClaimById);
router.post("/verify", shopAuthMiddleware, verifyClaim);

export default router;
