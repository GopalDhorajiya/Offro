import {Shop} from '../models/shop.js';

export const registerShop = async (shopData) => {
    try {
        const { name, email, password } = shopData;
        // Check if shop already exists
        const existingShop = await Shop.findOne({ email });
        if (existingShop) {
            throw new Error('Shop with this email already exists');
        }
        // Hash the password
        const hashedPassword = await Shop.hashPassword(password);
        // Create new shop
        const newShop = new Shop({
            name,
            email,
            password: hashedPassword
        });
        const savedShop = await newShop.save();
        return savedShop;
    } catch (error) {
        console.error('Error registering shop:', error);
        throw new Error('Server error');
    }
};

