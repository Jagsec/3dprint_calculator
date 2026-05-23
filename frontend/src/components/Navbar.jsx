import React from 'react';
import { useAuth } from '../context/AuthContext';
import { NavLink } from 'react-router-dom';
import { Printer, LogOut, User, Calculator, History } from 'lucide-react';

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Printer size={28} style={{ color: 'var(--secondary)' }} />
        <span className="gradient-text">3D Print Calc</span>
      </div>

      {user && (
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <NavLink 
            to="/" 
            className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.42rem 0.8rem', fontSize: '0.85rem' }}
          >
            <Calculator size={15} />
            <span>Calculadora</span>
          </NavLink>
          <NavLink 
            to="/history" 
            className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.42rem 0.8rem', fontSize: '0.85rem' }}
          >
            <History size={15} />
            <span>Historial</span>
          </NavLink>
        </div>
      )}
      
      {user && (
        <div className="navbar-actions">
          <div className="user-badge">
            <User size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
            <span style={{ verticalAlign: 'middle' }}>{user.username}</span>
          </div>
          <button onClick={logout} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
            <LogOut size={16} />
            <span>Salir</span>
          </button>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
