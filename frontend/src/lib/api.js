const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const withQuery = (path, params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
};

const buildHeaders = (token, hasJsonBody = true) => {
  const headers = {};

  if (hasJsonBody) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const parseResponse = async (response) => {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.error || "Something went wrong while contacting the server.");
  }

  return data;
};

export const apiRequest = async (path, options = {}) => {
  const { token, body, headers, ...rest } = options;
  const isFormData = body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      ...buildHeaders(token, !isFormData),
      ...headers,
    },
    body: isFormData || body === undefined ? body : JSON.stringify(body),
  });

  return parseResponse(response);
};

export const endpoints = {
  register: (payload) =>
    apiRequest("/api/auth/register", { method: "POST", body: payload }),
  login: (payload) =>
    apiRequest("/api/auth/login", { method: "POST", body: payload }),
  me: (token) => apiRequest("/api/auth/me", { token }),
  getListings: (params = {}) => apiRequest(withQuery("/api/listings", params)),
  getListing: (listingId) => apiRequest(`/api/listings/${listingId}`),
  getWishlist: (token) => apiRequest("/api/users/wishlist", { token }),
  toggleWishlist: (token, listingId) =>
    apiRequest(`/api/users/wishlist/${listingId}`, { method: "POST", token }),
  createOffer: (token, payload) =>
    apiRequest("/api/offers", { method: "POST", token, body: payload }),
  getSentOffers: (token) => apiRequest("/api/offers/sent", { token }),
  getReceivedOffers: (token) => apiRequest("/api/offers/received", { token }),
  respondToOffer: (token, offerId, status) =>
    apiRequest(`/api/offers/${offerId}/respond`, {
      method: "PATCH",
      token,
      body: { status },
    }),
  getInbox: (token) => apiRequest("/api/messages/inbox", { token }),
  getConversation: (token, userId) => apiRequest(`/api/messages/${userId}`, { token }),
  getUnreadCount: (token) => apiRequest("/api/messages/unread/count", { token }),
  sendMessage: (token, payload) =>
    apiRequest("/api/messages", { method: "POST", token, body: payload }),
  createListing: (token, payload) =>
    apiRequest("/api/listings", { method: "POST", token, body: payload }),
};

export { API_BASE_URL };
