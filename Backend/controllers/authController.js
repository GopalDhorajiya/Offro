import admin from '../config/firebaseAdmin.js';
import User from '../models/user.js';
import { Shop } from '../models/shop.js';
import userResponse from '../dtos/userResponse.js';
import shopResponse from '../dtos/shopResponse.js';

export const firebaseAuth = async (req, res) => {
  const { idToken, role, name } = req.body;

  if (!idToken || !role) {
    return res.status(400).json({ message: "idToken and role are required" });
  }

  try {
    // Verify Firebase ID Token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, phone_number: phoneNumber } = decodedToken;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number not found in Firebase token" });
    }

    let userOrShop;
    let token;
    let responseData;

    if (role === 'customer') {
      let user = await User.findOne({ 
        $or: [{ firebaseUid: uid }, { phoneNumber }] 
      });

      if (!user) {
        // Create new user if not exists
        user = new User({
          name: name || "Customer",
          phoneNumber,
          firebaseUid: uid
        });
        await user.save();
      } else if (!user.firebaseUid) {
        // Link existing user to Firebase UID if not linked
        user.firebaseUid = uid;
        await user.save();
      }

      token = user.generateJWT();
      responseData = {
        user: userResponse.fromUser(user),
        token,
        role: 'customer'
      };

    } else if (role === 'owner') {
      let shop = await Shop.findOne({ 
        $or: [{ firebaseUid: uid }, { phoneNumber }] 
      });

      if (!shop) {
        // For shop owner, we might want to check if they should be allowed to register this way
        // or if they need a pre-existing account.
        // Assuming we allow creation if not exists.
        shop = new Shop({
          name: name || "Shop Owner",
          phoneNumber,
          firebaseUid: uid
        });
        await shop.save();
      } else {
        if (!shop.firebaseUid) {
          shop.firebaseUid = uid;
        }
        if (!shop.phoneNumber) {
          shop.phoneNumber = phoneNumber;
        }
        await shop.save();
      }

      token = shop.generateJWT();
      responseData = {
        shop: shopResponse.fromShop(shop),
        token,
        role: 'owner'
      };
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }

    res.json(responseData);

  } catch (error) {
    console.error("Firebase auth error:", error);
    res.status(401).json({ message: "Authentication failed", error: error.message });
  }
};
