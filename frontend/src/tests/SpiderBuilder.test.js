import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import SpiderBuilder from '../pages/SpiderBuilder';

// Mock axios
jest.mock('axios');

// Mock react-flow-renderer
jest.mock('react-flow-renderer', () => {
  const ReactFlowRenderer = jest.requireActual('react-flow-renderer');
  return {
    ...ReactFlowRenderer,
    ReactFlowProvider: ({ children }) => <div data-testid="react-flow-provider">{children}</div>,
    addEdge: jest.fn((params, elements) => [...elements, { id: `e-test`, source: 'test1', target: 'test2' }]),
    Background: () => <div data-testid="flow-background">Background</div>,
    Controls: () => <div data-testid="flow-controls">Controls</div>,
    MiniMap: () => <div data-testid="flow-mini-map">MiniMap</div>,
    __esModule: true,
    default: (props) => {
      const { onNodeClick, onConnect, elements } = props;
      return (
        <div data-testid="react-flow">
          {elements && elements.map(el => (
            <div key={el.id} data-testid={`node-${el.id}`}>
              {el.data?.label}
              <button
                onClick={() => onNodeClick(null, { id: el.id, data: el.data, type: el.type })}
                data-testid={`click-${el.id}`}
              >
                Click Node
              </button>
            </div>
          ))}
          <button
            onClick={() => onConnect({ source: 'node1', target: 'node2' })}
            data-testid="connect-nodes"
          >
            Connect Nodes
          </button>
        </div>
      );
    }
  };
});

// Mock spider data
const mockSpider = {
  id: 'test-id',
  name: 'Test Spider',
  start_urls: ['https://example.com'],
  blocks: [
    {
      id: 'node1',
      type: 'Selector',
      params: {
        selector_type: 'css',
        selector: '.test',
        next: 'node2'
      },
      position: { x: 100, y: 100 }
    },
    {
      id: 'node2',
      type: 'Output',
      params: {
        field_name: 'test'
      },
      position: { x: 100, y: 250 }
    }
  ],
  status: 'idle'
};

// Component wrapper for router
const SpiderBuilderWithRouter = ({ spiderId }) => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<SpiderBuilder />} />
      </Routes>
    </BrowserRouter>
  );
};

