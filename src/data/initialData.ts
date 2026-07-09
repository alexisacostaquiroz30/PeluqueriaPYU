/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Category, Service, FixedExpense, VariableExpense, ServiceTicket, AppSettings } from '../types';

export const INITIAL_USERS: User[] = [
  { id: 'u-admin', username: 'admin', name: 'Eduardo Castro (Admin)', role: 'admin', password: 'admin123' },
  { id: 'u-sofia', username: 'sofia', name: 'Sofía Alarcón', role: 'worker', password: '123456' },
  { id: 'u-carlos', username: 'carlos', name: 'Carlos Gómez', role: 'worker', password: '123456' },
  { id: 'u-maria', username: 'maria', name: 'María Fernández', role: 'worker', password: '123456' },
  { id: 'u-lucia', username: 'lucia', name: 'Lucía Ruiz', role: 'worker', password: '123456' },
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Corte y Peinado' },
  { id: 'cat-2', name: 'Tinte y Color' },
  { id: 'cat-3', name: 'Tratamientos Capilares' },
  { id: 'cat-4', name: 'Manicura y Uñas' },
];

export const INITIAL_SERVICES: Service[] = [
  // Corte y Peinado
  { id: 'srv-1', categoryId: 'cat-1', name: 'Corte de Caballero + Lavado', price: 18 },
  { id: 'srv-2', categoryId: 'cat-1', name: 'Corte de Dama + Secado', price: 32 },
  { id: 'srv-3', categoryId: 'cat-1', name: 'Arreglo de Barba con Navaja', price: 12 },
  { id: 'srv-4', categoryId: 'cat-1', name: 'Peinado de Gala / Ondas', price: 40 },
  
  // Tinte y Color
  { id: 'srv-5', categoryId: 'cat-2', name: 'Tinte de Raíz', price: 35 },
  { id: 'srv-6', categoryId: 'cat-2', name: 'Mechas Balayage Completas', price: 95 },
  { id: 'srv-7', categoryId: 'cat-2', name: 'Matizador de Color', price: 25 },
  
  // Tratamientos
  { id: 'srv-8', categoryId: 'cat-3', name: 'Tratamiento de Queratina Profesional', price: 120 },
  { id: 'srv-9', categoryId: 'cat-3', name: 'Hidratación con Ácido Hialurónico', price: 45 },
  
  // Manicura y Uñas
  { id: 'srv-10', categoryId: 'cat-4', name: 'Manicura Semipermanente', price: 25 },
  { id: 'srv-11', categoryId: 'cat-4', name: 'Pedicura Completa Estética', price: 35 },
  { id: 'srv-12', categoryId: 'cat-4', name: 'Uñas de Gel Nuevas', price: 55 },
];

export const INITIAL_FIXED_EXPENSES: FixedExpense[] = [
  { id: 'fe-1', concept: 'Alquiler del Local', amount: 1100 },
  { id: 'fe-2', concept: 'Seguros y Autónomos Administrativos', amount: 320 },
  { id: 'fe-3', concept: 'Suministros Básicos (Agua, Electricidad, Gas)', amount: 260 },
  { id: 'fe-4', concept: 'Internet, Teléfono y Software de Citas', amount: 60 },
];

// Simulamos gastos variables para Junio y Julio de 2026 (mes actual del sistema)
export const INITIAL_VARIABLE_EXPENSES: VariableExpense[] = [
  // Junio 2026
  { id: 've-1', concept: 'Lote de Champús y Mascarillas L\'Oréal', amount: 155, date: '2026-06-03' },
  { id: 've-2', concept: 'Café de cortesía, leche y tés para clientes', amount: 42, date: '2026-06-10' },
  { id: 've-3', concept: 'Cuchillas desechables y toallas de papel', amount: 35, date: '2026-06-18' },
  
  // Julio 2026
  { id: 've-4', concept: 'Repuestos de Tintes de Coloración Premium', amount: 210, date: '2026-07-02' },
  { id: 've-5', concept: 'Reparación de grifo de lavacabezas', amount: 80, date: '2026-07-04' },
  { id: 've-6', concept: 'Suministros de manicura (Limas, limas de gel y esmaltes)', amount: 65, date: '2026-07-05' },
  { id: 've-7', concept: 'Agua mineral y cápsulas Nespresso', amount: 38, date: '2026-07-08' },
];

export const INITIAL_SETTINGS: AppSettings = {
  globalCommissionRate: 50, // 50% por defecto para el trabajador
  monthlyVariableBudget: 500, // Presupuesto mensual para gastos variables
};

