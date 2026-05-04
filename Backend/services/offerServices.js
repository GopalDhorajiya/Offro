import Offer from "../models/offer.js";
import { Product } from "../models/shop.js";

export const createOffer = async (offerData, shopId) => {
    try {
        const {
            benefitType,
            constraintType,
            image,
            applicableProducts = [],
            startTime,
            endTime,
            discount,
            buyQty,
            getQty,
            totalSlots,
            // New fields from frontend
            productName,
            productPrice,
            productDescription,
            productWeight,
            productUnit
        } = offerData;

        let finalApplicableProducts = [...applicableProducts];

        // If product details are provided, create the product first
        if (productName && productPrice) {
            const newProduct = new Product({
                name: productName,
                price: productPrice,
                description: productDescription,
                weight: productWeight,
                unit: productUnit,
                shop: shopId
            });
            const savedProduct = await newProduct.save();
            finalApplicableProducts.push(savedProduct._id);
        }

        const newOffer = new Offer({
            shop: shopId,
            benefitType,
            constraintType,
            image,
            applicableProducts: finalApplicableProducts,
            startTime,
            endTime,
            discount,
            buyQty,
            getQty,
            totalSlots
        });

        const savedOffer = await newOffer.save();
        return savedOffer;
    } catch (error) {
        console.error("Error creating offer:", error);
        throw error;
    }
};

export const getShopOffers = async (shopId) => {
    try {
        const offers = await Offer.find({ shop: shopId })
            .populate("applicableProducts")
            .populate("shop")
            .sort({ createdAt: -1 });
        return offers;
    } catch (error) {
        console.error("Error fetching shop offers:", error);
        throw error;
    }
};

export const getOfferById = async (offerId) => {
    try {
        const offer = await Offer.findById(offerId)
            .populate("applicableProducts")
            .populate("shop");
        return offer;
    } catch (error) {
        console.error("Error fetching offer by ID:", error);
        throw error;
    }
};

export const updateOfferData = async (offerId, updateData) => {
    try {
        const { filledSlots, participant } = updateData;
        const query = { _id: offerId };
        const update = {};
        
        if (filledSlots !== undefined) {
            update.$set = { filledSlots };
        }
        
        if (participant) {
            const offer = await Offer.findById(offerId);
            if (!offer) throw new Error("Offer not found");
            
            if (offer.constraintType === 'group_goal' || offer.constraintType === 'slot_limit') {
                const currentCount = offer.constraintType === 'group_goal' ? offer.participants.length : offer.filledSlots;
                if (currentCount >= offer.totalSlots) {
                    throw new Error("Offer is already full");
                }
            }
            
            update.$push = { participants: participant };
            if (offer.constraintType === 'slot_limit') {
                update.$inc = { filledSlots: 1 };
            }
        }

        const updatedOffer = await Offer.findOneAndUpdate(
            query,
            update,
            { new: true, runValidators: true }
        ).populate("applicableProducts").populate("shop");

        return updatedOffer;
    } catch (error) {
        console.error("Error updating offer data:", error);
        throw error;
    }
};

export const claimOffer = async (offerId, userPhone) => {
    try {
        const offer = await Offer.findById(offerId);
        if (!offer) throw new Error("Offer not found");
        if (!offer.isActive) throw new Error("Offer is disabled");

        const now = new Date();

        // Availability Checks
        if (offer.constraintType === "time_limit") {
            if (offer.startTime && now < offer.startTime) throw new Error("Offer has not started yet");
            if (offer.endTime && now > offer.endTime) throw new Error("Offer has expired");
        }

        if (offer.constraintType === "slot_limit" && offer.filledSlots >= offer.totalSlots) {
            throw new Error("No slots available");
        }

        if (offer.constraintType === "group_goal" && offer.participants.length >= offer.totalSlots) {
            throw new Error("Group goal already reached");
        }

        // Check if user already claimed this offer
        const existingClaim = offer.claims.find(c => c.userPhone === userPhone && c.status === 'pending');
        if (existingClaim) return { claimCode: existingClaim.claimCode, alreadyClaimed: true };

        // Generate Random 6-char Code
        const claimCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const update = {
            $push: { 
                claims: { userPhone, claimCode } 
            }
        };

        // If it's a slot limit, increment filledSlots automatically on claim
        if (offer.constraintType === "slot_limit") {
            update.$inc = { filledSlots: 1 };
        }

        const updatedOffer = await Offer.findByIdAndUpdate(
            offerId,
            update,
            { new: true }
        ).populate("applicableProducts").populate("shop");

        return { claimCode, offer: updatedOffer };
    } catch (error) {
        console.error("Error claiming offer:", error);
        throw error;
    }
};

export const deleteOffer = async (offerId) => {
    try {
        const deletedOffer = await Offer.findByIdAndDelete(offerId);
        return deletedOffer;
    } catch (error) {
        console.error("Error deleting offer:", error);
        throw error;
    }
};
