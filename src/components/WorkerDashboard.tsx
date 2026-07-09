/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Category, Service, ServiceTicket, AppSettings } from '../types';
import { 
  LogOut, Plus, Calendar, Scissors, Sparkles, DollarSign, 
  TrendingUp, Layers, CheckCircle2, Trash2, Tag, FileText, ClipboardList,
  AlertTriangle, Clock, X, RotateCcw, ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WorkerDashboardProps {
  worker: User;
  categories: Category[];
  services: Service[];
  tickets: ServiceTicket[];
  settings: AppSettings;
  selectedMonth: number; // 0-indexed (0 = Enero, 11 = Diciembre)
  selectedYear: number;
  onAddTicket: (ticket: Omit<ServiceTicket, 'id'>) => void;
  onRequestDeleteTicket: (ticketId: string, reason: string) => void;
  onCancelRequestDeleteTicket: (ticketId: string) => void;
  onLogout: () => void;
  onChangeMonth: (month: number) => void;
  onChangeYear: (year: number) => void;
}

export default function WorkerDashboard({
  worker,
  categories,
  services,
  tickets,
  settings,
  selectedMonth,
  selectedYear,
  onAddTicket,
  onRequestDeleteTicket,
  onCancelRequestDeleteTicket,
  onLogout,
  onChangeMonth,
  onChangeYear,
}: WorkerDashboardProps) {
  // Estado para el formulario de registro de servicio
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [customPrice, setCustomPrice] = useState<number | ''>('');
  const [ticketDate, setTicketDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [note, setNote] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Estado para la solicitud de eliminación de ticket
  const [deleteRequestTicketId, setDeleteRequestTicketId] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState('');

  // Estado para la paginación de la tabla de servicios
  const [currentPage, setCurrentPage] = useState(1);

  // Resetear página cuando cambia de mes/año o de trabajador
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, selectedYear, worker.id]);

  // Meses en español
  const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Años disponibles
  const YEARS = [2025, 2026, 2027];

  // Filtrar servicios de la categoría seleccionada
  const filteredServices = services.filter(s => s.categoryId === selectedCategoryId);

  // Al cambiar la categoría, limpiamos el servicio seleccionado y el precio
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const catId = e.target.value;
    setSelectedCategoryId(catId);
    setSelectedServiceId('');
    setCustomPrice('');
  };

  // Al cambiar el servicio, auto-rellenamos el precio base
  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const srvId = e.target.value;
    setSelectedServiceId(srvId);
    const service = services.find(s => s.id === srvId);
    if (service) {
      setCustomPrice(service.price);
    } else {
      setCustomPrice('');
    }
  };

  // Envío del formulario de registro
  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryId || !selectedServiceId || customPrice === '') return;

    const service = services.find(s => s.id === selectedServiceId);
    if (!service) return;

    onAddTicket({
      workerId: worker.id,
      categoryId: selectedCategoryId,
      serviceId: selectedServiceId,
      serviceName: service.name,
      price: Number(customPrice),
      commissionRate: settings.globalCommissionRate,
      date: ticketDate,
      note: note.trim() || undefined,
    });

    // Resetear formulario
    setSelectedCategoryId('');
    setSelectedServiceId('');
    setCustomPrice('');
    setNote('');
    
    // Mostrar mensaje de éxito
    setSuccessMessage('¡Servicio registrado con éxito!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Filtrar los tickets del trabajador para el mes y año seleccionado
  const workerTickets = tickets.filter(t => {
    if (t.workerId !== worker.id) return false;
    const tDate = new Date(t.date);
    // Para evitar problemas de zona horaria al parsear YYYY-MM-DD
    const parts = t.date.split('-');
    const tYear = parseInt(parts[0], 10);
    const tMonth = parseInt(parts[1], 10) - 1; // 0-11
    return tYear === selectedYear && tMonth === selectedMonth;
  });

  // Ordenar tickets por fecha descendente
  const sortedWorkerTickets = [...workerTickets].sort((a, b) => b.date.localeCompare(a.date));

  // Configuración de la paginación para la tabla de servicios
  const itemsPerPage = 8;
  const totalPages = Math.ceil(sortedWorkerTickets.length / itemsPerPage);
  const activePage = Math.min(currentPage, Math.max(1, totalPages));
  const paginatedTickets = sortedWorkerTickets.slice(
    (activePage - 1) * itemsPerPage,
    activePage * itemsPerPage
  );

  // KPIs
  const totalGrossGenerated = workerTickets.reduce((sum, t) => sum + t.price, 0);
  const totalCommissionEarned = workerTickets.reduce((sum, t) => sum + (t.price * (t.commissionRate / 100)), 0);
  const totalServicesCount = workerTickets.length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header superior */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-8" id="worker-header">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-lg border border-amber-500/10">
            {worker.name.charAt(0)}
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-slate-800">
              Hola, {worker.name}
            </h1>
            <p className="text-sm text-slate-400 font-medium">
              Panel de Control Personal (Comisión: <span className="text-amber-600">{settings.globalCommissionRate}%</span>)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Selector de Mes */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 text-sm">
            <Calendar className="w-4 h-4 text-slate-400 mr-2" />
            <select
              value={selectedMonth}
              id="month-selector"
              onChange={(e) => onChangeMonth(Number(e.target.value))}
              className="bg-transparent border-none font-medium focus:outline-none focus:ring-0 cursor-pointer text-slate-700"
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
              id="year-selector"
              onChange={(e) => onChangeYear(Number(e.target.value))}
              className="bg-transparent border-none font-medium focus:outline-none focus:ring-0 cursor-pointer text-slate-700"
            >
              {YEARS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <button
            onClick={onLogout}
            id="worker-logout-btn"
            className="p-2.5 bg-slate-50 hover:bg-red-50 hover:text-red-600 text-slate-500 border border-slate-200 hover:border-red-100 rounded-xl transition-all cursor-pointer flex items-center gap-2 text-sm font-medium"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>

      {/* Grid de KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Bruto Generado</p>
            <h3 className="font-mono text-2xl font-bold text-slate-800 mt-1">
              {totalGrossGenerated.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </h3>
            <p className="text-xs text-slate-400 mt-1">Monto total facturado por ti</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="bg-gradient-to-br from-amber-500 to-amber-600 p-6 rounded-2xl text-white shadow-md shadow-amber-500/10 flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-amber-100 uppercase tracking-wider">Tu Comisión Acumulada</p>
            <h3 className="font-mono text-2xl font-bold mt-1">
              {totalCommissionEarned.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </h3>
            <p className="text-xs text-amber-100/80 mt-1">
              Monto neto que te corresponde cobrar ({settings.globalCommissionRate}%)
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/20 text-white flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Servicios Realizados</p>
            <h3 className="font-mono text-2xl font-bold text-slate-800 mt-1">
              {totalServicesCount}
            </h3>
            <p className="text-xs text-slate-400 mt-1">En {MONTHS[selectedMonth]} {selectedYear}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <Scissors className="w-5 h-5" />
          </div>
        </motion.div>
      </div>

      {/* Grid de contenido */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Formulario de registro (Izquierda: 2 de 5 cols) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sticky top-6">
            <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-slate-100">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="font-display text-lg font-bold text-slate-800">
                Registrar Nuevo Servicio
              </h2>
            </div>

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 mb-5 rounded-lg bg-green-50 text-green-600 text-xs border border-green-100 font-medium"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmitTicket} className="space-y-4">
              {/* Selección Categoría */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Categoría
                </label>
                <select
                  required
                  value={selectedCategoryId}
                  onChange={handleCategoryChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  <option value="">Selecciona una categoría...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Selección Servicio (Condicionado a categoría) */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Servicio Realizado
                </label>
                <select
                  required
                  disabled={!selectedCategoryId}
                  value={selectedServiceId}
                  onChange={handleServiceChange}
                  className="w-full bg-slate-50 border border-slate-200 disabled:opacity-60 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  <option value="">
                    {!selectedCategoryId 
                      ? 'Primero selecciona una categoría...' 
                      : 'Selecciona un servicio...'}
                  </option>
                  {filteredServices.map((srv) => (
                    <option key={srv.id} value={srv.id}>
                      {srv.name} ({srv.price.toFixed(2)}€)
                    </option>
                  ))}
                </select>
              </div>

              {/* Precio (Editable si se requiere ajustar cobro real) */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Importe Cobrado (€)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-sm font-mono font-medium">
                    €
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0"
                    disabled={!selectedServiceId}
                    placeholder="0.00"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 disabled:opacity-60 rounded-xl text-sm font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Se autocompleta con el precio sugerido, pero puedes editarlo si aplicaste un descuento o precio especial.
                </p>
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Fecha del Servicio
                </label>
                <input
                  type="date"
                  required
                  value={ticketDate}
                  onChange={(e) => setTicketDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono"
                />
              </div>

              {/* Nota Opcional */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Nota / Detalle (Opcional)
                </label>
                <textarea
                  placeholder="ej. Nombre de cliente, detalle técnico..."
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
                />
              </div>

              <button
                type="submit"
                id="submit-ticket-btn"
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-medium rounded-xl transition-all shadow-md shadow-amber-500/10 flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Servicio</span>
              </button>
            </form>
          </div>
        </div>

        {/* Historial de Servicios Realizados (Derecha: 3 de 5 cols) */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <ClipboardList className="w-5 h-5 text-amber-500" />
                <h2 className="font-display text-lg font-bold text-slate-800">
                  Tus Servicios del Mes
                </h2>
              </div>
              <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2.5 py-1 rounded-full font-mono">
                {MONTHS[selectedMonth]} {selectedYear}
              </span>
            </div>

            {sortedWorkerTickets.length === 0 ? (
              <div className="text-center py-12 px-4 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl">
                <Scissors className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium text-sm">No has registrado servicios este mes.</p>
                <p className="text-xs text-slate-400 mt-1">Usa el formulario de la izquierda para empezar.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                        <th className="py-3 px-2">Fecha</th>
                        <th className="py-3 px-2">Servicio</th>
                        <th className="py-3 px-2 text-right">Cobrado</th>
                        <th className="py-3 px-2 text-right">Comisión</th>
                        <th className="py-3 px-2 text-right">Tu Pago</th>
                        <th className="py-3 px-2 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      <AnimatePresence initial={false}>
                        {paginatedTickets.map((tk) => {
                          const dateObj = new Date(tk.date);
                          const formattedDate = !isNaN(dateObj.getTime())
                            ? dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                            : tk.date;
                          
                          const earings = tk.price * (tk.commissionRate / 100);
                          const isPendingDelete = !!tk.deleteRequested;

                          return (
                            <motion.tr
                              key={tk.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0, x: -10 }}
                              className={`text-xs transition-colors ${
                                isPendingDelete 
                                  ? 'bg-amber-50/60 text-slate-500 hover:bg-amber-50' 
                                  : 'text-slate-700 hover:bg-slate-50/50'
                              }`}
                            >
                              <td className="py-3.5 px-2 font-mono whitespace-nowrap">
                                {formattedDate}
                              </td>
                              <td className="py-3.5 px-2">
                                <div className="flex items-center gap-2">
                                  <span className={`font-semibold ${isPendingDelete ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                                    {tk.serviceName}
                                  </span>
                                  {isPendingDelete && (
                                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.5 rounded font-bold font-sans">
                                      <Clock className="w-2.5 h-2.5" /> Pendiente
                                    </span>
                                  )}
                                </div>
                                {tk.note && (
                                  <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                    <FileText className="w-3 h-3 shrink-0" />
                                    <span className="truncate max-w-[150px]">{tk.note}</span>
                                  </div>
                                )}
                                {isPendingDelete && tk.deleteRequestReason && (
                                  <div className="text-[10px] text-amber-700 italic font-medium mt-0.5 bg-amber-100/40 p-1 rounded border border-amber-100 max-w-[200px] truncate" title={`Motivo: ${tk.deleteRequestReason}`}>
                                    Motivo: {tk.deleteRequestReason}
                                  </div>
                                )}
                              </td>
                              <td className="py-3.5 px-2 text-right font-mono font-medium">
                                {tk.price.toFixed(2)}€
                              </td>
                              <td className="py-3.5 px-2 text-right font-mono text-slate-400">
                                {tk.commissionRate}%
                              </td>
                              <td className="py-3.5 px-2 text-right font-mono font-bold text-amber-600">
                                {earings.toFixed(2)}€
                              </td>
                              <td className="py-3.5 px-2 text-center">
                                {isPendingDelete ? (
                                  <button
                                    onClick={() => {
                                      if (window.confirm('¿Deseas cancelar la solicitud de eliminación de este servicio?')) {
                                        onCancelRequestDeleteTicket(tk.id);
                                      }
                                    }}
                                    className="p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1"
                                    title="Cancelar solicitud de eliminación"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span className="text-[9px] font-bold">Deshacer</span>
                                  </button>
                                ) : (
                                  <button
                                    id={`delete-tk-${tk.id}`}
                                    onClick={() => {
                                      setDeleteRequestTicketId(tk.id);
                                      setDeleteReason('');
                                    }}
                                    className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all cursor-pointer"
                                    title="Solicitar eliminación de servicio"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-50 p-3 rounded-xl text-[11px] text-slate-500 font-semibold border border-slate-100 gap-2">
                  <span>Total del mes: {sortedWorkerTickets.length} servicios</span>
                  <span className="font-mono text-amber-600">
                    Suma total: {totalGrossGenerated.toFixed(2)}€ (Tu comisión: {totalCommissionEarned.toFixed(2)}€)
                  </span>
                </div>

                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-4 mt-2 gap-4">
                    <div className="text-xs text-slate-500 font-medium">
                      Mostrando <span className="font-bold text-slate-700">{(activePage - 1) * itemsPerPage + 1}-{Math.min(activePage * itemsPerPage, sortedWorkerTickets.length)}</span> de{' '}
                      <span className="font-bold text-slate-700">{sortedWorkerTickets.length}</span> servicios
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={activePage === 1}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer bg-white"
                        title="Página anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        const isCurrent = page === activePage;
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/10'
                                : 'text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-100 bg-white'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={activePage === totalPages}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer bg-white"
                        title="Página siguiente"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para Solicitar Eliminación */}
      <AnimatePresence>
        {deleteRequestTicketId && (() => {
          const ticketToRequest = tickets.find(t => t.id === deleteRequestTicketId);
          if (!ticketToRequest) return null;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-md w-full overflow-hidden"
              >
                <div className="bg-amber-500/10 border-b border-amber-500/10 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-700">
                    <AlertTriangle className="w-5 h-5" />
                    <h3 className="font-display font-bold text-base">Solicitar Eliminación de Servicio</h3>
                  </div>
                  <button
                    onClick={() => setDeleteRequestTicketId(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!deleteReason.trim()) return;
                    onRequestDeleteTicket(deleteRequestTicketId, deleteReason.trim());
                    setDeleteRequestTicketId(null);
                    setDeleteReason('');
                  }}
                  className="p-6 space-y-4"
                >
                  <div className="bg-slate-50 p-3.5 rounded-xl text-xs space-y-1 text-slate-600 border border-slate-100">
                    <p><strong>Servicio:</strong> {ticketToRequest.serviceName}</p>
                    <p><strong>Cobrado:</strong> {ticketToRequest.price.toFixed(2)}€</p>
                    <p><strong>Fecha:</strong> {ticketToRequest.date}</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Motivo de la eliminación <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={deleteReason}
                      onChange={(e) => setDeleteReason(e.target.value)}
                      required
                      placeholder="Explica brevemente por qué necesitas eliminar este registro..."
                      className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 min-h-[90px] resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setDeleteRequestTicketId(null)}
                      className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!deleteReason.trim()}
                      className="px-4 py-2 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Enviar Solicitud
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
