// Base API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

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

  const response = await fetch(url, { ...defaultOptions, ...options });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  return response.json();
}

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
};
