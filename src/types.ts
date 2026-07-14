/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'worker';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  password?: string; // Sencillo login local
  email?: string;    // Autenticación con Firebase
}

export interface Category {
  id: string;
  name: string;
}

export interface Service {
  id: string;
  categoryId: string;
  name: string;
  price: number;
}

export interface ServiceTicket {
  id: string;
  workerId: string;
  categoryId: string; // Guardado para fácil visualización
  serviceId: string;
  serviceName: string; // Respaldado por si el servicio se borra/edita en el futuro
  price: number; // Precio real cobrado en ese momento
  commissionRate: number; // Porcentaje del trabajador en ese momento (ej: 50)
  date: string; // formato YYYY-MM-DD
  note?: string;
  deleteRequested?: boolean; // Solicitar eliminación
  deleteRequestReason?: string; // Razón de eliminación
}

export interface FixedExpense {
  id: string;
  concept: string;
  amount: number;
}

export interface VariableExpense {
  id: string;
  concept: string;
  amount: number;
  date: string; // formato YYYY-MM-DD
}

export interface AppSettings {
  globalCommissionRate: number; // Porcentaje del trabajador. Por defecto: 50.
  monthlyVariableBudget?: number; // Presupuesto mensual para gastos variables. Por defecto: 500.
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string; // formato ISO 8601
}

export interface PayrollPayment {
  id: string;
  workerId: string;
  workerName: string;
  year: number;
  month: number; // 0 a 11
  period: 'first-half' | 'second-half'; // 'first-half' (1-15), 'second-half' (16-fin de mes)
  amountPaid: number;
  datePaid: string; // YYYY-MM-DD
  status: 'paid';
  note?: string;
}

