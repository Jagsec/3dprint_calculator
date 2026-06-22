import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  FileText, User, Calendar, Layers, Printer, Zap, Wrench, 
  Plus, Trash2, Edit2, ArrowLeft, Save, Briefcase, DollarSign,
  TrendingUp, Settings, CheckCircle, AlertCircle, ShoppingBag
} from 'lucide-react';

const STATUS_LABELS = {
  'QUOTED': { label: 'Presupuestado', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  'APPROVED': { label: 'Aprobado', color: '#06b6d4', bg: 'rgba(6,182,212,0.15)' },
  'IN_PRODUCTION': { label: 'En Producción', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
  'DELIVERED': { label: 'Entregado', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  'PAID': { label: 'Pagado', color: '#10b981', bg: 'rgba(16,185,129,0.3)' }
};

const FILAMENT_OPTIONS = ['PLA', 'PLA+', 'PETG', 'TPU', 'ASA', 'ABS', 'Nylon', 'Fibra de Carbono'];

function ProjectManager() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [printers, setPrinters] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [estimates, setEstimates] = useState([]);
  
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projectDetails, setProjectDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('list'); // 'list' | 'detail'
  
  // Alert banner
  const [alert, setAlert] = useState({ type: null, message: '' });

  // Formularios de Creación
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    client: '',
    margin_percentage: 30.00,
    status: 'QUOTED',
    due_date: ''
  });

  const [printForm, setPrintForm] = useState({
    name: '',
    printer: '',
    filament_type: 'PLA',
    filament_cost_per_kg: 20.00,
    part_weight_grams: 100.00,
    waste_percentage: 10.00,
    print_time_value: 5,
    print_time_unit: 'hours',
    printer_wattage: 150,
    electricity_cost_kwh: 0.10,
    printer_depreciation_hour: 0.80,
    post_process_value: 1,
    post_process_unit: 'hours',
    post_process_hourly_rate: 8.00
  });

  const [materialForm, setMaterialForm] = useState({
    material: '',
    quantity_used: 1.00
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const projsRes = await api.get('/projects/');
      setProjects(projsRes.data);
      
      const clientsRes = await api.get('/clients/');
      setClients(clientsRes.data);
      
      const printersRes = await api.get('/printers/');
      setPrinters(printersRes.data);
      
      const matRes = await api.get('/materials/');
      setInventory(matRes.data);

      const estsRes = await api.get('/estimates/');
      setEstimates(estsRes.data);
    } catch (err) {
      console.error(err);
      showAlert('error', 'Error al sincronizar datos del ERP.');
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: null, message: '' }), 5000);
  };

  const fetchProjectDetails = async (id) => {
    setLoading(true);
    try {
      const response = await api.get(`/projects/${id}/`);
      setProjectDetails(response.data);
      setSelectedProjectId(id);
      setView('detail');
    } catch (err) {
      console.error(err);
      showAlert('error', 'Error al cargar detalles del proyecto.');
    } finally {
      setLoading(false);
    }
  };

  // Crear nuevo proyecto
  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectForm.name.trim()) {
      showAlert('error', 'El nombre del proyecto es obligatorio.');
      return;
    }

    const payload = {
      ...projectForm,
      client: projectForm.client || null,
      margin_percentage: parseFloat(projectForm.margin_percentage) || 30.00
    };

    try {
      const response = await api.post('/projects/', payload);
      showAlert('success', 'Proyecto creado exitosamente.');
      setProjectForm({ name: '', description: '', client: '', margin_percentage: 30.00, status: 'QUOTED', due_date: '' });
      fetchInitialData();
      fetchProjectDetails(response.data.id);
    } catch (err) {
      console.error(err);
      showAlert('error', 'Error al crear proyecto.');
    }
  };

  // Modificar datos generales del proyecto
  const handleUpdateProjectGeneral = async (field, value) => {
    const updated = { ...projectDetails, [field]: value };
    try {
      const payload = {
        name: updated.name,
        description: updated.description,
        client: updated.client || null,
        margin_percentage: parseFloat(updated.margin_percentage) || 30.00,
        status: updated.status,
        due_date: updated.due_date || null
      };
      await api.put(`/projects/${selectedProjectId}/`, payload);
      fetchProjectDetails(selectedProjectId);
    } catch (err) {
      console.error(err);
      showAlert('error', 'Error al actualizar proyecto.');
    }
  };

  // Eliminar proyecto
  const handleDeleteProject = async (e, id, name) => {
    e.stopPropagation();
    if (!window.confirm(`¿Estás seguro de eliminar el proyecto "${name}"? Se perderán todas sus piezas e historial.`)) {
      return;
    }
    try {
      await api.delete(`/projects/${id}/`);
      showAlert('success', 'Proyecto eliminado.');
      fetchInitialData();
    } catch (err) {
      console.error(err);
      showAlert('error', 'No se pudo eliminar el proyecto.');
    }
  };

  // Auto-completar inputs de impresora al seleccionar una de la flota
  const handlePrinterSelection = (printerId) => {
    const pr = printers.find(p => p.id === parseInt(printerId));
    if (pr) {
      setPrintForm(prev => ({
        ...prev,
        printer: printerId,
        printer_wattage: pr.wattage,
        electricity_cost_kwh: parseFloat(pr.electricity_cost_kwh),
        printer_depreciation_hour: parseFloat(pr.depreciation_per_hour)
      }));
    } else {
      setPrintForm(prev => ({ ...prev, printer: '' }));
    }
  };

  // Agregar pieza impresa al proyecto
  const handleAddPrint = async (e) => {
    e.preventDefault();
    if (!printForm.name.trim()) {
      showAlert('error', 'Nombre de la pieza requerido.');
      return;
    }

    const print_time_minutes = Math.round(
      printForm.print_time_unit === 'hours' 
        ? printForm.print_time_value * 60 
        : printForm.print_time_value
    );

    const post_process_minutes = Math.round(
      printForm.post_process_unit === 'hours' 
        ? printForm.post_process_value * 60 
        : printForm.post_process_value
    );

    const payload = {
      project: selectedProjectId,
      name: printForm.name,
      printer: printForm.printer || null,
      filament_type: printForm.filament_type,
      filament_cost_per_kg: parseFloat(printForm.filament_cost_per_kg) || 0,
      part_weight_grams: parseFloat(printForm.part_weight_grams) || 0,
      waste_percentage: parseFloat(printForm.waste_percentage) || 0,
      print_time_minutes: print_time_minutes,
      printer_wattage: parseInt(printForm.printer_wattage) || 0,
      electricity_cost_kwh: parseFloat(printForm.electricity_cost_kwh) || 0,
      printer_depreciation_hour: parseFloat(printForm.printer_depreciation_hour) || 0,
      post_process_minutes: post_process_minutes,
      post_process_hourly_rate: parseFloat(printForm.post_process_hourly_rate) || 0
    };

    try {
      await api.post('/project-prints/', payload);
      showAlert('success', 'Pieza de impresión agregada.');
      setPrintForm({
        name: '', printer: '', filament_type: 'PLA', filament_cost_per_kg: 20.00,
        part_weight_grams: 100.00, waste_percentage: 10.00, print_time_value: 5,
        print_time_unit: 'hours', printer_wattage: 150, electricity_cost_kwh: 0.10,
        printer_depreciation_hour: 0.80, post_process_value: 1, post_process_unit: 'hours',
        post_process_hourly_rate: 8.00
      });
      fetchProjectDetails(selectedProjectId);
    } catch (err) {
      console.error(err);
      showAlert('error', 'Error al guardar pieza impresa.');
    }
  };

  // Eliminar pieza del proyecto
  const handleDeletePrint = async (printId) => {
    try {
      await api.delete(`/project-prints/${printId}/`);
      showAlert('success', 'Pieza de impresión quitada.');
      fetchProjectDetails(selectedProjectId);
    } catch (err) {
      console.error(err);
      showAlert('error', 'Error al quitar pieza.');
    }
  };

  // Agregar material externo / hardware al proyecto
  const handleAddMaterial = async (e) => {
    e.preventDefault();
    if (!materialForm.material) {
      showAlert('error', 'Por favor selecciona un material del inventario.');
      return;
    }
    if (parseFloat(materialForm.quantity_used) <= 0) {
      showAlert('error', 'La cantidad usada debe ser mayor a cero.');
      return;
    }

    const payload = {
      project: selectedProjectId,
      material: parseInt(materialForm.material),
      quantity_used: parseFloat(materialForm.quantity_used)
    };

    try {
      await api.post('/project-materials/', payload);
      showAlert('success', 'Hardware/Componente externo agregado.');
      setMaterialForm({ material: '', quantity_used: 1.00 });
      fetchProjectDetails(selectedProjectId);
    } catch (err) {
      console.error(err);
      showAlert('error', 'Error al vincular el componente.');
    }
  };

  // Eliminar material del proyecto
  const handleDeleteMaterial = async (relId) => {
    try {
      await api.delete(`/project-materials/${relId}/`);
      showAlert('success', 'Material quitado del proyecto.');
      fetchProjectDetails(selectedProjectId);
    } catch (err) {
      console.error(err);
      showAlert('error', 'Error al desvincular material.');
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

      {/* VISTA 1: LISTADO DE PROYECTOS */}
      {view === 'list' && (
        <div className="grid-3" style={{ alignItems: 'start', gridTemplateColumns: '1fr 2fr' }}>
          {/* CREAR PROYECTO */}
          <form onSubmit={handleCreateProject} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3><span className="gradient-text">Iniciar Proyecto</span></h3>
            
            <div className="form-group">
              <label className="form-label" htmlFor="proj-name">Nombre del Proyecto</label>
              <input
                id="proj-name"
                type="text"
                className="form-input"
                placeholder="Ej. Lámpara Custom, Ensamble Drone"
                value={projectForm.name}
                onChange={e => setProjectForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="proj-client">Cliente</label>
              <select
                id="proj-client"
                className="form-input"
                value={projectForm.client}
                onChange={e => setProjectForm(prev => ({ ...prev, client: e.target.value }))}
              >
                <option value="">Selecciona un cliente...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="proj-date">Fecha de Entrega</label>
              <input
                id="proj-date"
                type="date"
                className="form-input"
                value={projectForm.due_date}
                onChange={e => setProjectForm(prev => ({ ...prev, due_date: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="proj-desc">Notas</label>
              <textarea
                id="proj-desc"
                className="form-input"
                style={{ minHeight: '60px', resize: 'vertical' }}
                placeholder="Instrucciones del cliente, detalles adicionales..."
                value={projectForm.description}
                onChange={e => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              <Plus size={16} /> Crear Proyecto
            </button>
          </form>

          {/* LISTA DE PROYECTOS */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Proyectos en Marcha</h3>
              <span className="user-badge">{projects.length} proyectos</span>
            </div>

            {projects.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>No has creado ningún proyecto de gestión. Inicia uno en el formulario lateral.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {projects.map(proj => {
                  const stateInfo = STATUS_LABELS[proj.status] || { label: proj.status, color: '#9ca3af', bg: 'rgba(255,255,255,0.05)' };
                  return (
                    <div 
                      key={proj.id} 
                      className="glass-panel history-item" 
                      style={{ padding: '1.25rem', borderLeftColor: stateInfo.color }}
                      onClick={() => fetchProjectDetails(proj.id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Briefcase size={16} style={{ color: 'var(--secondary)' }} />
                            <span>{proj.name}</span>
                          </h4>
                          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {proj.client_details && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <User size={12} /> {proj.client_details.name}
                              </span>
                            )}
                            {proj.due_date && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Calendar size={12} /> {new Date(proj.due_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Presupuesto</div>
                            <strong style={{ fontSize: '1.3rem', color: 'var(--secondary)' }}>${parseFloat(proj.total_price).toFixed(2)}</strong>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                            <span className="user-badge" style={{ color: stateInfo.color, backgroundColor: stateInfo.bg, borderColor: stateInfo.color, fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                              {stateInfo.label}
                            </span>
                            <button 
                              onClick={(e) => handleDeleteProject(e, proj.id, proj.name)} 
                              className="btn-danger" 
                              style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
                              title="Borrar Proyecto"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VISTA 2: DETALLE / COTIZADOR COMPUESTO (BOM) */}
      {view === 'detail' && projectDetails && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* HEADER DEL DETALLE */}
          <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <button className="btn btn-outline" onClick={() => { setView('list'); fetchInitialData(); }}>
              <ArrowLeft size={16} /> Volver a Proyectos
            </button>
            <h2 style={{ margin: 0 }}>
              Proyecto: <span className="gradient-text">{projectDetails.name}</span>
            </h2>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <select
                  className="form-input"
                  value={projectDetails.status}
                  onChange={e => handleUpdateProjectGeneral('status', e.target.value)}
                  style={{ height: '40px', padding: '0.2rem 1.5rem' }}
                >
                  <option value="QUOTED">Presupuestado</option>
                  <option value="APPROVED">Aprobado</option>
                  <option value="IN_PRODUCTION">En Producción</option>
                  <option value="DELIVERED">Entregado</option>
                  <option value="PAID">Pagado</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid-2" style={{ alignItems: 'start', gridTemplateColumns: '2fr 1fr' }}>
            
            {/* CONSTRUCCIÓN DEL BOM (IZQUIERDA) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* PIEZAS IMPRESAS */}
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Printer size={18} /> Piezas Impresas 3D</h3>
                  <span className="user-badge">{projectDetails.prints?.length || 0} piezas</span>
                </div>

                {projectDetails.prints?.length > 0 && (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '0.5rem' }}>Pieza</th>
                          <th style={{ padding: '0.5rem' }}>Impresora</th>
                          <th style={{ padding: '0.5rem' }}>Peso</th>
                          <th style={{ padding: '0.5rem' }}>Tiempo</th>
                          <th style={{ padding: '0.5rem', textAlign: 'right' }}>Costo Directo</th>
                          <th style={{ padding: '0.5rem', textAlign: 'center' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projectDetails.prints.map(prt => (
                          <tr key={prt.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            <td style={{ padding: '0.75rem 0.5rem', fontWeight: '500' }}>{prt.name} ({prt.filament_type})</td>
                            <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>{prt.printer_details?.name || 'Manual'}</td>
                            <td style={{ padding: '0.75rem 0.5rem' }}>{parseFloat(prt.part_weight_grams).toFixed(0)}g</td>
                            <td style={{ padding: '0.75rem 0.5rem' }}>
                              {prt.print_time_minutes >= 60 
                                ? `${(prt.print_time_minutes / 60).toFixed(1)}h` 
                                : `${prt.print_time_minutes}m`}
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: '600' }}>${parseFloat(prt.total_cost).toFixed(2)}</td>
                            <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                              <button 
                                onClick={() => handleDeletePrint(prt.id)} 
                                className="btn-danger" 
                                style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* FORMULARIO AGREGAR IMPRESIÓN */}
                <form onSubmit={handleAddPrint} style={{ borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>+ Agregar Pieza Impresa al Presupuesto</div>
                    {estimates.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>o importar del Historial:</span>
                        <select
                          className="form-input"
                          style={{ width: '200px', padding: '0.25rem 0.5rem', fontSize: '0.75rem', height: '28px' }}
                          value=""
                          onChange={e => {
                            const estId = e.target.value;
                            if (!estId) return;
                            const est = estimates.find(item => item.id.toString() === estId.toString());
                            if (est) {
                              let printVal = est.print_time_minutes;
                              let printUnit = 'minutes';
                              if (est.print_time_minutes % 60 === 0 || est.print_time_minutes >= 60) {
                                printVal = est.print_time_minutes / 60;
                                printUnit = 'hours';
                              }

                              setPrintForm(prev => ({
                                ...prev,
                                name: est.name,
                                filament_type: est.filament_type,
                                filament_cost_per_kg: parseFloat(est.filament_cost_per_kg) || 20.00,
                                part_weight_grams: parseFloat(est.part_weight_grams) || 100.00,
                                waste_percentage: parseFloat(est.waste_percentage) || 10.00,
                                print_time_value: printVal,
                                print_time_unit: printUnit,
                                printer_wattage: est.printer_wattage || 150,
                                electricity_cost_kwh: parseFloat(est.electricity_cost_kwh) || 0.10,
                                printer_depreciation_hour: parseFloat(est.printer_depreciation_hour) || 0.80
                              }));
                              showAlert('success', `Datos de "${est.name}" cargados en el formulario.`);
                            }
                          }}
                        >
                          <option value="">-- Selecciona --</option>
                          {estimates.map(item => (
                            <option key={item.id} value={item.id}>{item.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="grid-3">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Nombre de Pieza</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ej. Carcasa Superior"
                        value={printForm.name}
                        onChange={e => setPrintForm(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Usar Impresora de Flota</label>
                      <select
                        className="form-input"
                        value={printForm.printer}
                        onChange={e => handlePrinterSelection(e.target.value)}
                      >
                        <option value="">Configurar Manual...</option>
                        {printers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Filamento</label>
                      <select
                        className="form-input"
                        value={printForm.filament_type}
                        onChange={e => setPrintForm(prev => ({ ...prev, filament_type: e.target.value }))}
                      >
                        {FILAMENT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid-3">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Costo Rollo ($/kg)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        value={printForm.filament_cost_per_kg}
                        onChange={e => setPrintForm(prev => ({ ...prev, filament_cost_per_kg: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Peso Pieza (g)</label>
                      <input
                        type="number"
                        step="1"
                        className="form-input"
                        value={printForm.part_weight_grams}
                        onChange={e => setPrintForm(prev => ({ ...prev, part_weight_grams: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Desperdicio (%)</label>
                      <input
                        type="number"
                        step="1"
                        className="form-input"
                        value={printForm.waste_percentage}
                        onChange={e => setPrintForm(prev => ({ ...prev, waste_percentage: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>

                  <div className="grid-3">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <label className="form-label" style={{ marginBottom: 0 }}>Tiempo Impr.</label>
                        <span style={{ fontSize: '0.75rem', color: 'var(--primary)', cursor: 'pointer', fontWeight: '600' }} onClick={() => setPrintForm(prev => ({ ...prev, print_time_unit: prev.print_time_unit === 'hours' ? 'minutes' : 'hours' }))}>
                          {printForm.print_time_unit === 'hours' ? 'H' : 'M'}
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        className="form-input"
                        value={printForm.print_time_value}
                        onChange={e => setPrintForm(prev => ({ ...prev, print_time_value: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Consumo (W)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={printForm.printer_wattage}
                        onChange={e => setPrintForm(prev => ({ ...prev, printer_wattage: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Depreciación ($/h)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        value={printForm.printer_depreciation_hour}
                        onChange={e => setPrintForm(prev => ({ ...prev, printer_depreciation_hour: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>

                  <div className="grid-3">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Electricidad ($/kWh)</label>
                      <input
                        type="number"
                        step="0.0001"
                        className="form-input"
                        value={printForm.electricity_cost_kwh}
                        onChange={e => setPrintForm(prev => ({ ...prev, electricity_cost_kwh: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <label className="form-label" style={{ marginBottom: 0 }}>Post-proceso</label>
                        <span style={{ fontSize: '0.75rem', color: 'var(--primary)', cursor: 'pointer', fontWeight: '600' }} onClick={() => setPrintForm(prev => ({ ...prev, post_process_unit: prev.post_process_unit === 'hours' ? 'minutes' : 'hours' }))}>
                          {printForm.post_process_unit === 'hours' ? 'H' : 'M'}
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        className="form-input"
                        value={printForm.post_process_value}
                        onChange={e => setPrintForm(prev => ({ ...prev, post_process_value: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Mano de Obra ($/h)</label>
                      <input
                        type="number"
                        step="0.5"
                        className="form-input"
                        value={printForm.post_process_hourly_rate}
                        onChange={e => setPrintForm(prev => ({ ...prev, post_process_hourly_rate: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-secondary" style={{ alignSelf: 'flex-end', padding: '0.5rem 1rem' }}>
                    <Plus size={14} /> Añadir Impresión
                  </button>
                </form>
              </div>

              {/* MATERIALES / HARDWARE EXTERNO */}
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><ShoppingBag size={18} /> Componentes Externos (BOM)</h3>
                  <span className="user-badge">{projectDetails.project_materials?.length || 0} materiales</span>
                </div>

                {projectDetails.project_materials?.length > 0 && (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '0.5rem' }}>Componente</th>
                          <th style={{ padding: '0.5rem' }}>Cantidad</th>
                          <th style={{ padding: '0.5rem', textAlign: 'right' }}>Costo Unitario</th>
                          <th style={{ padding: '0.5rem', textAlign: 'right' }}>Costo Total</th>
                          <th style={{ padding: '0.5rem', textAlign: 'center' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projectDetails.project_materials.map(pm => (
                          <tr key={pm.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            <td style={{ padding: '0.75rem 0.5rem', fontWeight: '500' }}>{pm.material_details?.name}</td>
                            <td style={{ padding: '0.75rem 0.5rem' }}>{parseFloat(pm.quantity_used).toFixed(1)} {pm.material_details?.unit_of_measure}</td>
                            <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-muted)' }}>${parseFloat(pm.material_details?.unit_cost).toFixed(4)}</td>
                            <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: '600' }}>${parseFloat(pm.total_cost).toFixed(2)}</td>
                            <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                              <button 
                                onClick={() => handleDeleteMaterial(pm.id)} 
                                className="btn-danger" 
                                style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* FORMULARIO AGREGAR MATERIAL */}
                <form onSubmit={handleAddMaterial} style={{ borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ marginBottom: 0, flex: '2 1 200px' }}>
                    <label className="form-label">Seleccionar Material del Inventario</label>
                    <select
                      className="form-input"
                      value={materialForm.material}
                      onChange={e => setMaterialForm(prev => ({ ...prev, material: e.target.value }))}
                    >
                      <option value="">Seleccionar del inventario...</option>
                      {inventory.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} (${parseFloat(item.unit_cost).toFixed(4)}/{item.unit_of_measure} - Stock: {parseFloat(item.stock_qty).toFixed(1)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0, flex: '1 1 100px' }}>
                    <label className="form-label">Cantidad a Usar</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={materialForm.quantity_used}
                      onChange={e => setMaterialForm(prev => ({ ...prev, quantity_used: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>

                  <button type="submit" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', height: '44px' }}>
                    <Plus size={14} /> Añadir Componente
                  </button>
                </form>
              </div>

            </div>

            {/* RESUMEN DE COSTOS DEL PROYECTO (DERECHA) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '100px' }}>
              <div className="glass-panel result-card">
                <h3 style={{ marginBottom: '1.25rem' }}>BOM & Resumen de Cotización</h3>
                
                <div className="result-row">
                  <span className="result-label"><Layers size={14} /> Costo Filamentos</span>
                  <span className="result-value">${parseFloat(projectDetails.material_cost).toFixed(2)}</span>
                </div>

                <div className="result-row">
                  <span className="result-label"><Zap size={14} /> Consumo Eléctrico</span>
                  <span className="result-value">${parseFloat(projectDetails.electricity_cost).toFixed(2)}</span>
                </div>

                <div className="result-row">
                  <span className="result-label"><Printer size={14} /> Depreciación Flota</span>
                  <span className="result-value">${parseFloat(projectDetails.depreciation_cost).toFixed(2)}</span>
                </div>

                <div className="result-row">
                  <span className="result-label"><Wrench size={14} /> Mano de Obra Acabados</span>
                  <span className="result-value">${parseFloat(projectDetails.post_process_cost).toFixed(2)}</span>
                </div>

                <div className="result-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
                  <span className="result-label" style={{ fontWeight: '600' }}>Subtotal Impresiones</span>
                  <span className="result-value" style={{ fontWeight: '600' }}>${parseFloat(projectDetails.prints_cost).toFixed(2)}</span>
                </div>

                <div className="result-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
                  <span className="result-label"><ShoppingBag size={14} /> Hardware / Componentes</span>
                  <span className="result-value">${parseFloat(projectDetails.hardware_cost).toFixed(2)}</span>
                </div>

                <div className="result-row">
                  <span className="result-label" style={{ fontWeight: '500' }}>Costo Directo Total</span>
                  <span className="result-value" style={{ fontWeight: '500' }}>${parseFloat(projectDetails.direct_cost).toFixed(2)}</span>
                </div>

                {/* Margen */}
                <div className="form-group" style={{ margin: '1rem 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                    <span className="result-label"><TrendingUp size={14} /> Margen Ganancia</span>
                    <span style={{ fontWeight: '600', color: 'var(--primary)' }}>{parseFloat(projectDetails.margin_percentage).toFixed(0)}%</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      style={{ flex: 1, accentColor: 'var(--primary)' }}
                      value={parseFloat(projectDetails.margin_percentage)}
                      onChange={e => handleUpdateProjectGeneral('margin_percentage', e.target.value)}
                    />
                  </div>
                </div>

                <div className="result-row">
                  <span className="result-label">Ganancia Neta</span>
                  <span className="result-value" style={{ color: 'var(--primary)' }}>+${parseFloat(projectDetails.margin_value).toFixed(2)}</span>
                </div>

                <div className="result-total">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Presupuesto Final</span>
                    <span>${parseFloat(projectDetails.total_price).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* INFORMACIÓN DEL PROYECTO */}
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                <h4>Detalles del Proyecto</h4>
                {projectDetails.client_details && (
                  <div>Cliente: <strong>{projectDetails.client_details.name}</strong></div>
                )}
                {projectDetails.due_date && (
                  <div>Entrega: <strong>{new Date(projectDetails.due_date).toLocaleDateString()}</strong></div>
                )}
                {projectDetails.description && (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
                    {projectDetails.description}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectManager;
