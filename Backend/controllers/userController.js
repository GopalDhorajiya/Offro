import admin from '../config/firebaseAdmin.js';
import User from "../models/user.js";
import userResponse from "../dtos/userResponse.js";

export const registerUserController = async (req, res) => {
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

    let user = await User.findOne({ 
      $or: [{ firebaseUid: uid }, { phoneNumber }] 
    });

    if (user) {
      return res.status(400).json({ message: "User already exists with this phone number" });
    }

    user = new User({
      name: name || "Customer",
      phoneNumber,
      firebaseUid: uid
    });
    
    await user.save();
    const token = user.generateJWT();
    res.status(201).json({ user: userResponse.fromUser(user), token });

  } catch (error) {
    console.error("User registration error:", error);
    res.status(500).json({ message: error.message || "Registration failed" });
  }
};

export const loginUserController = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ message: "idToken is required" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, phone_number: phoneNumber } = decodedToken;

    let user = await User.findOne({ 
      $or: [{ firebaseUid: uid }, { phoneNumber }] 
    });

    if (!user) {
      return res.status(404).json({ message: "User not found. Please sign up." });
    }

    if (!user.firebaseUid) {
      user.firebaseUid = uid;
      await user.save();
    }

    const token = user.generateJWT();
    res.json({ user: userResponse.fromUser(user), token });

  } catch (error) {
    console.error("User login error:", error);
    res.status(500).json({ message: error.message || "Login failed" });
  }
};
