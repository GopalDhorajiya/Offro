import express from "express";
import {
  registerUserController,
  loginUserController,
} from "../controllers/userController.js";
import { userAuthMiddleware } from "../middleware/userauth.js";
import userResponse from "../dtos/userResponse.js";

const router = express.Router();

router.post("/register", registerUserController);
router.post("/login", loginUserController);

// Example protected route for user profile
router.get("/profile", userAuthMiddleware, (req, res) => {
  const userData = userResponse.fromUser(req.user);
  res.json({ user: userData });
});

export default router;
