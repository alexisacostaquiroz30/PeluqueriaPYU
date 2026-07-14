/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Category, Service, FixedExpense, VariableExpense, ServiceTicket, AppSettings } from '../types';

export const INITIAL_USERS: User[] = [
  { id: 'u-admin', username: 'admin', name: 'Administrador (jaaq7919@gmail.com)', role: 'admin', password: 'admin123', email: 'jaaq7919@gmail.com' },
  { id: 'u-danielan', username: 'daniela_n', name: 'Daniela Nieto', role: 'worker', password: '123456' },
  { id: 'u-danielac', username: 'daniela_c', name: 'Daniela Cuero', role: 'worker', password: '123456' },
  { id: 'u-rafael', username: 'rafael', name: 'Rafael', role: 'worker', password: '123456' },
  { id: 'u-naidy', username: 'naidy', name: 'Naidy', role: 'worker', password: '123456' },
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
  // Daniela Nieto
  //{ id: 'tk-1', workerId: 'u-danielan', categoryId: 'cat-1', serviceId: 'srv-2', serviceName: 'Corte de Dama + Secado', price: 32, commissionRate: 50, date: '2026-06-02' },
  
  // Daniela Cuero
  //{ id: 'tk-6', workerId: 'u-danielac', categoryId: 'cat-1', serviceId: 'srv-1', serviceName: 'Corte de Caballero + Lavado', price: 18, commissionRate: 50, date: '2026-06-02' },
  
  // Rafael
  //{ id: 'tk-13', workerId: 'u-rafael', categoryId: 'cat-4', serviceId: 'srv-10', serviceName: 'Manicura Semipermanente', price: 25, commissionRate: 50, date: '2026-06-03' },
  
  // Naidy
  //{ id: 'tk-18', workerId: 'u-naidy', categoryId: 'cat-3', serviceId: 'srv-9', serviceName: 'Hidratación con Ácido Hialurónico', price: 45, commissionRate: 50, date: '2026-06-05' },
  
  // --- JULIO 2026 (Mes corriente) ---
  // Daniela Nieto
  //{ id: 'tk-22', workerId: 'u-danielan', categoryId: 'cat-1', serviceId: 'srv-2', serviceName: 'Corte de Dama + Secado', price: 32, commissionRate: 50, date: '2026-07-01' },
  
  // Daniela Cuero
  //{ id: 'tk-26', workerId: 'u-danielac', categoryId: 'cat-1', serviceId: 'srv-1', serviceName: 'Corte de Caballero + Lavado', price: 18, commissionRate: 50, date: '2026-07-01' },
  
  // Rafael
  //{ id: 'tk-31', workerId: 'u-rafael', categoryId: 'cat-4', serviceId: 'srv-10', serviceName: 'Manicura Semipermanente', price: 25, commissionRate: 50, date: '2026-07-01' },
  
  // Naidy
  //{ id: 'tk-35', workerId: 'u-naidy', categoryId: 'cat-1', serviceId: 'srv-2', serviceName: 'Corte de Dama + Secado', price: 32, commissionRate: 50, date: '2026-07-02' },
 ];
