import Claim from "../models/claim.js";
import Offer from "../models/offer.js";
import { emitOfferUpdate } from "../config/socket.js";
import offerResponse from "../dtos/offerResponse.js";
import crypto from "crypto";

/**
 * Generates a high-entropy 8-character unique hex code.
 */
const generateUniqueCode = () => crypto.randomBytes(4).toString('hex').toUpperCase();

const normalizePhone = (phone) => {
  if (!phone) return "";
  return (phone.startsWith('+') ? '+' : '') + phone.replace(/\D/g, '');
};

export const createClaim = async (req, res) => {
  const { offerId } = req.body;
  const phone = normalizePhone(req.user.phoneNumber);
  const userName = req.user.name;

  console.log(`[Claim] Request - User: ${phone}, Offer: ${offerId}`);

  if (!offerId) {
    return res.status(400).json({ message: "offerId is required" });
  }

  try {
    // 1. Initial existence check
    const existing = await Claim.findOne({ offerId, phone });
    if (existing) {
      return res.status(400).json({ message: "You have already claimed this offer" });
    }

    // 2. Fetch and Validate Offer
    const offer = await Offer.findById(offerId);
    if (!offer) return res.status(404).json({ message: "Offer not found" });
    if (!offer.isActive) return res.status(400).json({ message: "Offer is not active" });

    const now = new Date();

    // Constraint Checks
    if (offer.constraintType === "time_limit") {
      if (offer.endTime && now > offer.endTime) return res.status(400).json({ message: "Offer has expired" });
      if (offer.startTime && now < offer.startTime) return res.status(400).json({ message: "Offer has not started yet" });
    }

    if (offer.constraintType === "slot_limit" && offer.filledSlots >= offer.totalSlots) {
      return res.status(400).json({ message: "Offer slots are full" });
    }

    if (offer.constraintType === "group_goal") {
      if (offer.participants.length >= offer.totalSlots) {
        return res.status(400).json({ message: "Group goal already reached" });
      }
      if (offer.participants.some(p => normalizePhone(p.phone) === phone)) {
        return res.status(400).json({ message: "You have already joined this group goal" });
      }
    }

    // 3. Prepare Claim Data (Omit claimCode for group_goal initially)
    const claimData = { offerId, phone, name: userName };
    let goalReached = false;
    let updatedOffer = null;

    // 4. Atomic Offer Update
    if (offer.constraintType === "slot_limit") {
      updatedOffer = await Offer.findOneAndUpdate(
        { _id: offerId, filledSlots: { $lt: offer.totalSlots } },
        { $inc: { filledSlots: 1 } },
        { returnDocument: 'after', runValidators: true }
      ).populate("applicableProducts").populate("shop");

      if (!updatedOffer) return res.status(400).json({ message: "Offer slots filled up" });
      claimData.claimCode = generateUniqueCode();
    } 
    else if (offer.constraintType === "group_goal") {
      updatedOffer = await Offer.findOneAndUpdate(
        { 
          _id: offerId,
          $expr: { $lt: [{ $size: "$participants" }, "$totalSlots"] }
        },
        { $push: { participants: { phone, Name: userName, joinedAt: now } } },
        { returnDocument: 'after', runValidators: true }
      ).populate("applicableProducts").populate("shop");

      if (!updatedOffer) return res.status(400).json({ message: "Group goal reached" });
      if (updatedOffer.participants.length === updatedOffer.totalSlots) goalReached = true;
    } 
    else {
      // Time Limit
      claimData.claimCode = generateUniqueCode();
      updatedOffer = await Offer.findById(offerId).populate("applicableProducts").populate("shop");
    }

    // 5. Save the claim
    const newClaim = new Claim(claimData);
    await newClaim.save();

    // 6. Handle Group Goal Completion - Batch Update Claims
    if (goalReached) {
      console.log(`[Claim] Group goal reached for offer ${offerId}. Generating codes...`);
      // Find all claims for this offer that don't have a code yet
      const pendingClaims = await Claim.find({ offerId, claimCode: { $exists: false } });
      
      for (const claim of pendingClaims) {
        let code;
        let isUnique = false;
        let attempts = 0;
        
        while (!isUnique && attempts < 10) {
          code = generateUniqueCode();
          const collision = await Claim.findOne({ claimCode: code });
          if (!collision) isUnique = true;
          attempts++;
        }
        
        if (isUnique) {
          claim.claimCode = code;
          await claim.save();
        } else {
          console.error(`[Claim] Failed to generate unique code for claim ${claim._id} after 10 attempts`);
        }
      }
    }

    if (updatedOffer) emitOfferUpdate(offerResponse.fromOffer(updatedOffer));

    // Refetch claim to ensure we have the code if goal was reached
    const claimToReturn = goalReached 
      ? await Claim.findById(newClaim._id) 
      : newClaim;
    
    return res.status(201).json({ 
      message: goalReached 
        ? "Group goal reached! Everyone got their codes." 
        : (offer.constraintType === "group_goal" ? "Joined group. Waiting for more people..." : "Offer claimed successfully"), 
      claim: claimToReturn,
      offer: updatedOffer ? offerResponse.fromOffer(updatedOffer) : null,
      goalReached
    });

  } catch (error) {
    console.error(`[Claim] Error:`, error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "You have already claimed this offer" });
    }
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getUserClaims = async (req, res) => {
  const phone = normalizePhone(req.user.phoneNumber);
  try {
    const claims = await Claim.find({ phone })
      .populate({ path: 'offerId', populate: ['applicableProducts', 'shop'] })
      .sort({ claimedAt: -1 });
    res.json(claims);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getClaimById = async (req, res) => {
  const { id } = req.params;
  const userPhone = normalizePhone(req.user.phoneNumber);
  try {
    const claim = await Claim.findById(id).populate({ path: 'offerId', populate: ['applicableProducts', 'shop'] });
    if (!claim) return res.status(404).json({ message: "Claim not found" });
    if (normalizePhone(claim.phone) !== userPhone) return res.status(403).json({ message: "Unauthorized" });
    res.json(claim);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const verifyClaim = async (req, res) => {
  const { claimCode } = req.body;
  if (!claimCode) return res.status(400).json({ message: "Claim code is required" });

  try {
    const claim = await Claim.findOne({ claimCode: claimCode.toUpperCase() })
      .populate({ path: 'offerId', populate: ['applicableProducts', 'shop'] });

    if (!claim) return res.status(404).json({ message: "Invalid claim code" });
    if (claim.status === 'redeemed') {
      return res.status(400).json({ 
        message: "This claim has already been redeemed",
        claimDetails: { customerPhone: claim.phone, redeemedAt: claim.updatedAt, offer: offerResponse.fromOffer(claim.offerId) }
      });
    }

    claim.status = 'redeemed';
    await claim.save();

    res.json({
      message: "Claim verified successfully!",
      claimDetails: { customerName: claim.name, customerPhone: claim.phone, offer: offerResponse.fromOffer(claim.offerId) }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};