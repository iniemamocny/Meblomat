import { prisma } from '@meblomat/prisma';
import { OrderPriority, OrderStatus, TaskStatus } from '@/lib/domain';
import { createSampleRecords } from '@/lib/sample-data';
import {
  extractPrismaErrorMessage,
  isMissingTableError,
  isPrismaConnectionError,
} from '@/lib/prisma-errors';
import {
  AuthenticatedUser,
  isUnauthorizedError,
  requireCurrentUser,
} from '@/server/auth';

type RawOrder = {
  id: number;
  reference: string;
  title: string;
  description: string | null;
  status: OrderStatus;
  priority: OrderPriority;
  budgetCents: number | null;
  startDate: Date | null;
  dueDate: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  carpenter: { id: number; name: string } | null;
  client: { id: number; name: string } | null;
  workshop: { id: number; name: string } | null;
  tasks: { id: number; title: string; status: TaskStatus; dueDate: Date | null }[];
};

type RawCarpenter = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  headline?: string | null;
  skills: string[];
  workshop: { id: number; name: string } | null;
  orders: { status: OrderStatus; createdAt: Date; deliveredAt: Date | null }[];
};

type RawClient = {
  id: number;
  name: string;
  company?: string | null;
  email: string;
  phone?: string | null;
  orders: { status: OrderStatus; createdAt: Date }[];
};

type RawRecords = {
  orders: RawOrder[];
  carpenters: RawCarpenter[];
  clients: RawClient[];
};

type PrismaOrderRecord = RawOrder;

type PrismaCarpenterRecord = Omit<RawCarpenter, 'skills'> & {
  skills?: string[] | null;
};

type PrismaClientRecord = RawClient;

function isClosedStatus(status: OrderStatus) {
  return status === OrderStatus.COMPLETED || status === OrderStatus.CANCELLED;
}

export type DashboardOrder = {
  id: number;
  reference: string;
  title: string;
  status: OrderStatus;
  priority: OrderPriority;
  budgetCents: number | null;
  dueDate: Date | null;
  carpenterName: string | null;
  clientName: string | null;
  workshopName: string | null;
  tasksTotal: number;
  tasksCompleted: number;
};

export type DashboardCarpenter = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  headline?: string | null;
  workshopName: string | null;
  skills: string[];
  activeOrders: number;
  completedThisMonth: number;
};

export type DashboardClient = {
  id: number;
  name: string;
  company?: string | null;
  email: string;
  phone?: string | null;
  openOrders: number;
  lastOrderAt: Date | null;
};

export type OrdersByStatus = Record<OrderStatus, DashboardOrder[]>;

export type DashboardConnectionState = {
  status: 'connected' | 'schema-missing' | 'error';
  label: string;
  details?: string;
  source: 'database' | 'sample';
  errorCode?: string;
};

export type DashboardData = {
  viewer: AuthenticatedUser;
  connection: DashboardConnectionState;
  counts: {
    orders: number;
    activeOrders: number;
    urgentOrders: number;
    carpenters: number;
    clients: number;
  };
  ordersByStatus: OrdersByStatus;
  upcoming: DashboardOrder[];
  carpenters: DashboardCarpenter[];
  clients: DashboardClient[];
};

type DashboardSnapshot = Omit<DashboardData, 'viewer'>;

export async function getDashboardData(): Promise<DashboardData> {
  const viewer = await requireCurrentUser();

  try {
    const data = await fetchRecordsFromDatabase();
    const snapshot = buildDashboard(data, {
      status: 'connected',
      label: 'Połączono z bazą danych',
      details: 'Dane pobrano bezpośrednio z Twojej bazy danych przez Prisma.',
      source: 'database',
    });
    return { viewer, ...snapshot };
  } catch (error) {
    if (isUnauthorizedError(error)) {
      throw error;
    }

    if (isMissingTableError(error)) {
      const sample = createSampleDataset();
      const snapshot = buildDashboard(sample, {
        status: 'schema-missing',
        label: 'Połączono, ale w bazie brak tabel Prisma',
        details:
          'Uruchom `npx prisma migrate deploy`, aby utworzyć schemat. Poniżej widać dane przykładowe do projektowania interfejsu.',
        source: 'sample',
        errorCode: error.code,
      });
      return { viewer, ...snapshot };
    }

    if (isPrismaConnectionError(error)) {
      const sample = createSampleDataset();
      const snapshot = buildDashboard(sample, {
        status: 'error',
        label: 'Nie udało się połączyć z bazą danych',
        details:
          'Sprawdź zmienną środowiskową DATABASE_URL i konfigurację sieci. Wyświetlane są dane przykładowe.',
        source: 'sample',
        errorCode: 'connection',
      });
      return { viewer, ...snapshot };
    }

    console.error('Failed to load dashboard data', error);
    const sample = createSampleDataset();
    const snapshot = buildDashboard(sample, {
      status: 'error',
      label: 'Wystąpił nieoczekiwany błąd Prisma',
      details: extractPrismaErrorMessage(error),
      source: 'sample',
      errorCode: 'unknown',
    });
    return { viewer, ...snapshot };
  }
}

