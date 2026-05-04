import shopResponse  from "../dtos/shopResponse.js";
import {registerShop} from "../services/shopServices.js";
import {Shop} from "../models/shop.js";

export const registerShopController = async (req, res) => {
    
    registerShop(req.body).then(shop => {
        const token = shop.generateJWT();
        const shopData = shopResponse.fromShop(shop);
        res.status(201).json({ shop: shopData , token });
    })
    .catch(error => {
        console.error("Registration error:", error);
        res.status(400).json({ message: error.message });
    });
}

export const loginShopController = async (req, res) => {
    const { email, password } = req.body;
    try {
        const shop = await Shop.findOne({ email });
        if (!shop) {
            return res.status(404).json({ message: "Shop not found" });
        }
        const isMatch = await shop.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const token = shop.generateJWT();
        const shopData = shopResponse.fromShop(shop);
        res.json({ shop: shopData, token });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error" });
    }
}