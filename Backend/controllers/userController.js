import User from "../models/user.js";
import { registerUser } from "../services/userServices.js";
import userResponse from "../dtos/userResponse.js";

export const registerUserController = async (req, res) => {
  try {
    const user = await registerUser(req.body);
    const token = user.generateJWT();
    const userData = userResponse.fromUser(user);
    res.status(201).json({ user: userData, token });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(400).json({ message: error.message });
  }
};

export const loginUserController = async (req, res) => {
  const { phoneNumber, password } = req.body;
  try {
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = user.generateJWT();
    const userData = userResponse.fromUser(user);
    res.json({ user: userData, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