async function fetchRecordsFromDatabase(): Promise<RawRecords> {
  const [orders, carpenters, clients] = (await Promise.all([
    prisma.order.findMany({
      include: {
        carpenter: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
        workshop: { select: { id: true, name: true } },
        tasks: { select: { id: true, title: true, status: true, dueDate: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.carpenter.findMany({
      include: {
        workshop: { select: { id: true, name: true } },
        orders: {
          select: { status: true, createdAt: true, deliveredAt: true },
          take: 50,
        },
      },
    }),
    prisma.client.findMany({
      include: {
        orders: { select: { status: true, createdAt: true }, take: 50 },
      },
    }),
  ])) as [PrismaOrderRecord[], PrismaCarpenterRecord[], PrismaClientRecord[]];

  return {
    orders: orders.map((order) => ({
      id: order.id,
      reference: order.reference,
      title: order.title,
      description: order.description,
      status: order.status,
      priority: order.priority,
      budgetCents: order.budgetCents ?? null,
      startDate: order.startDate,
      dueDate: order.dueDate,
      deliveredAt: order.deliveredAt,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      carpenter: order.carpenter ? { id: order.carpenter.id, name: order.carpenter.name } : null,
      client: order.client ? { id: order.client.id, name: order.client.name } : null,
      workshop: order.workshop ? { id: order.workshop.id, name: order.workshop.name } : null,
      tasks: order.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        dueDate: task.dueDate,
      })),
    })),
    carpenters: carpenters.map((carpenter) => ({
      id: carpenter.id,
      name: carpenter.name,
      email: carpenter.email,
      phone: carpenter.phone,
      headline: carpenter.headline,
      skills: carpenter.skills ?? [],
      workshop: carpenter.workshop
        ? { id: carpenter.workshop.id, name: carpenter.workshop.name }
        : null,
      orders: carpenter.orders.map((order) => ({
        status: order.status,
        createdAt: order.createdAt,
        deliveredAt: order.deliveredAt,
      })),
    })),
    clients: clients.map((client) => ({
      id: client.id,
      name: client.name,
      company: client.company,
      email: client.email,
      phone: client.phone,
      orders: client.orders.map((order) => ({
        status: order.status,
        createdAt: order.createdAt,
      })),
    })),
  };
}

function createSampleDataset(): RawRecords {
  const sample = createSampleRecords();

  const orders: RawOrder[] = sample.orders.map((order) => ({
    id: order.id,
    reference: order.reference,
    title: order.title,
    description: order.description,
    status: order.status,
    priority: order.priority,
    budgetCents: order.budgetCents ?? null,
    startDate: order.startDate ?? null,
    dueDate: order.dueDate ?? null,
    deliveredAt: order.deliveredAt ?? null,
    createdAt: order.createdAt ?? new Date(),
    updatedAt: order.updatedAt ?? new Date(),
    carpenter: order.carpenterId
      ? {
          id: order.carpenterId,
          name:
            sample.carpenters.find((c) => c.id === order.carpenterId)?.name ??
            'Nieznany stolarz',
        }
      : null,
    client: order.clientId
      ? {
          id: order.clientId,
          name:
            sample.clients.find((c) => c.id === order.clientId)?.name ??
            'Nieznany klient',
        }
      : null,
    workshop: order.workshopId
      ? {
          id: order.workshopId,
          name:
            sample.workshops.find((w) => w.id === order.workshopId)?.name ??
            'Warsztat',
        }
      : null,
    tasks: order.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      dueDate: (task as { dueDate?: Date | null }).dueDate ?? null,
    })),
  }));

  const carpenters: RawCarpenter[] = sample.carpenters.map((carpenter) => ({
    id: carpenter.id,
    name: carpenter.name,
    email: carpenter.email,
    phone: carpenter.phone,
    headline: carpenter.headline,
    skills: carpenter.skills,
    workshop: carpenter.workshopId
      ? {
          id: carpenter.workshopId,
          name:
            sample.workshops.find((w) => w.id === carpenter.workshopId)?.name ??
            'Warsztat',
        }
      : null,
    orders: orders
      .filter((order) => order.carpenter?.id === carpenter.id)
      .map((order) => ({
        status: order.status,
        createdAt: order.createdAt,
        deliveredAt: order.deliveredAt,
      })),
  }));

  const clients: RawClient[] = sample.clients.map((client) => ({
    id: client.id,
    name: client.name,
    company: client.company,
    email: client.email,
    phone: client.phone,
    orders: orders
      .filter((order) => order.client?.id === client.id)
      .map((order) => ({
        status: order.status,
        createdAt: order.createdAt,
      })),
  }));

  return { orders, carpenters, clients };
}

