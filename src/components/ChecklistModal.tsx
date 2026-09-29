import React, { useState } from 'react';
import type { ChecklistRecord, MonthlyChecklistData } from '../types';
import { FISCAL_PEOPLE, DEFAULT_CHECKLIST_DATA } from '../types';
import { X, Save, Download, Calendar } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';

interface ChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: ChecklistRecord | null;
  onSave: (period: string, items: MonthlyChecklistData, status: 'Completado' | 'En progreso') => Promise<void>;
}

export const ChecklistModal: React.FC<ChecklistModalProps> = ({
  isOpen,
  onClose,
  record,
  onSave,
}) => {
  if (!isOpen) return null;

  const [period, setPeriod] = useState<string>(record ? record.period : '');
  const [formData, setFormData] = useState<MonthlyChecklistData>(
    record ? JSON.parse(JSON.stringify(record.items)) : JSON.parse(JSON.stringify(DEFAULT_CHECKLIST_DATA))
  );
  const [status, setStatus] = useState<'Completado' | 'En progreso'>(
    record ? (record.status === 'Pendiente' ? 'En progreso' : record.status) : 'En progreso'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleFiscalChange = (person: string) => {
    setFormData(prev => ({
      ...prev,
      constanciaFiscal: {
        ...prev.constanciaFiscal,
        [person]: !prev.constanciaFiscal[person]
      }
    }));
  };

  const handleVariableChange = (key: keyof MonthlyChecklistData['variables']) => {
    setFormData(prev => ({
      ...prev,
      variables: {
        ...prev.variables,
        [key]: !prev.variables[key]
      }
    }));
  };

  const handleNominaChange = (key: keyof MonthlyChecklistData['nominas']) => {
    setFormData(prev => ({
      ...prev,
      nominas: {
        ...prev.nominas,
        [key]: !prev.nominas[key]
      }
    }));
  };

  const handleSimpleChange = (key: keyof MonthlyChecklistData) => {
    if (typeof formData[key] === 'boolean') {
      setFormData(prev => ({
        ...prev,
        [key]: !prev[key]
      }));
    }
  };

  const handleObservationsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      observations: e.target.value
    }));
  };

  const handleSave = async () => {
    if (!period.trim()) {
      alert('Por favor ingresa el mes y año (ejemplo: oct-26)');
      return;
    }
    setIsSaving(true);
    try {
      await onSave(period.trim(), formData, status);
      if (status === 'Completado') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error al guardar en la base de datos');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    const element = document.getElementById('printable-checklist');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      pdf.save(`Checklist_${period || 'inicio_de_mes'}.pdf`);
    } catch (error) {
      console.error("Error generando el PDF:", error);
      alert("Hubo un error al generar el PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Split fiscal people into two columns matching the physical image
  const leftFiscal = FISCAL_PEOPLE.slice(0, 10);
  const rightFiscal = FISCAL_PEOPLE.slice(10);

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">CHECK LIST INICIO DE MES</h2>
            <p className="modal-subtitle">Supervisión y control mensual de procesos</p>
          </div>
          <div className="modal-actions">
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="btn btn-secondary"
              title="Descargar versión lista para imprimir"
            >
              <Download size={18} />
              {isGeneratingPdf ? 'Generando PDF...' : 'Descargar PDF'}
            </button>
            <button onClick={onClose} className="btn-close">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body / Scrollable Content */}
        <div className="modal-body">
          {/* Controls Bar */}
          <div className="period-status-bar">
            <div className="input-group">
              <label><Calendar size={16} /> Mes / Año:</label>
              <input
                type="text"
                value={period}
                onChange={e => setPeriod(e.target.value)}
                placeholder="ej: oct-26"
                className="input-field"
              />
            </div>
            <div className="input-group">
              <label>Estado del CheckList:</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="select-field"
              >
                <option value="En progreso">⏳ En progreso</option>
                <option value="Completado">✅ Completado</option>
              </select>
            </div>
          </div>

          {/* PRINTABLE AREA EXACTLY REPRODUCING THE FORM FROM IMAGE */}
          <div id="printable-checklist" className="paper-form">
            <div className="paper-header">
              <h1 className="paper-title">CHECK LIST INICIO DE MES</h1>
              <div className="paper-period">{period || '___-26'}</div>
            </div>

            {/* Constancia de Situación Fiscal */}
            <div className="paper-section">
              <h3 className="paper-section-title">Constancia de Situación Fiscal</h3>
              <div className="fiscal-grid">
                {/* Columna Izquierda */}
                <div className="fiscal-column">
                  {leftFiscal.map(person => (
                    <label key={person} className="paper-checkbox-row">
                      <span className="person-name">{person}</span>
                      <input
                        type="checkbox"
                        checked={!!formData.constanciaFiscal[person]}
                        onChange={() => handleFiscalChange(person)}
                        className="custom-checkbox"
                      />
                    </label>
                  ))}
                </div>

                {/* Columna Derecha */}
                <div className="fiscal-column">
                  {rightFiscal.map(person => (
                    <label key={person} className="paper-checkbox-row">
                      <span className="person-name">{person}</span>
                      <input
                        type="checkbox"
                        checked={!!formData.constanciaFiscal[person]}
                        onChange={() => handleFiscalChange(person)}
                        className="custom-checkbox"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Cancelaciones & Estados de cuenta */}
            <div className="paper-section">
              <label className="paper-checkbox-row single-row">
                <span>Cancelaciones (Correo a Carlos y Jaime)</span>
                <input
                  type="checkbox"
                  checked={formData.cancelaciones}
                  onChange={() => handleSimpleChange('cancelaciones')}
                  className="custom-checkbox"
                />
              </label>

              <label className="paper-checkbox-row single-row">
                <span>Solicitar Estados de Cuenta INVEX</span>
                <input
                  type="checkbox"
                  checked={formData.solicitarEstadosCuenta}
                  onChange={() => handleSimpleChange('solicitarEstadosCuenta')}
                  className="custom-checkbox"
                />
              </label>
            </div>

            {/* Variables */}
            <div className="paper-section">
              <h4 className="paper-subsection-title">Variables</h4>
              <div className="nested-group">
                <label className="paper-checkbox-row single-row">
                  <span>Crédito y Cobranza</span>
                  <input
                    type="checkbox"
                    checked={formData.variables.creditoYCobranza}
                    onChange={() => handleVariableChange('creditoYCobranza')}
                    className="custom-checkbox"
                  />
                </label>
                <label className="paper-checkbox-row single-row">
                  <span>Cobranza Mtto</span>
                  <input
                    type="checkbox"
                    checked={formData.variables.cobranzaMtto}
                    onChange={() => handleVariableChange('cobranzaMtto')}
                    className="custom-checkbox"
                  />
                </label>
                <label className="paper-checkbox-row single-row">
                  <span>Escrituración</span>
                  <input
                    type="checkbox"
                    checked={formData.variables.escrituracion}
                    onChange={() => handleVariableChange('escrituracion')}
                    className="custom-checkbox"
                  />
                </label>
              </div>
            </div>

            {/* Demás Items Individuales */}
            <div className="paper-section">
              <label className="paper-checkbox-row single-row">
                <span>Vacaciones Personal (Correo)</span>
                <input
                  type="checkbox"
                  checked={formData.vacacionesPersonal}
                  onChange={() => handleSimpleChange('vacacionesPersonal')}
                  className="custom-checkbox"
                />
              </label>

              <label className="paper-checkbox-row single-row">
                <span>Control de Obligaciones (Correo)</span>
                <input
                  type="checkbox"
                  checked={formData.controlObligaciones}
                  onChange={() => handleSimpleChange('controlObligaciones')}
                  className="custom-checkbox"
                />
              </label>

              <label className="paper-checkbox-row single-row">
                <span>Cartera (Silverio) (Correo)</span>
                <input
                  type="checkbox"
                  checked={formData.carteraSilverio}
                  onChange={() => handleSimpleChange('carteraSilverio')}
                  className="custom-checkbox"
                />
              </label>

              <label className="paper-checkbox-row single-row">
                <span>PLD y Efectivo (Yola)</span>
                <input
                  type="checkbox"
                  checked={formData.pldEfectivoYola}
                  onChange={() => handleSimpleChange('pldEfectivoYola')}
                  className="custom-checkbox"
                />
              </label>

              <label className="paper-checkbox-row single-row">
                <span>PLD y Efectivo (Carlos)</span>
                <input
                  type="checkbox"
                  checked={formData.pldEfectivoCarlos}
                  onChange={() => handleSimpleChange('pldEfectivoCarlos')}
                  className="custom-checkbox"
                />
              </label>

              <label className="paper-checkbox-row single-row">
                <span>Lotes Pendientes Escriturar</span>
                <input
                  type="checkbox"
                  checked={formData.lotesPendientesEscriturar}
                  onChange={() => handleSimpleChange('lotesPendientesEscriturar')}
                  className="custom-checkbox"
                />
              </label>

              <label className="paper-checkbox-row single-row">
                <span>Notas de Crédito</span>
                <input
                  type="checkbox"
                  checked={formData.notasCredito}
                  onChange={() => handleSimpleChange('notasCredito')}
                  className="custom-checkbox"
                />
              </label>

              <label className="paper-checkbox-row single-row">
                <span>Contabilidad Electrónica</span>
                <input
                  type="checkbox"
                  checked={formData.contabilidadElectronica}
                  onChange={() => handleSimpleChange('contabilidadElectronica')}
                  className="custom-checkbox"
                />
              </label>
            </div>

            {/* Nóminas */}
            <div className="paper-section">
              <h4 className="paper-subsection-title">Nóminas</h4>
              <div className="nested-group">
                <label className="paper-checkbox-row single-row">
                  <span>Comisión Ventas</span>
                  <input
                    type="checkbox"
                    checked={formData.nominas.comisionVentas}
                    onChange={() => handleNominaChange('comisionVentas')}
                    className="custom-checkbox"
                  />
                </label>
                <label className="paper-checkbox-row single-row">
                  <span>Comisión Call Center</span>
                  <input
                    type="checkbox"
                    checked={formData.nominas.comisionCallCenter}
                    onChange={() => handleNominaChange('comisionCallCenter')}
                    className="custom-checkbox"
                  />
                </label>
                <label className="paper-checkbox-row single-row">
                  <span>Comisión Dirección</span>
                  <input
                    type="checkbox"
                    checked={formData.nominas.comisionDireccion}
                    onChange={() => handleNominaChange('comisionDireccion')}
                    className="custom-checkbox"
                  />
                </label>
              </div>
            </div>

            {/* XML & Otros */}
            <div className="paper-section">
              <label className="paper-checkbox-row single-row">
                <span>XML en Contabilidad</span>
                <input
                  type="checkbox"
                  checked={formData.xmlContabilidad}
                  onChange={() => handleSimpleChange('xmlContabilidad')}
                  className="custom-checkbox"
                />
              </label>

              <label className="paper-checkbox-row single-row">
                <span>Otros:</span>
                <input
                  type="checkbox"
                  checked={formData.otros}
                  onChange={() => handleSimpleChange('otros')}
                  className="custom-checkbox"
                />
              </label>
            </div>

            {/* Observaciones con Líneas de Cuaderno */}
            <div className="paper-section observations-section">
              <label className="observations-label">Observaciones:</label>
              <textarea
                value={formData.observations}
                onChange={handleObservationsChange}
                placeholder="Escribe aquí notas adicionales u observaciones..."
                rows={3}
                className="ruled-textarea"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-tertiary">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn btn-primary"
          >
            <Save size={18} />
            {isSaving ? 'Guardando...' : 'Guardar Checklist'}
          </button>
        </div>
      </div>
    </div>
  );
};
