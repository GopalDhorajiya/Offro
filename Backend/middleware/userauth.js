import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const userAuthMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    console.warn(`[Auth] Missing Authorization header for ${req.method} ${req.originalUrl}`);
    return res.status(401).json({ message: "Authorization header missing" });
  }

  if (!authHeader.startsWith("Bearer ")) {
    console.warn(`[Auth] Malformed Authorization header: ${authHeader.substring(0, 15)}...`);
    return res.status(401).json({ message: "Authorization header malformed" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    req.user = user; 
    return next();
  } catch (error) {
    console.error(`[Auth] Token verification failed: ${error.message}`);
    return res.status(401).json({ error: "Unauthorized access" });
  }
};