describe('SpiderBuilder Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Mock useParams to return the ID
    jest.spyOn(require('react-router-dom'), 'useParams').mockReturnValue({
      id: 'test-id'
    });

    // Mock useNavigate
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(jest.fn());
  });

  test('loads spider data when editing an existing spider', async () => {
    // Mock axios.get to return mock data
    axios.get.mockResolvedValue({ data: mockSpider });

    render(<SpiderBuilderWithRouter />);

    // Check if it's fetching the spider data
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('http://localhost:8000/api/v1/spiders/test-id');
    });

    // Check if the form is populated with the spider data
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Spider')).toBeInTheDocument();
      expect(screen.getByDisplayValue('https://example.com')).toBeInTheDocument();
    });
  });

  test('handles URL updates correctly', async () => {
    // Mock axios.get to return mock data
    axios.get.mockResolvedValue({ data: mockSpider });

    render(<SpiderBuilderWithRouter />);

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('https://example.com')).toBeInTheDocument();
    });

    // Change URL
    const urlInput = screen.getByDisplayValue('https://example.com');
    fireEvent.change(urlInput, { target: { value: 'https://newexample.com' } });

    // Check if URL was updated
    expect(screen.getByDisplayValue('https://newexample.com')).toBeInTheDocument();

    // Add new URL
    const addUrlButton = screen.getByText('Add URL');
    fireEvent.click(addUrlButton);

    // Should now have 2 URL fields
    const urlInputs = screen.getAllByLabelText(/URL/);
    expect(urlInputs.length).toBe(2);
  });

  test('saves spider configuration', async () => {
    // Mock axios responses
    axios.get.mockResolvedValue({ data: mockSpider });
    axios.put.mockResolvedValue({ data: { ...mockSpider, name: 'Updated Spider' } });

    render(<SpiderBuilderWithRouter />);

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Spider')).toBeInTheDocument();
    });

    // Change spider name
    const nameInput = screen.getByDisplayValue('Test Spider');
    fireEvent.change(nameInput, { target: { value: 'Updated Spider' } });

    // Click save button
    const saveButton = screen.getByText('Save Spider');
    fireEvent.click(saveButton);

    // Check if PUT request was made with updated data
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/spiders/test-id',
        expect.objectContaining({
          name: 'Updated Spider',
          start_urls: ['https://example.com']
        })
      );
    });

    // Check for success message
    await waitFor(() => {
      expect(screen.getByText('Spider updated successfully!')).toBeInTheDocument();
    });
  });

  test('handles node configuration updates', async () => {
    // Mock axios.get to return mock data
    axios.get.mockResolvedValue({ data: mockSpider });

    render(<SpiderBuilderWithRouter />);

    // Wait for the data to load and render nodes
    await waitFor(() => {
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    // Find and click on a node
    const nodeButton = await screen.findByTestId('click-node1');
    fireEvent.click(nodeButton);

    // Configuration drawer should open
    await waitFor(() => {
      expect(screen.getByText('Selector Configuration')).toBeInTheDocument();
    });

    // Change selector value
    const selectorInput = screen.getByLabelText('Selector');
    fireEvent.change(selectorInput, { target: { value: '.new-selector' } });

    // Change should be applied to the node
    expect(selectorInput.value).toBe('.new-selector');
  });

  test('runs a spider', async () => {
    // Mock axios responses
    axios.get.mockResolvedValue({ data: mockSpider });
    axios.post.mockResolvedValue({ data: { success: true } });

    render(<SpiderBuilderWithRouter />);

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByText('Run Spider')).toBeInTheDocument();
    });

    // Click run button
    const runButton = screen.getByText('Run Spider');
    fireEvent.click(runButton);

    // Check if POST request was made
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('http://localhost:8000/api/v1/spiders/test-id/run');
    });

    // Check for success message
    await waitFor(() => {
      expect(screen.getByText('Spider started successfully!')).toBeInTheDocument();
    });
  });

  test('adds a new node via drag and drop', async () => {
    // Mock axios.get to return mock data with no blocks for a new spider
    axios.get.mockResolvedValue({
      data: {
        ...mockSpider,
        blocks: []
      }
    });

    // Need to mock getBoundingClientRect for the drop functionality
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      left: 0,
      top: 0,
      width: 500,
      height: 500,
      right: 500,
      bottom: 500
    }));

    // Mock for the ReactFlow instance's project method
    const mockProject = jest.fn((pos) => pos);

    render(<SpiderBuilderWithRouter />);

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    // Mock the ReactFlow instance in the component
    // This is needed because our onDrop function uses reactFlowInstance.project
    global.reactFlowInstance = { project: mockProject };

    // Create a DataTransfer object for the drag event
    const dataTransfer = new DataTransfer();
    dataTransfer.setData('application/reactflow', 'selectorNode');

    // Simulate drag over
    const reactFlow = screen.getByTestId('react-flow');
    fireEvent.dragOver(reactFlow, {
      dataTransfer,
      clientX: 250,
      clientY: 250
    });

    // Simulate drop
    fireEvent.drop(reactFlow, {
      dataTransfer,
      clientX: 250,
      clientY: 250
    });

    // Assert that a new node was added
    // Since we can't directly check the state, we'll verify that
    // when the save button is clicked, the request includes a block
    const saveButton = screen.getByText('Save Spider');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/spiders/test-id',
        expect.objectContaining({
          blocks: expect.arrayContaining([
            expect.objectContaining({
              type: 'Selector',
              params: expect.anything()
            })
          ])
        })
      );
    });
  });
});
