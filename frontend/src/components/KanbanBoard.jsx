import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Trello, Plus, Trash2, Edit2, Calendar, Folder, CheckSquare, 
  Search, X, Check, ChevronRight, ChevronLeft, ArrowRightLeft, Clock
} from 'lucide-react';

const COLUMNS = [
  { id: 'TODO', label: 'Por Hacer', color: '#9ca3af', bg: 'rgba(156, 163, 175, 0.1)', border: 'rgba(156, 163, 175, 0.2)' },
  { id: 'DESIGNING', label: 'Diseño / Slicing', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.2)' },
  { id: 'QUEUE', label: 'Cola de Impresión', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)' },
  { id: 'PRINTING', label: 'Imprimiendo', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.2)' },
  { id: 'POST_PROCESSING', label: 'Post-procesado', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)', border: 'rgba(236, 72, 153, 0.2)' },
  { id: 'QC', label: 'Control Calidad', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)', border: 'rgba(6, 182, 212, 0.2)' },
  { id: 'DONE', label: 'Listo / Entregado', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)' }
];

function KanbanBoard() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Alert banner
  const [alert, setAlert] = useState({ type: null, message: '' });
  
  // Expandible form / Modal control
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // Form State
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    project: '',
    status: 'TODO',
    due_date: ''
  });

  useEffect(() => {
    fetchProjects();
    fetchTasks();
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects/');
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let url = '/tasks/';
      if (selectedProjectId) {
        url += `?project=${selectedProjectId}`;
      }
      const res = await api.get(url);
      setTasks(res.data);
    } catch (err) {
      console.error(err);
      showAlert('error', 'No se pudieron sincronizar las tareas del Kanban.');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: null, message: '' }), 5000);
  };

  const handleInputChange = (field, val) => {
    setTaskForm(prev => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) {
      showAlert('error', 'El título de la tarea es obligatorio.');
      return;
    }
    if (!taskForm.project) {
      showAlert('error', 'Debes asociar la tarea a un proyecto.');
      return;
    }

    try {
      const payload = {
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        project: parseInt(taskForm.project),
        status: taskForm.status,
        due_date: taskForm.due_date || null
      };

      if (editId) {
        await api.put(`/tasks/${editId}/`, payload);
        showAlert('success', 'Tarea actualizada exitosamente.');
      } else {
        await api.post('/tasks/', payload);
        showAlert('success', 'Tarea creada exitosamente.');
      }

      setTaskForm({
        title: '',
        description: '',
        project: selectedProjectId || '',
        status: 'TODO',
        due_date: ''
      });
      setEditId(null);
      setShowForm(false);
      fetchTasks();
    } catch (err) {
      console.error(err);
      showAlert('error', 'Ocurrió un error al guardar la tarea.');
    }
  };

  const handleEdit = (task) => {
    setTaskForm({
      title: task.title,
      description: task.description || '',
      project: task.project.toString(),
      status: task.status,
      due_date: task.due_date || ''
    });
    setEditId(task.id);
    setShowForm(true);
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`¿Estás seguro de eliminar la tarea "${title}"?`)) {
      return;
    }
    try {
      await api.delete(`/tasks/${id}/`);
      showAlert('success', 'Tarea eliminada correctamente.');
      if (editId === id) {
        setEditId(null);
        setTaskForm({
          title: '',
          description: '',
          project: selectedProjectId || '',
          status: 'TODO',
          due_date: ''
        });
      }
      fetchTasks();
    } catch (err) {
      console.error(err);
      showAlert('error', 'No se pudo eliminar la tarea.');
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStatus) => {
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    
    // Encontrar la tarea para obtener los datos de envío y evitar perder el project ID
    const task = tasks.find(t => t.id.toString() === taskId.toString());
    if (!task || task.status === targetStatus) return;

    try {
      await api.patch(`/tasks/${taskId}/`, { status: targetStatus });
      fetchTasks();
    } catch (err) {
      console.error(err);
      showAlert('error', 'Error al mover el estado de la tarea.');
    }
  };

  // Mover estado de tarea con botón/dropdown (Mobile friendly)
  const handleMoveStatus = async (taskId, targetStatus) => {
    try {
      await api.patch(`/tasks/${taskId}/`, { status: targetStatus });
      fetchTasks();
    } catch (err) {
      console.error(err);
      showAlert('error', 'Error al cambiar el estado.');
    }
  };

  const isOverdue = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    const dueDate = new Date(dateStr);
    dueDate.setHours(24,0,0,0); // Dar margen al día completo
    return dueDate < today;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  // Buscar proyecto por id para mostrar el nombre
  const getProjectName = (projectId) => {
    const proj = projects.find(p => p.id === projectId);
    return proj ? proj.name : 'Proyecto Desconocido';
  };

  // Tareas filtradas por búsqueda de texto
  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="app-container">
      {alert.message && (
        <div className={`alert-banner ${alert.type}`}>
          {alert.type === 'success' ? <Check size={18} /> : <X size={18} />}
          <span>{alert.message}</span>
        </div>
      )}

      {/* HEADER Y FILTROS */}
      <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'between', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '250px' }}>
            <Trello size={28} style={{ color: 'var(--primary)' }} />
            <h2 style={{ margin: 0 }}><span className="gradient-text">Tablero Kanban</span></h2>
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Buscador de tareas */}
            <div style={{ position: 'relative', minWidth: '200px' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Buscar tareas..."
                className="form-input"
                style={{ paddingLeft: '2.2rem', paddingRight: '1rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', fontSize: '0.9rem' }}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Selector de Proyecto */}
            <select
              className="form-input"
              style={{ width: '220px', paddingTop: '0.5rem', paddingBottom: '0.5rem', fontSize: '0.9rem' }}
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
            >
              <option value="">Todos los Proyectos</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <button 
              className="btn btn-primary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
              onClick={() => {
                setEditId(null);
                setTaskForm({
                  title: '',
                  description: '',
                  project: selectedProjectId || (projects.length > 0 ? projects[0].id.toString() : ''),
                  status: 'TODO',
                  due_date: ''
                });
                setShowForm(!showForm);
              }}
            >
              {showForm ? <X size={16} /> : <Plus size={16} />}
              <span>{showForm ? 'Cancelar' : 'Nueva Tarea'}</span>
            </button>
          </div>
        </div>

        {/* FORMULARIO DE CREACIÓN / EDICIÓN INLINE */}
        {showForm && (
          <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1.5rem' }}>
            <h4 style={{ marginBottom: '1rem' }}><span className="gradient-text">{editId ? 'Editar Tarea' : 'Registrar Nueva Tarea'}</span></h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="task-title">Título de la Tarea</label>
                  <input
                    id="task-title"
                    type="text"
                    placeholder="Ej. Slicing de soporte de cámara"
                    className="form-input"
                    value={taskForm.title}
                    onChange={e => handleInputChange('title', e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="task-project">Proyecto Asociado</label>
                  <select
                    id="task-project"
                    className="form-input"
                    value={taskForm.project}
                    onChange={e => handleInputChange('project', e.target.value)}
                  >
                    <option value="" disabled>Selecciona un Proyecto</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="task-description">Descripción / Instrucciones</label>
                <textarea
                  id="task-description"
                  placeholder="Detalles sobre filamento a usar, orientación de capa, post-procesado..."
                  className="form-input"
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  value={taskForm.description}
                  onChange={e => handleInputChange('description', e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="task-status">Columna Inicial</label>
                  <select
                    id="task-status"
                    className="form-input"
                    value={taskForm.status}
                    onChange={e => handleInputChange('status', e.target.value)}
                  >
                    {COLUMNS.map(col => (
                      <option key={col.id} value={col.id}>{col.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="task-due-date">Fecha Límite</label>
                  <input
                    id="task-due-date"
                    type="date"
                    className="form-input"
                    value={taskForm.due_date}
                    onChange={e => handleInputChange('due_date', e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'end' }}>
                  <button type="submit" className="btn btn-secondary" style={{ width: '100%', height: '42px' }}>
                    <Check size={16} />
                    <span>Guardar Tarea</span>
                  </button>
                </div>
              </div>

            </div>
          </form>
        )}
      </div>

      {/* TABLERO DE COLUMNAS KANBAN */}
      <div 
        style={{ 
          display: 'flex', 
          gap: '1rem', 
          overflowX: 'auto', 
          paddingBottom: '1.5rem',
          minHeight: '65vh',
          alignItems: 'stretch'
        }}
      >
        {COLUMNS.map(column => {
          const columnTasks = filteredTasks.filter(t => t.status === column.id);
          
          return (
            <div
              key={column.id}
              className="kanban-column"
              style={{
                flex: '0 0 320px',
                background: 'rgba(10, 15, 30, 0.4)',
                borderRadius: 'var(--radius)',
                border: `1px solid ${column.border}`,
                display: 'flex',
                flexDirection: 'column',
                padding: '0.8rem',
                minHeight: '400px'
              }}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Encabezado Columna */}
              <div 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: '1rem',
                  borderBottom: `2px solid ${column.color}`,
                  paddingBottom: '0.5rem'
                }}
              >
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: column.color }}>
                  {column.label}
                </span>
                <span 
                  style={{ 
                    fontSize: '0.75rem', 
                    background: column.bg, 
                    color: column.color,
                    padding: '0.2rem 0.5rem',
                    borderRadius: '10px',
                    fontWeight: 'bold'
                  }}
                >
                  {columnTasks.length}
                </span>
              </div>

              {/* Contenedor de Tarjetas */}
              <div 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.75rem', 
                  flex: 1, 
                  overflowY: 'auto', 
                  paddingRight: '2px'
                }}
              >
                {columnTasks.length === 0 ? (
                  <div 
                    style={{ 
                      flex: 1, 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      color: 'var(--text-muted)', 
                      fontSize: '0.8rem',
                      border: '1px dashed rgba(255, 255, 255, 0.03)',
                      borderRadius: '8px',
                      padding: '2rem 1rem',
                      textAlign: 'center'
                    }}
                  >
                    Arrastra tareas aquí
                  </div>
                ) : (
                  columnTasks.map(task => {
                    const isTaskOverdue = isOverdue(task.due_date);
                    
                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        className="glass-panel"
                        style={{
                          padding: '1rem',
                          borderRadius: '10px',
                          background: 'rgba(17, 24, 39, 0.85)',
                          borderLeft: `4px solid ${column.color}`,
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                          cursor: 'grab',
                          position: 'relative'
                        }}
                      >
                        {/* Nombre del Proyecto */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--secondary)', marginBottom: '0.25rem' }}>
                          <Folder size={12} />
                          <span style={{ fontWeight: '600' }}>{getProjectName(task.project)}</span>
                        </div>

                        {/* Título Tarea */}
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', margin: '0 0 0.5rem 0', color: 'var(--text-main)', wordBreak: 'break-word' }}>
                          {task.title}
                        </h4>

                        {/* Descripción corta */}
                        {task.description && (
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {task.description}
                          </p>
                        )}

                        {/* Pie de la tarjeta */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '0.6rem', marginTop: '0.5rem' }}>
                          
                          {/* Fecha Límite */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                            {task.due_date ? (
                              <span style={{ 
                                color: isTaskOverdue && task.status !== 'DONE' ? 'var(--danger)' : 'var(--text-muted)', 
                                fontWeight: isTaskOverdue && task.status !== 'DONE' ? 'bold' : 'normal',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}>
                                <Calendar size={12} />
                                {formatDate(task.due_date)}
                                {isTaskOverdue && task.status !== 'DONE' && <Clock size={11} style={{ marginLeft: '1px' }} />}
                              </span>
                            ) : (
                              <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>Sin plazo</span>
                            )}
                          </div>

                          {/* Acciones */}
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            
                            {/* Selector rápido de columna (Mobile/Touch compatibility) */}
                            <div className="toggle-group" style={{ padding: '0px', border: 'none', background: 'transparent' }}>
                              <select
                                className="form-input"
                                value={task.status}
                                onChange={(e) => handleMoveStatus(task.id, e.target.value)}
                                style={{ 
                                  padding: '0.1rem 0.3rem', 
                                  fontSize: '0.7rem', 
                                  height: '22px', 
                                  width: '90px', 
                                  color: 'var(--text-muted)',
                                  background: 'rgba(255,255,255,0.05)',
                                  borderColor: 'transparent',
                                  borderRadius: '5px'
                                }}
                              >
                                {COLUMNS.map(col => (
                                  <option key={col.id} value={col.id}>{col.label}</option>
                                ))}
                              </select>
                            </div>

                            <button 
                              onClick={() => handleEdit(task)} 
                              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.1rem' }}
                              title="Editar"
                            >
                              <Edit2 size={13} hover-color="var(--primary)" />
                            </button>
                            <button 
                              onClick={() => handleDelete(task.id, task.title)} 
                              style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.1rem' }}
                              title="Eliminar"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default KanbanBoard;
