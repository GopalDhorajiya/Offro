import apiClient from './apiClient';

export const createOffer = async (offerData, token) => {
  return apiClient('/offers/create', {
    method: 'POST',
    token,
    body: JSON.stringify(offerData),
  });
};

export const getShopOffers = async (token) => {
  return apiClient('/offers/shop', {
    method: 'GET',
    token,
  });
};

export const getOfferById = async (id) => {
  return apiClient(`/offers/${id}`, {
    method: 'GET',
  });
};

export const deleteOffer = async (id, token) => {
  return apiClient(`/offers/${id}`, {
    method: 'DELETE',
    token,
  });
};
