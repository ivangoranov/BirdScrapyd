import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import SpiderList from '../pages/SpiderList';

// Mock axios
jest.mock('axios');

// Mock data for testing
const mockSpiders = [
  {
    id: '1',
    name: 'Test Spider 1',
    status: 'idle',
    created_at: '2023-05-10T12:00:00',
    updated_at: null
  },
  {
    id: '2',
    name: 'Test Spider 2',
    status: 'running',
    created_at: '2023-05-15T09:30:00',
    updated_at: '2023-05-15T09:35:00'
  }
];

describe('SpiderList Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    // Mock axios.get to return a pending promise
    axios.get.mockImplementation(() => new Promise(() => {}));

    render(
      <BrowserRouter>
        <SpiderList />
      </BrowserRouter>
    );

    // Check if loading indicator is displayed
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('fetches and displays spiders', async () => {
    // Mock axios.get to return mock data
    axios.get.mockResolvedValue({ data: mockSpiders });

    render(
      <BrowserRouter>
        <SpiderList />
      </BrowserRouter>
    );

    // Wait for the spiders to be loaded
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('http://localhost:8000/api/v1/spiders/');
    });

    // Check if spider names are displayed
    expect(screen.getByText('Test Spider 1')).toBeInTheDocument();
    expect(screen.getByText('Test Spider 2')).toBeInTheDocument();
  });

  test('handles API error', async () => {
    // Mock axios.get to throw an error
    axios.get.mockRejectedValue(new Error('Failed to fetch spiders'));

    render(
      <BrowserRouter>
        <SpiderList />
      </BrowserRouter>
    );

    // Wait for error message to be displayed
    await waitFor(() => {
      expect(screen.getByText(/Failed to load spiders/i)).toBeInTheDocument();
    });
  });

  test('handles running a spider', async () => {
    // Mock axios responses
    axios.get.mockResolvedValue({ data: mockSpiders });
    axios.post.mockResolvedValue({ data: { success: true } });

    render(
      <BrowserRouter>
        <SpiderList />
      </BrowserRouter>
    );

    // Wait for the spiders to be loaded
    await waitFor(() => {
      expect(screen.getByText('Test Spider 1')).toBeInTheDocument();
    });

    // Find and click the play button for the first spider
    const playButtons = screen.getAllByRole('button', { name: /Run Spider/i });
    fireEvent.click(playButtons[0]);

    // Check if axios.post was called with the correct URL
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('http://localhost:8000/api/v1/spiders/1/run');
    });

    // Check if axios.get was called again to refresh the list
    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  test('handles deleting a spider', async () => {
    // Mock axios responses
    axios.get.mockResolvedValue({ data: mockSpiders });
    axios.delete.mockResolvedValue({ data: { success: true } });

    // Mock window.confirm
    window.confirm = jest.fn(() => true);

    render(
      <BrowserRouter>
        <SpiderList />
      </BrowserRouter>
    );

    // Wait for the spiders to be loaded
    await waitFor(() => {
      expect(screen.getByText('Test Spider 1')).toBeInTheDocument();
    });

    // Find and click the delete button for the first spider
    const deleteButtons = screen.getAllByRole('button', { name: /Delete Spider/i });
    fireEvent.click(deleteButtons[0]);

    // Check if confirmation dialog was shown
    expect(window.confirm).toHaveBeenCalled();

    // Check if axios.delete was called with the correct URL
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith('http://localhost:8000/api/v1/spiders/1');
    });
  });
});