// Generar historial de tickets de servicio de forma realista para Junio y Julio 2026
export const INITIAL_TICKETS: ServiceTicket[] = [
  // --- JUNIO 2026 ---
  // Sofía
  { id: 'tk-1', workerId: 'u-sofia', categoryId: 'cat-1', serviceId: 'srv-2', serviceName: 'Corte de Dama + Secado', price: 32, commissionRate: 50, date: '2026-06-02' },
  { id: 'tk-2', workerId: 'u-sofia', categoryId: 'cat-2', serviceId: 'srv-6', serviceName: 'Mechas Balayage Completas', price: 95, commissionRate: 50, date: '2026-06-04' },
  { id: 'tk-3', workerId: 'u-sofia', categoryId: 'cat-1', serviceId: 'srv-4', serviceName: 'Peinado de Gala / Ondas', price: 40, commissionRate: 50, date: '2026-06-10' },
  { id: 'tk-4', workerId: 'u-sofia', categoryId: 'cat-2', serviceId: 'srv-5', serviceName: 'Tinte de Raíz', price: 35, commissionRate: 50, date: '2026-06-15' },
  { id: 'tk-5', workerId: 'u-sofia', categoryId: 'cat-3', serviceId: 'srv-8', serviceName: 'Tratamiento de Queratina Profesional', price: 120, commissionRate: 50, date: '2026-06-20' },
  
  // Carlos
  { id: 'tk-6', workerId: 'u-carlos', categoryId: 'cat-1', serviceId: 'srv-1', serviceName: 'Corte de Caballero + Lavado', price: 18, commissionRate: 50, date: '2026-06-02' },
  { id: 'tk-7', workerId: 'u-carlos', categoryId: 'cat-1', serviceId: 'srv-3', serviceName: 'Arreglo de Barba con Navaja', price: 12, commissionRate: 50, date: '2026-06-02' },
  { id: 'tk-8', workerId: 'u-carlos', categoryId: 'cat-1', serviceId: 'srv-1', serviceName: 'Corte de Caballero + Lavado', price: 18, commissionRate: 50, date: '2026-06-03' },
  { id: 'tk-9', workerId: 'u-carlos', categoryId: 'cat-1', serviceId: 'srv-1', serviceName: 'Corte de Caballero + Lavado', price: 18, commissionRate: 50, date: '2026-06-06' },
  { id: 'tk-10', workerId: 'u-carlos', categoryId: 'cat-1', serviceId: 'srv-2', serviceName: 'Corte de Dama + Secado', price: 32, commissionRate: 50, date: '2026-06-12' },
  { id: 'tk-11', workerId: 'u-carlos', categoryId: 'cat-2', serviceId: 'srv-6', serviceName: 'Mechas Balayage Completas', price: 95, commissionRate: 50, date: '2026-06-18' },
  { id: 'tk-12', workerId: 'u-carlos', categoryId: 'cat-1', serviceId: 'srv-1', serviceName: 'Corte de Caballero + Lavado', price: 18, commissionRate: 50, date: '2026-06-25' },
  
  // María
  { id: 'tk-13', workerId: 'u-maria', categoryId: 'cat-4', serviceId: 'srv-10', serviceName: 'Manicura Semipermanente', price: 25, commissionRate: 50, date: '2026-06-03' },
  { id: 'tk-14', workerId: 'u-maria', categoryId: 'cat-4', serviceId: 'srv-12', serviceName: 'Uñas de Gel Nuevas', price: 55, commissionRate: 50, date: '2026-06-04' },
  { id: 'tk-15', workerId: 'u-maria', categoryId: 'cat-4', serviceId: 'srv-11', serviceName: 'Pedicura Completa Estética', price: 35, commissionRate: 50, date: '2026-06-08' },
  { id: 'tk-16', workerId: 'u-maria', categoryId: 'cat-4', serviceId: 'srv-10', serviceName: 'Manicura Semipermanente', price: 25, commissionRate: 50, date: '2026-06-15' },
  { id: 'tk-17', workerId: 'u-maria', categoryId: 'cat-4', serviceId: 'srv-12', serviceName: 'Uñas de Gel Nuevas', price: 55, commissionRate: 50, date: '2026-06-22' },
  
  // Lucía
  { id: 'tk-18', workerId: 'u-lucia', categoryId: 'cat-3', serviceId: 'srv-9', serviceName: 'Hidratación con Ácido Hialurónico', price: 45, commissionRate: 50, date: '2026-06-05' },
  { id: 'tk-19', workerId: 'u-lucia', categoryId: 'cat-2', serviceId: 'srv-5', serviceName: 'Tinte de Raíz', price: 35, commissionRate: 50, date: '2026-06-09' },
  { id: 'tk-20', workerId: 'u-lucia', categoryId: 'cat-1', serviceId: 'srv-2', serviceName: 'Corte de Dama + Secado', price: 32, commissionRate: 50, date: '2026-06-14' },
  { id: 'tk-21', workerId: 'u-lucia', categoryId: 'cat-3', serviceId: 'srv-8', serviceName: 'Tratamiento de Queratina Profesional', price: 120, commissionRate: 50, date: '2026-06-19' },

  // --- JULIO 2026 (Mes corriente) ---
  // Sofia
  { id: 'tk-22', workerId: 'u-sofia', categoryId: 'cat-1', serviceId: 'srv-2', serviceName: 'Corte de Dama + Secado', price: 32, commissionRate: 50, date: '2026-07-01' },
  { id: 'tk-23', workerId: 'u-sofia', categoryId: 'cat-2', serviceId: 'srv-6', serviceName: 'Mechas Balayage Completas', price: 95, commissionRate: 50, date: '2026-07-02' },
  { id: 'tk-24', workerId: 'u-sofia', categoryId: 'cat-3', serviceId: 'srv-9', serviceName: 'Hidratación con Ácido Hialurónico', price: 45, commissionRate: 50, date: '2026-07-05' },
  { id: 'tk-25', workerId: 'u-sofia', categoryId: 'cat-1', serviceId: 'srv-4', serviceName: 'Peinado de Gala / Ondas', price: 40, commissionRate: 50, date: '2026-07-08' },
  
  // Carlos
  { id: 'tk-26', workerId: 'u-carlos', categoryId: 'cat-1', serviceId: 'srv-1', serviceName: 'Corte de Caballero + Lavado', price: 18, commissionRate: 50, date: '2026-07-01' },
  { id: 'tk-27', workerId: 'u-carlos', categoryId: 'cat-1', serviceId: 'srv-3', serviceName: 'Arreglo de Barba con Navaja', price: 12, commissionRate: 50, date: '2026-07-02' },
  { id: 'tk-28', workerId: 'u-carlos', categoryId: 'cat-1', serviceId: 'srv-1', serviceName: 'Corte de Caballero + Lavado', price: 18, commissionRate: 50, date: '2026-07-04' },
  { id: 'tk-29', workerId: 'u-carlos', categoryId: 'cat-1', serviceId: 'srv-2', serviceName: 'Corte de Dama + Secado', price: 32, commissionRate: 50, date: '2026-07-06' },
  { id: 'tk-30', workerId: 'u-carlos', categoryId: 'cat-2', serviceId: 'srv-5', serviceName: 'Tinte de Raíz', price: 35, commissionRate: 50, date: '2026-07-07' },
  
  // María
  { id: 'tk-31', workerId: 'u-maria', categoryId: 'cat-4', serviceId: 'srv-10', serviceName: 'Manicura Semipermanente', price: 25, commissionRate: 50, date: '2026-07-01' },
  { id: 'tk-32', workerId: 'u-maria', categoryId: 'cat-4', serviceId: 'srv-12', serviceName: 'Uñas de Gel Nuevas', price: 55, commissionRate: 50, date: '2026-07-03' },
  { id: 'tk-33', workerId: 'u-maria', categoryId: 'cat-4', serviceId: 'srv-11', serviceName: 'Pedicura Completa Estética', price: 35, commissionRate: 50, date: '2026-07-06' },
  { id: 'tk-34', workerId: 'u-maria', categoryId: 'cat-4', serviceId: 'srv-10', serviceName: 'Manicura Semipermanente', price: 25, commissionRate: 50, date: '2026-07-08' },
  
  // Lucía
  { id: 'tk-35', workerId: 'u-lucia', categoryId: 'cat-1', serviceId: 'srv-2', serviceName: 'Corte de Dama + Secado', price: 32, commissionRate: 50, date: '2026-07-02' },
  { id: 'tk-36', workerId: 'u-lucia', categoryId: 'cat-3', serviceId: 'srv-8', serviceName: 'Tratamiento de Queratina Profesional', price: 120, commissionRate: 50, date: '2026-07-04' },
  { id: 'tk-37', workerId: 'u-lucia', categoryId: 'cat-2', serviceId: 'srv-7', serviceName: 'Matizador de Color', price: 25, commissionRate: 50, date: '2026-07-07' },
];
