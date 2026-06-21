import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import Calculator from './components/Calculator';
import History from './components/History';
import ProjectManager from './components/ProjectManager';
import KanbanBoard from './components/KanbanBoard';
import InventoryManager from './components/InventoryManager';
import PrinterManager from './components/PrinterManager';
import ClientManager from './components/ClientManager';
import SettingsManager from './components/SettingsManager';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';

// Wrapper para proteger rutas que requieren autenticación
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '80vh',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-family)'
      }}>
        <span>Cargando sesión...</span>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Wrapper para evitar que usuarios autenticados entren a Login/Registro
const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return null;
  }
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <Routes>
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Calculator />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/history" 
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/projects" 
              element={
                <ProtectedRoute>
                  <ProjectManager />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/kanban" 
              element={
                <ProtectedRoute>
                  <KanbanBoard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/inventory" 
              element={
                <ProtectedRoute>
                  <InventoryManager />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/printers" 
              element={
                <ProtectedRoute>
                  <PrinterManager />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/clients" 
              element={
                <ProtectedRoute>
                  <ClientManager />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <SettingsManager />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/forgot-password" 
              element={
                <GuestRoute>
                  <ForgotPassword />
                </GuestRoute>
              } 
            />
            <Route 
              path="/reset-password/:uid/:token" 
              element={
                <GuestRoute>
                  <ResetPassword />
                </GuestRoute>
              } 
            />
            <Route 
              path="/login" 
              element={
                <GuestRoute>
                  <Login />
                </GuestRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <GuestRoute>
                  <Register />
                </GuestRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
