import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import { getDashboardStats, getRecentJobs } from '../services/api';

// Mock the API functions
jest.mock('../services/api', () => ({
  getDashboardStats: jest.fn(),
  getRecentJobs: jest.fn()
}));

// Helper to render Dashboard with Router
const renderDashboard = () => {
  return render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  );
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    // Default mock implementation
    getDashboardStats.mockResolvedValue({
      totalSpiders: 5,
      runningSpiders: 2,
      completedJobs: 10,
      itemsScraped: 500
    });

    getRecentJobs.mockResolvedValue([
      { id: '1', name: 'Test Spider', status: 'completed', items: 100, time: '1 hour ago', progress: 100 }
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    renderDashboard();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders dashboard content after loading', async () => {
    renderDashboard();

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Dashboard')).toBeInTheDocument();
    });

    // Check if stats are displayed
    expect(screen.getByText('5')).toBeInTheDocument(); // totalSpiders
    expect(screen.getByText('2')).toBeInTheDocument(); // runningSpiders
    expect(screen.getByText('10')).toBeInTheDocument(); // completedJobs
    expect(screen.getByText('500')).toBeInTheDocument(); // itemsScraped

    // Check if recent job is displayed
    expect(screen.getByText('Test Spider')).toBeInTheDocument();
  });

  test('handles job status colors properly', async () => {
    // Mock with different job statuses
    getRecentJobs.mockResolvedValue([
      { id: '1', name: 'Spider 1', status: 'completed', items: 100, time: '1h ago', progress: 100 },
      { id: '2', name: 'Spider 2', status: 'running', items: 50, time: '5m ago', progress: 50 },
      { id: '3', name: 'Spider 3', status: 'error', items: 0, time: '2h ago', progress: 0 },
      { id: '4', name: 'Spider 4', status: 'unknown_status', items: 25, time: '3h ago', progress: 25 }
    ]);

    renderDashboard();

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Dashboard')).toBeInTheDocument();
    });

    // Check if all statuses are displayed without errors
    expect(screen.getByText('completed')).toBeInTheDocument();
    expect(screen.getByText('running')).toBeInTheDocument();
    expect(screen.getByText('error')).toBeInTheDocument();
    expect(screen.getByText('unknown_status')).toBeInTheDocument();
  });

  test('handles API errors gracefully', async () => {
    // Mock API error
    getDashboardStats.mockRejectedValue(new Error('API Error'));
    getRecentJobs.mockRejectedValue(new Error('API Error'));

    // Spy on console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});

    renderDashboard();

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Dashboard')).toBeInTheDocument();
    });

    // Should still render with mock data
    expect(console.error).toHaveBeenCalled();

    // Restore console.error
    console.error.mockRestore();
  });
});
