import { OrderPriority, OrderStatus, TaskStatus } from '@/lib/domain';

type SampleWorkshop = {
  id: number;
  name: string;
  description?: string;
  location?: string;
};

type SampleCarpenter = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  headline?: string;
  skills: string[];
  workshopId?: number;
};

type SampleClient = {
  id: number;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  address?: string;
};

type SampleOrderTask = {
  id: number;
  title: string;
  status: TaskStatus;
  dueInDays?: number;
  dueDate?: Date | null;
};

type SampleOrder = {
  id: number;
  reference: string;
  title: string;
  description: string;
  status: OrderStatus;
  priority: OrderPriority;
  budgetCents?: number;
  startInDays?: number;
  dueInDays?: number;
  deliveredInDays?: number;
  carpenterId?: number;
  clientId?: number;
  workshopId?: number;
  createdAt?: Date;
  updatedAt?: Date;
  startDate?: Date | null;
  dueDate?: Date | null;
  deliveredAt?: Date | null;
  tasks: SampleOrderTask[];
};

type SampleRecords = {
  workshops: SampleWorkshop[];
  carpenters: SampleCarpenter[];
  clients: SampleClient[];
  orders: SampleOrder[];
};

export type SampleDataSet = ReturnType<typeof createSampleRecords>;

const workshops: SampleWorkshop[] = [
  {
    id: 1,
    name: 'Atelier Praga',
    description: 'Zespół specjalizujący się w meblach do mieszkań loftowych.',
    location: 'Warszawa, Praga-Północ',
  },
  {
    id: 2,
    name: 'Warsztat Mokotów',
    description: 'Drewniane zabudowy do biur i lokali usługowych.',
    location: 'Warszawa, Mokotów',
  },
];

const carpenters: SampleCarpenter[] = [
  {
    id: 1,
    name: 'Marta Kowalska',
    email: 'marta@meblomat.pl',
    phone: '+48 600 200 100',
    headline: 'Projektantka zabudów kuchennych',
    skills: ['Zabudowy kuchenne', 'Fronty lakierowane', 'Projektowanie 3D'],
    workshopId: 1,
  },
  {
    id: 2,
    name: 'Jakub Lis',
    email: 'jakub@meblomat.pl',
    phone: '+48 600 200 110',
    headline: 'Specjalista od konstrukcji drewnianych',
    skills: ['Schody', 'Stoły dębowe', 'Lite drewno'],
    workshopId: 1,
  },
  {
    id: 3,
    name: 'Natalia Wrona',
    email: 'natalia@meblomat.pl',
    phone: '+48 600 200 120',
    headline: 'Koordynatorka zamówień komercyjnych',
    skills: ['Zabudowy biurowe', 'Panele ścienne', 'Okleiny'],
    workshopId: 2,
  },
];

const clients: SampleClient[] = [
  {
    id: 1,
    name: 'Anna Nowak',
    company: 'Studio Wnętrz ARANŻ',
    email: 'anna.nowak@aranz.pl',
    phone: '+48 500 600 700',
    address: 'Warszawa, ul. Targowa 15',
  },
  {
    id: 2,
    name: 'Hubert Maj',
    company: 'Kawiarnia Zielony Zakątek',
    email: 'hubert@zielonyzakatek.pl',
    phone: '+48 511 633 211',
    address: 'Warszawa, ul. Puławska 67',
  },
  {
    id: 3,
    name: 'Joanna Piotrowska',
    company: 'Mieszkanie prywatne',
    email: 'joanna.piotrowska@example.com',
    phone: '+48 609 900 123',
    address: 'Warszawa, ul. Jana Pawła II 23/5',
  },
];

