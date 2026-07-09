/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Category, Service, ServiceTicket, FixedExpense, VariableExpense, AppSettings, AuditLog } from '../types';
import { 
  LogOut, Plus, Calendar, Scissors, Sparkles, DollarSign, 
  TrendingUp, Layers, CheckCircle2, Trash2, Tag, FileText, 
  Settings, Users, ShoppingBag, Receipt, BarChart3, AlertCircle, AlertTriangle, Edit2, Check, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, BarChart, Bar
} from 'recharts';

interface AdminDashboardProps {
  admin: User;
  users: User[];
  categories: Category[];
  services: Service[];
  tickets: ServiceTicket[];
  fixedExpenses: FixedExpense[];
  variableExpenses: VariableExpense[];
  settings: AppSettings;
  auditLogs: AuditLog[];
  selectedMonth: number;
  selectedYear: number;
  
  // Handlers para Tickets
  onDeleteTicket: (ticketId: string) => void;
  onRejectDeleteTicket: (ticketId: string) => void;
  
  // Handlers para Categorías
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onUpdateCategory: (id: string, updated: Partial<Category>) => void;
  onDeleteCategory: (id: string) => void;

  // Handlers para Servicios
  onAddService: (service: Omit<Service, 'id'>) => void;
  onUpdateService: (id: string, updated: Partial<Service>) => void;
  onDeleteService: (id: string) => void;

  // Handlers para Gastos Fijos
  onAddFixedExpense: (expense: Omit<FixedExpense, 'id'>) => void;
  onUpdateFixedExpense: (id: string, updated: Partial<FixedExpense>) => void;
  onDeleteFixedExpense: (id: string) => void;

  // Handlers para Gastos Variables
  onAddVariableExpense: (expense: Omit<VariableExpense, 'id'>) => void;
  onUpdateVariableExpense: (id: string, updated: Partial<VariableExpense>) => void;
  onDeleteVariableExpense: (id: string) => void;

  // Handlers para Trabajadores
  onAddWorker: (worker: Omit<User, 'id' | 'role'>) => void;
  onUpdateWorker: (id: string, updated: Partial<User>) => void;
  onDeleteWorker: (id: string) => void;

  // Handler para Ajustes
  onUpdateSettings: (settings: AppSettings) => void;

  // Handlers de Calendario y Sesión
  onLogout: () => void;
  onChangeMonth: (month: number) => void;
  onChangeYear: (year: number) => void;
}

type ActiveTab = 'summary' | 'expenses' | 'services' | 'staff' | 'settings';

