export interface ChecklistItem {
  id: string;
  category?: string;
  label: string;
  checked: boolean;
}

export interface MonthlyChecklistData {
  constanciaFiscal: Record<string, boolean>;
  cancelaciones: boolean;
  solicitarEstadosCuenta: boolean;
  variables: {
    creditoYCobranza: boolean;
    cobranzaMtto: boolean;
    escrituracion: boolean;
  };
  vacacionesPersonal: boolean;
  controlObligaciones: boolean;
  carteraSilverio: boolean;
  pldEfectivoYola: boolean;
  pldEfectivoCarlos: boolean;
  lotesPendientesEscriturar: boolean;
  notasCredito: boolean;
  contabilidadElectronica: boolean;
  nominas: {
    comisionVentas: boolean;
    comisionCallCenter: boolean;
    comisionDireccion: boolean;
  };
  xmlContabilidad: boolean;
  otros: boolean;
  observations: string;
}

export interface ChecklistRecord {
  id: string;
  period: string; // ej: "oct-26"
  status: 'Completado' | 'En progreso' | 'Pendiente';
  items: MonthlyChecklistData;
  observations: string;
  created_at?: string;
  updated_at?: string;
}

export const FISCAL_PEOPLE = [
  'Ing Elizondo', 'Erika', 'Julia', 'Jaime', 'David', 'Oscar',
  'Lu', 'Rossy', 'Eva', 'Brizz', 'Adrian', 'Mary', 'Carlos',
  'Silverio', 'Yoly', 'Eduardo', 'Mayra', 'Melissa', 'Clarissa', 'Samantha'
];

export const DEFAULT_CHECKLIST_DATA: MonthlyChecklistData = {
  constanciaFiscal: FISCAL_PEOPLE.reduce((acc, name) => ({ ...acc, [name]: false }), {}),
  cancelaciones: false,
  solicitarEstadosCuenta: false,
  variables: {
    creditoYCobranza: false,
    cobranzaMtto: false,
    escrituracion: false,
  },
  vacacionesPersonal: false,
  controlObligaciones: false,
  carteraSilverio: false,
  pldEfectivoYola: false,
  pldEfectivoCarlos: false,
  lotesPendientesEscriturar: false,
  notasCredito: false,
  contabilidadElectronica: false,
  nominas: {
    comisionVentas: false,
    comisionCallCenter: false,
    comisionDireccion: false,
  },
  xmlContabilidad: false,
  otros: false,
  observations: '',
};

// ==========================================
// BOTMA - Tickets de Soporte TI y Agenda
// ==========================================

export type TicketStatus = 
  | 'PENDING_APPROVAL' 
  | 'APPROVED' 
  | 'IN_PROGRESS' 
  | 'WAITING_USER_CONFIRMATION' 
  | 'CLOSED' 
  | 'REJECTED';

export type TicketPriority = 'baja' | 'media' | 'alta' | 'urgente';

export interface TicketHistoryItem {
  timestamp: string;
  author: string;
  action: string;
  details: string;
}

export interface Ticket {
  id: string;
  code: string;
  requesterName: string;
  requesterPhone: string;
  department: string;
  reason: string;
  requestedDate: string;
  requestedTime: string;
  priority: TicketPriority;
  status: TicketStatus;
  technicianId: string | null;
  technicianName: string | null;
  technicianPhone?: string;
  supervisorNotes?: string;
  technicianNotes?: string;
  userFeedback?: string;
  userRating?: number | null;
  createdAt: string;
  approvedAt?: string | null;
  completedByTechnicianAt?: string | null;
  confirmedByUserAt?: string | null;
  history: TicketHistoryItem[];
}

export interface Technician {
  id: string;
  name: string;
  phone: string;
  specialty: string;
  avatar: string;
  active: boolean;
  activeTicketsCount: number;
}

export interface BotmaSettings {
  supervisorName: string;
  supervisorPhone: string;
  companyName: string;
  botPhoneNumber: string;
  requireDualConfirmation: boolean;
  autoNotifyWhatsApp: boolean;
}