function buildDashboard(
  records: RawRecords,
  connection: DashboardConnectionState,
): DashboardSnapshot {
  const ordersByStatus = initialiseStatusBuckets();
  const upcoming: DashboardOrder[] = [];

  for (const order of records.orders) {
    const dashboardOrder = toDashboardOrder(order);
    ordersByStatus[order.status].push(dashboardOrder);
    if (order.dueDate && !isClosedStatus(order.status)) {
      upcoming.push(dashboardOrder);
    }
  }

  for (const status of Object.values(OrderStatus)) {
    ordersByStatus[status].sort(compareOrdersByDueDate);
  }

  upcoming.sort(compareOrdersByDueDate);

  const counts = {
    orders: records.orders.length,
    activeOrders: records.orders.filter((order) => !isClosedStatus(order.status)).length,
    urgentOrders: records.orders.filter(
      (order) =>
        order.priority === OrderPriority.URGENT && !isClosedStatus(order.status),
    ).length,
    carpenters: records.carpenters.length,
    clients: records.clients.length,
  };

  const carpenters = records.carpenters
    .map<DashboardCarpenter>((carpenter) => {
      const activeOrders = records.orders.filter(
        (order) =>
          order.carpenter?.id === carpenter.id &&
          !isClosedStatus(order.status),
      );
      const completedThisMonth = carpenter.orders.filter((order) => {
        if (order.status !== OrderStatus.COMPLETED) return false;
        const delivered = order.deliveredAt ?? order.createdAt;
        return isWithinLastDays(delivered, 30);
      }).length;

      return {
        id: carpenter.id,
        name: carpenter.name,
        email: carpenter.email,
        phone: carpenter.phone,
        headline: carpenter.headline ?? undefined,
        workshopName: carpenter.workshop?.name ?? null,
        skills: carpenter.skills,
        activeOrders: activeOrders.length,
        completedThisMonth,
      };
    })
    .sort((a, b) => b.activeOrders - a.activeOrders || b.completedThisMonth - a.completedThisMonth);

  const clients = records.clients
    .map<DashboardClient>((client) => {
      const relatedOrders = records.orders.filter(
        (order) => order.client?.id === client.id,
      );
      const openOrders = relatedOrders.filter((order) => !isClosedStatus(order.status));
      const lastOrderAt = relatedOrders
        .map((order) => order.createdAt)
        .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

      return {
        id: client.id,
        name: client.name,
        company: client.company ?? undefined,
        email: client.email,
        phone: client.phone ?? undefined,
        openOrders: openOrders.length,
        lastOrderAt,
      };
    })
    .sort((a, b) => b.openOrders - a.openOrders || compareDatesDesc(a.lastOrderAt, b.lastOrderAt));

  return {
    connection,
    counts,
    ordersByStatus,
    upcoming: upcoming.slice(0, 6),
    carpenters,
    clients: clients.slice(0, 8),
  };
}

function initialiseStatusBuckets(): OrdersByStatus {
  return Object.values(OrderStatus).reduce((acc, status) => {
    acc[status] = [];
    return acc;
  }, {} as OrdersByStatus);
}

function toDashboardOrder(order: RawOrder): DashboardOrder {
  const tasksTotal = order.tasks.length;
  const tasksCompleted = order.tasks.filter(
    (task) => task.status === TaskStatus.COMPLETED,
  ).length;

  return {
    id: order.id,
    reference: order.reference,
    title: order.title,
    status: order.status,
    priority: order.priority,
    budgetCents: order.budgetCents,
    dueDate: order.dueDate,
    carpenterName: order.carpenter?.name ?? null,
    clientName: order.client?.name ?? null,
    workshopName: order.workshop?.name ?? null,
    tasksTotal,
    tasksCompleted,
  };
}

function compareOrdersByDueDate(a: DashboardOrder, b: DashboardOrder) {
  const dueA = a.dueDate?.getTime() ?? Number.POSITIVE_INFINITY;
  const dueB = b.dueDate?.getTime() ?? Number.POSITIVE_INFINITY;

  if (dueA === dueB) {
    return a.title.localeCompare(b.title);
  }

  return dueA - dueB;
}

function compareDatesDesc(a: Date | null, b: Date | null) {
  const timeA = a?.getTime() ?? 0;
  const timeB = b?.getTime() ?? 0;
  return timeB - timeA;
}

function isWithinLastDays(date: Date, days: number) {
  const now = new Date();
  const threshold = new Date(now);
  threshold.setDate(now.getDate() - days);
  return date >= threshold;
}
