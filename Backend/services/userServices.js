import User from "../models/user.js";

export const registerUser = async (userData) => {
  try {
    const { name, phoneNumber, password } = userData;
    // Check if user already exists
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      throw new Error("User with this phone number already exists");
    }
    // Hash the password
    const hashedPassword = await User.hashPassword(password);
    // Create new user
    const newUser = new User({
      name,
      phoneNumber,
      password: hashedPassword,
    });
    const savedUser = await newUser.save();
    return savedUser;
  } catch (error) {
    console.error("Error registering user:", error);
    if (error.message.includes("exists")) {
        throw error;
    }
    throw new Error("Server error during registration");
  }
};
