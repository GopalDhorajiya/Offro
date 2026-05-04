import { createOffer, getShopOffers, updateOfferData, claimOffer, getOfferById, deleteOffer } from "../services/offerServices.js";
import offerResponse from "../dtos/offerResponse.js";
import { emitOfferUpdate, emitOfferDelete } from "../config/socket.js";

export const createOfferController = async (req, res) => {
    try {
        const shopId = req.shop._id; // Attached by shopAuthMiddleware
        const offerData = req.body;

        const offer = await createOffer(offerData, shopId);
        res.status(201).json({
            message: "Offer created successfully",
            offer: offerResponse.fromOffer(offer)
        });
    } catch (error) {
        console.error("Create offer controller error:", error);
        res.status(400).json({ message: error.message || "Failed to create offer" });
    }
};

export const getShopOffersController = async (req, res) => {
    try {
        const shopId = req.shop._id;
        const offers = await getShopOffers(shopId);
        res.status(200).json(offerResponse.fromOfferList(offers));
    } catch (error) {
        console.error("Get shop offers controller error:", error);
        res.status(400).json({ message: error.message || "Failed to fetch offers" });
    }
};

export const getOfferByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const offer = await getOfferById(id);
        if (!offer) {
            return res.status(404).json({ message: "Offer not found" });
        }
        res.status(200).json(offerResponse.fromOffer(offer));
    } catch (error) {
        console.error("Get offer by ID controller error:", error);
        res.status(400).json({ message: error.message || "Failed to fetch offer" });
    }
};

export const updateOfferDataController = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const updatedOffer = await updateOfferData(id, updateData);
        const responseData = offerResponse.fromOffer(updatedOffer);
        
        // Broadcast update via Socket.io
        emitOfferUpdate(responseData);

        res.status(200).json({
            message: "Offer updated successfully",
            offer: responseData
        });
    } catch (error) {
        console.error("Update offer data controller error:", error);
        res.status(400).json({ message: error.message || "Failed to update offer" });
    }
};

export const deleteOfferController = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedOffer = await deleteOffer(id);
        if (!deletedOffer) {
            return res.status(404).json({ message: "Offer not found" });
        }
        
        // Broadcast deletion via Socket.io
        emitOfferDelete(id);

        res.status(200).json({ message: "Offer deleted successfully" });
    } catch (error) {
        console.error("Delete offer controller error:", error);
        res.status(400).json({ message: error.message || "Failed to delete offer" });
    }
};

export const claimOfferController = async (req, res) => {
    try {
        const { id } = req.params;
        const { phone } = req.body;

        if (!phone) throw new Error("User phone is required");

        const result = await claimOffer(id, phone);
        
        // Broadcast update via Socket.io if offer data changed
        if (result.offer) {
            emitOfferUpdate(offerResponse.fromOffer(result.offer));
        }

        res.status(200).json({
            message: result.alreadyClaimed ? "You have already claimed this offer" : "Offer claimed successfully",
            claimCode: result.claimCode
        });
    } catch (error) {
        console.error("Claim offer controller error:", error);
        res.status(400).json({ message: error.message || "Failed to claim offer" });
    }
};
