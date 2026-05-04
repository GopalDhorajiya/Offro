const API_URL = `${process.env.BACKEND_URL}/api`;

let serverTimeOffset = 0;

// Calculate offset once on load
const syncTime = async () => {
  try {
    const start = Date.now();
    const response = await fetch(`${API_URL}/server-time`);
    const { serverTime } = await response.json();
    const end = Date.now();
    const latency = (end - start) / 2;
    serverTimeOffset = serverTime - (end - latency);
    console.log('Clock sync successful. Offset:', serverTimeOffset, 'ms');
  } catch (err) {
    console.error('Clock sync failed:', err);
  }
};

syncTime();

export const getServerTime = () => new Date(Date.now() + serverTimeOffset);

const apiClient = async (endpoint, options = {}) => {
  const { token, ...customConfig } = options;
  
  const headers = {
    'Content-Type': 'application/json',
    ...customConfig.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    ...customConfig,
    headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('customer_token');
    localStorage.removeItem('owner_token');
    window.location.href = '/';
    throw new Error('Unauthorized');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Something went wrong');
  }

  return data;
};

export default apiClient;
