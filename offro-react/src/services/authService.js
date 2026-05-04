import apiClient from './apiClient';
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../firebase";

// Firebase Auth Backend Verification
export const loginWithFirebase = async (idToken, role, name) => {
  return apiClient('/auth/firebase', {
    method: 'POST',
    body: JSON.stringify({ idToken, role, name }),
  });
};

// Setup Recaptcha
export const setupRecaptcha = (containerId = "recaptcha-container") => {
  if (window.recaptchaVerifier) {
    window.recaptchaVerifier.clear();
  }
  
  window.recaptchaVerifier = new RecaptchaVerifier(
    auth,
    containerId,
    { 
      size: "invisible",
      callback: (response) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
      }
    }
  );
};

// Send OTP
export const sendOTP = async (phone) => {
  if (!window.recaptchaVerifier) {
    setupRecaptcha();
  }
  
  const appVerifier = window.recaptchaVerifier;

  try {
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phone,
      appVerifier
    );
    window.confirmationResult = confirmationResult;
    return true;
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw error;
  }
};

// Verify OTP
export const verifyOTP = async (otp) => {
  if (!window.confirmationResult) {
    throw new Error("No OTP confirmation result found. Please send OTP first.");
  }
  
  try {
    const result = await window.confirmationResult.confirm(otp);
    const idToken = await result.user.getIdToken();
    return idToken;
  } catch (error) {
    console.error("Error verifying OTP:", error);
    throw error;
  }
};

// Keep old exports for compatibility but mark as deprecated if needed
// Or just replace them if they are only used in login/signup pages
export const registerShop = async (userData) => {
  // Now handled via Firebase + backend/firebase route
  console.warn("registerShop is deprecated, use loginWithFirebase");
};

export const loginShop = async (credentials) => {
  console.warn("loginShop is deprecated, use loginWithFirebase");
};

export const registerUser = async (userData) => {
  console.warn("registerUser is deprecated, use loginWithFirebase");
};

export const loginUser = async (credentials) => {
  console.warn("loginUser is deprecated, use loginWithFirebase");
};
