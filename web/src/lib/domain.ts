export const OrderStatus = Object.freeze({
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  READY_FOR_DELIVERY: 'READY_FOR_DELIVERY',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const);

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];
export const ORDER_STATUSES = Object.values(OrderStatus) as OrderStatus[];

export const OrderPriority = Object.freeze({
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const);

export type OrderPriority = (typeof OrderPriority)[keyof typeof OrderPriority];
export const ORDER_PRIORITIES = Object.values(OrderPriority) as OrderPriority[];

export const TaskStatus = Object.freeze({
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  BLOCKED: 'BLOCKED',
} as const);

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];
export const TASK_STATUSES = Object.values(TaskStatus) as TaskStatus[];

export const UserRole = Object.freeze({
  ADMIN: 'admin',
  CARPENTER: 'carpenter',
  CLIENT: 'client',
} as const);

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ClientSubscriptionPlan = Object.freeze({
  FREE: 'client_free',
  PREMIUM: 'client_premium',
} as const);

export type ClientSubscriptionPlan =
  (typeof ClientSubscriptionPlan)[keyof typeof ClientSubscriptionPlan];

export const CarpenterSubscriptionPlan = Object.freeze({
  PROFESSIONAL: 'carpenter_professional',
} as const);

export type CarpenterSubscriptionPlan =
  (typeof CarpenterSubscriptionPlan)[keyof typeof CarpenterSubscriptionPlan];
