import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';

// Define types for our context
interface User {
  id: number;
  email: string;
  role: 'admin' | 'vendor' | 'user';
  first_name?: string;
  last_name?: string;
  phone?: string;
  is_verified: boolean;
  profile?: {
    id: number;
    profile_picture?: string;
    bio?: string;
    date_of_birth?: string;
    company_name?: string;
    business_address?: string;
    business_registration_number?: string;
    is_approved: boolean;
  };
  vendor_profile?: {
    id: number;
    company_name: string;
    business_email: string;
    business_phone: string;
    tax_id?: string;
    business_address: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    status: string;
    is_featured: boolean;
    rating: number;
    business_certificate?: string;
    id_proof?: string;
    created_at: string;
    updated_at: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (roles: string[]) => boolean;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: () => {},
  hasPermission: () => false,
});

// API URL
const API_URL = 'http://3.25.95.103/api';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      
      if (storedToken) {
        setToken(storedToken);
        try {
          // Fetch user data
          const response = await fetch(`${API_URL}/users/me/`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            console.log('User data loaded from API:', userData);
            
            // Normalize vendor status if present
            if (userData && userData.vendor_profile && userData.vendor_profile.status) {
              console.log('Original vendor status:', userData.vendor_profile.status);
              
              // Handle case variations
              if (userData.vendor_profile.status === 'Approved') {
                console.log('Normalizing "Approved" to "approved"');
                userData.vendor_profile.status = 'approved';
              }
              
              console.log('Normalized vendor status:', userData.vendor_profile.status);
            }
            
            setUser(userData);
          } else {
            // If token is invalid, clear storage
            console.error('Invalid token, clearing storage');
            localStorage.removeItem('auth_token');
            setToken(null);
          }
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          localStorage.removeItem('auth_token');
          setToken(null);
        }
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/users/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      
      // Store token in localStorage
      localStorage.setItem('auth_token', data.access);
      setToken(data.access);
      
      // Fetch user data
      const userResponse = await fetch(`${API_URL}/users/me/`, {
        headers: {
          'Authorization': `Bearer ${data.access}`
        }
      });
      
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const userData = await userResponse.json();
      console.log('User data after login:', userData);
      
      // Normalize vendor status if present
      if (userData && userData.vendor_profile && userData.vendor_profile.status) {
        console.log('Original vendor status after login:', userData.vendor_profile.status);
        
        // Handle case variations
        if (userData.vendor_profile.status === 'Approved') {
          console.log('Normalizing "Approved" to "approved" after login');
          userData.vendor_profile.status = 'approved';
        }
        
        console.log('Normalized vendor status after login:', userData.vendor_profile.status);
      }
      
      // Check if user has admin or vendor role
      if (userData.role !== 'admin' && userData.role !== 'vendor') {
        throw new Error('Unauthorized: Only admins and vendors can access this panel');
      }
      
      setUser(userData);
      
      // Redirect based on role
      if (userData.role === 'admin') {
        navigate('/');
      } else if (userData.role === 'vendor') {
        navigate('/vendor/dashboard');
      }
      
    } catch (error) {
      console.error('Login error:', error);
      // Handle different error types
      if (error instanceof Error) {
        throw new Error(error.message);
      } else {
        throw new Error('An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setToken(null);
    navigate('/signin');
  };

  // Function to check if user has permission based on role
  const hasPermission = (roles: string[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext); 