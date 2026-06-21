import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Printer, Zap, Trash2, Edit2, Plus, AlertCircle, CheckCircle, HelpCircle 
} from 'lucide-react';

function PrinterManager() {
  const [printers, setPrinters] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    name: '',
    wattage: 150,
    depreciation_per_hour: 0.80,
    electricity_cost_kwh: 0.10
  });
  const [editId, setEditId] = useState(null);
  
  const [alert, setAlert] = useState({ type: null, message: '' });

  useEffect(() => {
    fetchPrinters();
  }, []);

  const fetchPrinters = async () => {
    setLoading(true);
    try {
      const response = await api.get('/printers/');
      setPrinters(response.data);
    } catch (err) {
      console.error(err);
      showAlert('error', 'No se pudieron cargar las impresoras.');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: null, message: '' }), 5000);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showAlert('error', 'El nombre de la impresora es obligatorio.');
      return;
    }

    const payload = {
      name: formData.name,
      wattage: parseInt(formData.wattage) || 0,
      depreciation_per_hour: parseFloat(formData.depreciation_per_hour) || 0,
      electricity_cost_kwh: parseFloat(formData.electricity_cost_kwh) || 0
    };

    try {
      if (editId) {
        await api.put(`/printers/${editId}/`, payload);
        showAlert('success', 'Impresora actualizada exitosamente.');
      } else {
        await api.post('/printers/', payload);
        showAlert('success', 'Impresora añadida a la flota.');
      }
      setFormData({ name: '', wattage: 150, depreciation_per_hour: 0.80, electricity_cost_kwh: 0.10 });
      setEditId(null);
      fetchPrinters();
    } catch (err) {
      console.error(err);
      showAlert('error', 'Ocurrió un error al guardar la impresora.');
    }
  };

  const handleEdit = (printer) => {
    setFormData({
      name: printer.name,
      wattage: printer.wattage,
      depreciation_per_hour: parseFloat(printer.depreciation_per_hour),
      electricity_cost_kwh: parseFloat(printer.electricity_cost_kwh)
    });
    setEditId(printer.id);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Estás seguro de eliminar la impresora "${name}" de tu flota?`)) {
      return;
    }
    try {
      await api.delete(`/printers/${id}/`);
      showAlert('success', 'Impresora eliminada.');
      if (editId === id) {
        setEditId(null);
        setFormData({ name: '', wattage: 150, depreciation_per_hour: 0.80, electricity_cost_kwh: 0.10 });
      }
      fetchPrinters();
    } catch (err) {
      console.error(err);
      showAlert('error', 'No se pudo eliminar la impresora.');
    }
  };

  return (
    <div className="app-container">
      {alert.message && (
        <div className={`alert-banner ${alert.type}`}>
          {alert.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{alert.message}</span>
        </div>
      )}

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* FORMULARIO */}
        <form onSubmit={handleSubmit} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3>
            <span className="gradient-text">{editId ? 'Editar Impresora' : 'Registrar Impresora'}</span>
          </h3>

          <div className="form-group">
            <label className="form-label" htmlFor="printer-name">Nombre de la Impresora / Modelo</label>
            <div style={{ position: 'relative' }}>
              <Printer size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                id="printer-name"
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Ej. Bambu Lab P1S, Ender 3 V3"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
              />
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label" htmlFor="printer-wattage">Consumo (W)</label>
              <input
                id="printer-wattage"
                type="number"
                min="0"
                className="form-input"
                value={formData.wattage}
                onChange={e => handleInputChange('wattage', parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="printer-depr">Depreciación ($/h)</label>
              <input
                id="printer-depr"
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                value={formData.depreciation_per_hour}
                onChange={e => handleInputChange('depreciation_per_hour', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="printer-elec">Electricidad ($/kWh)</label>
              <input
                id="printer-elec"
                type="number"
                step="0.0001"
                min="0"
                className="form-input"
                value={formData.electricity_cost_kwh}
                onChange={e => handleInputChange('electricity_cost_kwh', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              <Plus size={18} />
              <span>{editId ? 'Actualizar' : 'Agregar Impresora'}</span>
            </button>
            {editId && (
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => {
                  setEditId(null);
                  setFormData({ name: '', wattage: 150, depreciation_per_hour: 0.80, electricity_cost_kwh: 0.10 });
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        {/* LISTADO */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Flota de Impresoras</h3>
            <span className="user-badge">{printers.length} activas</span>
          </div>

          {loading && printers.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Cargando flota...</p>
          ) : printers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <HelpCircle size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
              <p>Aún no has registrado ninguna impresora. Añade una para agilizar tus cotizaciones.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {printers.map(printer => (
                <div key={printer.id} className="history-item" style={{ padding: '1.25rem', borderLeftColor: 'var(--secondary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Printer size={18} style={{ color: 'var(--secondary)' }} />
                      <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{printer.name}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button 
                        onClick={() => handleEdit(printer)} 
                        className="btn-danger" 
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(printer.id, printer.name)} 
                        className="btn-danger" 
                        style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid-3" style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Zap size={12} /> {printer.wattage} W
                    </div>
                    <div>
                      Depr: <strong>${parseFloat(printer.depreciation_per_hour).toFixed(2)}/h</strong>
                    </div>
                    <div>
                      Elec: <strong>${parseFloat(printer.electricity_cost_kwh).toFixed(4)}/kWh</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PrinterManager;
