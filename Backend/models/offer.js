import mongoose from "mongoose";

const offerSchema = new mongoose.Schema({
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shop",
        required: true,
    },
    benefitType: {
        type: String,
        enum: ["discount", "buy_x_get_y"],
        required: true,
    },
    constraintType: {
        type: String,
        enum: ["time_limit", "slot_limit", "group_goal"],
        required: true,
    },

    image: {type: String, null: true},

    applicableProducts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
        },
    ],

    // Benefit Fields
    discount: {
        type: Number,
        min: 1,
        max: 100,
    },
    buyQty: Number,
    getQty: Number,

    // Constraint Fields
    startTime: { type: Date },
    endTime: { type: Date },
    totalSlots: Number,
    filledSlots: { type: Number, default: 0 },
    
    // Group Deal specific
    participants: [
        {
            phone: String,
            Name: String,
            joinedAt: { type: Date, default: Date.now },
        },
    ],

    isActive: { type: Boolean, default: true },

    claims: [
        {
            userPhone: String,
            claimCode: String,
            claimedAt: { type: Date, default: Date.now },
            status: { type: String, enum: ['pending', 'verified', 'expired'], default: 'pending' }
        }
    ]

}, { timestamps: true });


offerSchema.index({ shop: 1, benefitType: 1 });
offerSchema.index({ shop: 1, constraintType: 1 });
offerSchema.index({ shop: 1, isActive: 1 });


offerSchema.virtual("status").get(function () {
    const now = new Date();

    if (!this.isActive) return "disabled";

    // Handle Time Limit
    if (this.constraintType === "time_limit") {
        if (this.startTime && now < this.startTime) return "upcoming";
        if (this.endTime && now > this.endTime) return "expired";
    }

    // Handle Slot Limit
    if (this.constraintType === "slot_limit") {
        if (this.filledSlots >= this.totalSlots) return "expired";
    }

    // Handle Group Goal
    if (this.constraintType === "group_goal") {
        if (this.participants.length >= this.totalSlots) return "completed";
    }

    return "active";
});

// ── Virtual: remaining slots ──────────────────────────────────────
offerSchema.virtual("remainingSlots").get(function () {
    if (this.constraintType === "group_goal" || this.constraintType === "slot_limit") {
        return this.totalSlots - (this.constraintType === "group_goal" ? this.participants.length : this.filledSlots);
    }
    return null;
});

const Offer = mongoose.model("Offer", offerSchema);

export default Offer;