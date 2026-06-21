import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  User, Mail, Phone, FileText, Plus, Trash2, Edit2, Search, CheckCircle, AlertCircle 
} from 'lucide-react';

function ClientManager() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estado del formulario
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', notes: '' });
  const [editId, setEditId] = useState(null);
  
  const [alert, setAlert] = useState({ type: null, message: '' });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await api.get('/clients/');
      setClients(response.data);
    } catch (err) {
      console.error(err);
      showAlert('error', 'No se pudieron cargar los clientes.');
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
      showAlert('error', 'El nombre es obligatorio.');
      return;
    }

    try {
      if (editId) {
        await api.put(`/clients/${editId}/`, formData);
        showAlert('success', 'Cliente actualizado exitosamente.');
      } else {
        await api.post('/clients/', formData);
        showAlert('success', 'Cliente creado exitosamente.');
      }
      setFormData({ name: '', email: '', phone: '', notes: '' });
      setEditId(null);
      fetchClients();
    } catch (err) {
      console.error(err);
      showAlert('error', 'Ocurrió un error al guardar el cliente.');
    }
  };

  const handleEdit = (client) => {
    setFormData({
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      notes: client.notes || ''
    });
    setEditId(client.id);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Estás seguro de eliminar al cliente "${name}"? Se desvinculará de sus proyectos.`)) {
      return;
    }
    try {
      await api.delete(`/clients/${id}/`);
      showAlert('success', 'Cliente eliminado.');
      if (editId === id) {
        setEditId(null);
        setFormData({ name: '', email: '', phone: '', notes: '' });
      }
      fetchClients();
    } catch (err) {
      console.error(err);
      showAlert('error', 'No se pudo eliminar al cliente.');
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <span className="gradient-text">{editId ? 'Editar Cliente' : 'Nuevo Cliente'}</span>
          </h3>

          <div className="form-group">
            <label className="form-label" htmlFor="client-name">Nombre / Empresa</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                id="client-name"
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Nombre del cliente"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="client-email">Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                id="client-email"
                type="email"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="correo@ejemplo.com"
                value={formData.email}
                onChange={e => handleInputChange('email', e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="client-phone">Teléfono</label>
            <div style={{ position: 'relative' }}>
              <Phone size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                id="client-phone"
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Ej. +54 9 11 2233-4455"
                value={formData.phone}
                onChange={e => handleInputChange('phone', e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="client-notes">Notas / Detalles</label>
            <div style={{ position: 'relative' }}>
              <FileText size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <textarea
                id="client-notes"
                className="form-input"
                style={{ paddingLeft: '2.5rem', minHeight: '80px', resize: 'vertical' }}
                placeholder="Dirección de entrega, especificaciones de facturación..."
                value={formData.notes}
                onChange={e => handleInputChange('notes', e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              <Plus size={18} />
              <span>{editId ? 'Actualizar' : 'Registrar'}</span>
            </button>
            {editId && (
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => {
                  setEditId(null);
                  setFormData({ name: '', email: '', phone: '', notes: '' });
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
            <h3 style={{ margin: 0 }}>Directorio de Clientes</h3>
            <span className="user-badge">{clients.length} registrados</span>
          </div>

          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Buscar por nombre..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {loading && clients.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Cargando directorio...</p>
          ) : filteredClients.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No se encontraron clientes.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {filteredClients.map(client => (
                <div key={client.id} className="history-item" style={{ padding: '1rem', borderLeftColor: 'var(--primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{client.name}</div>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button 
                        onClick={() => handleEdit(client)} 
                        className="btn-danger" 
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(client.id, client.name)} 
                        className="btn-danger" 
                        style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {client.email && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={12} /> {client.email}</span>}
                    {client.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={12} /> {client.phone}</span>}
                    {client.notes && <span style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '0.25rem', paddingLeft: '0.25rem', borderLeft: '2px solid rgba(255,255,255,0.05)' }}>{client.notes}</span>}
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

export default ClientManager;
