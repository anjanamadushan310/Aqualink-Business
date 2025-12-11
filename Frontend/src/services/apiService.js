import { API_BASE_URL } from './apiConfig';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get auth token from localStorage
  getAuthToken() {
    return localStorage.getItem('token');
  }

  // Get default headers with authentication
  getHeaders(contentType = 'application/json') {
    const headers = {
      'Content-Type': contentType,
    };

    const token = this.getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  // Generic API request method
  async request(endpoint, options = {}) {
    const {
      skipAuthHandling = false,
      headers: customHeaders,
      ...restOptions
    } = options;

    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      ...this.getHeaders(),
      ...(customHeaders || {}),
    };

    if (restOptions.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    const config = {
      headers,
      ...restOptions,
    };

    try {
      const response = await fetch(url, config);
      
      // Handle 401 Unauthorized - token expired or invalid
      if (response.status === 401) {
        // Try to get error message from response
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Authentication failed. Please log in again.';
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            // Check for message in various possible fields
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (parseError) {
            console.log('Could not parse error response:', parseError);
          }
        }
        
        // Don't clear auth data immediately for 401s with specific error messages
        // Let AuthContext handle it based on the error message
        if (
          !skipAuthHandling &&
          !errorMessage.includes('pending') &&
          !errorMessage.includes('rejected') &&
          !errorMessage.includes('deactivated')
        ) {
          // Clear auth data and redirect to login only for actual token issues
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Dispatch custom event to notify AuthContext
          window.dispatchEvent(new CustomEvent('authTokenExpired'));
        }
        
        throw new Error(errorMessage);
      }
      
      // Handle non-JSON responses (like file downloads)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        if (response.ok) {
          return await response.text();
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!response.ok) {
        // Enhanced error message extraction
        let errorMessage = 'An error occurred';
        
        // Try to get message from various possible fields
        if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (typeof data === 'string') {
          errorMessage = data;
        } else {
          errorMessage = `HTTP error! status: ${response.status}`;
        }
        
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // GET request
  async get(endpoint) {
    return this.request(endpoint, {
      method: 'GET',
    });
  }

  // POST request
  async post(endpoint, data, options = {}) {
    const { body, ...restOptions } = options;
    let requestBody = body;

    if (requestBody === undefined && data !== undefined) {
      requestBody = data instanceof FormData ? data : JSON.stringify(data);
    }

    const requestOptions = {
      method: 'POST',
      ...restOptions,
    };

    if (requestBody !== undefined) {
      requestOptions.body = requestBody;
    }

    return this.request(endpoint, requestOptions);
  }

  // PUT request
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  // Upload file
  async uploadFile(endpoint, file, additionalData = {}) {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add additional form data
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    return this.request(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
      },
      body: formData,
    });
  }
}

export default new ApiService();