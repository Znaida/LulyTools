import React, { useState, useEffect } from 'react';
import type { ChecklistRecord, MonthlyChecklistData } from '../types';
import { DEFAULT_CHECKLIST_DATA } from '../types';
import { supabase } from '../supabaseClient';
import { ChecklistModal } from './ChecklistModal';
import { Plus, Edit3, Trash2, CheckCircle2, Clock, Calendar, Search, FileText } from 'lucide-react';

interface ChecklistToolProps {
  onBack: () => void;
}

// LocalStorage key for fallback if Supabase credentials are not added yet
const STORAGE_KEY = 'lulytools_checklists_data';

export const ChecklistTool: React.FC<ChecklistToolProps> = ({ onBack }) => {
  const [records, setRecords] = useState<ChecklistRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ChecklistRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    setLoading(true);
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('monthly_checklists')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) {
          setRecords(data as ChecklistRecord[]);
        }
      } catch (err) {
        console.warn('Supabase request failed, loading local fallback:', err);
        loadLocalFallback();
      }
    } else {
      loadLocalFallback();
    }
    setLoading(false);
  };

  const loadLocalFallback = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setRecords(JSON.parse(saved));
      } catch {
        setRecords([]);
      }
    } else {
      // Demo initial data if empty
      const demoData: ChecklistRecord[] = [
        {
          id: 'demo-1',
          period: 'oct-26',
          status: 'En progreso',
          items: DEFAULT_CHECKLIST_DATA,
          observations: 'Pendiente confirmar correo con Silverio.',
          created_at: new Date().toISOString()
        }
      ];
      setRecords(demoData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(demoData));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateNew = () => {
    setSelectedRecord(null);
    setIsModalOpen(true);
  };

  const handleEdit = (record: ChecklistRecord) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, period: string) => {
    if (!confirm(`¿Estás segura de eliminar el checklist del periodo ${period}?`)) return;

    if (supabase) {
      try {
        await supabase.from('monthly_checklists').delete().eq('id', id);
      } catch (err) {
        console.error('Error deleting from Supabase:', err);
      }
    }

    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleSave = async (period: string, items: MonthlyChecklistData, status: 'Completado' | 'En progreso') => {
    const now = new Date().toISOString();
    let newRecord: ChecklistRecord;

    if (selectedRecord) {
      newRecord = {
        ...selectedRecord,
        period,
        items,
        status,
        updated_at: now
      };

      if (supabase) {
        try {
          await supabase
            .from('monthly_checklists')
            .update({
              period,
              items,
              status,
              updated_at: now
            })
            .eq('id', selectedRecord.id);
        } catch (err) {
          console.error('Error updating Supabase:', err);
        }
      }

      const updated = records.map(r => r.id === selectedRecord.id ? newRecord : r);
      setRecords(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } else {
      const tempId = crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}`;
      newRecord = {
        id: tempId,
        period,
        items,
        status,
        observations: items.observations,
        created_at: now,
        updated_at: now
      };

      if (supabase) {
        try {
          const { data } = await supabase
            .from('monthly_checklists')
            .insert([{
              period,
              items,
              status,
              observations: items.observations
            }])
            .select();

          if (data && data[0]) {
            newRecord = data[0] as ChecklistRecord;
          }
        } catch (err) {
          console.error('Error inserting into Supabase:', err);
        }
      }

      const updated = [newRecord, ...records];
      setRecords(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  };

  const filteredRecords = records.filter(r =>
    r.period.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="tool-view">
      <div className="tool-header">
        <div>
          <button onClick={onBack} className="btn-back">
            ← Volver a Herramientas
          </button>
          <h1 className="tool-title">CheckList Inicio de Mes</h1>
          <p className="tool-subtitle">Historial de revisiones de inicio de mes de Luly</p>
        </div>
        <button onClick={handleCreateNew} className="btn btn-primary shadow-glow">
          <Plus size={18} />
          Nuevo Checklist
        </button>
      </div>

      {/* Search & Stats Bar */}
      <div className="filter-bar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por mes y año (ej: oct-26)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="stats-badges">
          <span className="badge badge-total">Total: {records.length}</span>
          <span className="badge badge-success">Completados: {records.filter(r => r.status === 'Completado').length}</span>
          <span className="badge badge-progress">En progreso: {records.filter(r => r.status === 'En progreso').length}</span>
        </div>
      </div>

      {/* Table Container */}
      <div className="table-card" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {loading ? (
          <div className="loading-state">Cargando registros...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} className="empty-icon" />
            <h3>No se encontraron registros</h3>
            <p>Empieza registrando el primer checklist de inicio de mes.</p>
            <button onClick={handleCreateNew} className="btn btn-secondary mt-4">
              Crear Checklist
            </button>
          </div>
        ) : (
          <table className="custom-table" style={{ minWidth: '650px' }}>
            <thead>
              <tr>
                <th>MES / AÑO</th>
                <th>FECHA DE CREACIÓN</th>
                <th>ESTATUS</th>
                <th>OBSERVACIONES</th>
                <th style={{ textAlign: 'right' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((r) => (
                <tr key={r.id}>
                  <td className="period-cell">
                    <Calendar size={16} className="text-accent" />
                    <strong>{r.period}</strong>
                  </td>
                  <td>
                    {r.created_at ? new Date(r.created_at).toLocaleDateString('es-ES', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    }) : 'Sin fecha'}
                  </td>
                  <td>
                    <span className={`status-pill ${r.status === 'Completado' ? 'status-completed' : 'status-in-progress'}`}>
                      {r.status === 'Completado' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                      {r.status}
                    </span>
                  </td>
                  <td className="observations-cell" title={r.items?.observations || ''}>
                    {r.items?.observations || <span className="text-muted">Sin observaciones</span>}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="action-buttons">
                      <button
                        onClick={() => handleEdit(r)}
                        className="btn-icon btn-icon-primary"
                        title="Abrir Formulario CheckList / Exportar PDF"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(r.id, r.period)}
                        className="btn-icon btn-icon-danger"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ChecklistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        record={selectedRecord}
        onSave={handleSave}
      />
    </div>
  );
};
