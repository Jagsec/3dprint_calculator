import React, { useState } from 'react';
import api from '../services/api';
import { 
  Settings, Download, Upload, FileJson, AlertTriangle, 
  CheckCircle, AlertCircle, ShieldAlert, Loader2, Info, Server
} from 'lucide-react';

function SettingsManager() {
  const [loading, setLoading] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [alert, setAlert] = useState({ type: null, message: '' });

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: null, message: '' }), 6000);
  };

  const handleExportBackup = async () => {
    setLoading(true);
    try {
      const response = await api.get('/backup/export/');
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const date = new Date().toISOString().slice(0, 10);
      const exportFileDefaultName = `3dprint_backup_${date}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      showAlert('success', 'Copia de seguridad exportada y descargada exitosamente.');
    } catch (err) {
      console.error(err);
      showAlert('error', 'Error al generar la copia de seguridad.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0]);
    }
  };

  const handleImportBackup = async (e) => {
    e.preventDefault();
    if (!importFile) {
      showAlert('error', 'Por favor selecciona un archivo JSON de respaldo.');
      return;
    }

    if (!importFile.name.endsWith('.json')) {
      showAlert('error', 'El archivo de respaldo debe ser de formato .json.');
      return;
    }

    const confirmImport = window.confirm(
      '¿Estás seguro de importar esta copia de seguridad? Se agregarán todos los registros (clientes, impresoras, inventario, proyectos, tareas y cotizaciones rápidos) vinculándolos a tu cuenta actual.'
    );
    if (!confirmImport) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonData = JSON.parse(event.target.result);
        
        // Validar mínimamente la estructura básica del backup
        if (!jsonData.clients || !jsonData.printers || !jsonData.materials || !jsonData.projects) {
          showAlert('error', 'El formato del archivo JSON no corresponde a una copia de seguridad válida.');
          setLoading(false);
          return;
        }

        const response = await api.post('/backup/import/', jsonData);
        showAlert('success', response.data.detail || 'Copia de seguridad restaurada exitosamente.');
        setImportFile(null);
        // Limpiar input file
        document.getElementById('backup-file-input').value = '';
      } catch (err) {
        console.error(err);
        const errorMsg = err.response?.data?.detail || 'Error al analizar o procesar el archivo de respaldo en el servidor.';
        showAlert('error', errorMsg);
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      showAlert('error', 'Error al leer el archivo seleccionado.');
      setLoading(false);
    };

    reader.readAsText(importFile);
  };

  return (
    <div className="app-container">
      {alert.message && (
        <div className={`alert-banner ${alert.type}`}>
          {alert.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{alert.message}</span>
        </div>
      )}

      {/* HEADER DE LA SECCIÓN */}
      <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Settings size={28} style={{ color: 'var(--primary)' }} />
          <h2 style={{ margin: 0 }}><span className="gradient-text">Configuración del Sistema</span></h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
          Administra copias de seguridad de datos, importaciones para servidores de red local (LAN) y mantenimiento general del ERP.
        </p>
      </div>

      <div className="grid-2">
        {/* RESPALDO DE DATOS - EXPORTACIÓN */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3>
            <span className="gradient-text">Exportar Copia de Seguridad</span>
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
            Descarga un volcado completo de toda tu información en un archivo comprimido JSON. Este archivo incluye:
          </p>
          <ul style={{ paddingLeft: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <li>Directorio CRM de Clientes.</li>
            <li>Especificaciones de la Flota de Impresoras.</li>
            <li>Inventario de Materiales, Bobinas y Componentes Físicos.</li>
            <li>Proyectos Compuestos, piezas 3D y Hardware externo enlazado.</li>
            <li>Tablero de tareas del Kanban y Cotizaciones rápidas registradas.</li>
          </ul>

          <div style={{ marginTop: 'auto', paddingTop: '1.5rem' }}>
            <button 
              className="btn btn-primary" 
              onClick={handleExportBackup}
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              <span>Descargar Respaldo (.json)</span>
            </button>
          </div>
        </div>

        {/* RESTAURAR DATOS - IMPORTACIÓN */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3>
            <span className="gradient-text">Restaurar Copia de Seguridad</span>
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
            Carga un archivo de respaldo JSON generado previamente por esta aplicación.
          </p>
          
          <div className="alert-banner warning" style={{ margin: 0, padding: '0.75rem', borderStyle: 'dashed' }}>
            <AlertTriangle size={24} style={{ color: 'var(--warning)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', color: '#fcd34d' }}>
              <strong>Advertencia:</strong> La importación inserta los registros y mapea las relaciones dinámicamente. 
              No sobrescribirá datos existentes a menos que coincidan con identificadores idénticos de importaciones previas.
            </span>
          </div>

          <form onSubmit={handleImportBackup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: 'auto' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="backup-file-input">Seleccionar archivo JSON de backup</label>
              <div style={{ position: 'relative' }}>
                <FileJson size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  id="backup-file-input"
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="form-input"
                  style={{ paddingLeft: '2.5rem', fontSize: '0.9rem' }}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-secondary" 
              disabled={loading || !importFile}
              style={{ width: '100%' }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              <span>Subir e Importar Respaldo</span>
            </button>
          </form>
        </div>
      </div>

      {/* INFORMACIÓN SOBRE DESPLIEGUE EN LAN */}
      <div className="glass-panel" style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Server size={20} style={{ color: 'var(--secondary)' }} />
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Soporte de Red Local (LAN) y Despliegue en Servidor</h3>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
            <p style={{ marginBottom: '0.75rem' }}>
              Para desplegar esta aplicación permanentemente en tu servidor local (LAN) y acceder desde cualquier dispositivo conectado al router Wifi:
            </p>
            <ol style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>
                <strong>Docker Compose:</strong> Asegúrate de que el Docker Compose está activo en tu servidor. Los volúmenes aseguran que tus datos MySQL se persistan incluso si apagas o reinicias la máquina.
              </li>
              <li>
                <strong>Configuración IP:</strong> Modifica la variable del entorno frontend <code>VITE_API_URL</code> (en el archivo de producción o Dockerfile) para apuntar a la dirección IP de tu servidor local (ej. <code>http://192.168.1.50:8000</code>).
              </li>
              <li>
                <strong>Portabilidad:</strong> Usa este panel de Configuración para transferir rápidamente tus estimaciones, proyectos o inventarios desde tu PC local de desarrollo al servidor LAN sin necesidad de clonar la base de datos MySQL directamente.
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsManager;
