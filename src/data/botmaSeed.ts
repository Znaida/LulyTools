import type { Technician, BotmaSettings, Ticket } from '../types';

export const INITIAL_TECHNICIANS: Technician[] = [
  {
    id: 'tech-1',
    name: 'Carlos Mendoza',
    phone: '5215512345678',
    specialty: 'Redes, Routers y Servidores',
    avatar: '👨‍💻',
    active: true,
    activeTicketsCount: 1
  },
  {
    id: 'tech-2',
    name: 'Laura Gómez',
    phone: '5215587654321',
    specialty: 'Hardware, Laptops y Mantenimiento',
    avatar: '👩‍💻',
    active: true,
    activeTicketsCount: 1
  },
  {
    id: 'tech-3',
    name: 'Andrés Silva',
    phone: '5215599887766',
    specialty: 'Software, ERP y Licenciamiento',
    avatar: '👨‍🔧',
    active: true,
    activeTicketsCount: 0
  },
  {
    id: 'tech-4',
    name: 'Mariana Ortiz',
    phone: '5215544332211',
    specialty: 'Telefonía IP y Periféricos',
    avatar: '👩‍🔧',
    active: true,
    activeTicketsCount: 0
  }
];

export const INITIAL_SETTINGS: BotmaSettings = {
  supervisorName: 'Ing. Roberto Fuentes',
  supervisorPhone: '5215500001122',
  companyName: 'OpinIA Soporte TI Enterprise',
  botPhoneNumber: '5215599008811',
  requireDualConfirmation: true,
  autoNotifyWhatsApp: true
};

