import React, { useState } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor, ingresa tu correo electrónico.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await api.post('/auth/password-reset/', { email });
      setMessage(response.data.detail || 'Si el correo electrónico está registrado, recibirás un mensaje para restablecer tu contraseña.');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Ocurrió un error al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h2 style={{ textAlign: 'center', margin: 0 }}>
          <span className="gradient-text">Recuperar Contraseña</span>
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', lineHeight: '1.5', margin: 0 }}>
          Ingresa tu dirección de correo electrónico registrada. Te enviaremos un correo con un enlace seguro para que puedas cambiar tu contraseña.
        </p>

        {message && (
          <div className="alert-banner success" style={{ margin: 0 }}>
            <CheckCircle size={18} style={{ flexShrink: 0 }} />
            <span>{message}</span>
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
              <label className="form-label" htmlFor="email-input">Correo Electrónico</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  id="email-input"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
              <span>{loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}</span>
            </button>
          </form>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1rem' }}>
          <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600' }}>
            <ArrowLeft size={16} />
            <span>Volver al Iniciar Sesión</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
