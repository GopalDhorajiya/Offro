import jwt from "jsonwebtoken";
import { Shop } from "../models/shop.js";


export const shopAuthMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authorization header missing or malformed" });
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const shop = await Shop.findById(decoded.id);
        if (!shop) {
            return res.status(401).json({ message: "Shop not found" });
        }
        req.shop = shop; // Attach shop to request object
        return next();
    }
    catch (error) {
        console.error("Authentication error:", error);
        return res.status(401).json({error: "unauthorized access"});
    }
};