const now = Date.now();
const todayIso = new Date().toISOString().split('T')[0];

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'TICK-101',
    code: '101',
    requesterName: 'Sofía Ramírez',
    requesterPhone: '5215533221100',
    department: 'Contabilidad - Piso 3',
    reason: 'Falla con la impresora de facturación fiscal y la terminal de red local tras corte de luz',
    requestedDate: todayIso,
    requestedTime: '09:30',
    priority: 'alta',
    status: 'PENDING_APPROVAL',
    technicianId: null,
    technicianName: null,
    supervisorNotes: '',
    technicianNotes: '',
    userFeedback: '',
    userRating: null,
    createdAt: new Date(now - 3600000 * 2).toISOString(),
    approvedAt: null,
    completedByTechnicianAt: null,
    confirmedByUserAt: null,
    history: [
      {
        timestamp: new Date(now - 3600000 * 2).toISOString(),
        author: 'Sofía Ramírez (WhatsApp Bot)',
        action: 'Ticket solicitado vía WhatsApp',
        details: 'El usuario completó el formulario de asistencia para hoy a las 09:30.'
      }
    ]
  },
  {
    id: 'TICK-102',
    code: '102',
    requesterName: 'Alejandro Morales',
    requesterPhone: '5215566778899',
    department: 'Ventas y Atención a Clientes',
    reason: 'Laptop principal no da video al conectar proyector HDMI de sala de juntas',
    requestedDate: todayIso,
    requestedTime: '11:00',
    priority: 'media',
    status: 'APPROVED',
    technicianId: 'tech-2',
    technicianName: 'Laura Gómez',
    supervisorNotes: 'Aprobado. Llevar adaptadores DisplayPort a HDMI de respaldo.',
    technicianNotes: '',
    userFeedback: '',
    userRating: null,
    createdAt: new Date(now - 3600000 * 6).toISOString(),
    approvedAt: new Date(now - 3600000 * 4).toISOString(),
    completedByTechnicianAt: null,
    confirmedByUserAt: null,
    history: [
      {
        timestamp: new Date(now - 3600000 * 6).toISOString(),
        author: 'Alejandro Morales (WhatsApp Bot)',
        action: 'Ticket solicitado vía WhatsApp',
        details: 'Solicitud agendada para reunión comercial urgente.'
      },
      {
        timestamp: new Date(now - 3600000 * 4).toISOString(),
        author: 'Supervisor (Roberto Fuentes)',
        action: 'Ticket Aprobado y Asignado',
        details: 'Asignado a la técnico Laura Gómez con prioridad media.'
      }
    ]
  },
  {
    id: 'TICK-103',
    code: '103',
    requesterName: 'Lic. Fernando Cruz',
    requesterPhone: '5215577889900',
    department: 'Recursos Humanos',
    reason: 'Instalación y configuración de VPN segura para trabajo remoto de nuevo colaborador',
    requestedDate: todayIso,
    requestedTime: '14:00',
    priority: 'baja',
    status: 'IN_PROGRESS',
    technicianId: 'tech-1',
    technicianName: 'Carlos Mendoza',
    supervisorNotes: 'Verificar credenciales de Active Directory de RRHH.',
    technicianNotes: 'Inicié el aprovisionamiento de certificados SSL.',
    userFeedback: '',
    userRating: null,
    createdAt: new Date(now - 3600000 * 8).toISOString(),
    approvedAt: new Date(now - 3600000 * 5).toISOString(),
    completedByTechnicianAt: null,
    confirmedByUserAt: null,
    history: [
      {
        timestamp: new Date(now - 3600000 * 8).toISOString(),
        author: 'Lic. Fernando Cruz (WhatsApp Bot)',
        action: 'Ticket solicitado',
        details: 'Ingreso de nuevo personal.'
      },
      {
        timestamp: new Date(now - 3600000 * 5).toISOString(),
        author: 'Supervisor',
        action: 'Ticket Aprobado y Asignado',
        details: 'Asignado a Carlos Mendoza.'
      },
      {
        timestamp: new Date(now - 3600000 * 1).toISOString(),
        author: 'Carlos Mendoza (Técnico)',
        action: 'Servicio iniciado en sitio',
        details: 'Técnico presente en la oficina para configuración de VPN.'
      }
    ]
  },
  {
    id: 'TICK-104',
    code: '104',
    requesterName: 'Ing. Mónica Valdés',
    requesterPhone: '5215522334455',
    department: 'Dirección de Operaciones',
    reason: 'Mantenimiento preventivo y reemplazo de batería UPS en rack de comunicaciones',
    requestedDate: todayIso,
    requestedTime: '16:00',
    priority: 'alta',
    status: 'WAITING_USER_CONFIRMATION',
    technicianId: 'tech-1',
    technicianName: 'Carlos Mendoza',
    supervisorNotes: 'Realizar prueba de conmutación sin desconectar servidores críticos.',
    technicianNotes: 'Se reemplazaron 2 módulos de baterías 12V 9Ah y se calibró el inversor. Todo operando al 100%.',
    userFeedback: '',
    userRating: null,
    createdAt: new Date(now - 3600000 * 12).toISOString(),
    approvedAt: new Date(now - 3600000 * 10).toISOString(),
    completedByTechnicianAt: new Date(now - 3600000 * 2).toISOString(),
    confirmedByUserAt: null,
    history: [
      {
        timestamp: new Date(now - 3600000 * 12).toISOString(),
        author: 'Ing. Mónica Valdés',
        action: 'Ticket solicitado',
        details: 'Plan de mantenimiento semestral.'
      },
      {
        timestamp: new Date(now - 3600000 * 2).toISOString(),
        author: 'Carlos Mendoza (Técnico)',
        action: 'Conclusión reportada por técnico',
        details: 'Mantenimiento de UPS concluido. En espera de visto bueno de la Ing. Valdés.'
      }
    ]
  },
  {
    id: 'TICK-105',
    code: '105',
    requesterName: 'Patricio Vega',
    requesterPhone: '5215544556677',
    department: 'Marketing y Diseño',
    reason: 'Restablecimiento de contraseña corporativa y acceso a unidad compartida en la nube',
    requestedDate: todayIso,
    requestedTime: '08:30',
    priority: 'baja',
    status: 'CLOSED',
    technicianId: 'tech-3',
    technicianName: 'Andrés Silva',
    supervisorNotes: 'Atender vía remota.',
    technicianNotes: 'Se restablecieron credenciales de Office 365 y se mapeó la unidad Z: con permisos de lectura.',
    userFeedback: 'Excelente atención rápida y muy amable.',
    userRating: 5,
    createdAt: new Date(now - 3600000 * 24).toISOString(),
    approvedAt: new Date(now - 3600000 * 23).toISOString(),
    completedByTechnicianAt: new Date(now - 3600000 * 21).toISOString(),
    confirmedByUserAt: new Date(now - 3600000 * 20).toISOString(),
    history: [
      {
        timestamp: new Date(now - 3600000 * 24).toISOString(),
        author: 'Patricio Vega',
        action: 'Ticket solicitado',
        details: 'Bloqueo de cuenta.'
      },
      {
        timestamp: new Date(now - 3600000 * 20).toISOString(),
        author: 'Patricio Vega (Solicitante)',
        action: 'Cierre Dual Confirmado por Usuario',
        details: 'Calificación: 5 estrellas. Feedback: Excelente atención rápida y muy amable.'
      }
    ]
  }
];
