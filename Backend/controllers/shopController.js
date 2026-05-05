import admin from '../config/firebaseAdmin.js';
import shopResponse from "../dtos/shopResponse.js";
import { Shop } from "../models/shop.js";

export const registerShopController = async (req, res) => {
    const { idToken, name } = req.body;

    if (!idToken) {
        return res.status(400).json({ message: "idToken is required" });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { uid, phone_number: phoneNumber } = decodedToken;

        if (!phoneNumber) {
            return res.status(400).json({ message: "Phone number not found in Firebase token" });
        }

        let shop = await Shop.findOne({ 
            $or: [{ firebaseUid: uid }, { phoneNumber }] 
        });

        if (shop) {
            return res.status(400).json({ message: "Shop already exists with this phone number" });
        }

        shop = new Shop({
            name: name || "Shop Owner",
            phoneNumber,
            firebaseUid: uid
        });

        await shop.save();
        const token = shop.generateJWT();
        res.status(201).json({ shop: shopResponse.fromShop(shop), token });

    } catch (error) {
        console.error("Shop registration error:", error);
        res.status(500).json({ message: error.message || "Registration failed" });
    }
}

export const loginShopController = async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        return res.status(400).json({ message: "idToken is required" });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { uid, phone_number: phoneNumber } = decodedToken;

        let shop = await Shop.findOne({ 
            $or: [{ firebaseUid: uid }, { phoneNumber }] 
        });

        if (!shop) {
            return res.status(404).json({ message: "Shop not found. Please register your shop." });
        }

        if (!shop.firebaseUid) {
            shop.firebaseUid = uid;
            await shop.save();
        }

        const token = shop.generateJWT();
        res.json({ shop: shopResponse.fromShop(shop), token });

    } catch (error) {
        console.error("Shop login error:", error);
        res.status(500).json({ message: error.message || "Login failed" });
    }
}