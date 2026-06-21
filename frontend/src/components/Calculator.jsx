import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Layers, Printer, Zap, Wrench, TrendingUp, Save, 
  Plus, AlertCircle, CheckCircle, FileText
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
  electricity_cost_kwh: 0.10, // Default actualizado a 0.1
  printer_depreciation_hour: 0.80, // Default actualizado a 0.8
  post_process_value: 1.00,
  post_process_unit: 'hours', // 'hours' | 'minutes'
  post_process_hourly_rate: 8.00, // Default actualizado a 8.0
  margin_percentage: 30.00
};

function Calculator() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get('edit');

  const [calcState, setCalcState] = useState(INITIAL_CALC_STATE);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({ type: null, message: '' });
  const [printers, setPrinters] = useState([]);

  useEffect(() => {
    const fetchPrinters = async () => {
      try {
        const response = await api.get('/printers/');
        setPrinters(response.data);
      } catch (err) {
        console.error("Error al cargar impresoras de la flota:", err);
      }
    };
    fetchPrinters();
  }, []);

  // Cargar item para edición si hay un ID en la URL
  useEffect(() => {
    if (editId) {
      fetchEstimateToEdit(editId);
    } else {
      setCalcState(INITIAL_CALC_STATE);
    }
  }, [editId]);

  const fetchEstimateToEdit = async (id) => {
    setLoading(true);
    try {
      const response = await api.get(`/estimates/${id}/`);
      const est = response.data;
      
      // Conversión de tiempos para visualización
      let printVal = est.print_time_minutes;
      let printUnit = 'minutes';
      if (est.print_time_minutes % 60 === 0 || est.print_time_minutes >= 60) {
        printVal = est.print_time_minutes / 60;
        printUnit = 'hours';
      }

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
      showAlert('success', `Cotización "${est.name}" cargada para editar.`);
    } catch (err) {
      console.error("Error al cargar cotización:", err);
      showAlert('error', 'No se pudo obtener la cotización solicitada.');
      setSearchParams({}); // Limpiar query param si hay error
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: null, message: '' }), 5000);
  };

  const handleInputChange = (field, value) => {
    setCalcState(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Fórmulas matemáticas en tiempo real
  const getCalculations = () => {
    const filamentCost = calcState.filament_cost_per_kg || 0;
    const partWeight = calcState.part_weight_grams || 0;
    const waste = calcState.waste_percentage || 0;
    const materialCost = (partWeight / 1000) * (1 + waste / 100) * filamentCost;

    const printTimeVal = calcState.print_time_value || 0;
    const printHours = calcState.print_time_unit === 'hours' ? printTimeVal : printTimeVal / 60;
    const depreciationHour = calcState.printer_depreciation_hour || 0;
    const printerDepreciationCost = printHours * depreciationHour;

    const wattage = calcState.printer_wattage || 0;
    const elecCostKwh = calcState.electricity_cost_kwh || 0;
    const electricityCost = (wattage / 1000) * printHours * elecCostKwh;

    const postTimeVal = calcState.post_process_value || 0;
    const postHours = calcState.post_process_unit === 'hours' ? postTimeVal : postTimeVal / 60;
    const hourlyRate = calcState.post_process_hourly_rate || 0;
    const postProcessCost = postHours * hourlyRate;

    const directCost = materialCost + printerDepreciationCost + electricityCost + postProcessCost;
    const marginPercent = calcState.margin_percentage || 0;
    const marginValue = directCost * (marginPercent / 100);
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

  const handleNewEstimate = () => {
    setCalcState(INITIAL_CALC_STATE);
    setSearchParams({}); // Quitar el ID de edición
    showAlert('success', 'Formulario limpiado.');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!calcState.name.trim()) {
      showAlert('error', 'Por favor ingresa un nombre para la cotización.');
      return;
    }

    setSaving(true);
    
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
      if (editId) {
        await api.put(`/estimates/${editId}/`, payload);
        showAlert('success', 'Cotización actualizada exitosamente.');
      } else {
        const response = await api.post('/estimates/', payload);
        // Redirigir a edición del nuevo item
        setSearchParams({ edit: response.data.id });
        showAlert('success', 'Cotización guardada exitosamente.');
      }
    } catch (err) {
      console.error("Error al guardar:", err);
      showAlert('error', 'Ocurrió un error al procesar la cotización.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="app-container" style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-muted)' }}>
        Cargando datos de la cotización...
      </div>
    );
  }

  return (
    <div className="app-container">
      {alert.message && (
        <div className={`alert-banner ${alert.type}`}>
          {alert.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{alert.message}</span>
        </div>
      )}

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* COLUMNA IZQUIERDA: FORMULARIO */}
        <form onSubmit={handleSave} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h2 style={{ marginBottom: '0.25rem' }}>
              <span className="gradient-text">Calculadora de Costos</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Define los parámetros físicos, energéticos y humanos para cotizar tu proyecto 3D.
            </p>
          </div>

          {/* DATOS GENERALES */}
          <div>
            <div className="calc-section-title">
              <FileText size={18} />
              <span>Información General</span>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="calc-name">Nombre del Item</label>
              <input
                id="calc-name"
                type="text"
                className="form-input"
                placeholder="Ej. Maceta Geométrica, Engranaje..."
                value={calcState.name}
                onChange={e => handleInputChange('name', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="calc-desc">Descripción</label>
              <textarea
                id="calc-desc"
                className="form-input"
                style={{ resize: 'vertical', minHeight: '60px' }}
                placeholder="Notas adicionales para este cliente o proyecto"
                value={calcState.description}
                onChange={e => handleInputChange('description', e.target.value)}
              />
            </div>
          </div>

          {/* SECCIÓN 1: FILAMENTO */}
          <div>
            <div className="calc-section-title">
              <Layers size={18} />
              <span>1. Filamento (Material)</span>
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
              <span>2. Impresora y Consumo Eléctrico</span>
            </div>

            {printers.length > 0 && (
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" htmlFor="calc-printer-select">Perfil de Impresora (Carga automática)</label>
                <select
                  id="calc-printer-select"
                  className="form-input"
                  defaultValue=""
                  onChange={e => {
                    const selectedId = e.target.value;
                    if (!selectedId) return;
                    const printer = printers.find(p => p.id.toString() === selectedId.toString());
                    if (printer) {
                      setCalcState(prev => ({
                        ...prev,
                        printer_wattage: printer.wattage,
                        printer_depreciation_hour: parseFloat(printer.depreciation_per_hour),
                        electricity_cost_kwh: parseFloat(printer.electricity_cost_kwh)
                      }));
                    }
                  }}
                >
                  <option value="">-- Selecciona un perfil para autorrellenar --</option>
                  {printers.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.wattage}W)</option>
                  ))}
                </select>
              </div>
            )}

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
                <label className="form-label" htmlFor="calc-elec">Precio Electricidad ($ por kWh)</label>
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
                <label className="form-label" htmlFor="calc-depr">Depreciación Impresora ($ por hora)</label>
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
              <span>3. Post-procesamiento (Mano de Obra)</span>
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
              <span>4. Margen de Ganancia</span>
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

        {/* COLUMNA DERECHA: RESULTADOS EN TIEMPO REAL */}
        <div className="glass-panel result-card" style={{ position: 'sticky', top: '100px' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Desglose de Costos</span>
            {editId && (
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
              <Printer size={16} /> Depreciación Impresora
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
              <Wrench size={16} /> Mano de Obra (Post-proceso)
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
              <span>Precio a Cobrar</span>
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
              <span>{editId ? 'Actualizar' : 'Guardar en Historial'}</span>
            </button>
            
            {(editId || calcState.name) && (
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
      </div>
    </div>
  );
}

export default Calculator;
