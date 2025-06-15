// Base API URL and configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
const TOKEN_KEY = 'pirat_auth_token';
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

/**
 * Auth helper functions
 */
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);
export const isAuthenticated = () => !!getToken();

/**
 * Delay helper for retry mechanism
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Enhanced fetch wrapper with retry logic and better error handling
 */
async function fetchAPI(endpoint, options = {}, retryCount = 0) {
  const url = `${API_BASE_URL}/${endpoint}`;

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    credentials: 'include',
    mode: 'cors',
  };

  // Add auth token to headers if available
  const token = getToken();
  if (token) {
    defaultOptions.headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });

    // Handle various HTTP status codes
    if (response.status === 401) {
      removeToken();
      throw new Error('Unauthorized - Please log in again');
    }

    if (response.status === 403) {
      throw new Error('Forbidden - You do not have permission to access this resource');
    }

    if (response.status === 404) {
      throw new Error('Resource not found');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    // Network errors or parsing errors
    if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
      if (retryCount < MAX_RETRIES) {
        await delay(RETRY_DELAY * (retryCount + 1));
        return fetchAPI(endpoint, options, retryCount + 1);
      }
    }

    throw error;
  }
}

/**
 * Authentication API functions
 */
export const login = async (credentials) => {
  try {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const data = await fetchAPI('auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (data.access_token) {
      setToken(data.access_token);
    }
    return data;
  } catch (error) {
    // Enhanced error handling for login
    if (error.message.includes('NetworkError') || error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to the server. Please check your internet connection.');
    }
    if (error.message.includes('401')) {
      throw new Error('Invalid username or password');
    }
    throw error;
  }
};

export const signup = (userData) => {
  return fetchAPI('auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

export const loginWithSocial = (provider, token) => {
  return fetchAPI('auth/social-login', {
    method: 'POST',
    body: JSON.stringify({ provider, token }),
  }).then(data => {
    if (data.access_token) {
      setToken(data.access_token);
    }
    return data;
  });
};

export const logout = () => {
  removeToken();
  // Optionally call a backend logout endpoint if needed
  // return fetchAPI('auth/logout', { method: 'POST' });
};

/**
 * Dashboard API functions
 */
export const getDashboardStats = () => {
  return fetchAPI('dashboard/stats');
};

export const getRecentJobs = (limit = 5) => {
  return fetchAPI(`dashboard/recent-jobs?limit=${limit}`);
};

/**
 * Spiders API functions
 */
export const getSpiders = () => {
  return fetchAPI('spiders');
};

export const getSpiderById = (id) => {
  return fetchAPI(`spiders/${id}`);
};

export const createSpider = (spiderData) => {
  return fetchAPI('spiders', {
    method: 'POST',
    body: JSON.stringify(spiderData),
  });
};

export const updateSpider = (id, spiderData) => {
  return fetchAPI(`spiders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(spiderData),
  });
};

export const deleteSpider = (id) => {
  return fetchAPI(`spiders/${id}`, {
    method: 'DELETE',
  });
};

/**
 * Jobs API functions
 */
export const runSpider = (spiderId, params = {}) => {
  return fetchAPI(`spiders/${spiderId}/run`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
};

export const getJobById = (jobId) => {
  return fetchAPI(`jobs/${jobId}`);
};

export const getJobsList = (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  return fetchAPI(`jobs?${queryParams}`);
};

export const cancelJob = (jobId) => {
  return fetchAPI(`jobs/${jobId}/cancel`, {
    method: 'POST',
  });
};

const api = {
  getDashboardStats,
  getRecentJobs,
  getSpiders,
  getSpiderById,
  createSpider,
  updateSpider,
  deleteSpider,
  runSpider,
  getJobById,
  getJobsList,
  cancelJob,
  login,
  logout,
  signup,
  loginWithSocial,
};

export default api;
