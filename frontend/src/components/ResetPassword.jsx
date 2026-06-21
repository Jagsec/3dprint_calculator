import React, { useState } from 'react';
import api from '../services/api';
import { Link, useParams } from 'react-router-dom';
import { Key, Lock, CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';

function ResetPassword() {
  const { uid, token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setError('Por favor, completa todos los campos.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await api.post('/auth/password-reset/confirm/', {
        uidb64: uid,
        token: token,
        new_password: password
      });
      setMessage(response.data.detail || 'Tu contraseña ha sido restablecida exitosamente.');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'El enlace es inválido, ha expirado o hubo un error al restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h2 style={{ textAlign: 'center', margin: 0 }}>
          <span className="gradient-text">Restablecer Contraseña</span>
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', lineHeight: '1.5', margin: 0 }}>
          Escribe tu nueva contraseña para volver a acceder al sistema.
        </p>

        {message && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="alert-banner success" style={{ margin: 0 }}>
              <CheckCircle size={18} style={{ flexShrink: 0 }} />
              <span>{message}</span>
            </div>
            <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>
              <span>Ir al Login</span>
            </Link>
          </div>
        )}

        {error && (
          <div className="alert-banner error" style={{ margin: 0 }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {!message && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="new-password">Nueva Contraseña</label>
              <div style={{ position: 'relative' }}>
                <Key size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  id="new-password"
                  type="password"
                  placeholder="Min. 8 caracteres"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="confirm-new-password">Confirmar Contraseña</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  id="confirm-new-password"
                  type="password"
                  placeholder="Repite la contraseña"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
              <span>{loading ? 'Restableciendo...' : 'Guardar Nueva Contraseña'}</span>
            </button>
          </form>
        )}

        {!message && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1rem' }}>
            <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600' }}>
              <ArrowLeft size={16} />
              <span>Volver al Iniciar Sesión</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;
