import axios from 'axios';
import { AISResponse, ArrivalUpdate, PortCall } from '../types';
import { mockArrivalUpdates, mockPortCalls, mockTrackedVessels } from '../data/mockData';

// @ts-ignore
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// @ts-ignore
const AIS_API_BASE_URL = import.meta.env.VITE_AIS_API_BASE_URL;

// Flag to use mock data instead of real API calls
const USE_MOCK_DATA = false;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL + '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include function key and auth token
apiClient.interceptors.request.use(
    (config) => {
      // Add function key if available
      const functionKey = localStorage.getItem('portmanFunctionKey');
      if (functionKey) {
        config.params = {
          ...config.params,
          code: functionKey,
        };
      }

      // Add auth token if available
      const token = localStorage.getItem('portmanAuthToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => Promise.reject(error)
);

// API functions
export const api = {
  // Port calls
  getPortCalls: async (params?: { imo?: string; from?: string; to?: string; after?: string }) => {
    if (USE_MOCK_DATA) {
      // Filter mock data based on params if needed
      let filteredCalls = [...mockPortCalls];
      if (params?.imo) {
        const imoNumber = parseInt(params.imo);
        filteredCalls = filteredCalls.filter(call => call.imolloyds === imoNumber);
      }
      return { portCalls: filteredCalls };
    }

    try {
      const response = await apiClient.get('/voyages', { params });
      return response.data.value;
    } catch (error) {
      console.error('Error fetching port calls:', error);
      throw error;
    }
  },

  // Port calls with pagination support
  getPortCallsPaginated: async (afterParam?: string) => {
    if (USE_MOCK_DATA) {
      // Sort mock data from newest to oldest
      const sortedCalls = [...mockPortCalls].sort((a, b) => 
        new Date(b.created).getTime() - new Date(a.created).getTime()
      );
      return { data: { value: sortedCalls, nextLink: null } };
    }

    try {
      const params: any = {
        // Add orderby parameter to sort by created date in descending order
        '$orderby': 'created desc'
      };
      if (afterParam) {
        params['$after'] = afterParam;
      }
      const response = await apiClient.get('/voyages', { params });
      return response;
    } catch (error) {
      console.error('Error fetching port calls:', error);
      throw error;
    }
  },

  getPortCallById: async (id: number) => {
    if (USE_MOCK_DATA) {
      const portCall = mockPortCalls.find(call => call.portcallid === id);
      return portCall || null;
    }

    try {
      const response = await apiClient.get(`/port-calls/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching port call ${id}:`, error);
      throw error;
    }
  },

  createPortCall: async (portCall: Partial<PortCall>) => {
    if (USE_MOCK_DATA) {
      // Create a new port call with a unique ID
      const newId = Math.max(...mockPortCalls.map(call => call.portcallid)) + 1;
      const newPortCall = {
        ...portCall,
        portcallid: newId,
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      };
      // In a real implementation, we would add this to the mock data
      return newPortCall;
    }

    try {
      const response = await apiClient.post('/port-calls', portCall);
      return response.data;
    } catch (error) {
      console.error('Error creating port call:', error);
      throw error;
    }
  },

  updatePortCall: async (id: number, portCall: Partial<PortCall>) => {
    if (USE_MOCK_DATA) {
      // Find and update the port call
      const index = mockPortCalls.findIndex(call => call.portcallid === id);
      if (index >= 0) {
        const updatedCall = {
          ...mockPortCalls[index],
          ...portCall,
          modified: new Date().toISOString()
        };
        // In a real implementation, we would update the mock data
        return updatedCall;
      }
      throw new Error(`Port call with ID ${id} not found`);
    }

    try {
      const response = await apiClient.put(`/port-calls/${id}`, portCall);
      return response.data;
    } catch (error) {
      console.error(`Error updating port call ${id}:`, error);
      throw error;
    }
  },

  deletePortCall: async (id: number) => {
    if (USE_MOCK_DATA) {
      // Find and "delete" the port call
      const index = mockPortCalls.findIndex(call => call.portcallid === id);
      if (index >= 0) {
        // In a real implementation, we would remove from the mock data
        return { success: true, message: `Port call ${id} deleted` };
      }
      throw new Error(`Port call with ID ${id} not found`);
    }

    try {
      const response = await apiClient.delete(`/port-calls/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting port call ${id}:`, error);
      throw error;
    }
  },

  // Arrivals with pagination support
  getArrivals: async (afterParam?: string) => {
    if (USE_MOCK_DATA) {
      return { data: { value: mockArrivalUpdates, nextLink: null } };
    }

    try {
      const params: any = {};
      if (afterParam) {
        params['$after'] = afterParam;
      }
      const response = await apiClient.get('/arrivals', { params });
      return response;
    } catch (error) {
      console.error('Error fetching arrivals:', error);
      throw error;
    }
  },

  // Arrival updates (legacy method)
  getArrivalUpdates: async (params?: { vesselname?: string; portcallid?: number }) => {
    if (USE_MOCK_DATA) {
      // Filter mock data based on params if needed
      let filteredUpdates = [...mockArrivalUpdates];
      if (params?.portcallid) {
        filteredUpdates = filteredUpdates.filter(update => update.portcallid === params.portcallid);
      }
      if (params?.vesselname) {
        filteredUpdates = filteredUpdates.filter(update => update.vesselname === params.vesselname);
      }
      return { arrivalUpdates: filteredUpdates };
    }

    try {
      const response = await apiClient.get('/arrivals', { params });
      console.log("response:", response)
      return response.data.value;
    } catch (error) {
      console.error('Error fetching arrival updates:', error);
      throw error;
    }
  },

  createArrivalUpdate: async (update: Partial<ArrivalUpdate>) => {
    if (USE_MOCK_DATA) {
      // Create a new arrival update with a unique ID
      const newId = Math.max(...mockArrivalUpdates.map(update => update.id)) + 1;
      const newUpdate = {
        ...update,
        id: newId,
        created: new Date().toISOString()
      };
      // In a real implementation, we would add this to the mock data
      return newUpdate;
    }

    try {
      const response = await apiClient.post('/arrivals', update);
      return response.data;
    } catch (error) {
      console.error('Error creating arrival update:', error);
      throw error;
    }
  },

  // Vessels
  getTrackedVessels: async () => {
    if (USE_MOCK_DATA) {
      return { vessels: mockTrackedVessels };
    }

    try {
      // const response = await apiClient.get('/vessels/tracked');
      // return response.data;
      return { vessels: mockTrackedVessels }; // TODO: fix
    } catch (error) {
      console.error('Error fetching tracked vessels:', error);
      throw error;
    }
  },

  updateTrackedVessels: async (imoNumbers: number[]) => {
    if (USE_MOCK_DATA) {
      // In a real implementation, we would update the mock data
      return { success: true, vessels: imoNumbers };
    }

    try {
      const response = await apiClient.post('/vessels/tracked', { imoNumbers });
      return response.data;
    } catch (error) {
      console.error('Error updating tracked vessels:', error);
      throw error;
    }
  },

  // Authentication - simplified but kept for future use
  login: async (email: string, password: string) => {
    if (USE_MOCK_DATA) {
      // Always succeed with mock user
      const mockUser = {
        id: '1',
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
      };
      localStorage.setItem('portmanAuthToken', 'mock-token-123');
      localStorage.setItem('portmanUser', JSON.stringify(mockUser));
      return { user: mockUser, token: 'mock-token-123' };
    }

    try {
      const response = await apiClient.post('/auth/login', { email, password });
      if (response.data.token) {
        localStorage.setItem('portmanAuthToken', response.data.token);
        localStorage.setItem('portmanUser', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  },

  register: async (name: string, email: string, password: string, role: string) => {
    if (USE_MOCK_DATA) {
      // Always succeed with mock registration
      return { success: true, message: 'Registration successful' };
    }

    try {
      const response = await apiClient.post('/auth/register', { name, email, password, role });
      return response.data;
    } catch (error) {
      console.error('Error during registration:', error);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('portmanAuthToken');
    localStorage.removeItem('portmanUser');
  },

  // Settings
  getSettings: async () => {
    if (USE_MOCK_DATA) {
      return {
        apiUrl: API_BASE_URL,
        refreshInterval: 60,
        defaultView: 'dashboard',
        theme: 'light',
      };
    }

    try {
      const response = await apiClient.get('/settings');
      return response.data;
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  },

  updateSettings: async (settings: any) => {
    if (USE_MOCK_DATA) {
      return { ...settings, updated: true };
    }

    try {
      const response = await apiClient.put('/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  },

  // Fetch Digitraffic AIS API data for displaying vessel locations on the map
  getVesselLocations: async (): Promise<AISResponse> => {
    try {
      const response = await axios.get(`${AIS_API_BASE_URL}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching vessel locations:', error);
      throw error;
    }
  },
};

export default api;