export default function AdminDashboard({
  admin,
  users,
  categories,
  services,
  tickets,
  fixedExpenses,
  variableExpenses,
  settings,
  auditLogs,
  selectedMonth,
  selectedYear,
  onDeleteTicket,
  onRejectDeleteTicket,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAddService,
  onUpdateService,
  onDeleteService,
  onAddFixedExpense,
  onUpdateFixedExpense,
  onDeleteFixedExpense,
  onAddVariableExpense,
  onUpdateVariableExpense,
  onDeleteVariableExpense,
  onAddWorker,
  onUpdateWorker,
  onDeleteWorker,
  onUpdateSettings,
  onLogout,
  onChangeMonth,
  onChangeYear,
}: AdminDashboardProps) {
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('summary');
  const [expandedWorkerId, setExpandedWorkerId] = useState<string | null>(null);

  // Solicitudes de eliminación pendientes (Globales de todos los tiempos para que no se pierdan)
  const pendingDeletions = tickets.filter(t => t.deleteRequested);

  // Meses en español
  const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const YEARS = [2025, 2026, 2027];

  // --- FILTROS DE TIEMPO Y AUXILIARES ---
  const [filterMode, setFilterMode] = useState<'month' | 'range'>('month');
  const [customStartDate, setCustomStartDate] = useState(() => {
    const mm = String(selectedMonth + 1).padStart(2, '0');
    return `${selectedYear}-${mm}-01`;
  });
  const [customEndDate, setCustomEndDate] = useState(() => {
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const mm = String(selectedMonth + 1).padStart(2, '0');
    const dd = String(lastDay).padStart(2, '0');
    return `${selectedYear}-${mm}-${dd}`;
  });

  // Sincronizar rango de fechas cuando cambie el mes/año seleccionado mensualmente
  useEffect(() => {
    const mm = String(selectedMonth + 1).padStart(2, '0');
    setCustomStartDate(`${selectedYear}-${mm}-01`);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const dd = String(lastDay).padStart(2, '0');
    setCustomEndDate(`${selectedYear}-${mm}-${dd}`);
  }, [selectedMonth, selectedYear]);

  const filterTickets = (tList: ServiceTicket[]) => {
    if (filterMode === 'month') {
      return tList.filter(t => {
        const parts = t.date.split('-');
        const tYear = parseInt(parts[0], 10);
        const tMonth = parseInt(parts[1], 10) - 1;
        return tYear === selectedYear && tMonth === selectedMonth;
      });
    } else {
      return tList.filter(t => t.date >= customStartDate && t.date <= customEndDate);
    }
  };

  const filterVariableExpenses = (eList: VariableExpense[]) => {
    if (filterMode === 'month') {
      return eList.filter(e => {
        const parts = e.date.split('-');
        const eYear = parseInt(parts[0], 10);
        const eMonth = parseInt(parts[1], 10) - 1;
        return eYear === selectedYear && eMonth === selectedMonth;
      });
    } else {
      return eList.filter(e => e.date >= customStartDate && e.date <= customEndDate);
    }
  };

  const monthlyTickets = filterTickets(tickets);
  const monthlyVariableExpenses = filterVariableExpenses(variableExpenses);

  // --- CALCULOS KPIS ---
  // 1. Ingresos Brutos Totales (100% de lo cobrado)
  const totalGrossRevenue = monthlyTickets.reduce((sum, t) => sum + t.price, 0);

  // 2. Ingresos Brutos del Negocio (Monto retenido según comisiones individuales al momento del servicio)
  const businessGrossRevenue = monthlyTickets.reduce((sum, t) => {
    const businessRate = 100 - t.commissionRate;
    return sum + (t.price * (businessRate / 100));
  }, 0);

  // 3. Total a Pagar a Empleados (Monto destinado a trabajadores)
  const totalEmployeesPayout = monthlyTickets.reduce((sum, t) => {
    return sum + (t.price * (t.commissionRate / 100));
  }, 0);

  // 4. Gastos Fijos (Aplican mes a mes / prorrateados al periodo si es rango, pero por simplicidad se mantienen estables)
  const totalFixedExpensesAmount = fixedExpenses.reduce((sum, e) => sum + e.amount, 0);

  // 5. Gastos Variables (Del mes corriente o periodo seleccionado)
  const totalVariableExpensesAmount = monthlyVariableExpenses.reduce((sum, e) => sum + e.amount, 0);

  // 5b. Presupuesto Mensual para Gastos Variables
  const currentBudget = settings.monthlyVariableBudget ?? 500;
  const budgetPercentage = currentBudget > 0 ? (totalVariableExpensesAmount / currentBudget) * 100 : 0;

  // 6. Gastos Totales
  const totalExpenses = totalFixedExpensesAmount + totalVariableExpensesAmount;

  // 7. Ganancia Neta del Negocio (Ingreso Retenido - Gastos Totales)
  const netBusinessProfit = businessGrossRevenue - totalExpenses;

  // --- DESGLOSE INDIVIDUAL DE EMPLEADOS ---
  const workers = users.filter(u => u.role === 'worker');
  const workerSalariesBreakdown = workers.map(worker => {
    const wTickets = monthlyTickets.filter(t => t.workerId === worker.id);
    const gross = wTickets.reduce((sum, t) => sum + t.price, 0);
    const payout = wTickets.reduce((sum, t) => sum + (t.price * (t.commissionRate / 100)), 0);
    const businessShare = wTickets.reduce((sum, t) => sum + (t.price * ((100 - t.commissionRate) / 100)), 0);
    return {
      id: worker.id,
      name: worker.name,
      username: worker.username,
      servicesCount: wTickets.length,
      gross,
      payout,
      businessShare
    };
  });

  // --- COMPILACIÓN DE DATOS MENSUALES PARA EL GRÁFICO (RECHARTS) ---
  const monthlyDataForYear = MONTHS.map((monthName, index) => {
    // Tickets del mes de selectedYear
    const monthTickets = tickets.filter(t => {
      const parts = t.date.split('-');
      const tYear = parseInt(parts[0], 10);
      const tMonth = parseInt(parts[1], 10) - 1;
      return tYear === selectedYear && tMonth === index;
    });
    const grossRevenue = monthTickets.reduce((sum, t) => sum + t.price, 0);

    // Gastos variables del mes de selectedYear
    const monthVarExpenses = variableExpenses.filter(e => {
      const parts = e.date.split('-');
      const eYear = parseInt(parts[0], 10);
      const eMonth = parseInt(parts[1], 10) - 1;
      return eYear === selectedYear && eMonth === index;
    });
    const varExpensesAmount = monthVarExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Gastos fijos (se calculan a partir de la reducción actual)
    const fixedExpensesTotal = fixedExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Gastos totales = Fijos (aplica a todos los meses) + Variables del mes
    const totalExpensesAmount = fixedExpensesTotal + varExpensesAmount;

    return {
      name: monthName.substring(0, 3), // e.g. 'Ene', 'Feb'
      fullName: monthName,
      ingresos: parseFloat(grossRevenue.toFixed(2)),
      gastos: parseFloat(totalExpensesAmount.toFixed(2)),
      monthIndex: index,
    };
  }).filter(data => {
    if (filterMode === 'month') return true;

    // Si es rango, comprobar si el año/mes está comprendido en el rango de fechas
    const startParts = customStartDate.split('-');
    const endParts = customEndDate.split('-');
    if (startParts.length < 2 || endParts.length < 2) return true;

    const startYear = parseInt(startParts[0], 10);
    const startMonth = parseInt(startParts[1], 10) - 1;
    const endYear = parseInt(endParts[0], 10);
    const endMonth = parseInt(endParts[1], 10) - 1;

    const currentYearMonthVal = selectedYear * 12 + data.monthIndex;
    const startVal = startYear * 12 + startMonth;
    const endVal = endYear * 12 + endMonth;

    return currentYearMonthVal >= startVal && currentYearMonthVal <= endVal;
  });

  // --- ESTADOS INTERNOS CRUD CATEGORÍAS ---
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  // --- ESTADOS INTERNOS CRUD SERVICIOS ---
  const [newSrvCategoryId, setNewSrvCategoryId] = useState('');
  const [newSrvName, setNewSrvName] = useState('');
  const [newSrvPrice, setNewSrvPrice] = useState<number | ''>('');
  const [editingSrvId, setEditingSrvId] = useState<string | null>(null);
  const [editingSrvCategoryId, setEditingSrvCategoryId] = useState('');
  const [editingSrvName, setEditingSrvName] = useState('');
  const [editingSrvPrice, setEditingSrvPrice] = useState<number | ''>('');

  // --- ESTADOS INTERNOS CRUD GASTOS ---
  const [newFixedConcept, setNewFixedConcept] = useState('');
  const [newFixedAmount, setNewFixedAmount] = useState<number | ''>('');
  const [editingFixedId, setEditingFixedId] = useState<string | null>(null);
  const [editingFixedConcept, setEditingFixedConcept] = useState('');
  const [editingFixedAmount, setEditingFixedAmount] = useState<number | ''>('');

  const [newVarConcept, setNewVarConcept] = useState('');
  const [newVarAmount, setNewVarAmount] = useState<number | ''>('');
  const [newVarDate, setNewVarDate] = useState(() => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${today.getFullYear()}-${mm}-${dd}`;
  });
  const [editingVarId, setEditingVarId] = useState<string | null>(null);
  const [editingVarConcept, setEditingVarConcept] = useState('');
  const [editingVarAmount, setEditingVarAmount] = useState<number | ''>('');
  const [editingVarDate, setEditingVarDate] = useState('');

  // --- ESTADOS INTERNOS CRUD TRABAJADORES ---
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerUsername, setNewWorkerUsername] = useState('');
  const [newWorkerPassword, setNewWorkerPassword] = useState('');
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null);
  const [editingWorkerName, setEditingWorkerName] = useState('');
  const [editingWorkerUsername, setEditingWorkerUsername] = useState('');
  const [editingWorkerPassword, setEditingWorkerPassword] = useState('');

  // --- ESTADO INTERNO CONFIGURACIÓN ---
  const [commInput, setCommInput] = useState(settings.globalCommissionRate);
  const [budgetInput, setBudgetInput] = useState(settings.monthlyVariableBudget ?? 500);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Sincronizar inputs con configuración externa cuando cambie
  useEffect(() => {
    setCommInput(settings.globalCommissionRate);
    setBudgetInput(settings.monthlyVariableBudget ?? 500);
  }, [settings]);

  // --- SUBMITS CATEGORÍA ---
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    onAddCategory({ name: newCatName.trim() });
    setNewCatName('');
  };

  const handleSaveCategoryEdit = (id: string) => {
    if (!editingCatName.trim()) return;
    onUpdateCategory(id, { name: editingCatName.trim() });
    setEditingCatId(null);
  };

  // --- SUBMITS SERVICIO ---
  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSrvCategoryId || !newSrvName.trim() || newSrvPrice === '') return;
    onAddService({
      categoryId: newSrvCategoryId,
      name: newSrvName.trim(),
      price: Number(newSrvPrice)
    });
    setNewSrvName('');
    setNewSrvPrice('');
  };

  const handleSaveServiceEdit = (id: string) => {
    if (!editingSrvCategoryId || !editingSrvName.trim() || editingSrvPrice === '') return;
    onUpdateService(id, {
      categoryId: editingSrvCategoryId,
      name: editingSrvName.trim(),
      price: Number(editingSrvPrice)
    });
    setEditingSrvId(null);
  };

  // --- SUBMITS GASTOS FIJOS ---
  const handleCreateFixedExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFixedConcept.trim() || newFixedAmount === '') return;
    onAddFixedExpense({
      concept: newFixedConcept.trim(),
      amount: Number(newFixedAmount)
    });
    setNewFixedConcept('');
    setNewFixedAmount('');
  };

  const handleSaveFixedExpenseEdit = (id: string) => {
    if (!editingFixedConcept.trim() || editingFixedAmount === '') return;
    onUpdateFixedExpense(id, {
      concept: editingFixedConcept.trim(),
      amount: Number(editingFixedAmount)
    });
    setEditingFixedId(null);
  };

  // --- SUBMITS GASTOS VARIABLES ---
  const handleCreateVariableExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVarConcept.trim() || newVarAmount === '' || !newVarDate) return;
    onAddVariableExpense({
      concept: newVarConcept.trim(),
      amount: Number(newVarAmount),
      date: newVarDate
    });
    setNewVarConcept('');
    setNewVarAmount('');
  };

  const handleSaveVariableExpenseEdit = (id: string) => {
    if (!editingVarConcept.trim() || editingVarAmount === '' || !editingVarDate) return;
    onUpdateVariableExpense(id, {
      concept: editingVarConcept.trim(),
      amount: Number(editingVarAmount),
      date: editingVarDate
    });
    setEditingVarId(null);
  };

  // --- SUBMITS TRABAJADOR ---
  const handleCreateWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkerName.trim() || !newWorkerUsername.trim() || !newWorkerPassword) return;
    
    // Validar nombre de usuario duplicado
    if (users.some(u => u.username.toLowerCase() === newWorkerUsername.trim().toLowerCase())) {
      alert('Este nombre de usuario ya está ocupado.');
      return;
    }

    onAddWorker({
      name: newWorkerName.trim(),
      username: newWorkerUsername.trim().toLowerCase(),
      password: newWorkerPassword
    });
    setNewWorkerName('');
    setNewWorkerUsername('');
    setNewWorkerPassword('');
  };

  const handleSaveWorkerEdit = (id: string) => {
    if (!editingWorkerName.trim() || !editingWorkerUsername.trim()) return;
    
    // Validar duplicados de username excluyéndose a sí mismo
    if (users.some(u => u.id !== id && u.username.toLowerCase() === editingWorkerUsername.trim().toLowerCase())) {
      alert('Este nombre de usuario ya está ocupado.');
      return;
    }

    onUpdateWorker(id, {
      name: editingWorkerName.trim(),
      username: editingWorkerUsername.trim().toLowerCase(),
      password: editingWorkerPassword || undefined
    });
    setEditingWorkerId(null);
  };

  // --- SUBMITS CONFIGURACIÓN ---
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      globalCommissionRate: commInput,
      monthlyVariableBudget: budgetInput
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header superior */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-8" id="admin-header">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-amber-500/10">
            A
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-xl font-bold text-slate-800">
                {admin.name}
              </h1>
              {pendingDeletions.length > 0 && (
                <div 
                  onClick={() => setActiveTab('summary')}
                  className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 cursor-pointer animate-pulse transition-all shadow-sm"
                  title={`${pendingDeletions.length} solicitudes de eliminación pendientes`}
                  id="admin-pending-deletions-badge"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                  <span>{pendingDeletions.length}</span>
                </div>
              )}
            </div>
            <p className="text-sm text-slate-400 font-medium">
              Panel Administrativo de Control Financiero
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3" id="admin-filters-controls">
          {/* Selector de Modo de Filtro (Mes o Rango Personalizado) */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setFilterMode('month')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                filterMode === 'month'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Mes
            </button>
            <button
              onClick={() => setFilterMode('range')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                filterMode === 'range'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Rango
            </button>
          </div>

          {filterMode === 'month' ? (
            <>
              {/* Selector de Mes */}
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 text-sm">
                <Calendar className="w-4 h-4 text-slate-400 mr-2" />
                <select
                  value={selectedMonth}
                  id="admin-month-selector"
                  onChange={(e) => onChangeMonth(Number(e.target.value))}
                  className="bg-transparent border-none font-medium focus:outline-none focus:ring-0 cursor-pointer text-slate-700 text-sm"
                >
                  {MONTHS.map((m, idx) => (
                    <option key={m} value={idx}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Selector de Año */}
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 text-sm">
                <select
                  value={selectedYear}
                  id="admin-year-selector"
                  onChange={(e) => onChangeYear(Number(e.target.value))}
                  className="bg-transparent border-none font-medium focus:outline-none focus:ring-0 cursor-pointer text-slate-700 text-sm"
                >
                  {YEARS.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {/* Rango de fechas */}
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-700 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 mr-2">Desde</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-transparent border-none font-mono focus:outline-none focus:ring-0 cursor-pointer text-slate-700 text-xs py-0.5"
                />
              </div>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-700 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 mr-2">Hasta</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-transparent border-none font-mono focus:outline-none focus:ring-0 cursor-pointer text-slate-700 text-xs py-0.5"
                />
              </div>
            </div>
          )}

          <button
            onClick={onLogout}
            id="admin-logout-btn"
            className="p-2.5 bg-slate-50 hover:bg-red-50 hover:text-red-600 text-slate-500 border border-slate-200 hover:border-red-100 rounded-xl transition-all cursor-pointer flex items-center gap-2 text-sm font-medium"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Grid de KPIs Globales */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8" id="admin-kpi-grid">
        {/* KPI 1: Ingresos Brutos Totales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bruto Facturado</p>
          <h3 className="font-mono text-xl font-bold text-slate-800 mt-1 whitespace-nowrap">
            {totalGrossRevenue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">100% servicios cobrados</p>
        </div>

        {/* KPI 2: Retenido Negocio */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bruto del Negocio</p>
          <h3 className="font-mono text-xl font-bold text-slate-800 mt-1">
            {businessGrossRevenue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">Parte del negocio</p>
        </div>

        {/* KPI 3: Nómina Empleados */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pago a Empleados</p>
          <h3 className="font-mono text-xl font-bold text-slate-800 mt-1">
            {totalEmployeesPayout.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">Total comisiones staff</p>
        </div>

        {/* KPI 4: Gastos Totales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gastos Totales</p>
          <h3 className="font-mono text-xl font-bold text-red-500 mt-1">
            {totalExpenses.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">Fijos + Var. del mes</p>
        </div>

        {/* KPI 5: Ganancia Neta */}
        <div className={`p-5 rounded-2xl shadow-sm col-span-2 lg:col-span-1 border ${
          netBusinessProfit >= 0 
            ? 'bg-emerald-50/60 border-emerald-100 text-emerald-800' 
            : 'bg-rose-50/60 border-rose-100 text-rose-800'
        }`}>
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Ganancia Neta (Real)</p>
          <h3 className="font-mono text-xl font-bold mt-1">
            {netBusinessProfit.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </h3>
          <p className="text-[10px] mt-1 opacity-80">
            {netBusinessProfit >= 0 ? 'Balance Positivo' : 'Alerta de Pérdidas'}
          </p>
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className="flex border-b border-slate-200 mb-8 overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'summary' 
              ? 'border-amber-500 text-amber-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Resumen y Nóminas</span>
          {pendingDeletions.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
              {pendingDeletions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'expenses' 
              ? 'border-amber-500 text-amber-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Gastos ({fixedExpenses.length + monthlyVariableExpenses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'services' 
              ? 'border-amber-500 text-amber-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Scissors className="w-4 h-4" />
          <span>Servicios ({services.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'staff' 
              ? 'border-amber-500 text-amber-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Personal de Estilistas ({workers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'settings' 
              ? 'border-amber-500 text-amber-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Configuración</span>
        </button>
      </div>

      {/* Contenido según Tab */}
      <div>
        {/* TAB 1: RESUMEN Y NÓMINAS */}
        {activeTab === 'summary' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Alerta Visual de Presupuesto Excedido (> 90%) */}
            {currentBudget > 0 && totalVariableExpensesAmount > currentBudget * 0.9 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${
                  totalVariableExpensesAmount > currentBudget
                    ? 'bg-rose-50 border-rose-100 text-rose-800 animate-pulse'
                    : 'bg-amber-50 border-amber-100 text-amber-800'
                }`}
                id="budget-alert-summary"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl shrink-0 ${
                    totalVariableExpensesAmount > currentBudget ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm">
                      {totalVariableExpensesAmount > currentBudget 
                        ? 'Presupuesto Mensual de Gastos Excedido' 
                        : 'Alerta de Límite de Presupuesto Mensual'}
                    </h4>
                    <p className="text-xs mt-1 leading-relaxed opacity-90 font-medium">
                      El gasto variable acumulado de <strong>{MONTHS[selectedMonth]} {selectedYear}</strong> es de{' '}
                      <span className="font-mono font-bold">{totalVariableExpensesAmount.toFixed(2)} €</span>, lo cual representa el{' '}
                      <strong>{budgetPercentage.toFixed(1)}%</strong> del presupuesto mensual establecido de{' '}
                      <span className="font-mono font-bold">{currentBudget.toFixed(2)} €</span>.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('expenses')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm shrink-0 transition-all cursor-pointer ${
                    totalVariableExpensesAmount > currentBudget
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-amber-500 hover:bg-amber-600 text-white'
                  }`}
                >
                  Ajustar o Ver Gastos
                </button>
              </motion.div>
            )}

            {/* Sección de Solicitudes de Eliminación Pendientes */}
            {pendingDeletions.length > 0 && (
              <div className="bg-red-50/60 border border-red-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" />
                  <h3 className="font-display font-bold text-slate-800 text-base">
                    Solicitudes de Eliminación Pendientes de Aprobación ({pendingDeletions.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {pendingDeletions.map((tk) => {
                    const worker = users.find(u => u.id === tk.workerId);
                    return (
                      <div key={tk.id} className="bg-white border border-red-100 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:border-red-200 transition-all">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                              Estilista: {worker ? worker.name : 'Desconocido'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{tk.date}</span>
                          </div>
                          <div className="text-sm font-semibold text-slate-800">
                            {tk.serviceName} &bull; <span className="font-mono text-amber-600">{tk.price.toFixed(2)}€</span>
                          </div>
                          {tk.deleteRequestReason && (
                            <p className="text-xs text-red-600 font-medium bg-red-50/50 p-2 rounded border border-red-100/50 italic">
                              <strong>Motivo:</strong> "{tk.deleteRequestReason}"
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Estás seguro de que deseas APROBAR la eliminación de este servicio?\nSe borrará de forma permanente.`)) {
                                onDeleteTicket(tk.id);
                              }
                            }}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Aprobar
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('¿Deseas RECHAZAR la solicitud de eliminación? El servicio se mantendrá activo.')) {
                                onRejectDeleteTicket(tk.id);
                              }
                            }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 text-xs font-semibold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            Rechazar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Gráfico Recharts de Comparativa Mensual de Ingresos y Gastos */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm" id="recharts-monthly-comparison">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-display font-bold text-slate-800 text-base">
                    Comparativa Mensual de Rendimiento Financiero
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Historial de Ingresos Brutos vs Gastos Totales para el año {selectedYear}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-amber-400"></span>
                    <span className="text-slate-600 font-medium">Ingresos Brutos</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-red-500"></span>
                    <span className="text-slate-600 font-medium">Gastos Totales</span>
                  </div>
                </div>
              </div>

              <div className="w-full h-[320px] font-mono text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={monthlyDataForYear}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 11 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      tickFormatter={(val) => `${val} €`}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const net = data.ingresos - data.gastos;
                          return (
                            <div className="bg-slate-950 text-white p-3.5 rounded-xl shadow-xl border border-slate-800 text-xs font-sans space-y-1.5">
                              <p className="font-bold text-slate-200">{data.fullName}</p>
                              <div className="space-y-1 font-mono text-[11px]">
                                <div className="flex justify-between gap-6">
                                  <span className="text-slate-400">Ingresos Brutos:</span>
                                  <span className="text-amber-400 font-bold">{data.ingresos.toFixed(2)} €</span>
                                </div>
                                <div className="flex justify-between gap-6">
                                  <span className="text-slate-400">Gastos Totales:</span>
                                  <span className="text-red-400 font-bold">{data.gastos.toFixed(2)} €</span>
                                </div>
                                <div className="border-t border-slate-800 my-1 pt-1 flex justify-between gap-6">
                                  <span className="text-slate-400">Rendimiento:</span>
                                  <span className={net >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                                    {net >= 0 ? '+' : ''}{net.toFixed(2)} €
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="ingresos" 
                      stroke="#fbbf24" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorIngresos)" 
                      name="Ingresos Brutos"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="gastos" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorGastos)" 
                      name="Gastos Totales"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráficos SVG Financieros */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gráfico 1: Comparativa Ingresos Retenidos vs Gastos */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="font-display font-bold text-slate-800 text-sm mb-4">
                  Visualización de Flujo de Caja ({MONTHS[selectedMonth]} {selectedYear})
                </h3>
                
                {/* Barras de comparación */}
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Ingresos Brutos Totales</span>
                      <span className="font-mono font-semibold">{totalGrossRevenue.toFixed(2)} €</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div className="bg-amber-400 h-full rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Ingreso Neto Retenido (Negocio)</span>
                      <span className="font-mono font-semibold text-amber-600">{businessGrossRevenue.toFixed(2)} €</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${totalGrossRevenue > 0 ? (businessGrossRevenue / totalGrossRevenue) * 100 : 0}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Pago Total de Nóminas / Comisiones</span>
                      <span className="font-mono font-semibold text-slate-600">{totalEmployeesPayout.toFixed(2)} €</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div className="bg-slate-500 h-full rounded-full" style={{ width: `${totalGrossRevenue > 0 ? (totalEmployeesPayout / totalGrossRevenue) * 100 : 0}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Gastos Operativos (Fijos + Variables)</span>
                      <span className="font-mono font-semibold text-red-500">{totalExpenses.toFixed(2)} €</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div className="bg-red-500 h-full rounded-full" style={{ width: `${Math.min(100, businessGrossRevenue > 0 ? (totalExpenses / businessGrossRevenue) * 100 : totalExpenses > 0 ? 100 : 0)}%` }}></div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      * Porcentaje calculado sobre la porción retenida por el negocio.
                    </p>
                  </div>
                </div>
              </div>

              {/* Gráfico 2: Desglose de Gastos */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-display font-bold text-slate-800 text-sm mb-4">
                    Composición de Gastos
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 items-center">
                    {/* SVG Donut Sencillo */}
                    <div className="flex justify-center">
                      <svg width="120" height="120" viewBox="0 0 42 42" className="transform -rotate-90">
                        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="6" />
                        {totalExpenses > 0 && (
                          <>
                            {/* Gastos Fijos */}
                            <circle 
                              cx="21" 
                              cy="21" 
                              r="15.915" 
                              fill="transparent" 
                              stroke="#ef4444" 
                              strokeWidth="6" 
                              strokeDasharray={`${(totalFixedExpensesAmount / totalExpenses) * 100} ${100 - (totalFixedExpensesAmount / totalExpenses) * 100}`}
                              strokeDashoffset="0" 
                            />
                            {/* Gastos Variables */}
                            <circle 
                              cx="21" 
                              cy="21" 
                              r="15.915" 
                              fill="transparent" 
                              stroke="#f97316" 
                              strokeWidth="6" 
                              strokeDasharray={`${(totalVariableExpensesAmount / totalExpenses) * 100} ${100 - (totalVariableExpensesAmount / totalExpenses) * 100}`}
                              strokeDashoffset={-(totalFixedExpensesAmount / totalExpenses) * 100} 
                            />
                          </>
                        )}
                      </svg>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full shrink-0"></div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-semibold uppercase">Gastos Fijos</div>
                          <div className="text-xs font-mono font-bold text-slate-700">{totalFixedExpensesAmount.toFixed(2)} €</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-orange-500 rounded-full shrink-0"></div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-semibold uppercase">Gastos Variables</div>
                          <div className="text-xs font-mono font-bold text-slate-700">{totalVariableExpensesAmount.toFixed(2)} €</div>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-2 mt-2">
                        <div className="text-[10px] text-slate-400 font-semibold">TOTAL GASTOS</div>
                        <div className="text-sm font-mono font-extrabold text-slate-800">{totalExpenses.toFixed(2)} €</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-4">
                  <strong>Regla de Negocio:</strong> Los gastos fijos se repiten automáticamente mes a mes, mientras que los variables dependen del registro con fecha específica.
                </div>
              </div>
            </div>

            {/* Listado de Nóminas y Rendimiento por Empleado */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-500" />
                  <h3 className="font-display font-bold text-slate-800">
                    Nóminas y Comisión Detallada por Trabajador
                  </h3>
                </div>
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  {MONTHS[selectedMonth]} {selectedYear}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                      <th className="py-3 px-2">Estilista</th>
                      <th className="py-3 px-2 text-center">Servicios Realizados</th>
                      <th className="py-3 px-2 text-right">Facturación Bruta (100%)</th>
                      <th className="py-3 px-2 text-right">Comisión a Pagar</th>
                      <th className="py-3 px-2 text-right">Aporte al Negocio</th>
                      <th className="py-3 px-2 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {workerSalariesBreakdown.map((row) => {
                      const isExpanded = expandedWorkerId === row.id;
                      const wTickets = monthlyTickets.filter(t => t.workerId === row.id);

                      return (
                        <React.Fragment key={row.id}>
                          <tr className="text-sm text-slate-700 hover:bg-slate-50/50 transition-colors border-b border-slate-100/50">
                            <td className="py-4 px-2 font-semibold text-slate-800 flex items-center gap-2">
                              <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs uppercase">
                                {row.name.charAt(0)}
                              </span>
                              <div>
                                <div>{row.name}</div>
                                <div className="text-[10px] font-mono text-slate-400">@{row.username}</div>
                              </div>
                            </td>
                            <td className="py-4 px-2 text-center font-mono font-medium">
                              {row.servicesCount}
                            </td>
                            <td className="py-4 px-2 text-right font-mono text-slate-500">
                              {row.gross.toFixed(2)} €
                            </td>
                            <td className="py-4 px-2 text-right font-mono font-bold text-amber-600">
                              {row.payout.toFixed(2)} €
                            </td>
                            <td className="py-4 px-2 text-right font-mono text-slate-600">
                              {row.businessShare.toFixed(2)} €
                            </td>
                            <td className="py-4 px-2 text-center">
                              <button
                                onClick={() => setExpandedWorkerId(isExpanded ? null : row.id)}
                                className="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700 rounded-lg transition-all cursor-pointer flex items-center gap-1 mx-auto"
                              >
                                <span>{isExpanded ? 'Ocultar' : 'Ver Tickets'}</span>
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={6} className="bg-slate-50/40 px-4 py-3 border-b border-slate-100">
                                <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm space-y-3">
                                  <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Detalle de Servicios de {row.name} ({MONTHS[selectedMonth]} {selectedYear})
                                  </div>
                                  {wTickets.length === 0 ? (
                                    <div className="text-xs text-slate-400 py-3 text-center">No hay servicios registrados en este mes.</div>
                                  ) : (
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                          <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase font-bold">
                                            <th className="py-2 px-2">Fecha</th>
                                            <th className="py-2 px-2">Servicio</th>
                                            <th className="py-2 px-2 text-right">Precio</th>
                                            <th className="py-2 px-2 text-center">Comisión %</th>
                                            <th className="py-2 px-2 text-right">Pago</th>
                                            <th className="py-2 px-2 text-center">Estado / Acción</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                          {wTickets.map((tk) => {
                                            const dateObj = new Date(tk.date);
                                            const formattedDate = !isNaN(dateObj.getTime())
                                              ? dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                                              : tk.date;
                                            const payoutValue = tk.price * (tk.commissionRate / 100);
                                            const isPending = !!tk.deleteRequested;

                                            return (
                                              <tr key={tk.id} className={`hover:bg-slate-50 transition-colors ${isPending ? 'bg-amber-50/50' : ''}`}>
                                                <td className="py-2.5 px-2 font-mono whitespace-nowrap">{formattedDate}</td>
                                                <td className="py-2.5 px-2">
                                                  <div className="font-semibold text-slate-700">{tk.serviceName}</div>
                                                  {tk.note && <div className="text-[10px] text-slate-400 italic">Nota: {tk.note}</div>}
                                                </td>
                                                <td className="py-2.5 px-2 text-right font-mono font-medium">{tk.price.toFixed(2)}€</td>
                                                <td className="py-2.5 px-2 text-center font-mono text-slate-400">{tk.commissionRate}%</td>
                                                <td className="py-2.5 px-2 text-right font-mono font-bold text-amber-600">{payoutValue.toFixed(2)}€</td>
                                                <td className="py-2.5 px-2 text-center">
                                                  {isPending ? (
                                                    <div className="flex items-center justify-center gap-1.5">
                                                      <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded truncate max-w-[120px]" title={`Motivo: ${tk.deleteRequestReason}`}>
                                                        Petición: {tk.deleteRequestReason}
                                                      </span>
                                                      <button
                                                        onClick={() => {
                                                          if (window.confirm('¿Aprobar la solicitud de eliminación de este servicio?')) {
                                                            onDeleteTicket(tk.id);
                                                          }
                                                        }}
                                                        className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded cursor-pointer"
                                                        title="Aprobar eliminación"
                                                      >
                                                        Aprobar
                                                      </button>
                                                      <button
                                                        onClick={() => {
                                                          if (window.confirm('¿Denegar la solicitud de eliminación?')) {
                                                            onRejectDeleteTicket(tk.id);
                                                          }
                                                        }}
                                                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded cursor-pointer"
                                                        title="Denegar eliminación"
                                                      >
                                                        Denegar
                                                      </button>
                                                    </div>
                                                  ) : (
                                                    <button
                                                      onClick={() => {
                                                        if (window.confirm('¿Estás seguro de que deseas eliminar este servicio de manera directa?')) {
                                                          onDeleteTicket(tk.id);
                                                        }
                                                      }}
                                                      className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-slate-100 transition-all cursor-pointer inline-flex items-center"
                                                      title="Eliminar servicio directamente"
                                                    >
                                                      <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                  )}
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 p-4 rounded-xl bg-amber-50/30 border border-amber-100 text-xs">
                <div>
                  <span className="font-bold text-slate-700">Resumen acumulado del mes:</span>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 mt-1.5">
                    <li>Facturación total de estilistas: <strong>{totalGrossRevenue.toFixed(2)} €</strong></li>
                    <li>Porcentaje destinado a comisiones del personal: <strong>{totalEmployeesPayout.toFixed(2)} €</strong></li>
                  </ul>
                </div>
                <div>
                  <span className="font-bold text-slate-700">Porcentaje de comisiones aplicadas:</span>
                  <p className="text-slate-600 mt-1">
                    Cada ticket se calcula con la tasa vigente al guardarse. Las comisiones globales actuales de la plantilla se gestionan en la pestaña <strong>Configuración</strong>.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: GASTOS */}
        {activeTab === 'expenses' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-5 gap-8"
          >
            {/* Gestión Gastos Fijos (Izquierda: 2 cols) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="font-display font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-amber-500" />
                  <span>Gastos Fijos Mensuales</span>
                </h3>

                <form onSubmit={handleCreateFixedExpense} className="space-y-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-xs font-bold text-slate-600">AÑADIR GASTO FIJO</div>
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Concepto (ej. Alquiler)"
                      value={newFixedConcept}
                      onChange={(e) => setNewFixedConcept(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs font-mono">
                        €
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        min="0"
                        placeholder="Importe"
                        value={newFixedAmount}
                        onChange={(e) => setNewFixedAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full pl-6 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir</span>
                  </button>
                </form>

                {/* Tabla de Gastos Fijos */}
                <div className="space-y-2">
                  {fixedExpenses.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No hay gastos fijos registrados.</p>
                  ) : (
                    fixedExpenses.map((fe) => (
                      <div key={fe.id} className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl border border-slate-100 text-xs">
                        {editingFixedId === fe.id ? (
                          <div className="flex items-center gap-1.5 w-full">
                            <input
                              type="text"
                              value={editingFixedConcept}
                              onChange={(e) => setEditingFixedConcept(e.target.value)}
                              className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs w-1/2"
                            />
                            <input
                              type="number"
                              step="0.01"
                              value={editingFixedAmount}
                              onChange={(e) => setEditingFixedAmount(e.target.value === '' ? '' : Number(e.target.value))}
                              className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-mono w-1/4"
                            />
                            <button
                              onClick={() => handleSaveFixedExpenseEdit(fe.id)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingFixedId(null)}
                              className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="font-semibold text-slate-700">{fe.concept}</div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-slate-800">{fe.amount.toFixed(2)} €</span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    setEditingFixedId(fe.id);
                                    setEditingFixedConcept(fe.concept);
                                    setEditingFixedAmount(fe.amount);
                                  }}
                                  className="p-1 text-slate-400 hover:text-amber-600 rounded hover:bg-slate-100"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`¿Eliminar gasto fijo "${fe.concept}"?`)) {
                                      onDeleteFixedExpense(fe.id);
                                    }
                                  }}
                                  className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-50"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                  <div className="border-t border-slate-100 pt-2.5 mt-2 flex justify-between font-bold text-slate-800 text-xs px-1">
                    <span>Suma Fijos:</span>
                    <span className="font-mono">{totalFixedExpensesAmount.toFixed(2)} €/mes</span>
                  </div>
                </div>
              </div>

              {/* Presupuesto de Gastos Variables (Izquierda abajo) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <h3 className="font-display font-bold text-slate-800 text-base flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-amber-500" />
                  <span>Presupuesto Mensual de Variables</span>
                </h3>

                <p className="text-slate-500 text-xs leading-relaxed">
                  Establece un límite mensual para los gastos variables. El sistema te alertará si el gasto acumulado de <strong>{MONTHS[selectedMonth]}</strong> supera el 90% de este valor.
                </p>

                {/* Gráfico de Progreso */}
                {currentBudget > 0 ? (
                  <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-600">Progreso de Presupuesto</span>
                      <span className={`font-mono font-bold ${
                        totalVariableExpensesAmount > currentBudget
                          ? 'text-red-600'
                          : totalVariableExpensesAmount > currentBudget * 0.9
                          ? 'text-amber-600'
                          : 'text-green-600'
                      }`}>
                        {budgetPercentage.toFixed(1)}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 rounded-full ${
                          totalVariableExpensesAmount > currentBudget
                            ? 'bg-red-500'
                            : totalVariableExpensesAmount > currentBudget * 0.9
                            ? 'bg-amber-500 animate-pulse'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
                      <span>Acumulado: <strong className="text-slate-700 font-mono">{totalVariableExpensesAmount.toFixed(2)} €</strong></span>
                      <span>Límite: <strong className="text-slate-700 font-mono">{currentBudget.toFixed(2)} €</strong></span>
                    </div>

                    {totalVariableExpensesAmount > currentBudget * 0.9 && (
                      <div className={`mt-3 p-2.5 rounded-lg border text-[11px] font-medium flex items-start gap-1.5 ${
                        totalVariableExpensesAmount > currentBudget 
                          ? 'bg-rose-50 border-rose-100 text-rose-700' 
                          : 'bg-amber-50 border-amber-100 text-amber-700'
                      }`}>
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 animate-bounce" />
                        <div>
                          {totalVariableExpensesAmount > currentBudget 
                            ? '¡Presupuesto excedido! Considera controlar gastos variables.' 
                            : '¡Alerta! Has consumido más del 90% del presupuesto mensual.'}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center py-6">
                    <p className="text-xs text-slate-400 font-medium">No hay ningún presupuesto establecido para gastos variables.</p>
                  </div>
                )}

                {/* Formulario para establecer presupuesto */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    onUpdateSettings({
                      ...settings,
                      monthlyVariableBudget: budgetInput
                    });
                    setSettingsSaved(true);
                    setTimeout(() => setSettingsSaved(false), 3000);
                  }}
                  className="pt-2 border-t border-slate-100 space-y-3"
                >
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Modificar Presupuesto Mensual (€)
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs font-mono">
                        €
                      </span>
                      <input
                        type="number"
                        min="1"
                        required
                        value={budgetInput}
                        onChange={(e) => setBudgetInput(Number(e.target.value))}
                        className="w-full pl-6 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                        placeholder="Ej: 500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white font-bold rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap"
                    >
                      Establecer
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Gestión Gastos Variables (Derecha: 3 cols) */}
            <div className="lg:col-span-3">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                  <h3 className="font-display font-bold text-slate-800 text-base flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-amber-500" />
                    <span>Gastos Variables ({MONTHS[selectedMonth]} {selectedYear})</span>
                  </h3>
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full font-mono">
                    Filtrado por mes
                  </span>
                </div>

                <form onSubmit={handleCreateVariableExpense} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                  <div className="sm:col-span-4 text-xs font-bold text-slate-600">AÑADIR GASTO VARIABLE</div>
                  
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      required
                      placeholder="Concepto (ej. Tintes)"
                      value={newVarConcept}
                      onChange={(e) => setNewVarConcept(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0"
                      placeholder="Importe"
                      value={newVarAmount}
                      onChange={(e) => setNewVarAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <input
                      type="date"
                      required
                      value={newVarDate}
                      onChange={(e) => setNewVarDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="sm:col-span-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Registrar Gasto Variable</span>
                  </button>
                </form>

                {/* Listado de Gastos Variables */}
                {monthlyVariableExpenses.length === 0 ? (
                  <div className="text-center py-12 px-4 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                    No hay gastos variables registrados para {MONTHS[selectedMonth]} {selectedYear}.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                          <th className="py-2.5 px-2">Fecha</th>
                          <th className="py-2.5 px-2">Concepto</th>
                          <th className="py-2.5 px-2 text-right">Importe</th>
                          <th className="py-2.5 px-2 text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {monthlyVariableExpenses.map((ve) => {
                          if (editingVarId === ve.id) {
                            return (
                              <tr key={ve.id} className="text-xs text-slate-700 bg-amber-50/20">
                                <td className="py-2 px-2">
                                  <input
                                    type="date"
                                    required
                                    value={editingVarDate}
                                    onChange={(e) => setEditingVarDate(e.target.value)}
                                    className="bg-white border border-slate-300 rounded px-1.5 py-1 text-xs font-mono w-full"
                                  />
                                </td>
                                <td className="py-2 px-2">
                                  <input
                                    type="text"
                                    required
                                    value={editingVarConcept}
                                    onChange={(e) => setEditingVarConcept(e.target.value)}
                                    className="bg-white border border-slate-300 rounded px-1.5 py-1 text-xs w-full"
                                  />
                                </td>
                                <td className="py-2 px-2 text-right">
                                  <input
                                    type="number"
                                    step="0.01"
                                    required
                                    min="0"
                                    value={editingVarAmount}
                                    onChange={(e) => setEditingVarAmount(e.target.value === '' ? '' : Number(e.target.value))}
                                    className="bg-white border border-slate-300 rounded px-1.5 py-1 text-xs font-mono w-24 text-right"
                                  />
                                </td>
                                <td className="py-2 px-2 text-center">
                                  <div className="flex justify-center gap-1">
                                    <button
                                      onClick={() => handleSaveVariableExpenseEdit(ve.id)}
                                      className="p-1 text-green-600 hover:bg-green-50 rounded cursor-pointer"
                                      title="Guardar"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setEditingVarId(null)}
                                      className="p-1 text-slate-400 hover:bg-slate-100 rounded cursor-pointer"
                                      title="Cancelar"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          const dateObj = new Date(ve.date);
                          const formattedDate = !isNaN(dateObj.getTime())
                            ? dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                            : ve.date;

                          return (
                            <tr key={ve.id} className="text-xs text-slate-700 hover:bg-slate-50/50 transition-colors">
                              <td className="py-3 px-2 font-mono whitespace-nowrap">{formattedDate}</td>
                              <td className="py-3 px-2 font-medium">{ve.concept}</td>
                              <td className="py-3 px-2 text-right font-mono font-bold text-slate-800">
                                {ve.amount.toFixed(2)} €
                              </td>
                              <td className="py-3 px-2 text-center">
                                <div className="flex justify-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      setEditingVarId(ve.id);
                                      setEditingVarConcept(ve.concept);
                                      setEditingVarAmount(ve.amount);
                                      setEditingVarDate(ve.date);
                                    }}
                                    className="p-1 text-slate-400 hover:text-amber-600 rounded hover:bg-slate-100 cursor-pointer"
                                    title="Editar"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (window.confirm(`¿Deseas eliminar el gasto "${ve.concept}"?`)) {
                                        onDeleteVariableExpense(ve.id);
                                      }
                                    }}
                                    className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-50 cursor-pointer"
                                    title="Eliminar"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl text-xs text-slate-700 font-bold border border-slate-100 mt-6">
                  <span>Suma Variables del Mes:</span>
                  <span className="font-mono">{totalVariableExpensesAmount.toFixed(2)} €</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: SERVICIOS Y CATEGORÍAS */}
        {activeTab === 'services' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-5 gap-8"
          >
            {/* CRUD Categorías (Izquierda: 2 cols) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="font-display font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-500" />
                  <span>Categorías de Servicio</span>
                </h3>

                <form onSubmit={handleCreateCategory} className="flex gap-2 mb-6">
                  <input
                    type="text"
                    required
                    placeholder="Nueva Categoría..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    className="px-3 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir</span>
                  </button>
                </form>

                {/* Listado de Categorías */}
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      {editingCatId === cat.id ? (
                        <div className="flex items-center gap-1.5 w-full">
                          <input
                            type="text"
                            value={editingCatName}
                            onChange={(e) => setEditingCatName(e.target.value)}
                            className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs flex-1"
                          />
                          <button
                            onClick={() => handleSaveCategoryEdit(cat.id)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingCatId(null)}
                            className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="font-semibold text-slate-700">{cat.name}</div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setEditingCatId(cat.id);
                                setEditingCatName(cat.name);
                              }}
                              className="p-1 text-slate-400 hover:text-amber-600 rounded hover:bg-slate-100"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`¿Deseas eliminar la categoría "${cat.name}"? Se mantendrán los tickets existentes, pero los servicios asociados a esta categoría ya no se listarán.`)) {
                                  onDeleteCategory(cat.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CRUD Servicios (Derecha: 3 cols) */}
            <div className="lg:col-span-3">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="font-display font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-amber-500" />
                  <span>Catálogo de Servicios y Precios Base</span>
                </h3>

                {/* Formulario de creación de servicio */}
                <form onSubmit={handleCreateService} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                  <div className="sm:col-span-4 text-xs font-bold text-slate-600 uppercase">Nuevo Servicio</div>
                  
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      required
                      placeholder="Nombre del servicio"
                      value={newSrvName}
                      onChange={(e) => setNewSrvName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <select
                      required
                      value={newSrvCategoryId}
                      onChange={(e) => setNewSrvCategoryId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    >
                      <option value="">Categoría...</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0"
                      placeholder="Precio €"
                      value={newSrvPrice}
                      onChange={(e) => setNewSrvPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="sm:col-span-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Crear Servicio</span>
                  </button>
                </form>

                {/* Listado de Servicios */}
                <div className="space-y-4">
                  {categories.map((category) => {
                    const catServices = services.filter(s => s.categoryId === category.id);
                    if (catServices.length === 0) return null;

                    return (
                      <div key={category.id} className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          {category.name}
                        </div>
                        <div className="divide-y divide-slate-100">
                          {catServices.map((srv) => (
                            <div key={srv.id} className="p-3 bg-white hover:bg-slate-50/50 transition-colors text-xs flex justify-between items-center">
                              {editingSrvId === srv.id ? (
                                <div className="flex flex-wrap items-center gap-1.5 w-full">
                                  <input
                                    type="text"
                                    value={editingSrvName}
                                    onChange={(e) => setEditingSrvName(e.target.value)}
                                    className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs flex-1"
                                  />
                                  <select
                                    value={editingSrvCategoryId}
                                    onChange={(e) => setEditingSrvCategoryId(e.target.value)}
                                    className="bg-white border border-slate-300 rounded px-1 py-0.5 text-xs"
                                  >
                                    {categories.map(c => (
                                      <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                  </select>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={editingSrvPrice}
                                    onChange={(e) => setEditingSrvPrice(e.target.value === '' ? '' : Number(e.target.value))}
                                    className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-mono w-16"
                                  />
                                  <button
                                    onClick={() => handleSaveServiceEdit(srv.id)}
                                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingSrvId(null)}
                                    className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <div className="font-medium text-slate-700">{srv.name}</div>
                                  <div className="flex items-center gap-3">
                                    <span className="font-mono font-bold text-amber-600">{srv.price.toFixed(2)} €</span>
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => {
                                          setEditingSrvId(srv.id);
                                          setEditingSrvCategoryId(srv.categoryId);
                                          setEditingSrvName(srv.name);
                                          setEditingSrvPrice(srv.price);
                                        }}
                                        className="p-1 text-slate-400 hover:text-amber-600 rounded hover:bg-slate-100"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (window.confirm(`¿Deseas eliminar el servicio "${srv.name}"?`)) {
                                            onDeleteService(srv.id);
                                          }
                                        }}
                                        className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-50"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 4: PERSONAL (CRUD TRABAJADORES) */}
        {activeTab === 'staff' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-5 gap-8"
          >
            {/* Crear Trabajador (Izquierda: 2 cols) */}
            <div className="lg:col-span-2">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm sticky top-6">
                <h3 className="font-display font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-500" />
                  <span>Añadir Estilista</span>
                </h3>

                <form onSubmit={handleCreateWorker} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      required
                      placeholder="ej. Natalia Beltrán"
                      value={newWorkerName}
                      onChange={(e) => setNewWorkerName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre de Usuario (Login)</label>
                    <input
                      type="text"
                      required
                      placeholder="ej. natalia"
                      value={newWorkerUsername}
                      onChange={(e) => setNewWorkerUsername(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Contraseña de Acceso</label>
                    <input
                      type="text"
                      required
                      placeholder="ej. 123"
                      value={newWorkerPassword}
                      onChange={(e) => setNewWorkerPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Crear Cuenta de Personal</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Listado Trabajadores (Derecha: 3 cols) */}
            <div className="lg:col-span-3">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="font-display font-bold text-slate-800 text-base mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-500" />
                  <span>Equipo de Estilistas Registrados ({workers.length})</span>
                </h3>

                <div className="space-y-3">
                  {workers.map((worker) => (
                    <div key={worker.id} className="p-4 bg-slate-50 hover:bg-slate-100/50 rounded-2xl border border-slate-200/50 transition-all">
                      {editingWorkerId === worker.id ? (
                        <div className="space-y-3">
                          <div className="text-xs font-bold text-amber-600">Editando Estilista</div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-0.5">Nombre</label>
                              <input
                                type="text"
                                value={editingWorkerName}
                                onChange={(e) => setEditingWorkerName(e.target.value)}
                                className="bg-white border border-slate-300 rounded px-2 py-1 text-xs w-full"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-0.5">Usuario</label>
                              <input
                                type="text"
                                value={editingWorkerUsername}
                                onChange={(e) => setEditingWorkerUsername(e.target.value)}
                                className="bg-white border border-slate-300 rounded px-2 py-1 text-xs w-full font-mono"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">Contraseña (Vacío para mantener)</label>
                            <input
                              type="text"
                              placeholder="Sin cambios..."
                              value={editingWorkerPassword}
                              onChange={(e) => setEditingWorkerPassword(e.target.value)}
                              className="bg-white border border-slate-300 rounded px-2 py-1 text-xs w-full font-mono"
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleSaveWorkerEdit(worker.id)}
                              className="px-2.5 py-1 bg-green-600 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" /> Guardar
                            </button>
                            <button
                              onClick={() => setEditingWorkerId(null)}
                              className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" /> Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <span className="w-9 h-9 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/10 flex items-center justify-center font-bold text-sm">
                              {worker.name.charAt(0)}
                            </span>
                            <div>
                              <div className="font-bold text-slate-800 text-sm">{worker.name}</div>
                              <div className="text-slate-400 font-mono text-[10px]">
                                Username: @{worker.username} | Password: {worker.password}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingWorkerId(worker.id);
                                setEditingWorkerName(worker.name);
                                setEditingWorkerUsername(worker.username);
                                setEditingWorkerPassword('');
                              }}
                              className="p-1.5 text-slate-400 hover:text-amber-500 rounded hover:bg-white border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                              title="Editar empleado"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`¿Estás seguro de que deseas eliminar la cuenta de ${worker.name}? Esto conservará sus servicios en el historial, pero no podrá iniciar sesión de nuevo.`)) {
                                  onDeleteWorker(worker.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-500 rounded hover:bg-white border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                              title="Eliminar empleado"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 5: CONFIGURACIÓN GLOBAL */}
        {activeTab === 'settings' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto flex flex-col gap-8"
          >
            {/* Tarjeta de Parámetros de Comisión */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="font-display font-bold text-slate-800 text-base mb-6 flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-500" />
                <span>Parámetros Globales de Comisión</span>
              </h3>

              {settingsSaved && (
                <div className="flex items-center gap-2 p-3 mb-6 rounded-lg bg-green-50 text-green-600 text-xs border border-green-100 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Configuración guardada correctamente en localStorage.</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
                      Porcentaje para los Trabajadores (%)
                    </label>
                    <span className="font-mono text-base font-bold text-amber-600">
                      {commInput}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    step="5"
                    value={commInput}
                    onChange={(e) => setCommInput(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold font-mono mt-1">
                    <span>10% (Min)</span>
                    <span>50% (Default)</span>
                    <span>90% (Max)</span>
                  </div>
                </div>

                {/* Vista del reparto visual */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs space-y-3">
                  <div className="font-bold text-slate-700">Simulación de Reparto de un Servicio de 100 €:</div>
                  
                  <div className="flex gap-1 h-6 rounded-lg overflow-hidden font-bold text-[10px] text-white">
                    <div 
                      className="bg-amber-500 flex items-center justify-center transition-all duration-300"
                      style={{ width: `${commInput}%` }}
                    >
                      {commInput >= 20 ? `Trabajador: ${commInput}€` : `${commInput}%`}
                    </div>
                    <div 
                      className="bg-slate-800 flex items-center justify-center transition-all duration-300"
                      style={{ width: `${100 - commInput}%` }}
                    >
                      {100 - commInput >= 20 ? `Negocio: ${100 - commInput}€` : `${100 - commInput}%`}
                    </div>
                  </div>

                  <p className="text-slate-500 leading-relaxed text-[11px] pt-1">
                    * Al guardar este cambio, <strong>todos los nuevos servicios registrados</strong> de aquí en adelante heredarán la comisión del <strong>{commInput}%</strong>. Los servicios ya registrados en el pasado conservarán sus respectivos porcentajes históricos para garantizar la integridad fiscal y contable.
                  </p>
                </div>

                {/* Presupuesto de Gastos Variables */}
                <div className="pt-4 border-t border-slate-100">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-2">
                    Presupuesto Mensual de Gastos Variables (€)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-mono">
                      €
                    </span>
                    <input
                      type="number"
                      min="1"
                      required
                      value={budgetInput}
                      onChange={(e) => setBudgetInput(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      placeholder="Ej: 500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                    Límite mensual utilizado para realizar un seguimiento de los gastos variables acumulados y emitir alertas si se supera el 90% del presupuesto.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-medium rounded-xl transition-all shadow-md shadow-amber-500/10 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Parámetros de Comisión y Presupuesto</span>
                </button>
              </form>
            </div>

            {/* Tarjeta de Log de Auditoría */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="font-display font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                <span>Log de Auditoría de Operaciones Críticas</span>
              </h3>
              
              <p className="text-slate-500 text-xs mb-6 leading-relaxed">
                Este registro almacena de forma inmutable en Firestore las acciones críticas realizadas por los administradores (cambios de comisión, creación, modificación o eliminación de gastos, y aprobación/rechazo de solicitudes de borrado).
              </p>

              {auditLogs.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <span>No se han registrado modificaciones críticas todavía.</span>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold border-b border-slate-100">
                        <th className="p-3">Fecha y Hora</th>
                        <th className="p-3">Administrador</th>
                        <th className="p-3">Acción</th>
                        <th className="p-3">Detalle de Modificación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {auditLogs.map((log) => {
                        let actionBadgeColor = "bg-slate-100 text-slate-700";
                        let actionLabel = log.action;
                        if (log.action === 'update_settings') {
                          actionBadgeColor = "bg-amber-100 text-amber-800 border border-amber-200/50";
                          actionLabel = "Comisión";
                        } else if (log.action.includes('delete_')) {
                          actionBadgeColor = "bg-red-100 text-red-800 border border-red-200/50";
                          actionLabel = "Eliminación";
                        } else if (log.action.includes('add_')) {
                          actionBadgeColor = "bg-green-100 text-green-800 border border-green-200/50";
                          actionLabel = "Registro";
                        } else if (log.action.includes('update_')) {
                          actionBadgeColor = "bg-blue-100 text-blue-800 border border-blue-200/50";
                          actionLabel = "Actualización";
                        } else if (log.action === 'approve_ticket_delete') {
                          actionBadgeColor = "bg-rose-100 text-rose-800 border border-rose-200/50";
                          actionLabel = "Aprobó Borrado";
                        } else if (log.action === 'reject_ticket_delete') {
                          actionBadgeColor = "bg-slate-100 text-slate-800 border border-slate-300/50";
                          actionLabel = "Rechazó Borrado";
                        }

                        return (
                          <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-3 font-mono text-slate-500 whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleString('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              })}
                            </td>
                            <td className="p-3 font-medium text-slate-700 whitespace-nowrap">
                              {log.userName}
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${actionBadgeColor}`}>
                                {actionLabel}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600 font-medium leading-normal max-w-xs md:max-w-md break-words">
                              {log.details}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
