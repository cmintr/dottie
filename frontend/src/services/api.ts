import { getAuth } from 'firebase/auth';

// Base API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * API service for making authenticated requests to the backend
 */
export class ApiService {
  /**
   * Get the current user's ID token for authentication
   * @returns Promise with the ID token or null if no user is logged in
   */
  private static async getAuthToken(): Promise<string | null> {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      return null;
    }
    
    try {
      return await user.getIdToken();
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Create headers for API requests, including authentication if available
   * @returns Headers object with content type and optional authorization
   */
  private static async createHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = await this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Make a GET request to the API
   * @param endpoint API endpoint path
   * @returns Promise with the response data
   */
  static async get<T>(endpoint: string): Promise<T> {
    const headers = await this.createHeaders();
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Make a POST request to the API
   * @param endpoint API endpoint path
   * @param data Request body data
   * @returns Promise with the response data
   */
  static async post<T>(endpoint: string, data: any): Promise<T> {
    const headers = await this.createHeaders();
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Make a PUT request to the API
   * @param endpoint API endpoint path
   * @param data Request body data
   * @returns Promise with the response data
   */
  static async put<T>(endpoint: string, data: any): Promise<T> {
    const headers = await this.createHeaders();
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Make a DELETE request to the API
   * @param endpoint API endpoint path
   * @returns Promise with the response data
   */
  static async delete<T>(endpoint: string): Promise<T> {
    const headers = await this.createHeaders();
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}
