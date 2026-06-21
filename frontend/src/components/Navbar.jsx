import React from 'react';
import { useAuth } from '../context/AuthContext';
import { NavLink } from 'react-router-dom';
import { 
  Printer, LogOut, User, Calculator, History, 
  Briefcase, Trello, Package, Users, Settings 
} from 'lucide-react';

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar" style={{ flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
        <div className="navbar-brand">
          <Printer size={28} style={{ color: 'var(--secondary)' }} />
          <span className="gradient-text" style={{ fontSize: '1.4rem' }}>3D Print ERP</span>
        </div>

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
      </div>

      {user && (
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          width: '100%', 
          justifyContent: 'center',
          borderTop: '1px solid var(--panel-border)',
          paddingTop: '0.75rem'
        }}>
          <NavLink 
            to="/" 
            className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}
          >
            <Calculator size={14} />
            <span>Calculadora</span>
          </NavLink>
          <NavLink 
            to="/history" 
            className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}
          >
            <History size={14} />
            <span>Historial</span>
          </NavLink>
          <NavLink 
            to="/projects" 
            className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}
          >
            <Briefcase size={14} />
            <span>Proyectos</span>
          </NavLink>
          <NavLink 
            to="/kanban" 
            className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}
          >
            <Trello size={14} />
            <span>Kanban</span>
          </NavLink>
          <NavLink 
            to="/inventory" 
            className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}
          >
            <Package size={14} />
            <span>Inventario</span>
          </NavLink>
          <NavLink 
            to="/printers" 
            className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}
          >
            <Printer size={14} />
            <span>Flota</span>
          </NavLink>
          <NavLink 
            to="/clients" 
            className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}
          >
            <Users size={14} />
            <span>Clientes</span>
          </NavLink>
          <NavLink 
            to="/settings" 
            className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}
          >
            <Settings size={14} />
            <span>Configuración</span>
          </NavLink>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
