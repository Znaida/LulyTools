import React, { useState } from 'react';
import { ChecklistTool } from './components/ChecklistTool';
import { GicrLotesTool } from './components/GicrLotesTool';
import { 
  ClipboardCheck, 
  Sparkles, 
  Calculator, 
  FileSpreadsheet, 
  FolderKanban, 
  Layers,
  Heart
} from 'lucide-react';
import './index.css';

interface ToolApp {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  isAvailable: boolean;
  tag?: string;
}

export function App() {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const tools: ToolApp[] = [
    {
      id: 'checklist',
      name: 'CheckList Inicio de Mes',
      description: 'Formatos mensuales de constancias fiscales, nómina, cancelaciones y obligaciones.',
      icon: <ClipboardCheck size={32} className="tool-icon-svg" />,
      category: 'Gestión Mensual',
      isAvailable: true,
      tag: 'Principal'
    },
    {
      id: 'gicr-lotes',
      name: 'Procesador GIR_LOTES',
      description: 'Limpia el archivo de lotes y genera resúmenes anuales de ventas, disponibles y pendientes por escriturar.',
      icon: <FileSpreadsheet size={32} className="tool-icon-svg" />,
      category: 'Reportes y Excel',
      isAvailable: true,
      tag: 'Nuevo'
    },
    {
      id: 'calculadora',
      name: 'Calculadora Rápida',
      description: 'Herramienta de cálculo rápido para comisiones y gastos operativos.',
      icon: <Calculator size={32} className="tool-icon-svg" />,
      category: 'Finanzas',
      isAvailable: false,
      tag: 'Próximamente'
    },
    {
      id: 'reportes',
      name: 'Generador de Reportes',
      description: 'Generación de reportes semanales en formato PDF y Excel para la dirección.',
      icon: <FileSpreadsheet size={32} className="tool-icon-svg" />,
      category: 'Documentos',
      isAvailable: false,
      tag: 'Próximamente'
    },
    {
      id: 'control-carpetas',
      name: 'Control de Expedientes',
      description: 'Seguimiento de lotes pendientes por escriturar y firmas de clientes.',
      icon: <FolderKanban size={32} className="tool-icon-svg" />,
      category: 'Administración',
      isAvailable: false,
      tag: 'Próximamente'
    },
  ];

  return (
    <div className="app-container">
      {/* Background Glow Highlights */}
      <div className="bg-glow bg-glow-1"></div>
      <div className="bg-glow bg-glow-2"></div>

      {/* Main Header */}
      <header className="main-header">
        <div className="header-brand" onClick={() => setActiveTool(null)}>
          <div className="brand-logo">
            <Sparkles className="logo-sparkle" size={24} />
          </div>
          <div>
            <h1 className="brand-title">LulyTools</h1>
            <p className="brand-subtitle">Suite de Herramientas para Luly</p>
          </div>
        </div>
        <div className="header-badge">
          <Heart size={14} className="heart-icon" /> Hecho con cariño para mamá
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {activeTool === 'checklist' ? (
          <ChecklistTool onBack={() => setActiveTool(null)} />
        ) : activeTool === 'gicr-lotes' ? (
          <GicrLotesTool onBack={() => setActiveTool(null)} />
        ) : (
          <div className="dashboard-home">
            <div className="welcome-banner">
              <h2>¡Hola Luly! 👋</h2>
              <p>
                Bienvenida a tu espacio de herramientas de trabajo. Selecciona cualquier aplicación
                para comenzar tu gestión mensual.
              </p>
            </div>

            <div className="section-title-group">
              <Layers size={20} className="text-accent" />
              <h3>Tus Aplicaciones y Herramientas</h3>
            </div>

            {/* Grid of Apps (App Launcher style) */}
            <div className="apps-grid">
              {tools.map((tool) => (
                <div
                  key={tool.id}
                  className={`app-card ${!tool.isAvailable ? 'app-card-disabled' : ''}`}
                  onClick={() => {
                    if (tool.isAvailable) {
                      setActiveTool(tool.id);
                    }
                  }}
                >
                  <div className="app-card-header">
                    <div className="app-icon-wrapper">{tool.icon}</div>
                    {tool.tag && (
                      <span className={`app-tag ${tool.isAvailable ? 'tag-active' : 'tag-soon'}`}>
                        {tool.tag}
                      </span>
                    )}
                  </div>
                  <h4 className="app-name">{tool.name}</h4>
                  <p className="app-description">{tool.description}</p>
                  <div className="app-card-footer">
                    <span className="app-category">{tool.category}</span>
                    <span className="app-action-text">
                      {tool.isAvailable ? 'Abrir App →' : 'En desarrollo'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="main-footer">
        <p>LulyTools © {new Date().getFullYear()} — Plataforma de productividad</p>
      </footer>
    </div>
  );
}

export default App;
