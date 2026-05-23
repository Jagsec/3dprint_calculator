import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Search, Edit2, Trash2, History as HistoryIcon, 
  RefreshCw, CheckCircle, AlertCircle, Calendar, Layers, Printer
} from 'lucide-react';

const FILAMENT_LABELS = {
  'PLA': 'PLA',
  'PLA_PLUS': 'PLA+',
  'PETG': 'PETG',
  'TPU': 'TPU',
  'ASA': 'ASA',
  'ABS': 'ABS',
  'NYLON': 'Nylon',
  'CARBON_FIBER': 'Fibra de Carbono'
};

function History() {
  const navigate = useNavigate();
  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [alert, setAlert] = useState({ type: null, message: '' });

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await api.get('/estimates/');
      setEstimates(response.data);
    } catch (err) {
      console.error("Error al obtener cotizaciones:", err);
      showAlert('error', 'No se pudo cargar el historial de cotizaciones.');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: null, message: '' }), 5000);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar la cotización "${name}" del historial?`)) {
      return;
    }
    try {
      await api.delete(`/estimates/${id}/`);
      showAlert('success', 'Cotización eliminada.');
      setEstimates(prev => prev.filter(est => est.id !== id));
    } catch (err) {
      console.error("Error al eliminar:", err);
      showAlert('error', 'No se pudo eliminar la cotización.');
    }
  };

  const handleEdit = (id) => {
    navigate(`/?edit=${id}`);
  };

  // Búsqueda interactiva por nombre (case-insensitive)
  const filteredEstimates = estimates.filter(est => 
    est.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app-container">
      {alert.message && (
        <div className={`alert-banner ${alert.type}`}>
          {alert.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{alert.message}</span>
        </div>
      )}

      {/* HEADER DE BÚSQUEDA */}
      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <HistoryIcon className="gradient-text" size={28} />
            <span>Historial de Cotizaciones</span>
          </h2>
          
          <button 
            className="btn btn-outline" 
            style={{ padding: '0.6rem 0.8rem' }}
            onClick={fetchHistory}
            disabled={loading}
            title="Recargar historial"
          >
            <RefreshCw size={16} className={loading ? 'spin-anim' : ''} />
          </button>
        </div>

        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={20} style={{ position: 'absolute', left: '16px', top: '14px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '3rem', paddingRight: '1rem', height: '48px', fontSize: '1.05rem' }}
            placeholder="Buscar cotizaciones por nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* LISTADO DE ITEMS */}
      {loading && estimates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          Cargando cotizaciones del historial...
        </div>
      ) : filteredEstimates.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
          {estimates.length === 0 ? (
            <p>No tienes cotizaciones guardadas. ¡Calcula y guarda tu primer proyecto en la calculadora!</p>
          ) : (
            <p>No se encontraron cotizaciones con el nombre de búsqueda.</p>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredEstimates.map(est => {
            const printHours = (est.print_time_minutes / 60).toFixed(1);
            const dateStr = new Date(est.created_at).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });

            return (
              <div key={est.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div style={{ flex: '1 1 300px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{est.name}</h3>
                    <span className="user-badge" style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--primary)', borderColor: 'rgba(139, 92, 246, 0.3)' }}>
                      {FILAMENT_LABELS[est.filament_type] || est.filament_type || 'PLA'}
                    </span>
                  </div>

                  {est.description && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                      {est.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={14} /> {dateStr}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Layers size={14} /> {est.part_weight_grams}g (desp. {parseInt(est.waste_percentage)}%)
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Printer size={14} /> {printHours}h de impr.
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Precio a Cobrar</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--secondary)' }}>
                      ${parseFloat(est.total_price).toFixed(2)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => handleEdit(est.id)} 
                      className="btn btn-outline" 
                      style={{ padding: '0.6rem 1rem' }}
                      title="Cargar en calculadora para editar"
                    >
                      <Edit2 size={16} />
                      <span>Editar</span>
                    </button>
                    <button 
                      onClick={() => handleDelete(est.id, est.name)} 
                      className="btn btn-danger" 
                      style={{ padding: '0.6rem 0.8rem', display: 'flex', alignItems: 'center' }}
                      title="Eliminar cotización"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-anim {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default History;
