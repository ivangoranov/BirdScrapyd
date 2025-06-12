// Base API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001/api/v1';

// Store the auth token in localStorage
const TOKEN_KEY = 'pirat_auth_token';

/**
 * Auth helper functions
 */
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);
export const isAuthenticated = () => !!getToken();

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}/${endpoint}`;

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Add auth token to headers if available
  const token = getToken();
  if (token) {
    defaultOptions.headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...defaultOptions, ...options });

  if (!response.ok) {
    // If we get a 401 Unauthorized, clear the token
    if (response.status === 401) {
      removeToken();
    }

    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Authentication API functions
 */
export const login = (credentials) => {
  // Create URLSearchParams for form data submission (required by OAuth2PasswordRequestForm)
  const formData = new URLSearchParams();
  formData.append('username', credentials.username);
  formData.append('password', credentials.password);

  return fetchAPI('auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
  }).then(data => {
    if (data.access_token) {
      setToken(data.access_token);
    }
    return data;
  });
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

export default {
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
