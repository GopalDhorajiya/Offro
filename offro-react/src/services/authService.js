import apiClient from './apiClient';
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../firebase";

// Customer Auth
export const registerUser = async (idToken, name) => {
  return apiClient('/users/register', {
    method: 'POST',
    body: JSON.stringify({ idToken, name }),
  });
};

export const loginUser = async (idToken) => {
  return apiClient('/users/login', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  });
};

// Shop Owner Auth
export const registerShop = async (idToken, name) => {
  return apiClient('/shops/register', {
    method: 'POST',
    body: JSON.stringify({ idToken, name }),
  });
};

export const loginShop = async (idToken) => {
  return apiClient('/shops/login', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
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

// Deprecated generic login
export const loginWithFirebase = async (idToken, role, name) => {
  return apiClient('/auth/firebase', {
    method: 'POST',
    body: JSON.stringify({ idToken, role, name }),
  });
};
