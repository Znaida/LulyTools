import React, { useState, useEffect, useMemo } from 'react';
import type { 
  Ticket, 
  Technician, 
  BotmaSettings, 
  TicketStatus, 
  TicketPriority,
  TicketHistoryItem 
} from '../types';
import { 
  INITIAL_TICKETS, 
  INITIAL_TECHNICIANS, 
  INITIAL_SETTINGS 
} from '../data/botmaSeed';
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  ListFilter, 
  Users, 
  Settings, 
  Search, 
  Clock, 
  MapPin, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  Play, 
  Star, 
  ExternalLink, 
  X, 
  Send, 
  Smartphone, 
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Check,
  UserPlus,
  Trash2
} from 'lucide-react';
import '../botma.css';

interface BotmaTicketsToolProps {
  onBack: () => void;
}

const STORAGE_TICKETS_KEY = 'lulytools_botma_tickets';
const STORAGE_TECHS_KEY = 'lulytools_botma_techs';
const STORAGE_SETTINGS_KEY = 'lulytools_botma_settings';

export const BotmaTicketsTool: React.FC<BotmaTicketsToolProps> = ({ onBack }) => {
  // State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [settings, setSettings] = useState<BotmaSettings>(INITIAL_SETTINGS);

  // View & Filters
  const [currentView, setCurrentView] = useState<'agenda' | 'list' | 'technicians'>('agenda');
  const [calendarMode, setCalendarMode] = useState<'week' | 'month' | 'day'>('week');
  const [calendarDate, setCalendarDate] = useState<Date>(() => new Date());
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Modals & Panels
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState<boolean>(false);
  const [isAddTechModalOpen, setIsAddTechModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isPhoneSimOpen, setIsPhoneSimOpen] = useState<boolean>(false);

  // Form states for adding technician
  const [newTechName, setNewTechName] = useState('');
  const [newTechPhone, setNewTechPhone] = useState('52155');
  const [newTechSpecialty, setNewTechSpecialty] = useState('');
  const [newTechAvatar, setNewTechAvatar] = useState('👨‍💻');

  // Form states for approval/workflow
  const [assignTechId, setAssignTechId] = useState<string>('');
  const [assignPriority, setAssignPriority] = useState<TicketPriority>('media');
  const [supervisorNotes, setSupervisorNotes] = useState<string>('');
  const [techNotes, setTechNotes] = useState<string>('');
  const [userFeedback, setUserFeedback] = useState<string>('');
  const [userRating, setUserRating] = useState<number>(5);

  // New Ticket Form State
  const [newReqName, setNewReqName] = useState('');
  const [newReqPhone, setNewReqPhone] = useState('52155');
  const [newDept, setNewDept] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('10:00');
  const [newPriority, setNewPriority] = useState<TicketPriority>('media');

  // WhatsApp Simulator Chat State
  const [waMessages, setWaMessages] = useState<Array<{ text: string; direction: 'in' | 'out'; time: string }>>([]);
  const [waInput, setWaInput] = useState('');
  const [simRole, setSimRole] = useState<'USER' | 'TECH'>('USER');
  const [botStep, setBotStep] = useState<string>('IDLE');
  const [botFormData, setBotFormData] = useState({
    name: '',
    dept: '',
    reason: '',
    date: '',
    time: ''
  });

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Initial Load & Persistence
  useEffect(() => {
    const savedTickets = localStorage.getItem(STORAGE_TICKETS_KEY);
    const savedTechs = localStorage.getItem(STORAGE_TECHS_KEY);
    const savedSettings = localStorage.getItem(STORAGE_SETTINGS_KEY);

    if (savedTickets) {
      try {
        setTickets(JSON.parse(savedTickets));
      } catch {
        setTickets(INITIAL_TICKETS);
      }
    } else {
      setTickets(INITIAL_TICKETS);
    }

    if (savedTechs) {
      try {
        setTechnicians(JSON.parse(savedTechs));
      } catch {
        setTechnicians(INITIAL_TECHNICIANS);
      }
    } else {
      setTechnicians(INITIAL_TECHNICIANS);
    }

    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch {
        setSettings(INITIAL_SETTINGS);
      }
    } else {
      setSettings(INITIAL_SETTINGS);
    }

    // Initialize WhatsApp greeting
    setWaMessages([
      {
        text: '👋 ¡Hola! Soy el *Bot de Soporte Técnico TI*.\n\nPuedo ayudarte a generar un ticket, agendar una visita técnica o reportar el cierre de un servicio.\n\nEscribe *hola* o pulsa los botones rápidos para comenzar.',
        direction: 'in',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, []);

  // Sync to localStorage
  const saveTickets = (updated: Ticket[]) => {
    setTickets(updated);
    localStorage.setItem(STORAGE_TICKETS_KEY, JSON.stringify(updated));
  };

  const saveSettings = (updated: BotmaSettings) => {
    setSettings(updated);
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(updated));
    showToast('Configuración guardada correctamente');
    setIsSettingsModalOpen(false);
  };

  // Real-time workload calculation for technicians
  const techniciansWithLoad = useMemo(() => {
    return technicians.map(tech => {
      const activeCount = tickets.filter(
        t => t.technicianId === tech.id && 
             (t.status === 'APPROVED' || t.status === 'IN_PROGRESS' || t.status === 'WAITING_USER_CONFIRMATION')
      ).length;
      return { ...tech, activeTicketsCount: activeCount };
    });
  }, [technicians, tickets]);

  // Real-time stats
  const stats = useMemo(() => {
    return {
      pending: tickets.filter(t => t.status === 'PENDING_APPROVAL').length,
      approved: tickets.filter(t => t.status === 'APPROVED').length,
      inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
      waiting: tickets.filter(t => t.status === 'WAITING_USER_CONFIRMATION').length,
      closed: tickets.filter(t => t.status === 'CLOSED').length,
      total: tickets.length
    };
  }, [tickets]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (dateFilter && t.requestedDate !== dateFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = t.code.toLowerCase().includes(q);
        const matchReq = t.requesterName.toLowerCase().includes(q);
        const matchDept = t.department.toLowerCase().includes(q);
        const matchReason = t.reason.toLowerCase().includes(q);
        const matchTech = (t.technicianName || '').toLowerCase().includes(q);
        if (!matchCode && !matchReq && !matchDept && !matchReason && !matchTech) return false;
      }
      return true;
    });
  }, [tickets, statusFilter, dateFilter, searchQuery]);

  // Open Ticket Detail Modal
  const openTicketDetail = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setAssignTechId(ticket.technicianId || (technicians[0]?.id ?? ''));
    setAssignPriority(ticket.priority || 'media');
    setSupervisorNotes(ticket.supervisorNotes || '');
    setTechNotes(ticket.technicianNotes || '');
    setUserFeedback(ticket.userFeedback || '');
    setUserRating(ticket.userRating || 5);
    setIsDetailModalOpen(true);
  };

  // Workflow Action 1: Supervisor Approve & Assign
  const handleApproveTicket = () => {
    if (!selectedTicket || !assignTechId) {
      showToast('Por favor selecciona un técnico', 'error');
      return;
    }
    const tech = technicians.find(t => t.id === assignTechId);
    const techName = tech ? tech.name : 'Técnico Asignado';

    const nowIso = new Date().toISOString();
    const updatedTickets = tickets.map(t => {
      if (t.id === selectedTicket.id) {
        const historyItem: TicketHistoryItem = {
          timestamp: nowIso,
          author: `${settings.supervisorName} (Supervisor)`,
          action: 'Ticket Aprobado y Asignado',
          details: `Asignado a ${techName} con prioridad ${assignPriority}. ${supervisorNotes ? `Nota: "${supervisorNotes}"` : ''}`
        };
        return {
          ...t,
          status: 'APPROVED' as TicketStatus,
          technicianId: assignTechId,
          technicianName: techName,
          technicianPhone: tech?.phone,
          priority: assignPriority,
          supervisorNotes: supervisorNotes,
          approvedAt: nowIso,
          history: [...t.history, historyItem]
        };
      }
      return t;
    });

    saveTickets(updatedTickets);
    showToast(`¡Ticket #${selectedTicket.code} Aprobado y Asignado a ${techName}!`);
    setIsDetailModalOpen(false);
  };

  // Workflow Action 2: Supervisor Reject
  const handleRejectTicket = () => {
    if (!selectedTicket) return;
    const reason = prompt('Motivo del rechazo del ticket:');
    if (!reason) return;

    const nowIso = new Date().toISOString();
    const updatedTickets = tickets.map(t => {
      if (t.id === selectedTicket.id) {
        const historyItem: TicketHistoryItem = {
          timestamp: nowIso,
          author: `${settings.supervisorName} (Supervisor)`,
          action: 'Ticket Rechazado',
          details: `Motivo: ${reason}`
        };
        return {
          ...t,
          status: 'REJECTED' as TicketStatus,
          history: [...t.history, historyItem]
        };
      }
      return t;
    });

    saveTickets(updatedTickets);
    showToast(`Ticket #${selectedTicket.code} Rechazado.`, 'error');
    setIsDetailModalOpen(false);
  };

  // Workflow Action 3: Start Service in Site
  const handleStartService = () => {
    if (!selectedTicket) return;
    const nowIso = new Date().toISOString();
    const updatedTickets = tickets.map(t => {
      if (t.id === selectedTicket.id) {
        const historyItem: TicketHistoryItem = {
          timestamp: nowIso,
          author: `${t.technicianName || 'Técnico'}`,
          action: 'Servicio iniciado en sitio',
          details: 'El técnico se encuentra atendiendo la solicitud en la ubicación indicada.'
        };
        return {
          ...t,
          status: 'IN_PROGRESS' as TicketStatus,
          history: [...t.history, historyItem]
        };
      }
      return t;
    });

    saveTickets(updatedTickets);
    showToast(`Ticket #${selectedTicket.code} ahora está En Servicio.`);
    setIsDetailModalOpen(false);
  };

  // Workflow Action 4: Complete Technician Service
  const handleCompleteTechnician = () => {
    if (!selectedTicket) return;
    if (!techNotes.trim()) {
      showToast('Ingresa las notas o diagnóstico de la resolución técnica.', 'error');
      return;
    }

    const nowIso = new Date().toISOString();
    const updatedTickets = tickets.map(t => {
      if (t.id === selectedTicket.id) {
        const historyItem: TicketHistoryItem = {
          timestamp: nowIso,
          author: `${t.technicianName || 'Técnico'}`,
          action: 'Conclusión reportada por técnico',
          details: `Resolución: "${techNotes}". En espera de visto bueno del solicitante.`
        };
        return {
          ...t,
          status: 'WAITING_USER_CONFIRMATION' as TicketStatus,
          technicianNotes: techNotes,
          completedByTechnicianAt: nowIso,
          history: [...t.history, historyItem]
        };
      }
      return t;
    });

    saveTickets(updatedTickets);
    showToast(`Conclusión reportada. Ticket #${selectedTicket.code} en espera de conformidad del solicitante.`);
    setIsDetailModalOpen(false);
  };

  // Workflow Action 5: Dual Confirmation by User
  const handleConfirmByUser = () => {
    if (!selectedTicket) return;
    const nowIso = new Date().toISOString();
    const updatedTickets = tickets.map(t => {
      if (t.id === selectedTicket.id) {
        const historyItem: TicketHistoryItem = {
          timestamp: nowIso,
          author: `${t.requesterName} (Solicitante)`,
          action: 'Cierre Dual Confirmado por Usuario',
          details: `Calificación: ${userRating} estrellas. Comentario: "${userFeedback || 'Sin comentarios adicionales'}"`
        };
        return {
          ...t,
          status: 'CLOSED' as TicketStatus,
          userFeedback: userFeedback,
          userRating: userRating,
          confirmedByUserAt: nowIso,
          history: [...t.history, historyItem]
        };
      }
      return t;
    });

    saveTickets(updatedTickets);
    showToast(`🎉 ¡Ticket #${selectedTicket.code} validado y CERRADO con éxito!`);
    setIsDetailModalOpen(false);
  };

  // Create New Ticket from Modal
  const handleCreateNewTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReqName.trim() || !newDept.trim() || !newReason.trim()) {
      showToast('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    const maxCode = tickets.reduce((max, t) => {
      const num = parseInt(t.code, 10);
      return !isNaN(num) && num > max ? num : max;
    }, 100);

    const nextCode = String(maxCode + 1);
    const newId = `TICK-${nextCode}`;
    const nowIso = new Date().toISOString();

    const createdTicket: Ticket = {
      id: newId,
      code: nextCode,
      requesterName: newReqName.trim(),
      requesterPhone: newReqPhone.trim(),
      department: newDept.trim(),
      reason: newReason.trim(),
      requestedDate: newDate,
      requestedTime: newTime,
      priority: newPriority,
      status: 'PENDING_APPROVAL',
      technicianId: null,
      technicianName: null,
      createdAt: nowIso,
      history: [
        {
          timestamp: nowIso,
          author: `${newReqName.trim()} (Formulario Web)`,
          action: 'Ticket solicitado',
          details: `Solicitud registrada para el ${newDate} a las ${newTime}. Prioridad: ${newPriority}`
        }
      ]
    };

    const updated = [createdTicket, ...tickets];
    saveTickets(updated);
    showToast(`¡Ticket #${nextCode} generado y agregado a la agenda!`);
    setIsNewTicketModalOpen(false);

    // Reset Form
    setNewReqName('');
    setNewDept('');
    setNewReason('');
  };

  // Handler: Add Technician
  const handleAddTechnician = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTechName.trim() || !newTechSpecialty.trim()) {
      showToast('Nombre y especialidad son campos obligatorios', 'error');
      return;
    }

    const newTech: Technician = {
      id: `tech-${Date.now()}`,
      name: newTechName.trim(),
      phone: newTechPhone.trim(),
      specialty: newTechSpecialty.trim(),
      avatar: newTechAvatar,
      active: true,
      activeTicketsCount: 0
    };

    const updated = [...technicians, newTech];
    setTechnicians(updated);
    localStorage.setItem(STORAGE_TECHS_KEY, JSON.stringify(updated));
    showToast(`👨‍💻 ¡Técnico "${newTech.name}" registrado con éxito!`);
    setIsAddTechModalOpen(false);

    // Reset Form
    setNewTechName('');
    setNewTechSpecialty('');
    setNewTechPhone('52155');
    setNewTechAvatar('👨‍💻');
  };

  // Handler: Delete Technician
  const handleDeleteTechnician = (tech: Technician) => {
    let confirmMsg = `¿Estás seguro de que deseas eliminar al técnico "${tech.name}"?`;
    if (tech.activeTicketsCount > 0) {
      confirmMsg = `⚠️ El técnico "${tech.name}" tiene ${tech.activeTicketsCount} ticket(s) activo(s).\n\nSi lo eliminas, los tickets asignados pasarán a estado "Pendiente de Aprobación" para reasignar otro técnico.\n\n¿Deseas continuar?`;
    }

    const confirmed = window.confirm(confirmMsg);
    if (!confirmed) return;

    // Unassign technician from active tickets
    const nowIso = new Date().toISOString();
    const updatedTickets = tickets.map(t => {
      if (t.technicianId === tech.id) {
        return {
          ...t,
          technicianId: null,
          technicianName: null,
          technicianPhone: undefined,
          status: (t.status === 'APPROVED' ? 'PENDING_APPROVAL' : t.status) as TicketStatus,
          history: [
            ...t.history,
            {
              timestamp: nowIso,
              author: 'Sistema',
              action: 'Técnico desvinculado',
              details: `El técnico ${tech.name} fue eliminado del equipo. Ticket devuelto a revisión.`
            }
          ]
        };
      }
      return t;
    });
    saveTickets(updatedTickets);

    // Remove from technicians
    const updatedTechs = technicians.filter(t => t.id !== tech.id);
    setTechnicians(updatedTechs);
    localStorage.setItem(STORAGE_TECHS_KEY, JSON.stringify(updatedTechs));
    showToast(`Técnico "${tech.name}" eliminado del sistema.`, 'error');
  };

  // WhatsApp Smart Links Generator
  const getWhatsAppLinks = (ticket: Ticket) => {
    const botNum = settings.botPhoneNumber.replace(/[^0-9]/g, '');
    const techPhone = (ticket.technicianPhone || (technicians.find(t => t.id === ticket.technicianId)?.phone || '')).replace(/[^0-9]/g, '');
    const userPhone = (ticket.requesterPhone || '').replace(/[^0-9]/g, '');

    const notifyTechMsg = `🔔 *ASIGNACIÓN DE SOPORTE TÉCNICO*\n` +
      `Estimado(a) *${ticket.technicianName}*, se te ha asignado el ticket *#${ticket.code}*.\n\n` +
      `📍 *Lugar:* ${ticket.department}\n` +
      `👤 *Solicitante:* ${ticket.requesterName} (${ticket.requesterPhone})\n` +
      `📅 *Fecha requerida:* ${ticket.requestedDate} a las ${ticket.requestedTime}\n` +
      `⚠️ *Problema:* ${ticket.reason}\n` +
      (ticket.supervisorNotes ? `💬 *Nota Supervisor:* ${ticket.supervisorNotes}\n` : '') +
      `\nPor favor acude a tiempo. Al terminar, notifica al bot para el cierre del servicio.`;

    const notifyUserApprovedMsg = `✅ *SOPORTE TÉCNICO APROBADO*\n` +
      `Hola *${ticket.requesterName}*, tu solicitud de soporte *#${ticket.code}* ha sido APROBADA.\n` +
      `👨‍💻 *Técnico asignado:* ${ticket.technicianName}\n` +
      `📅 *Fecha de visita:* ${ticket.requestedDate} a las ${ticket.requestedTime}\n\n` +
      `El técnico se presentará en *${ticket.department}*. ¡Gracias por tu paciencia!`;

    const techCompleteMsg = `FINALIZAR #${ticket.code}: Servicio concluido satisfactoriamente en ${ticket.department}.`;
    const userConfirmMsg = `CONFORME #${ticket.code}: Confirmo que el soporte técnico fue completado a mi satisfacción. Calificación: 5 estrellas.`;

    return {
      notifyTech: `https://wa.me/${techPhone || ''}?text=${encodeURIComponent(notifyTechMsg)}`,
      notifyUserApproved: `https://wa.me/${userPhone || ''}?text=${encodeURIComponent(notifyUserApprovedMsg)}`,
      techComplete: `https://wa.me/${botNum}?text=${encodeURIComponent(techCompleteMsg)}`,
      userConfirm: `https://wa.me/${botNum}?text=${encodeURIComponent(userConfirmMsg)}`
    };
  };

  // WhatsApp Simulator Interaction Engine
  const sendWaMessage = (overrideText?: string) => {
    const text = (overrideText || waInput).trim();
    if (!text) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { text, direction: 'out' as const, time: timeStr };
    setWaMessages(prev => [...prev, userMsg]);
    if (!overrideText) setWaInput('');

    // Bot Response Logic
    setTimeout(() => {
      processBotIncoming(text);
    }, 600);
  };

  const processBotIncoming = (rawText: string) => {
    const text = rawText.toLowerCase();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const reply = (msg: string) => {
      setWaMessages(prev => [...prev, { text: msg, direction: 'in', time: timeStr }]);
    };

    // Command: Finalizar (Técnico)
    if (text.includes('finalizar') || text.includes('concluir') || text.includes('cerrar')) {
      const match = rawText.match(/#?(\d{3})/);
      const code = match ? match[1] : (tickets.find(t => t.status === 'IN_PROGRESS')?.code || '103');
      const target = tickets.find(t => t.code === code);

      if (target) {
        const nowIso = new Date().toISOString();
        const updated = tickets.map(t => {
          if (t.code === code) {
            return {
              ...t,
              status: 'WAITING_USER_CONFIRMATION' as TicketStatus,
              technicianNotes: rawText,
              completedByTechnicianAt: nowIso,
              history: [
                ...t.history,
                {
                  timestamp: nowIso,
                  author: `${t.technicianName || 'Técnico'} (WhatsApp Bot)`,
                  action: 'Conclusión reportada vía WhatsApp',
                  details: rawText
                }
              ]
            };
          }
          return t;
        });
        saveTickets(updated);
        reply(
          `✅ *Reporte Técnico Recibido para Ticket #${code}*.\n\n` +
          `Se ha enviado una solicitud de conformidad al usuario solicitante para calificar el servicio. Una vez validado, se cerrará automáticamente en la Agenda del Supervisor.`
        );
      } else {
        reply(`⚠️ No se encontró un ticket en servicio con el código #${code}.`);
      }
      return;
    }

    // Command: Conformidad / Validar
    if (text.includes('conforme') || text.includes('aprobado') || text.includes('excelente') || text.includes('5 estrellas')) {
      const match = rawText.match(/#?(\d{3})/);
      const code = match ? match[1] : (tickets.find(t => t.status === 'WAITING_USER_CONFIRMATION')?.code || '104');
      const target = tickets.find(t => t.code === code);

      if (target) {
        const nowIso = new Date().toISOString();
        const updated = tickets.map(t => {
          if (t.code === code) {
            return {
              ...t,
              status: 'CLOSED' as TicketStatus,
              userRating: 5,
              userFeedback: 'Validado vía WhatsApp',
              confirmedByUserAt: nowIso,
              history: [
                ...t.history,
                {
                  timestamp: nowIso,
                  author: `${t.requesterName} (WhatsApp Bot)`,
                  action: 'Cierre Dual Confirmado vía WhatsApp',
                  details: 'Calificación: 5 estrellas. Servicio concluido satisfactoriamente.'
                }
              ]
            };
          }
          return t;
        });
        saveTickets(updated);
        reply(
          `🎉 *¡Muchas gracias!* Tu conformidad para el Ticket *#${code}* ha sido registrada con 5 ⭐.\n\n` +
          `El ticket ha sido *CONCLUIDO Y CERRADO* en la Agenda del Supervisor.`
        );
      } else {
        reply(`ℹ️ No tienes tickets pendientes de validación en este momento.`);
      }
      return;
    }

    // Command: Mis Tickets / Estado
    if (text.includes('estado') || text.includes('mis tickets') || text.includes('consultar')) {
      const activeTickets = tickets.filter(t => t.status !== 'CLOSED' && t.status !== 'REJECTED');
      if (activeTickets.length === 0) {
        reply(`ℹ️ Actualmente no hay tickets de soporte activos.`);
      } else {
        let msg = `📋 *TICKETS ACTIVOS EN SISTEMA*:\n\n`;
        activeTickets.slice(0, 4).forEach(t => {
          msg += `• *#${t.code}*: ${t.reason.substring(0, 45)}...\n  ↳ Estado: *${t.status}* | Fecha: ${t.requestedDate} ${t.requestedTime}\n\n`;
        });
        reply(msg);
      }
      return;
    }

    // Conversational Intake Wizard
    switch (botStep) {
      case 'IDLE':
        if (text.includes('soporte') || text.includes('ayuda') || text.includes('ticket') || text.includes('hola') || text.includes('buenos')) {
          setBotStep('ASK_NAME');
          reply(`🤖 *Asistente TI*: Con gusto agendamos tu servicio técnico.\n\nPara empezar, por favor indícame tu *Nombre y Apellido*:`);
        } else {
          reply(`Para agendar un servicio escribe *soporte*, o bien pulsa el botón *📝 Pedir Soporte* abajo.`);
        }
        break;

      case 'ASK_NAME':
        setBotFormData(prev => ({ ...prev, name: rawText }));
        setBotStep('ASK_DEPT');
        reply(`Mucho gusto *${rawText}*.\n\n¿En qué *Departamento, Oficina o Área* necesitas la atención?`);
        break;

      case 'ASK_DEPT':
        setBotFormData(prev => ({ ...prev, dept: rawText }));
        setBotStep('ASK_REASON');
        reply(`Anotado: *${rawText}*.\n\nPor favor describe brevemente el *problema o motivo* del soporte técnico:`);
        break;

      case 'ASK_REASON':
        setBotFormData(prev => ({ ...prev, reason: rawText }));
        setBotStep('ASK_DATE');
        const tmr = new Date();
        tmr.setDate(tmr.getDate() + 1);
        const isoTmr = tmr.toISOString().split('T')[0];
        reply(`Entendido.\n\n¿Para qué *fecha* requieres la visita?\nPuedes escribir *hoy*, *mañana* o una fecha como *${isoTmr}*:`);
        break;

      case 'ASK_DATE':
        let selectedDate = rawText;
        const todayIso = new Date().toISOString().split('T')[0];
        if (text === 'hoy') selectedDate = todayIso;
        else if (text === 'mañana' || text === 'manana') {
          const t = new Date();
          t.setDate(t.getDate() + 1);
          selectedDate = t.toISOString().split('T')[0];
        }
        setBotFormData(prev => ({ ...prev, date: selectedDate }));
        setBotStep('ASK_TIME');
        reply(`Fecha registrada: *${selectedDate}*.\n\n¿A qué *hora* prefieres la visita? (Ej: 10:00, 11:30, 15:00):`);
        break;

      case 'ASK_TIME':
        const cleanTime = rawText.replace(/[^0-9:]/g, '') || '10:00';
        setBotFormData(prev => ({ ...prev, time: cleanTime }));
        setBotStep('CONFIRM');
        reply(
          `📋 *RESUMEN DE TU SOLICITUD DE SOPORTE*:\n\n` +
          `👤 *Solicitante:* ${botFormData.name}\n` +
          `🏢 *Ubicación:* ${botFormData.dept}\n` +
          `⚠️ *Motivo:* ${botFormData.reason}\n` +
          `📅 *Fecha solicitada:* ${botFormData.date} a las ${cleanTime}\n\n` +
          `¿Confirmas el envío de este ticket para aprobación del supervisor?\nResponde *1* para Confirmar o *2* para Cancelar.`
        );
        break;

      case 'CONFIRM':
        if (text === '1' || text.includes('si') || text.includes('confirmo') || text.includes('ok')) {
          const maxCode = tickets.reduce((max, t) => {
            const num = parseInt(t.code, 10);
            return !isNaN(num) && num > max ? num : max;
          }, 100);
          const nextCode = String(maxCode + 1);
          const newId = `TICK-${nextCode}`;
          const nowIso = new Date().toISOString();

          const autoTicket: Ticket = {
            id: newId,
            code: nextCode,
            requesterName: botFormData.name || 'Usuario WhatsApp',
            requesterPhone: '5215599001122',
            department: botFormData.dept || 'Oficina General',
            reason: botFormData.reason || 'Soporte vía WhatsApp',
            requestedDate: botFormData.date || new Date().toISOString().split('T')[0],
            requestedTime: botFormData.time || '10:00',
            priority: 'media',
            status: 'PENDING_APPROVAL',
            technicianId: null,
            technicianName: null,
            createdAt: nowIso,
            history: [
              {
                timestamp: nowIso,
                author: `${botFormData.name || 'Usuario'} (WhatsApp Bot)`,
                action: 'Ticket solicitado vía WhatsApp',
                details: 'El usuario completó el cuestionario interactivo de WhatsApp.'
              }
            ]
          };

          const updated = [autoTicket, ...tickets];
          saveTickets(updated);
          setBotStep('IDLE');
          reply(
            `🎉 *¡TICKET #${nextCode} GENERADO EXITOSAMENTE!*\n\n` +
            `🛡️ *Estado actual:* PENDIENTE DE APROBACIÓN.\n` +
            `Tu solicitud ya aparece en la *Agenda del Supervisor*.\n\n` +
            `_El técnico asignado será notificado en cuanto el supervisor autorice la visita. Te mantendremos informado por aquí._`
          );
          showToast(`¡Nuevo Ticket #${nextCode} recibido desde WhatsApp!`);
        } else {
          setBotStep('IDLE');
          reply(`❌ Solicitud cancelada. Escribe *soporte* si deseas iniciar nuevamente.`);
        }
        break;
    }
  };

  // Calendar Helpers (Week Calculation)
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
    return new Date(d.setDate(diff));
  };

  const weekDays = useMemo(() => {
    const start = getStartOfWeek(calendarDate);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  }, [calendarDate]);

  const monthTitle = useMemo(() => {
    const start = getStartOfWeek(calendarDate);
    return start.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  }, [calendarDate]);

  const hoursList = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
  const dayNamesShort = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const todayIsoStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const shiftCalendar = (direction: number) => {
    const next = new Date(calendarDate);
    if (calendarMode === 'week') next.setDate(next.getDate() + direction * 7);
    else if (calendarMode === 'month') next.setMonth(next.getMonth() + direction);
    else next.setDate(next.getDate() + direction);
    setCalendarDate(next);
  };

  return (
    <div className="botma-wrapper">
      {/* 1. Header Bar */}
      <header className="botma-header">
        <div className="botma-header-left">
          <button className="botma-back-btn" onClick={onBack}>
            <ArrowLeft size={16} /> Volver a LulyTools
          </button>
          <div className="botma-title-group">
            <h2>
              BOTMA <span className="botma-tag-badge">Soporte TI</span>
            </h2>
            <p>Agenda Operativa, Aprobación de Tickets & Flujo WhatsApp</p>
          </div>
        </div>

        <div className="botma-header-actions">
          <button className="btn-botma-primary" onClick={() => setIsNewTicketModalOpen(true)}>
            <Plus size={18} /> Nuevo Ticket
          </button>
          <button className="btn-botma-whatsapp" onClick={() => setIsPhoneSimOpen(true)}>
            <Smartphone size={18} /> Simulador WhatsApp
          </button>
          <button className="btn-botma-secondary" onClick={() => setIsSettingsModalOpen(true)}>
            <Settings size={18} /> Configuración
          </button>
        </div>
      </header>

      {/* 2. Stats KPI Strip */}
      <section className="botma-stats-strip">
        <div 
          className={`stat-card warning ${statusFilter === 'PENDING_APPROVAL' ? 'active-filter' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'PENDING_APPROVAL' ? 'ALL' : 'PENDING_APPROVAL')}
          title="Clic para filtrar tickets pendientes de aprobación"
        >
          <span className="pulse-indicator"></span>
          <div className="stat-icon-wrap">
            <AlertCircle size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-number">{stats.pending}</span>
            <span className="stat-label">Pendientes Aprobación</span>
          </div>
        </div>

        <div 
          className={`stat-card info ${statusFilter === 'APPROVED' ? 'active-filter' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'APPROVED' ? 'ALL' : 'APPROVED')}
        >
          <div className="stat-icon-wrap">
            <ShieldCheck size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-number">{stats.approved}</span>
            <span className="stat-label">Aprobados / Asignados</span>
          </div>
        </div>

        <div 
          className={`stat-card primary ${statusFilter === 'IN_PROGRESS' ? 'active-filter' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
        >
          <div className="stat-icon-wrap">
            <Play size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-number">{stats.inProgress}</span>
            <span className="stat-label">En Servicio</span>
          </div>
        </div>

        <div 
          className={`stat-card waiting ${statusFilter === 'WAITING_USER_CONFIRMATION' ? 'active-filter' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'WAITING_USER_CONFIRMATION' ? 'ALL' : 'WAITING_USER_CONFIRMATION')}
        >
          <div className="stat-icon-wrap">
            <Clock size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-number">{stats.waiting}</span>
            <span className="stat-label">Por Validar Usuario</span>
          </div>
        </div>

        <div 
          className={`stat-card success ${statusFilter === 'CLOSED' ? 'active-filter' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'CLOSED' ? 'ALL' : 'CLOSED')}
        >
          <div className="stat-icon-wrap">
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-number">{stats.closed}</span>
            <span className="stat-label">Concluidos y Cerrados</span>
          </div>
        </div>
      </section>

      {/* 3. Toolbar & Filters */}
      <section className="botma-toolbar">
        <div className="botma-view-tabs">
          <button 
            className={`botma-tab-btn ${currentView === 'agenda' ? 'active' : ''}`}
            onClick={() => setCurrentView('agenda')}
          >
            <Calendar size={16} /> Agenda Calendario
          </button>
          <button 
            className={`botma-tab-btn ${currentView === 'list' ? 'active' : ''}`}
            onClick={() => setCurrentView('list')}
          >
            <ListFilter size={16} /> Listado y Tablero
          </button>
          <button 
            className={`botma-tab-btn ${currentView === 'technicians' ? 'active' : ''}`}
            onClick={() => setCurrentView('technicians')}
          >
            <Users size={16} /> Equipo Técnico
          </button>
        </div>

        <div className="botma-filter-controls">
          <select 
            className="botma-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Todos los Estados</option>
            <option value="PENDING_APPROVAL">⚠️ Pendientes de Aprobación</option>
            <option value="APPROVED">🔵 Aprobados / Asignados</option>
            <option value="IN_PROGRESS">🟣 En Servicio</option>
            <option value="WAITING_USER_CONFIRMATION">🟠 Por Validar Usuario</option>
            <option value="CLOSED">🟢 Cerrados con Éxito</option>
            <option value="REJECTED">🔴 Rechazados</option>
          </select>

          <div className="botma-search-input-wrap">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Buscar por ticket, área, técnico..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <input 
            type="date" 
            className="botma-date-input"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />

          {dateFilter && (
            <button 
              className="btn-icon-sm" 
              onClick={() => setDateFilter('')} 
              title="Quitar filtro de fecha"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </section>

      {/* ==========================================================================
          VIEW 1: AGENDA CALENDARIO INTERACTIVA
          ========================================================================== */}
      {currentView === 'agenda' && (
        <section className="agenda-card">
          <div className="agenda-nav-bar">
            <div className="agenda-nav-left">
              <div className="agenda-nav-arrows">
                <button className="btn-icon-sm" onClick={() => shiftCalendar(-1)} title="Anterior">
                  <ChevronLeft size={16} />
                </button>
                <button className="btn-icon-sm" onClick={() => shiftCalendar(1)} title="Siguiente">
                  <ChevronRight size={16} />
                </button>
              </div>
              <h3 className="agenda-title">
                {monthTitle.charAt(0).toUpperCase() + monthTitle.slice(1)}
              </h3>
            </div>

            <div className="agenda-mode-toggle">
              <button 
                className={`mode-btn ${calendarMode === 'week' ? 'active' : ''}`}
                onClick={() => setCalendarMode('week')}
              >
                Semana
              </button>
              <button 
                className={`mode-btn ${calendarMode === 'day' ? 'active' : ''}`}
                onClick={() => {
                  setCalendarDate(new Date());
                  setCalendarMode('day');
                }}
              >
                Hoy
              </button>
            </div>
          </div>

          {/* Week Calendar Grid */}
          <div className="calendar-grid-container">
            <table className="cal-table">
              <thead>
                <tr>
                  <th className="cal-time-col-header">HORA</th>
                  {weekDays.map((d, idx) => {
                    const iso = d.toISOString().split('T')[0];
                    const isToday = iso === todayIsoStr;
                    return (
                      <th key={iso} className={`cal-header-th ${isToday ? 'today' : ''}`}>
                        <div className="cal-header-dayname">{dayNamesShort[idx]}</div>
                        <div className="cal-header-daynum">{d.getDate()}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {hoursList.map(hour => (
                  <tr key={hour}>
                    <td className="cal-time-label">
                      {String(hour).padStart(2, '0')}:00
                    </td>
                    {weekDays.map(d => {
                      const dayIso = d.toISOString().split('T')[0];
                      const isToday = dayIso === todayIsoStr;
                      
                      // Tickets for this day and approximate hour slot
                      const slotTickets = filteredTickets.filter(t => {
                        if (t.requestedDate !== dayIso) return false;
                        const ticketHour = parseInt(t.requestedTime.split(':')[0], 10);
                        return ticketHour === hour;
                      });

                      return (
                        <td key={`${dayIso}-${hour}`} className={`cal-slot-cell ${isToday ? 'today' : ''}`}>
                          {slotTickets.map(ticket => (
                            <div 
                              key={ticket.id} 
                              className={`cal-ticket-pill status-pill-${ticket.status}`}
                              onClick={() => openTicketDetail(ticket)}
                            >
                              <div className="cal-pill-header">
                                <span className="cal-pill-code">#{ticket.code}</span>
                                <span className="cal-pill-time">{ticket.requestedTime}</span>
                              </div>
                              <div className="cal-pill-req" title={ticket.requesterName}>
                                {ticket.requesterName}
                              </div>
                              <div className="cal-pill-tech">
                                <span>{ticket.technicianName ? `👨‍💻 ${ticket.technicianName.split(' ')[0]}` : '⚠️ Sin Asignar'}</span>
                              </div>
                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ==========================================================================
          VIEW 2: LISTADO Y TABLERO
          ========================================================================== */}
      {currentView === 'list' && (
        <section className="tickets-cards-grid">
          {filteredTickets.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <AlertCircle size={40} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>No se encontraron tickets con los filtros seleccionados.</p>
            </div>
          ) : (
            filteredTickets.map(ticket => {
              const waLinks = getWhatsAppLinks(ticket);
              return (
                <div key={ticket.id} className="ticket-card">
                  <div>
                    <div className="ticket-card-header">
                      <span className="ticket-code-tag">#{ticket.code}</span>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <span className={`priority-tag priority-${ticket.priority}`}>
                          {ticket.priority}
                        </span>
                        <span className={`status-badge status-pill-${ticket.status}`}>
                          {ticket.status === 'PENDING_APPROVAL' && '⚠️ Pendiente'}
                          {ticket.status === 'APPROVED' && '🔵 Aprobado'}
                          {ticket.status === 'IN_PROGRESS' && '🟣 En Servicio'}
                          {ticket.status === 'WAITING_USER_CONFIRMATION' && '🟠 Por Validar'}
                          {ticket.status === 'CLOSED' && '🟢 Cerrado'}
                          {ticket.status === 'REJECTED' && '🔴 Rechazado'}
                        </span>
                      </div>
                    </div>

                    <p className="ticket-reason-box" style={{ marginTop: '0.85rem' }}>
                      {ticket.reason}
                    </p>
                  </div>

                  <div>
                    <div className="ticket-meta-list">
                      <div className="ticket-meta-row">
                        <User size={14} /> <span><strong>{ticket.requesterName}</strong></span>
                      </div>
                      <div className="ticket-meta-row">
                        <MapPin size={14} /> <span>{ticket.department}</span>
                      </div>
                      <div className="ticket-meta-row">
                        <Clock size={14} /> <span>{ticket.requestedDate} a las {ticket.requestedTime}</span>
                      </div>
                    </div>

                    <div className="ticket-tech-assigned" style={{ marginTop: '0.65rem' }}>
                      <span>Técnico:</span>
                      <strong>{ticket.technicianName || '⚠️ Sin Asignar'}</strong>
                    </div>

                    <div className="ticket-actions-bar">
                      <button className="btn-card-action" onClick={() => openTicketDetail(ticket)}>
                        Gestionar Ticket →
                      </button>
                      <a 
                        href={ticket.technicianId ? waLinks.notifyTech : waLinks.notifyUserApproved} 
                        target="_blank" 
                        rel="noreferrer"
                        className="btn-card-wa" 
                        title="Enviar notificación por WhatsApp"
                      >
                        <MessageSquare size={16} />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>
      )}

      {/* ==========================================================================
          VIEW 3: EQUIPO TÉCNICO
          ========================================================================== */}
      {currentView === 'technicians' && (
        <section>
          {/* Header Toolbar para Técnicos */}
          <div className="techs-header-bar">
            <div className="techs-header-info">
              <h3>Directorio de Especialistas ({techniciansWithLoad.length} técnicos)</h3>
              <p>Monitoreo de carga de trabajo, disponibilidad y contacto directo vía WhatsApp.</p>
            </div>
            <button className="btn-botma-primary" onClick={() => setIsAddTechModalOpen(true)}>
              <UserPlus size={16} /> Agregar Técnico
            </button>
          </div>

          <div className="techs-grid">
            {techniciansWithLoad.map(tech => (
              <div key={tech.id} className="tech-card">
                <div className="tech-card-top">
                  <div className="tech-card-left">
                    <div className="tech-avatar">{tech.avatar}</div>
                    <div className="tech-info">
                      <h4>{tech.name}</h4>
                      <p className="tech-specialty">{tech.specialty}</p>
                    </div>
                  </div>
                  <button 
                    className="btn-delete-tech" 
                    title={`Eliminar a ${tech.name}`}
                    onClick={() => handleDeleteTechnician(tech)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="tech-load-indicator">
                  <span>Carga de trabajo:</span>
                  <span className={`load-badge ${
                    tech.activeTicketsCount === 0 ? 'free' : tech.activeTicketsCount <= 2 ? 'busy' : 'high'
                  }`}>
                    {tech.activeTicketsCount} tickets activos
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                  <a 
                    href={`https://wa.me/${tech.phone.replace(/[^0-9]/g, '')}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="wa-link-btn"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <MessageSquare size={16} /> Contactar WhatsApp
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ==========================================================================
          MODAL: DETALLE Y CICLO DE VIDA DEL TICKET
          ========================================================================== */}
      {isDetailModalOpen && selectedTicket && (
        <div className="botma-modal-backdrop" onClick={() => setIsDetailModalOpen(false)}>
          <div className="botma-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="botma-modal-header">
              <h3>
                Gestión del Ticket #{selectedTicket.code}
                <span className={`status-badge status-pill-${selectedTicket.status}`}>
                  {selectedTicket.status}
                </span>
              </h3>
              <button className="btn-close-modal" onClick={() => setIsDetailModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="botma-modal-body">
              {/* Información General del Solicitante */}
              <div className="detail-section-card">
                <span className="detail-section-title"><User size={15} /> Información de la Solicitud</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.85rem' }}>
                  <div><strong>Solicitante:</strong> {selectedTicket.requesterName}</div>
                  <div><strong>Teléfono:</strong> {selectedTicket.requesterPhone}</div>
                  <div><strong>Departamento:</strong> {selectedTicket.department}</div>
                  <div><strong>Fecha/Hora solicitada:</strong> {selectedTicket.requestedDate} a las {selectedTicket.requestedTime}</div>
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.88rem', background: 'rgba(15, 23, 42, 0.6)', padding: '0.75rem', borderRadius: '8px' }}>
                  <strong>Problema Reportado:</strong>
                  <p style={{ marginTop: '0.25rem', color: '#f1f5f9' }}>{selectedTicket.reason}</p>
                </div>
              </div>

              {/* ACCIONES SEGÚN EL ESTADO DEL TICKET */}

              {/* 1. Si está PENDING_APPROVAL -> Panel de Supervisor */}
              {selectedTicket.status === 'PENDING_APPROVAL' && (
                <div className="action-box-supervisor">
                  <span className="detail-section-title" style={{ color: '#60a5fa' }}>
                    <ShieldCheck size={16} /> Panel de Aprobación del Supervisor
                  </span>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                        Asignar Técnico:
                      </label>
                      <select 
                        className="botma-select" 
                        style={{ width: '100%' }}
                        value={assignTechId}
                        onChange={(e) => setAssignTechId(e.target.value)}
                      >
                        <option value="">-- Seleccionar Técnico --</option>
                        {techniciansWithLoad.map(tech => (
                          <option key={tech.id} value={tech.id}>
                            {tech.avatar} {tech.name} ({tech.activeTicketsCount} activos)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                        Nivel de Prioridad:
                      </label>
                      <select 
                        className="botma-select" 
                        style={{ width: '100%' }}
                        value={assignPriority}
                        onChange={(e) => setAssignPriority(e.target.value as TicketPriority)}
                      >
                        <option value="baja">Baja</option>
                        <option value="media">Media</option>
                        <option value="alta">Alta</option>
                        <option value="urgente">Urgente</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                      Instrucciones o Notas Técnicas del Supervisor:
                    </label>
                    <textarea 
                      style={{ 
                        width: '100%', 
                        background: 'rgba(15, 23, 42, 0.7)', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: '8px', 
                        padding: '0.6rem', 
                        color: '#fff', 
                        fontSize: '0.85rem' 
                      }}
                      rows={2}
                      placeholder="Ej: Llevar adaptadores DisplayPort a HDMI de respaldo..."
                      value={supervisorNotes}
                      onChange={(e) => setSupervisorNotes(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button 
                      className="btn-botma-secondary" 
                      onClick={handleRejectTicket}
                      style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                    >
                      Rechazar Ticket
                    </button>
                    <button className="btn-botma-primary" onClick={handleApproveTicket}>
                      <Check size={16} /> Aprobar y Asignar Técnico
                    </button>
                  </div>
                </div>
              )}

              {/* 2. Si está APPROVED -> Iniciar Atención en Sitio */}
              {selectedTicket.status === 'APPROVED' && (
                <div className="action-box-technician">
                  <span className="detail-section-title" style={{ color: '#a78bfa' }}>
                    <Play size={16} /> Control Operativo del Técnico ({selectedTicket.technicianName})
                  </span>
                  <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                    El ticket está aprobado y asignado. Al presentarse en la ubicación indicada, haz clic en el botón para marcarlo como <strong>En Servicio</strong>.
                  </p>
                  <button className="btn-botma-primary" onClick={handleStartService}>
                    <Play size={16} /> Iniciar Atención en Sitio
                  </button>
                </div>
              )}

              {/* 3. Si está IN_PROGRESS -> Reporte de Conclusión del Técnico */}
              {selectedTicket.status === 'IN_PROGRESS' && (
                <div className="action-box-technician">
                  <span className="detail-section-title" style={{ color: '#a78bfa' }}>
                    <CheckCircle2 size={16} /> Reporte de Conclusión del Técnico
                  </span>
                  <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                    Describe los trabajos realizados y soluciones implementadas para solicitar la confirmación de conformidad al usuario:
                  </p>
                  <textarea 
                    style={{ 
                      width: '100%', 
                      background: 'rgba(15, 23, 42, 0.7)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '8px', 
                      padding: '0.6rem', 
                      color: '#fff', 
                      fontSize: '0.85rem' 
                    }}
                    rows={3}
                    placeholder="Ej: Se reemplazó el cable de red y se reconfiguró la IP estática. Impresora operando al 100%..."
                    value={techNotes}
                    onChange={(e) => setTechNotes(e.target.value)}
                  />
                  <button className="btn-botma-primary" onClick={handleCompleteTechnician}>
                    <Check size={16} /> Reportar Conclusión y Solicitar Visto Bueno
                  </button>
                </div>
              )}

              {/* 4. Si está WAITING_USER_CONFIRMATION -> Validación Dual del Usuario */}
              {selectedTicket.status === 'WAITING_USER_CONFIRMATION' && (
                <div className="action-box-dual">
                  <span className="detail-section-title" style={{ color: '#f472b6' }}>
                    <Star size={16} /> Cierre por Doble Validación (Conformidad del Usuario)
                  </span>
                  <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                    El técnico ha reportado la conclusión del servicio:
                    <br />
                    <em>"{selectedTicket.technicianNotes || 'Sin notas'}"</em>
                  </p>
                  
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                      Calificación de Satisfacción:
                    </label>
                    <div className="star-rating-selector">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button 
                          key={star} 
                          type="button"
                          className={`star-btn ${userRating >= star ? 'active' : ''}`}
                          onClick={() => setUserRating(star)}
                        >
                          ⭐
                        </button>
                      ))}
                      <span style={{ fontSize: '0.85rem', color: '#fde047', marginLeft: '0.5rem', fontWeight: 600 }}>
                        {userRating} de 5 estrellas
                      </span>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                      Comentarios de Conformidad:
                    </label>
                    <textarea 
                      style={{ 
                        width: '100%', 
                        background: 'rgba(15, 23, 42, 0.7)', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: '8px', 
                        padding: '0.6rem', 
                        color: '#fff', 
                        fontSize: '0.85rem' 
                      }}
                      rows={2}
                      placeholder="Ej: Excelente servicio, todo quedó funcionando muy bien."
                      value={userFeedback}
                      onChange={(e) => setUserFeedback(e.target.value)}
                    />
                  </div>

                  <button className="btn-botma-whatsapp" onClick={handleConfirmByUser}>
                    <CheckCircle2 size={16} /> Validar Servicio y Cerrar Ticket
                  </button>
                </div>
              )}

              {/* 5. Si está CLOSED -> Resumen Final */}
              {selectedTicket.status === 'CLOSED' && (
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1rem', borderRadius: '12px' }}>
                  <h4 style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={18} /> Ticket Cerrado con Éxito
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: '#e2e8f0', marginTop: '0.35rem' }}>
                    Validación dual completada. Calificación otorgada: <strong>{'⭐'.repeat(selectedTicket.userRating || 5)} ({selectedTicket.userRating || 5}/5)</strong>.
                  </p>
                  {selectedTicket.userFeedback && (
                    <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '0.25rem', fontStyle: 'italic' }}>
                      "{selectedTicket.userFeedback}"
                    </p>
                  )}
                </div>
              )}

              {/* Enlaces Inteligentes de WhatsApp wa.me */}
              <div className="whatsapp-links-group">
                <span className="detail-section-title"><MessageSquare size={15} /> Notificaciones Inteligentes WhatsApp (wa.me)</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  <a 
                    href={getWhatsAppLinks(selectedTicket).notifyTech} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="wa-link-btn"
                  >
                    <span>Avisar al Técnico Asignado</span>
                    <ExternalLink size={14} />
                  </a>
                  <a 
                    href={getWhatsAppLinks(selectedTicket).notifyUserApproved} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="wa-link-btn"
                  >
                    <span>Notificar Aprobación a Usuario</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              {/* Historial de Auditoría */}
              <div className="detail-section-card">
                <span className="detail-section-title"><Clock size={15} /> Historial y Trazabilidad del Ticket</span>
                <div className="audit-timeline">
                  {selectedTicket.history.map((h, idx) => (
                    <div key={idx} className="timeline-item">
                      <div className="timeline-dot"></div>
                      <div className="timeline-time">
                        {new Date(h.timestamp).toLocaleString('es-ES', { 
                          dateStyle: 'short', 
                          timeStyle: 'short' 
                        })}
                      </div>
                      <div className="timeline-author">{h.author} — {h.action}</div>
                      <div className="timeline-details">{h.details}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MODAL: NUEVO TICKET
          ========================================================================== */}
      {isNewTicketModalOpen && (
        <div className="botma-modal-backdrop" onClick={() => setIsNewTicketModalOpen(false)}>
          <div className="botma-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="botma-modal-header">
              <h3><Plus size={20} /> Registrar Nuevo Ticket de Soporte</h3>
              <button className="btn-close-modal" onClick={() => setIsNewTicketModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateNewTicket}>
              <div className="botma-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                      Nombre del Solicitante *
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ej: Lic. Elena Morales" 
                      className="botma-date-input" 
                      style={{ width: '100%' }}
                      value={newReqName}
                      onChange={(e) => setNewReqName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                      Teléfono WhatsApp
                    </label>
                    <input 
                      type="text" 
                      placeholder="52155..." 
                      className="botma-date-input" 
                      style={{ width: '100%' }}
                      value={newReqPhone}
                      onChange={(e) => setNewReqPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                      Departamento / Ubicación Física *
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ej: Contabilidad Piso 2" 
                      className="botma-date-input" 
                      style={{ width: '100%' }}
                      value={newDept}
                      onChange={(e) => setNewDept(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                      Nivel de Prioridad Inicial
                    </label>
                    <select 
                      className="botma-select" 
                      style={{ width: '100%' }}
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as TicketPriority)}
                    >
                      <option value="baja">Baja</option>
                      <option value="media">Media</option>
                      <option value="alta">Alta</option>
                      <option value="urgente">Urgente</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                      Fecha Requerida de Atención
                    </label>
                    <input 
                      type="date" 
                      className="botma-date-input" 
                      style={{ width: '100%' }}
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                      Hora Requerida
                    </label>
                    <input 
                      type="time" 
                      className="botma-date-input" 
                      style={{ width: '100%' }}
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                    Motivo o Descripción de la Falla *
                  </label>
                  <textarea 
                    required
                    rows={3}
                    placeholder="Describe a detalle el problema con el equipo, red o software..." 
                    style={{ 
                      width: '100%', 
                      background: 'rgba(15, 23, 42, 0.7)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '8px', 
                      padding: '0.6rem', 
                      color: '#fff', 
                      fontSize: '0.85rem' 
                    }}
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button 
                    type="button" 
                    className="btn-botma-secondary" 
                    onClick={() => setIsNewTicketModalOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-botma-primary">
                    <Plus size={16} /> Crear Ticket
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MODAL: CONFIGURACIÓN DEL SISTEMA
          ========================================================================== */}
      {isSettingsModalOpen && (
        <div className="botma-modal-backdrop" onClick={() => setIsSettingsModalOpen(false)}>
          <div className="botma-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="botma-modal-header">
              <h3><Settings size={20} /> Configuración de BOTMA & WhatsApp</h3>
              <button className="btn-close-modal" onClick={() => setIsSettingsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="botma-modal-body">
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                  Nombre del Supervisor
                </label>
                <input 
                  type="text" 
                  className="botma-date-input" 
                  style={{ width: '100%' }}
                  value={settings.supervisorName}
                  onChange={(e) => setSettings({ ...settings, supervisorName: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                  Teléfono del Supervisor
                </label>
                <input 
                  type="text" 
                  className="botma-date-input" 
                  style={{ width: '100%' }}
                  value={settings.supervisorPhone}
                  onChange={(e) => setSettings({ ...settings, supervisorPhone: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                  Nombre de la Empresa u Organización
                </label>
                <input 
                  type="text" 
                  className="botma-date-input" 
                  style={{ width: '100%' }}
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                  Número del Bot de WhatsApp
                </label>
                <input 
                  type="text" 
                  className="botma-date-input" 
                  style={{ width: '100%' }}
                  value={settings.botPhoneNumber}
                  onChange={(e) => setSettings({ ...settings, botPhoneNumber: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  id="chkDual"
                  checked={settings.requireDualConfirmation}
                  onChange={(e) => setSettings({ ...settings, requireDualConfirmation: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                <label htmlFor="chkDual" style={{ fontSize: '0.85rem', color: '#f1f5f9', cursor: 'pointer' }}>
                  Requerir Cierre por Doble Validación (Técnico + Conformidad de Solicitante)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button className="btn-botma-secondary" onClick={() => setIsSettingsModalOpen(false)}>
                  Cerrar
                </button>
                <button className="btn-botma-primary" onClick={() => saveSettings(settings)}>
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MODAL: SIMULADOR DE TELÉFONO WHATSAPP
          ========================================================================== */}
      {isPhoneSimOpen && (
        <div className="wa-simulator-backdrop" onClick={() => setIsPhoneSimOpen(false)}>
          <div className="phone-mockup" onClick={(e) => e.stopPropagation()}>
            <div className="phone-notch">
              <div className="notch-pill"></div>
            </div>

            <div className="phone-header">
              <div className="phone-header-left">
                <div className="phone-bot-avatar">🤖</div>
                <div className="phone-bot-info">
                  <h4>Bot Soporte TI</h4>
                  <span>en línea</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <select 
                  className="phone-role-selector"
                  value={simRole}
                  onChange={(e) => {
                    const role = e.target.value as 'USER' | 'TECH';
                    setSimRole(role);
                    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    setWaMessages(prev => [
                      ...prev,
                      {
                        text: role === 'TECH' 
                          ? '👨‍💻 _Has cambiado al rol de Técnico._ Puedes enviar comandos como: `Finalizar #101` para reportar término.' 
                          : '👤 _Has cambiado al rol de Solicitante._ Puedes solicitar asistencia escribiendo lo que necesitas.',
                        direction: 'in',
                        time: timeStr
                      }
                    ]);
                  }}
                >
                  <option value="USER">👤 Solicitante</option>
                  <option value="TECH">👨‍💻 Técnico</option>
                </select>

                <button 
                  className="btn-icon-sm" 
                  style={{ width: '28px', height: '28px', border: 'none', background: 'transparent', color: '#94a3b8' }}
                  onClick={() => setIsPhoneSimOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="phone-chat-body">
              {waMessages.map((msg, idx) => (
                <div key={idx} className={`wa-bubble ${msg.direction}`}>
                  <div dangerouslySetInnerHTML={{ 
                    __html: msg.text
                      .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
                      .replace(/_(.*?)_/g, '<em>$1</em>')
                      .replace(/\n/g, '<br/>') 
                  }} />
                  <div className="wa-bubble-time">{msg.time} {msg.direction === 'out' && '✓✓'}</div>
                </div>
              ))}
            </div>

            {/* Quick Action Chips */}
            <div className="phone-quick-chips">
              <button className="phone-chip" onClick={() => sendWaMessage('Quiero solicitar soporte técnico')}>
                📝 Pedir Soporte
              </button>
              <button className="phone-chip" onClick={() => sendWaMessage('¿Cuál es el estado de mis tickets?')}>
                🔍 Mis Tickets
              </button>
              <button className="phone-chip" onClick={() => sendWaMessage('Finalizar servicio #103')}>
                ✅ Concluir #103
              </button>
            </div>

            {/* Input Bar */}
            <div className="phone-input-bar">
              <input 
                type="text" 
                placeholder="Escribe un mensaje..."
                value={waInput}
                onChange={(e) => setWaInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendWaMessage()}
              />
              <button className="btn-send-wa" onClick={() => sendWaMessage()}>
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MODAL: REGISTRAR NUEVO TÉCNICO
          ========================================================================== */}
      {isAddTechModalOpen && (
        <div className="botma-modal-backdrop" onClick={() => setIsAddTechModalOpen(false)}>
          <div className="botma-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="botma-modal-header">
              <h3><UserPlus size={20} /> Registrar Nuevo Técnico</h3>
              <button className="btn-close-modal" onClick={() => setIsAddTechModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddTechnician}>
              <div className="botma-modal-body">
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                    Nombre Completo del Técnico *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ej: Ing. Jorge Valenzuela" 
                    className="botma-date-input" 
                    style={{ width: '100%' }}
                    value={newTechName}
                    onChange={(e) => setNewTechName(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                      Teléfono WhatsApp
                    </label>
                    <input 
                      type="text" 
                      placeholder="52155..." 
                      className="botma-date-input" 
                      style={{ width: '100%' }}
                      value={newTechPhone}
                      onChange={(e) => setNewTechPhone(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                      Especialidad / Área Principal *
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ej: Redes, Servidores y Fibra" 
                      className="botma-date-input" 
                      style={{ width: '100%' }}
                      value={newTechSpecialty}
                      onChange={(e) => setNewTechSpecialty(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                    Avatar / Icono del Técnico
                  </label>
                  <div className="avatar-emoji-picker">
                    {['👨‍💻', '👩‍💻', '👨‍🔧', '👩‍🔧', '🧑‍💻', '💻', '🛠️', '⚡'].map(emoji => (
                      <button 
                        key={emoji}
                        type="button"
                        className={`avatar-emoji-btn ${newTechAvatar === emoji ? 'active' : ''}`}
                        onClick={() => setNewTechAvatar(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button 
                    type="button" 
                    className="btn-botma-secondary" 
                    onClick={() => setIsAddTechModalOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-botma-primary">
                    <UserPlus size={16} /> Guardar Técnico
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className={`botma-toast ${toastType}`}>
          {toastType === 'success' ? <CheckCircle2 size={18} color="#10b981" /> : <AlertCircle size={18} color="#ef4444" />}
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
