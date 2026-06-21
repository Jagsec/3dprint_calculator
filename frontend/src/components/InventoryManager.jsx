import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Layers, Tag, DollarSign, Package, Search, Plus, Trash2, Edit2, CheckCircle, AlertCircle 
} from 'lucide-react';

const UNIT_CHOICES = [
  { value: 'g', label: 'Gramos (g)' },
  { value: 'units', label: 'Unidades (U)' },
  { value: 'cm', label: 'Centímetros (cm)' },
  { value: 'meters', label: 'Metros (m)' }
];

const FILAMENT_CHOICES = [
  { value: 'FILAMENT', label: 'Filamento' },
  { value: 'COMPONENT', label: 'Componente / Hardware' }
];

function InventoryManager() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    name: '',
    material_type: 'FILAMENT',
    purchase_cost: 20.00,
    purchase_size: 1000.00,
    unit_of_measure: 'g',
    stock_qty: 1000.00,
    details: ''
  });
  const [editId, setEditId] = useState(null);
  
  const [alert, setAlert] = useState({ type: null, message: '' });

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const response = await api.get('/materials/');
      setMaterials(response.data);
    } catch (err) {
      console.error(err);
      showAlert('error', 'No se pudieron cargar los materiales.');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: null, message: '' }), 5000);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-ajustes lógicos de unidades al cambiar el tipo
      if (field === 'material_type') {
        if (value === 'FILAMENT') {
          updated.unit_of_measure = 'g';
          updated.purchase_size = 1000.00;
          updated.stock_qty = 1000.00;
        } else {
          updated.unit_of_measure = 'units';
          updated.purchase_size = 1.00;
          updated.stock_qty = 10.00;
        }
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showAlert('error', 'El nombre es obligatorio.');
      return;
    }
    if (parseFloat(formData.purchase_size) <= 0) {
      showAlert('error', 'El tamaño de compra debe ser mayor a cero.');
      return;
    }

    const payload = {
      name: formData.name,
      material_type: formData.material_type,
      purchase_cost: parseFloat(formData.purchase_cost) || 0,
      purchase_size: parseFloat(formData.purchase_size) || 1,
      unit_of_measure: formData.unit_of_measure,
      stock_qty: parseFloat(formData.stock_qty) || 0,
      details: formData.details
    };

    try {
      if (editId) {
        await api.put(`/materials/${editId}/`, payload);
        showAlert('success', 'Material actualizado exitosamente.');
      } else {
        await api.post('/materials/', payload);
        showAlert('success', 'Material registrado exitosamente en el inventario.');
      }
      // Reset del formulario
      setFormData({
        name: '',
        material_type: 'FILAMENT',
        purchase_cost: 20.00,
        purchase_size: 1000.00,
        unit_of_measure: 'g',
        stock_qty: 1000.00,
        details: ''
      });
      setEditId(null);
      fetchMaterials();
    } catch (err) {
      console.error(err);
      showAlert('error', 'Ocurrió un error al guardar el material.');
    }
  };

  const handleEdit = (material) => {
    setFormData({
      name: material.name,
      material_type: material.material_type,
      purchase_cost: parseFloat(material.purchase_cost),
      purchase_size: parseFloat(material.purchase_size),
      unit_of_measure: material.unit_of_measure,
      stock_qty: parseFloat(material.stock_qty),
      details: material.details || ''
    });
    setEditId(material.id);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${name}" del inventario?`)) {
      return;
    }
    try {
      await api.delete(`/materials/${id}/`);
      showAlert('success', 'Material eliminado.');
      if (editId === id) {
        setEditId(null);
        setFormData({
          name: '',
          material_type: 'FILAMENT',
          purchase_cost: 20.00,
          purchase_size: 1000.00,
          unit_of_measure: 'g',
          stock_qty: 1000.00,
          details: ''
        });
      }
      fetchMaterials();
    } catch (err) {
      console.error(err);
      showAlert('error', 'No se pudo eliminar el material.');
    }
  };

  const filteredMaterials = materials.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
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
            <span className="gradient-text">{editId ? 'Editar Material / Bobina' : 'Nuevo Material / Bobina'}</span>
          </h3>

          <div className="grid-2">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="mat-name">Nombre / Descripción</label>
              <div style={{ position: 'relative' }}>
                <Layers size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  id="mat-name"
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Ej. PLA Rojo, Luces LED..."
                  value={formData.name}
                  onChange={e => handleInputChange('name', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="mat-type">Categoría</label>
              <select
                id="mat-type"
                className="form-input"
                value={formData.material_type}
                onChange={e => handleInputChange('material_type', e.target.value)}
              >
                {FILAMENT_CHOICES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="mat-cost">Costo de Compra ($)</label>
              <div style={{ position: 'relative' }}>
                <DollarSign size={14} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
                <input
                  id="mat-cost"
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  style={{ paddingLeft: '2rem' }}
                  value={formData.purchase_cost}
                  onChange={e => handleInputChange('purchase_cost', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="mat-size">Tamaño Adquirido</label>
              <input
                id="mat-size"
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                placeholder="Ej. 1000g, 500 unidades"
                value={formData.purchase_size}
                onChange={e => handleInputChange('purchase_size', parseFloat(e.target.value) || 1)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="mat-uom">Unidad de Uso</label>
              <select
                id="mat-uom"
                className="form-input"
                value={formData.unit_of_measure}
                onChange={e => handleInputChange('unit_of_measure', e.target.value)}
              >
                {UNIT_CHOICES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="mat-stock">Cantidad en Stock</label>
              <div style={{ position: 'relative' }}>
                <Package size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  id="mat-stock"
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  value={formData.stock_qty}
                  onChange={e => handleInputChange('stock_qty', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Costo por Unidad Fraccionaria</label>
              <div className="form-input" style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--secondary)', fontWeight: '600' }}>
                ${(formData.purchase_size > 0 ? formData.purchase_cost / formData.purchase_size : 0).toFixed(4)} / {formData.unit_of_measure}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="mat-details">Notas del Inventario</label>
            <textarea
              id="mat-details"
              className="form-input"
              style={{ minHeight: '60px', resize: 'vertical' }}
              placeholder="Marca, color, proveedor, link de compra..."
              value={formData.details}
              onChange={e => handleInputChange('details', e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              <Plus size={18} />
              <span>{editId ? 'Actualizar' : 'Registrar Inventario'}</span>
            </button>
            {editId && (
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => {
                  setEditId(null);
                  setFormData({
                    name: '',
                    material_type: 'FILAMENT',
                    purchase_cost: 20.00,
                    purchase_size: 1000.00,
                    unit_of_measure: 'g',
                    stock_qty: 1000.00,
                    details: ''
                  });
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
            <h3 style={{ margin: 0 }}>Inventario General</h3>
            <span className="user-badge">{materials.length} ítems</span>
          </div>

          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Buscar material..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {loading && materials.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Cargando inventario...</p>
          ) : filteredMaterials.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No se encontraron materiales.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '520px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {filteredMaterials.map(material => (
                <div key={material.id} className="history-item" style={{ padding: '1rem', borderLeftColor: material.material_type === 'FILAMENT' ? 'var(--primary)' : 'var(--secondary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{material.name}</span>
                        <span className="user-badge" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                          {material.material_type === 'FILAMENT' ? 'Filamento' : 'Pieza Externa'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button 
                        onClick={() => handleEdit(material)} 
                        className="btn-danger" 
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(material.id, material.name)} 
                        className="btn-danger" 
                        style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid-3" style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <div>
                      Stock: <strong style={{ color: material.stock_qty < (material.material_type === 'FILAMENT' ? 150 : 5) ? 'var(--danger)' : 'var(--text-main)' }}>{parseFloat(material.stock_qty).toFixed(1)} {material.unit_of_measure}</strong>
                    </div>
                    <div>
                      Costo Un: <strong>${parseFloat(material.unit_cost).toFixed(4)}</strong>
                    </div>
                    <div>
                      Adq: <strong>${parseFloat(material.purchase_cost).toFixed(2)}</strong> / {parseFloat(material.purchase_size).toFixed(0)}{material.unit_of_measure}
                    </div>
                  </div>
                  {material.details && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)', borderTop: '1px dashed rgba(255,255,255,0.03)', paddingTop: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {material.details}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InventoryManager;
