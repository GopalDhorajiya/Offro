import { Schema, model , mongoose } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Product Schema FIRST
const productSchema = new Schema(
    {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        description: String,
        weight: { type: Number },
        unit: { type: String, enum: ['kg', 'L', 'g', 'ml', 'pcs'], default: 'kg' },
        shop: {
            type: Schema.Types.ObjectId,
            ref: "Shop",
            required: true,
        },
    },
    { timestamps: true },
);

// Shop Schema
const shopSchema = new Schema(
    {
        name: { type: String, required: true },
        email: {
            type: String,
            lowercase: true,
            unique: true,
            sparse: true,
            match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
        },
        phoneNumber: {
            type: String,
            unique: true,
            sparse: true,
        },
        firebaseUid: {
            type: String,
            unique: true,
            sparse: true,
        },
        password: { type: String, required: false },
    },
    { timestamps: true },
);

// Password helpers
shopSchema.statics.hashPassword = async function (password) {
    return await bcrypt.hash(password, 10);
};

shopSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

shopSchema.methods.generateJWT = function () {
    return jwt.sign({ id: this._id, phoneNumber: this.phoneNumber }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });
};

export const Shop =
  mongoose.models.Shop || mongoose.model("Shop", shopSchema);

export const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);