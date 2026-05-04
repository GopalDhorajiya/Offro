import apiClient from './apiClient';

export const createClaim = async (offerId, token) => {
  return apiClient('/claims/create', {
    method: 'POST',
    token,
    body: JSON.stringify({ offerId }),
  });
};

export const getUserClaims = async (token) => {
  return apiClient('/claims/my-claims', {
    method: 'GET',
    token,
  });
};

export const getClaimById = async (id, token) => {
  return apiClient(`/claims/${id}`, {
    method: 'GET',
    token,
  });
};

export const verifyClaim = async (claimCode, token) => {
  return apiClient('/claims/verify', {
    method: 'POST',
    token,
    body: JSON.stringify({ claimCode }),
  });
};
