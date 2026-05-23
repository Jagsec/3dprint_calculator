import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Layers, Printer, Zap, Wrench, TrendingUp, Save, 
  Plus, Trash2, History, AlertCircle, CheckCircle, RefreshCw, FileText
} from 'lucide-react';

const INITIAL_CALC_STATE = {
  name: '',
  description: '',
  filament_type: 'PLA',
  filament_cost_per_kg: 20.00,
  part_weight_grams: 100.00,
  waste_percentage: 10.00,
  print_time_value: 5.00,
  print_time_unit: 'hours', // 'hours' | 'minutes'
  printer_wattage: 150,
  electricity_cost_kwh: 0.15,
  printer_depreciation_hour: 0.50,
  post_process_value: 1.00,
  post_process_unit: 'hours', // 'hours' | 'minutes'
  post_process_hourly_rate: 15.00,
  margin_percentage: 30.00
};

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

function Dashboard() {
  const { user } = useAuth();
  
  // Estados de la calculadora
  const [calcState, setCalcState] = useState(INITIAL_CALC_STATE);
  const [selectedEstimateId, setSelectedEstimateId] = useState(null);
  
  // Estados de la historia y UI
  const [estimates, setEstimates] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({ type: null, message: '' });
  
  // Cargar historial al montar
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await api.get('/estimates/');
      setEstimates(response.data);
    } catch (err) {
      console.error("Error al obtener cotizaciones:", err);
      showAlert('error', 'No se pudo cargar el historial de cotizaciones.');
    } finally {
      setLoadingHistory(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: null, message: '' }), 5000);
  };

  // Manejo de cambios en los inputs
  const handleInputChange = (field, value) => {
    setCalcState(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Real-time calculations (Frontend mirror of Backend logic)
  const getCalculations = () => {
    // 1. Filamento
    const filamentCost = calcState.filament_cost_per_kg || 0;
    const partWeight = calcState.part_weight_grams || 0;
    const waste = calcState.waste_percentage || 0;
    const materialCost = (partWeight / 1000) * (1 + waste / 100) * filamentCost;

    // 2. Impresora (Normalizado a horas)
    const printTimeVal = calcState.print_time_value || 0;
    const printHours = calcState.print_time_unit === 'hours' ? printTimeVal : printTimeVal / 60;
    
    const depreciationHour = calcState.printer_depreciation_hour || 0;
    const printerDepreciationCost = printHours * depreciationHour;

    const wattage = calcState.printer_wattage || 0;
    const elecCostKwh = calcState.electricity_cost_kwh || 0;
    const electricityCost = (wattage / 1000) * printHours * elecCostKwh;

    // 3. Post-procesamiento (Normalizado a horas)
    const postTimeVal = calcState.post_process_value || 0;
    const postHours = calcState.post_process_unit === 'hours' ? postTimeVal : postTimeVal / 60;
    
    const hourlyRate = calcState.post_process_hourly_rate || 0;
    const postProcessCost = postHours * hourlyRate;

    // 4. Margen
    const directCost = materialCost + printerDepreciationCost + electricityCost + postProcessCost;
    const marginPercent = calcState.margin_percentage || 0;
    const marginValue = directCost * (marginPercent / 100);

    // 5. Total
    const totalPrice = directCost + marginValue;

    return {
      materialCost: isNaN(materialCost) ? 0 : materialCost,
      printerDepreciationCost: isNaN(printerDepreciationCost) ? 0 : printerDepreciationCost,
      electricityCost: isNaN(electricityCost) ? 0 : electricityCost,
      postProcessCost: isNaN(postProcessCost) ? 0 : postProcessCost,
      marginValue: isNaN(marginValue) ? 0 : marginValue,
      totalPrice: isNaN(totalPrice) ? 0 : totalPrice
    };
  };

  const calcs = getCalculations();

  // Reset del formulario a valores por defecto
  const handleNewEstimate = () => {
    setCalcState(INITIAL_CALC_STATE);
    setSelectedEstimateId(null);
    showAlert('success', 'Formulario limpiado para una nueva cotización.');
  };

  // Guardar o actualizar la cotización en el Backend
  const handleSave = async (e) => {
    e.preventDefault();
    if (!calcState.name.trim()) {
      showAlert('error', 'Por favor ingresa un nombre para guardar la cotización.');
      return;
    }

    setSaving(true);
    
    // Normalizar tiempos a minutos para la base de datos
    const print_time_minutes = Math.round(
      calcState.print_time_unit === 'hours' 
        ? calcState.print_time_value * 60 
        : calcState.print_time_value
    );

    const post_process_minutes = Math.round(
      calcState.post_process_unit === 'hours' 
        ? calcState.post_process_value * 60 
        : calcState.post_process_value
    );

    const payload = {
      name: calcState.name,
      description: calcState.description,
      filament_type: calcState.filament_type,
      filament_cost_per_kg: calcState.filament_cost_per_kg,
      part_weight_grams: calcState.part_weight_grams,
      waste_percentage: calcState.waste_percentage,
      print_time_minutes: print_time_minutes,
      printer_wattage: calcState.printer_wattage,
      electricity_cost_kwh: calcState.electricity_cost_kwh,
      printer_depreciation_hour: calcState.printer_depreciation_hour,
      post_process_minutes: post_process_minutes,
      post_process_hourly_rate: calcState.post_process_hourly_rate,
      margin_percentage: calcState.margin_percentage
    };

    try {
      if (selectedEstimateId) {
        // Actualizar cotización existente
        await api.put(`/estimates/${selectedEstimateId}/`, payload);
        showAlert('success', 'Cotización actualizada exitosamente.');
      } else {
        // Crear cotización nueva
        const response = await api.post('/estimates/', payload);
        setSelectedEstimateId(response.data.id);
        showAlert('success', 'Cotización guardada exitosamente en el historial.');
      }
      fetchHistory();
    } catch (err) {
      console.error("Error al guardar:", err);
      showAlert('error', 'Ocurrió un error al guardar la cotización.');
    } finally {
      setSaving(false);
    }
  };

  // Cargar una cotización desde el historial
  const handleLoadEstimate = (est) => {
    // Determinar la mejor unidad visual para el tiempo de impresión
    let printVal = est.print_time_minutes;
    let printUnit = 'minutes';
    if (est.print_time_minutes % 60 === 0 || est.print_time_minutes >= 60) {
      printVal = est.print_time_minutes / 60;
      printUnit = 'hours';
    }

    // Determinar la mejor unidad visual para el tiempo de post-procesamiento
    let postVal = est.post_process_minutes;
    let postUnit = 'minutes';
    if (est.post_process_minutes % 60 === 0 || est.post_process_minutes >= 60) {
      postVal = est.post_process_minutes / 60;
      postUnit = 'hours';
    }

    setCalcState({
      name: est.name,
      description: est.description || '',
      filament_type: est.filament_type || 'PLA',
      filament_cost_per_kg: parseFloat(est.filament_cost_per_kg),
      part_weight_grams: parseFloat(est.part_weight_grams),
      waste_percentage: parseFloat(est.waste_percentage),
      print_time_value: printVal,
      print_time_unit: printUnit,
      printer_wattage: est.printer_wattage,
      electricity_cost_kwh: parseFloat(est.electricity_cost_kwh),
      printer_depreciation_hour: parseFloat(est.printer_depreciation_hour),
      post_process_value: postVal,
      post_process_unit: postUnit,
      post_process_hourly_rate: parseFloat(est.post_process_hourly_rate),
      margin_percentage: parseFloat(est.margin_percentage)
    });
    
    setSelectedEstimateId(est.id);
    showAlert('success', `Cotización "${est.name}" cargada.`);
  };

  // Eliminar una cotización
  const handleDeleteEstimate = async (e, id) => {
    e.stopPropagation(); // Evitar que cargue el item al hacer click en borrar
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta cotización del historial?')) {
      return;
    }

    try {
      await api.delete(`/estimates/${id}/`);
      showAlert('success', 'Cotización eliminada.');
      if (selectedEstimateId === id) {
        setSelectedEstimateId(null);
      }
      fetchHistory();
    } catch (err) {
      console.error("Error al eliminar:", err);
      showAlert('error', 'No se pudo eliminar la cotización.');
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
        {/* COLUMNA IZQUIERDA: FORMULARIO CALCULADORA */}
        <form onSubmit={handleSave} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h2 style={{ marginBottom: '0.25rem' }}>
              <span className="gradient-text">Calculadora de Impresión 3D</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Calcula costos exactos ajustando las variables físicas, energéticas y de post-procesamiento.
            </p>
          </div>

          {/* DATOS GENERALES */}
          <div>
            <div className="calc-section-title">
              <FileText size={18} />
              <span>Información del Item</span>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="calc-name">Nombre del Producto / Proyecto</label>
              <input
                id="calc-name"
                type="text"
                className="form-input"
                placeholder="Ej. Soporte Auriculares, Engranaje Nylon..."
                value={calcState.name}
                onChange={e => handleInputChange('name', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="calc-desc">Descripción (Opcional)</label>
              <textarea
                id="calc-desc"
                className="form-input"
                style={{ resize: 'vertical', minHeight: '60px' }}
                placeholder="Detalles sobre el material, color, cliente, etc."
                value={calcState.description}
                onChange={e => handleInputChange('description', e.target.value)}
              />
            </div>
          </div>

          {/* SECCIÓN 1: FILAMENTO */}
          <div>
            <div className="calc-section-title">
              <Layers size={18} />
              <span>Componente 1: Filamento</span>
            </div>
            
            <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="calc-fil-type">Tipo de Filamento</label>
                <select
                  id="calc-fil-type"
                  className="form-input"
                  value={calcState.filament_type}
                  onChange={e => handleInputChange('filament_type', e.target.value)}
                >
                  <option value="PLA">PLA</option>
                  <option value="PLA_PLUS">PLA+</option>
                  <option value="PETG">PETG</option>
                  <option value="TPU">TPU</option>
                  <option value="ASA">ASA</option>
                  <option value="ABS">ABS</option>
                  <option value="NYLON">Nylon</option>
                  <option value="CARBON_FIBER">Fibra de Carbono</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="calc-fil-cost">Costo del Rollo ($/kg)</label>
                <input
                  id="calc-fil-cost"
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  value={calcState.filament_cost_per_kg}
                  onChange={e => handleInputChange('filament_cost_per_kg', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            
            <div className="grid-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="calc-weight">Peso de la Pieza (g)</label>
                <input
                  id="calc-weight"
                  type="number"
                  step="0.1"
                  min="0"
                  className="form-input"
                  value={calcState.part_weight_grams}
                  onChange={e => handleInputChange('part_weight_grams', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="calc-waste">Desperdicio (%)</label>
                <input
                  id="calc-waste"
                  type="number"
                  step="1"
                  min="0"
                  className="form-input"
                  value={calcState.waste_percentage}
                  onChange={e => handleInputChange('waste_percentage', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: IMPRESORA Y ENERGÍA */}
          <div>
            <div className="calc-section-title">
              <Printer size={18} />
              <span>Componente 2: Impresora e Electricidad</span>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="form-label" htmlFor="calc-time" style={{ marginBottom: 0 }}>Tiempo de Impresión</label>
                  <div className="toggle-group">
                    <button
                      type="button"
                      className={`toggle-btn ${calcState.print_time_unit === 'hours' ? 'active' : ''}`}
                      onClick={() => handleInputChange('print_time_unit', 'hours')}
                    >
                      Horas
                    </button>
                    <button
                      type="button"
                      className={`toggle-btn ${calcState.print_time_unit === 'minutes' ? 'active' : ''}`}
                      onClick={() => handleInputChange('print_time_unit', 'minutes')}
                    >
                      Minutos
                    </button>
                  </div>
                </div>
                <input
                  id="calc-time"
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  value={calcState.print_time_value}
                  onChange={e => handleInputChange('print_time_value', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="calc-wattage">Consumo Impresora (Watts)</label>
                <input
                  id="calc-wattage"
                  type="number"
                  step="10"
                  min="0"
                  className="form-input"
                  value={calcState.printer_wattage}
                  onChange={e => handleInputChange('printer_wattage', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="calc-elec">Electricidad ($ por kWh)</label>
                <input
                  id="calc-elec"
                  type="number"
                  step="0.0001"
                  min="0"
                  className="form-input"
                  value={calcState.electricity_cost_kwh}
                  onChange={e => handleInputChange('electricity_cost_kwh', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="calc-depr">Depreciación ($ por hora)</label>
                <input
                  id="calc-depr"
                  type="number"
                  step="0.05"
                  min="0"
                  className="form-input"
                  value={calcState.printer_depreciation_hour}
                  onChange={e => handleInputChange('printer_depreciation_hour', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: POST-PROCESAMIENTO */}
          <div>
            <div className="calc-section-title">
              <Wrench size={18} />
              <span>Componente 3: Mano de Obra (Post-proceso)</span>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="form-label" htmlFor="calc-post-time" style={{ marginBottom: 0 }}>Tiempo de Trabajo</label>
                  <div className="toggle-group">
                    <button
                      type="button"
                      className={`toggle-btn ${calcState.post_process_unit === 'hours' ? 'active' : ''}`}
                      onClick={() => handleInputChange('post_process_unit', 'hours')}
                    >
                      Horas
                    </button>
                    <button
                      type="button"
                      className={`toggle-btn ${calcState.post_process_unit === 'minutes' ? 'active' : ''}`}
                      onClick={() => handleInputChange('post_process_unit', 'minutes')}
                    >
                      Minutos
                    </button>
                  </div>
                </div>
                <input
                  id="calc-post-time"
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  value={calcState.post_process_value}
                  onChange={e => handleInputChange('post_process_value', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="calc-post-rate">Tarifa por Hora ($/h)</label>
                <input
                  id="calc-post-rate"
                  type="number"
                  step="0.5"
                  min="0"
                  className="form-input"
                  value={calcState.post_process_hourly_rate}
                  onChange={e => handleInputChange('post_process_hourly_rate', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 4: MARGEN DE GANANCIA */}
          <div>
            <div className="calc-section-title">
              <TrendingUp size={18} />
              <span>Componente 4: Margen de Ganancia</span>
            </div>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label className="form-label" htmlFor="calc-margin">Margen (%)</label>
                <span style={{ fontWeight: '600', color: 'var(--primary)' }}>{calcState.margin_percentage}%</span>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input
                  id="calc-margin"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  style={{ flex: 1, accentColor: 'var(--primary)' }}
                  value={calcState.margin_percentage}
                  onChange={e => handleInputChange('margin_percentage', parseInt(e.target.value) || 0)}
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="form-input"
                  style={{ width: '80px', padding: '0.4rem 0.5rem', textAlign: 'center' }}
                  value={calcState.margin_percentage}
                  onChange={e => handleInputChange('margin_percentage', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                />
              </div>
            </div>
          </div>
        </form>

        {/* COLUMNA DERECHA: RESULTADOS Y HISTORIAL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
          
          {/* RESULTADOS EN TIEMPO REAL */}
          <div className="glass-panel result-card">
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Desglose de Costos</span>
              {selectedEstimateId && (
                <span className="user-badge" style={{ fontSize: '0.7rem', color: 'var(--secondary)' }}>
                  Modo Edición
                </span>
              )}
            </h3>

            <div className="result-row">
              <span className="result-label">
                <Layers size={16} /> Costo por Material
              </span>
              <span className="result-value">${calcs.materialCost.toFixed(2)}</span>
            </div>

            <div className="result-row">
              <span className="result-label">
                <Printer size={16} /> Costo Uso Impresora (Depr.)
              </span>
              <span className="result-value">${calcs.printerDepreciationCost.toFixed(2)}</span>
            </div>

            <div className="result-row">
              <span className="result-label">
                <Zap size={16} /> Costo Eléctrico
              </span>
              <span className="result-value">${calcs.electricityCost.toFixed(2)}</span>
            </div>

            <div className="result-row">
              <span className="result-label">
                <Wrench size={16} /> Costo de Post-Procesamiento
              </span>
              <span className="result-value">${calcs.postProcessCost.toFixed(2)}</span>
            </div>

            <div className="result-row">
              <span className="result-label">
                <TrendingUp size={16} /> Margen de Ganancia ({calcState.margin_percentage}%)
              </span>
              <span className="result-value" style={{ color: 'var(--primary)' }}>+${calcs.marginValue.toFixed(2)}</span>
            </div>

            <div className="result-total">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Precio Total</span>
                <span>${calcs.totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
              <button 
                type="button" 
                onClick={handleSave} 
                className="btn btn-primary" 
                style={{ flex: 1 }}
                disabled={saving}
              >
                <Save size={18} />
                <span>{selectedEstimateId ? 'Actualizar' : 'Guardar Item'}</span>
              </button>
              
              {(selectedEstimateId || calcState.name) && (
                <button 
                  type="button" 
                  onClick={handleNewEstimate} 
                  className="btn btn-outline"
                  title="Nueva Cotización"
                >
                  <Plus size={18} />
                  <span>Nuevo</span>
                </button>
              )}
            </div>
          </div>

          {/* HISTORIAL / LISTA DE ITEMS */}
          <div className="glass-panel" style={{ flex: 1 }}>
            <div className="history-header">
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <History size={20} className="gradient-text" />
                <span>Historial de Cotizaciones</span>
              </h3>
              <button 
                className="btn btn-outline" 
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} 
                onClick={fetchHistory}
                disabled={loadingHistory}
                title="Recargar historial"
              >
                <RefreshCw size={12} className={loadingHistory ? 'spin-anim' : ''} />
              </button>
            </div>

            {loadingHistory && estimates.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', margin: '2rem 0' }}>
                Cargando historial...
              </p>
            ) : estimates.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', margin: '2rem 0' }}>
                Aún no has guardado ninguna cotización. Llena los datos y haz click en "Guardar Item".
              </p>
            ) : (
              <div className="history-list">
                {estimates.map(est => {
                  const estTimeMinutes = est.print_time_minutes;
                  const estHours = (estTimeMinutes / 60).toFixed(1);
                  return (
                    <div 
                      key={est.id} 
                      className="history-item"
                      onClick={() => handleLoadEstimate(est)}
                      style={{
                        borderLeftColor: selectedEstimateId === est.id ? 'var(--primary)' : 'transparent',
                        background: selectedEstimateId === est.id ? 'rgba(139, 92, 246, 0.05)' : ''
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div className="history-item-title">{est.name}</div>
                        <div style={{ fontWeight: '700', color: 'var(--secondary)' }}>
                          ${parseFloat(est.total_price).toFixed(2)}
                        </div>
                      </div>
                      
                      {est.description && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0.5rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {est.description}
                        </p>
                      )}

                      <div className="history-item-meta" style={{ marginTop: est.description ? '0' : '0.5rem' }}>
                        <span>
                          {est.filament_type && (
                            <span style={{ fontWeight: '600', color: 'var(--primary)', marginRight: '6px' }}>
                              {FILAMENT_LABELS[est.filament_type] || est.filament_type}
                            </span>
                          )}
                          | {est.part_weight_grams}g | {estHours}h de impr.
                        </span>
                        <button 
                          type="button" 
                          onClick={(e) => handleDeleteEstimate(e, est.id)} 
                          className="btn-danger" 
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '2px'
                          }}
                          title="Eliminar de la lista"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
      
      {/* CSS style rule for spin-anim rotation */}
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

export default Dashboard;
