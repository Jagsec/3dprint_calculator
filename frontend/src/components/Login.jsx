import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Key, User } from 'lucide-react';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }
    setError('');
    setLoading(true);
    const res = await login(username, password);
    setLoading(false);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-panel">
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span className="gradient-text">Iniciar Sesión</span>
        </h2>

        {error && (
          <div className="alert-banner error">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Usuario
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                id="username"
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Ingresa tu usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="form-label" htmlFor="password" style={{ marginBottom: 0 }}>
                Contraseña
              </label>
              <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--secondary)', textDecoration: 'none' }}>
                ¿La olvidaste?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <Key size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                id="password"
                type="password"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={loading}
          >
            <LogIn size={18} />
            <span>{loading ? 'Accediendo...' : 'Entrar'}</span>
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          ¿No tienes una cuenta?{' '}
          <Link to="/register" style={{ color: 'var(--secondary)', textDecoration: 'none', fontWeight: '600' }}>
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
