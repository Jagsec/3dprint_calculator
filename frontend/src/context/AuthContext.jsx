import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar perfil de usuario al iniciar si ya existe un token guardado
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const response = await api.get('/auth/user/');
          setUser(response.data);
        } catch (error) {
          console.error("Error al obtener usuario inicial", error);
          logout();
        }
      }
      setLoading(false);
    };

    fetchUser();

    // Escucha eventos de logout disparados por el interceptor API (p. ej. si expira la sesión)
    const handleForceLogout = () => {
      logout();
    };
    window.addEventListener('auth_logout', handleForceLogout);
    return () => window.removeEventListener('auth_logout', handleForceLogout);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login/', { username, password });
      const { access, refresh } = response.data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      const userResponse = await api.get('/auth/user/');
      setUser(userResponse.data);
      return { success: true };
    } catch (error) {
      console.error("Error en login:", error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Credenciales inválidas o error de conexión.' 
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      await api.post('/auth/register/', { username, email, password });
      // Iniciar sesión automáticamente tras el registro exitoso
      return await login(username, password);
    } catch (error) {
      console.error("Error en registro:", error);
      let errorMsg = 'Error al registrar usuario.';
      if (error.response?.data) {
        const errors = error.response.data;
        if (typeof errors === 'object') {
          // Extraer primer mensaje de error
          const firstKey = Object.keys(errors)[0];
          const val = errors[firstKey];
          errorMsg = Array.isArray(val) ? `${firstKey}: ${val[0]}` : `${firstKey}: ${val}`;
        }
      }
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
