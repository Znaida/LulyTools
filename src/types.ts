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
