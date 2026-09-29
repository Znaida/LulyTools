import React, { useState } from 'react';
import type { ProcessedExcelResult } from '../utils/excelProcessor';
import { processGicrLotesExcel } from '../utils/excelProcessor';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  BarChart3, 
  Table, 
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface GicrLotesToolProps {
  onBack: () => void;
}

export const GicrLotesTool: React.FC<GicrLotesToolProps> = ({ onBack }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessedExcelResult | null>(null);
  const [activeTab, setActiveTab] = useState<'ventas' | 'dispo' | 'pendientes'>('pendientes');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const processed = await processGicrLotesExcel(file);
      setResult(processed);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error al procesar el archivo Excel.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadExcel = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.wbOutBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderPivotTable = (data: any[]) => {
    if (!data || data.length === 0) return <div className="p-4 text-muted">Sin datos para mostrar.</div>;
    const cols = Object.keys(data[0]);

    return (
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              {cols.map(c => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => {
              const isTotal = row['Fracc'] === 'Total General';
              return (
                <tr key={idx} className={isTotal ? 'font-bold bg-slate-800' : ''}>
                  {cols.map(c => (
                    <td key={c} style={{ fontWeight: isTotal ? 'bold' : 'normal' }}>
                      {row[c]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="tool-view">
      {/* Header */}
      <div className="tool-header">
        <div>
          <button onClick={onBack} className="btn-back">
            <ArrowLeft size={16} /> Volver a Herramientas
          </button>
          <h1 className="tool-title">Procesador GIR_LOTES (GICR)</h1>
          <p className="tool-subtitle">
            Limpia, calcula y genera los resúmenes anuales de ventas, disponibles y pendientes por escriturar.
          </p>
        </div>

        {result && (
          <button onClick={handleDownloadExcel} className="btn btn-primary shadow-glow">
            <Download size={18} />
            Descargar Excel Final (.xlsx)
          </button>
        )}
      </div>

      {/* Upload Dropzone */}
      <div className="upload-card">
        <input
          type="file"
          accept=".xls,.xlsx"
          onChange={handleFileUpload}
          id="excel-upload"
          className="hidden-file-input"
          disabled={isProcessing}
        />
        <label htmlFor="excel-upload" className="upload-label">
          <div className="upload-icon-wrapper">
            <FileSpreadsheet size={40} className="text-accent" />
          </div>
          <div className="upload-text">
            <h3>{isProcessing ? 'Procesando archivo...' : 'Sube tu archivo Excel (GIR_LOTES)'}</h3>
            <p>Formatos soportados: .xls, .xlsx (debe contener la hoja 'GICR_Lotes')</p>
          </div>
          <div className="btn btn-secondary">
            <Upload size={18} />
            {isProcessing ? 'Cargando...' : 'Seleccionar Archivo'}
          </div>
        </label>
      </div>

      {/* Error display */}
      {errorMsg && (
        <div className="error-banner">
          <AlertCircle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Dashboard Result View */}
      {result && (
        <div className="result-container">
          <div className="success-banner">
            <CheckCircle2 size={24} className="text-green-400" />
            <div>
              <h4>¡Archivo procesado exitosamente!</h4>
              <p>Se limpiaron {result.totalRows} registros y se generaron 3 tablas pivote resumen.</p>
            </div>
          </div>

          {/* Tab Selection */}
          <div className="tabs-header">
            <button
              className={`tab-btn ${activeTab === 'pendientes' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('pendientes')}
            >
              <Sparkles size={16} />
              Resumen Pendientes Escriturar
            </button>
            <button
              className={`tab-btn ${activeTab === 'ventas' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('ventas')}
            >
              <BarChart3 size={16} />
              Resumen Ventas Anual
            </button>
            <button
              className={`tab-btn ${activeTab === 'dispo' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('dispo')}
            >
              <Table size={16} />
              Resumen Disponibles
            </button>
          </div>

          {/* Active Tab Table Display */}
          <div className="table-card">
            {activeTab === 'pendientes' && renderPivotTable(result.resumenPendientes)}
            {activeTab === 'ventas' && renderPivotTable(result.resumenVentas)}
            {activeTab === 'dispo' && renderPivotTable(result.resumenDispo)}
          </div>
        </div>
      )}
    </div>
  );
};
