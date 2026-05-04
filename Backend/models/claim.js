import mongoose from "mongoose";

const claimSchema = new mongoose.Schema(
  {
    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Offer",
      required: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    claimedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["claimed", "redeemed"],
      default: "claimed",
    },
    claimCode: {
      type: String,
      unique: true,
      sparse: true, // Allow multiple nulls
    },
  },
  { timestamps: true }
);

// Unique index: One claim per user (phone) per offer
claimSchema.index({ offerId: 1, phone: 1 }, { unique: true });

const Claim = mongoose.models.Claim || mongoose.model("Claim", claimSchema);

export default Claim;