const orders: SampleOrder[] = [
  {
    id: 1,
    reference: 'ORD-2024-001',
    title: 'Zabudowa kuchni na wymiar',
    description:
      'Projekt i wykonanie zabudowy kuchennej w mieszkaniu w kamienicy – dąb bielony, fronty frezowane, systemy Blum.',
    status: OrderStatus.IN_PROGRESS,
    priority: OrderPriority.URGENT,
    budgetCents: 342500,
    startInDays: -10,
    dueInDays: 12,
    carpenterId: 1,
    clientId: 1,
    workshopId: 1,
    tasks: [
      { id: 1, title: 'Pomiary na miejscu', status: TaskStatus.COMPLETED, dueInDays: -9 },
      { id: 2, title: 'Projekt frontów i korpusów', status: TaskStatus.IN_PROGRESS, dueInDays: 2 },
      { id: 3, title: 'Zamówienie okuć', status: TaskStatus.PENDING, dueInDays: 3 },
    ],
  },
  {
    id: 2,
    reference: 'ORD-2024-002',
    title: 'Lady i zabudowy do kawiarni',
    description:
      'Kompletna zabudowa baru, witryny na wypieki i siedziska dla kawiarni w centrum miasta. Lite drewno i stal.',
    status: OrderStatus.PENDING,
    priority: OrderPriority.HIGH,
    budgetCents: 528900,
    startInDays: -3,
    dueInDays: 28,
    carpenterId: 3,
    clientId: 2,
    workshopId: 2,
    tasks: [
      { id: 4, title: 'Opracowanie projektu wykonawczego', status: TaskStatus.PENDING, dueInDays: 5 },
      { id: 5, title: 'Wycena materiałów', status: TaskStatus.PENDING, dueInDays: 7 },
    ],
  },
  {
    id: 3,
    reference: 'ORD-2024-003',
    title: 'Schody dębowe z balustradą',
    description:
      'Wykonanie schodów na konstrukcji stalowej, stopnie z dębu olejowanego i balustrada z hartowanego szkła.',
    status: OrderStatus.READY_FOR_DELIVERY,
    priority: OrderPriority.MEDIUM,
    budgetCents: 187400,
    startInDays: -25,
    dueInDays: 3,
    carpenterId: 2,
    clientId: 3,
    workshopId: 1,
    tasks: [
      { id: 6, title: 'Spawanie konstrukcji', status: TaskStatus.COMPLETED, dueInDays: -15 },
      { id: 7, title: 'Montaż stopni', status: TaskStatus.COMPLETED, dueInDays: -5 },
      { id: 8, title: 'Szlifowanie i olejowanie', status: TaskStatus.IN_PROGRESS, dueInDays: 1 },
    ],
  },
  {
    id: 4,
    reference: 'ORD-2024-004',
    title: 'Biblioteka z podświetleniem LED',
    description:
      'Zabudowa ściany w salonie z półkami na wymiar i zintegrowanym oświetleniem LED.',
    status: OrderStatus.COMPLETED,
    priority: OrderPriority.MEDIUM,
    budgetCents: 146000,
    startInDays: -60,
    dueInDays: -5,
    deliveredInDays: -2,
    carpenterId: 1,
    clientId: 3,
    workshopId: 1,
    tasks: [
      { id: 9, title: 'Produkcja korpusów', status: TaskStatus.COMPLETED, dueInDays: -20 },
      { id: 10, title: 'Montaż oświetlenia', status: TaskStatus.COMPLETED, dueInDays: -6 },
    ],
  },
  {
    id: 5,
    reference: 'ORD-2024-005',
    title: 'Renowacja stołu konferencyjnego',
    description:
      'Czyszczenie, uzupełnienie ubytków i ponowne olejowanie stołu konferencyjnego z litego dębu.',
    status: OrderStatus.CANCELLED,
    priority: OrderPriority.LOW,
    budgetCents: 54000,
    startInDays: -8,
    dueInDays: -1,
    carpenterId: 2,
    clientId: 2,
    workshopId: 2,
    tasks: [
      { id: 11, title: 'Diagnoza stanu', status: TaskStatus.COMPLETED, dueInDays: -6 },
      { id: 12, title: 'Przygotowanie kosztorysu', status: TaskStatus.BLOCKED, dueInDays: -2 },
    ],
  },
];

export function createSampleRecords() {
  const now = new Date();

  const ordersWithDates = orders.map((order, index) => {
    const createdAt = addDays(now, order.startInDays ?? -14 - index * 3);
    const updatedAt = addDays(now, order.dueInDays ?? 0);
    return {
      ...order,
      createdAt,
      updatedAt,
      startDate: order.startInDays != null ? addDays(now, order.startInDays) : null,
      dueDate: order.dueInDays != null ? addDays(now, order.dueInDays) : null,
      deliveredAt:
        order.deliveredInDays != null ? addDays(now, order.deliveredInDays) : null,
      tasks: order.tasks.map((task) => ({
        ...task,
        dueDate: task.dueInDays != null ? addDays(now, task.dueInDays) : null,
      })),
    };
  });

  return {
    workshops,
    carpenters,
    clients,
    orders: ordersWithDates,
  } satisfies SampleRecords;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}
