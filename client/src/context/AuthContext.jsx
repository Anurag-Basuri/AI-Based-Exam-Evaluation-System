import { createContext, useEffect, useCallback, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { setToken, getToken, removeToken, isTokenExpired } from "../utils/handleToken.js";
import { login as apiLogin, registerStudent, registerTeacher, getMe } from "../services/apiServices.js"; // ✅ Import getMe
import React from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ✅ MODIFIED: This effect now fetches the full user profile on load
  useEffect(() => {
    const fetchUser = async () => {
      const { accessToken } = getToken();
      if (accessToken && !isTokenExpired(accessToken)) {
        try {
          // Instead of just decoding, we fetch the full user object
          const response = await getMe();
          setUser(response.data.user); // The backend wraps the user in response.data.user
        } catch (error) {
          console.error("Failed to fetch user profile, logging out.", error);
          removeToken();
          setUser(null);
        }
      }
      setAuthLoading(false);
    };

    fetchUser();
  }, []);

  // Universal login function
  const login = useCallback(async (credentials) => {
    setAuthLoading(true);
    try {
      const response = await apiLogin(credentials);
      // The user object is at response.data.user
      const loggedInUser = response.data.user; 
      setUser(loggedInUser);
      if (loggedInUser.role === 'student') {
        navigate('/student-dashboard');
      } else if (loggedInUser.role === 'teacher') {
        navigate('/teacher-dashboard');
      } else {
        navigate('/');
      }
      return { success: true };
    } catch (error) {
      console.error("Login failed:", error.response?.data?.message || error.message);
      removeToken();
      setUser(null);
      return { success: false, message: error.response?.data?.message || "Invalid credentials" };
    } finally {
      setAuthLoading(false);
    }
  }, [navigate]);

  // Universal signup function
  const signup = useCallback(async (userData, role) => {
    setAuthLoading(true);
    try {
      let response;
      if (role === 'student') {
        response = await registerStudent(userData);
      } else {
        response = await registerTeacher(userData);
      }
      const signedUpUser = response.data.user;
      setUser(signedUpUser);
      if (role === 'student') {
        navigate('/student-dashboard');
      } else {
        navigate('/teacher-dashboard');
      }
      return { success: true };
    } catch (error) {
      console.error("Signup failed:", error.response?.data?.message || error.message);
      return { success: false, message: error.response?.data?.message || "Registration failed. Please check your data." };
    } finally {
      setAuthLoading(false);
    }
  }, [navigate]);

  // Logout function
  const logout = useCallback(() => {
    removeToken();
    setUser(null);
    navigate('/');
  }, [navigate]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      authLoading,
      login,
      signup,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
