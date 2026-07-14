/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  User, Category, Service, ServiceTicket, 
  FixedExpense, VariableExpense, AppSettings, AuditLog, PayrollPayment
} from './types';
import { 
  INITIAL_USERS, INITIAL_CATEGORIES, INITIAL_SERVICES, 
  INITIAL_FIXED_EXPENSES, INITIAL_VARIABLE_EXPENSES, 
  INITIAL_SETTINGS, INITIAL_TICKETS 
} from './data/initialData';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import WorkerDashboard from './components/WorkerDashboard';
import { Scissors } from 'lucide-react';
import { motion } from 'motion/react';
import { 
  collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from './firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';

function cleanData<T extends Record<string, any>>(obj: T): T {
  const cleaned = { ...obj };
  Object.keys(cleaned).forEach((key) => {
    if (cleaned[key] === undefined) {
      delete cleaned[key];
    }
  });
  return cleaned;
}

export default function App() {
  // --- ESTADOS LOCALES RESPALDADOS POR FIRESTORE ---
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [tickets, setTickets] = useState<ServiceTicket[]>(INITIAL_TICKETS);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>(INITIAL_FIXED_EXPENSES);
  const [variableExpenses, setVariableExpenses] = useState<VariableExpense[]>(INITIAL_VARIABLE_EXPENSES);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [payrollPayments, setPayrollPayments] = useState<PayrollPayment[]>([]);

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('salon_logged_user');
    return saved ? JSON.parse(saved) : null;
  });

  // --- CONTROL DE TIEMPO GLOBAL (POR DEFECTO JULIO 2026 SEGÚN METADATO) ---
  const [selectedMonth, setSelectedMonth] = useState(6); // 6 = Julio (0-indexed)
  const [selectedYear, setSelectedYear] = useState(2026);

  // --- SINCRONIZACIÓN EN TIEMPO REAL CON FIRESTORE ---
  useEffect(() => {
    // 1. Usuarios (users)
    const unsubscribeUsers = onSnapshot(
      collection(db, 'users'),
      async (snapshot) => {
        if (snapshot.empty) {
          try {
            for (const user of INITIAL_USERS) {
              await setDoc(doc(db, 'users', user.id), user);
            }
          } catch (e) {
            handleFirestoreError(e, OperationType.WRITE, 'users');
          }
        } else {
          const list: User[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as User);
          });
          setUsers(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'users');
      }
    );

    // 2. Categorías (categories)
    const unsubscribeCategories = onSnapshot(
      collection(db, 'categories'),
      async (snapshot) => {
        if (snapshot.empty) {
          try {
            for (const cat of INITIAL_CATEGORIES) {
              await setDoc(doc(db, 'categories', cat.id), cat);
            }
          } catch (e) {
            handleFirestoreError(e, OperationType.WRITE, 'categories');
          }
        } else {
          const list: Category[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as Category);
          });
          setCategories(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'categories');
      }
    );

    // 3. Servicios (services)
    const unsubscribeServices = onSnapshot(
      collection(db, 'services'),
      async (snapshot) => {
        if (snapshot.empty) {
          try {
            for (const srv of INITIAL_SERVICES) {
              await setDoc(doc(db, 'services', srv.id), srv);
            }
          } catch (e) {
            handleFirestoreError(e, OperationType.WRITE, 'services');
          }
        } else {
          const list: Service[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as Service);
          });
          setServices(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'services');
      }
    );

    // 4. Tickets (tickets)
    const unsubscribeTickets = onSnapshot(
      collection(db, 'tickets'),
      (snapshot) => {
        const list: ServiceTicket[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as ServiceTicket);
        });
        list.sort((a, b) => b.id.localeCompare(a.id));
        setTickets(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'tickets');
      }
    );

    // 5. Gastos Fijos (fixedExpenses)
    const unsubscribeFixedExpenses = onSnapshot(
      collection(db, 'fixedExpenses'),
      (snapshot) => {
        const list: FixedExpense[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as FixedExpense);
        });
        setFixedExpenses(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'fixedExpenses');
      }
    );

    // 6. Gastos Variables (variableExpenses)
    const unsubscribeVariableExpenses = onSnapshot(
      collection(db, 'variableExpenses'),
      (snapshot) => {
        const list: VariableExpense[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as VariableExpense);
        });
        list.sort((a, b) => b.id.localeCompare(a.id));
        setVariableExpenses(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'variableExpenses');
      }
    );

    // 7. Configuración Global (settings)
    const unsubscribeSettings = onSnapshot(
      doc(db, 'settings', 'global'),
      async (docSnap) => {
        if (!docSnap.exists()) {
          try {
            await setDoc(doc(db, 'settings', 'global'), INITIAL_SETTINGS);
          } catch (e) {
            handleFirestoreError(e, OperationType.WRITE, 'settings/global');
          }
        } else {
          setSettings(docSnap.data() as AppSettings);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'settings/global');
      }
    );

    // 8. Log de Auditoría (auditLogs)
    const unsubscribeAuditLogs = onSnapshot(
      collection(db, 'auditLogs'),
      (snapshot) => {
        const list: AuditLog[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as AuditLog);
        });
        list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        setAuditLogs(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'auditLogs');
      }
    );

    // 9. Pagos de Nómina (payrollPayments)
    const unsubscribePayrollPayments = onSnapshot(
      collection(db, 'payrollPayments'),
      (snapshot) => {
        const list: PayrollPayment[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as PayrollPayment);
        });
        setPayrollPayments(list);
      },
      (error) => {
        console.error('Error al escuchar pagos de nómina:', error);
      }
    );

    return () => {
      unsubscribeUsers();
      unsubscribeCategories();
      unsubscribeServices();
      unsubscribeTickets();
      unsubscribeFixedExpenses();
      unsubscribeVariableExpenses();
      unsubscribeSettings();
      unsubscribeAuditLogs();
      unsubscribePayrollPayments();
    };
  }, []);

  // --- CONTROL DE SESIÓN CON FIREBASE AUTH ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const email = firebaseUser.email;
        const isAdminEmail = email && email.toLowerCase() === 'jaaq7919@gmail.com';
        const matched = users.find(
          (u) => u.id === firebaseUser.uid || (email && u.email?.toLowerCase() === email.toLowerCase())
        );
        if (matched) {
          setCurrentUser({
            ...matched,
            role: isAdminEmail ? 'admin' : matched.role,
          });
        } else if (email) {
          const username = email.split('@')[0];
          setCurrentUser({
            id: firebaseUser.uid,
            username,
            name: firebaseUser.displayName || username,
            email: email,
            role: isAdminEmail ? 'admin' : 'worker',
          });
        }
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribeAuth();
  }, [users]);

  // Persistir la sesión del usuario actual en Local Storage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('salon_logged_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('salon_logged_user');
    }
  }, [currentUser]);

  // --- FUNCIÓN AUXILIAR DE AUDITORÍA ---
  const addAuditLog = async (action: string, details: string) => {
    if (!currentUser) return;
    const id = `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const log: AuditLog = {
      id,
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'auditLogs', id), log);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `auditLogs/${id}`);
    }
  };

  // --- MANIPULADORES DE ESTADO EN FIRESTORE ---
  
  // LOGIN/LOGOUT
  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (e) {
      console.error('Error al cerrar sesión de Firebase Auth:', e);
    }
  };

  // TICKETS DE SERVICIO
  const handleAddTicket = async (ticket: Omit<ServiceTicket, 'id'>) => {
    const id = `tk-${Date.now()}`;
    const newTicket: ServiceTicket = {
      id,
      ...ticket
    };
    try {
      await setDoc(doc(db, 'tickets', id), cleanData(newTicket));
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `tickets/${id}`);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    try {
      const tk = tickets.find(t => t.id === ticketId);
      await deleteDoc(doc(db, 'tickets', ticketId));
      if (tk) {
        const workerName = users.find(u => u.id === tk.workerId)?.name || tk.workerId;
        await addAuditLog(
          'approve_ticket_delete',
          `Aprobó la eliminación del ticket #${ticketId} (Servicio: "${tk.serviceName}", Estilista: "${workerName}", Importe: ${tk.price} €)`
        );
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `tickets/${ticketId}`);
    }
  };

  const handleRequestDeleteTicket = async (ticketId: string, reason: string) => {
    try {
      await updateDoc(doc(db, 'tickets', ticketId), {
        deleteRequested: true,
        deleteRequestReason: reason
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `tickets/${ticketId}`);
    }
  };

  const handleCancelRequestDeleteTicket = async (ticketId: string) => {
    try {
      await updateDoc(doc(db, 'tickets', ticketId), {
        deleteRequested: false,
        deleteRequestReason: ''
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `tickets/${ticketId}`);
    }
  };

  const handleRejectDeleteTicket = async (ticketId: string) => {
    try {
      const tk = tickets.find(t => t.id === ticketId);
      await updateDoc(doc(db, 'tickets', ticketId), {
        deleteRequested: false,
        deleteRequestReason: ''
      });
      if (tk) {
        const workerName = users.find(u => u.id === tk.workerId)?.name || tk.workerId;
        await addAuditLog(
          'reject_ticket_delete',
          `Rechazó la solicitud de eliminación del ticket #${ticketId} (Servicio: "${tk.serviceName}", Estilista: "${workerName}", Razón: "${tk.deleteRequestReason || 'Sin razón'}")`
        );
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `tickets/${ticketId}`);
    }
  };

  // CATEGORÍAS
  const handleAddCategory = async (cat: Omit<Category, 'id'>) => {
    const id = `cat-${Date.now()}`;
    const newCat: Category = {
      id,
      name: cat.name
    };
    try {
      await setDoc(doc(db, 'categories', id), newCat);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `categories/${id}`);
    }
  };

  const handleUpdateCategory = async (id: string, updated: Partial<Category>) => {
    try {
      await updateDoc(doc(db, 'categories', id), cleanData(updated));
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `categories/${id}`);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
      const servicesToDelete = services.filter(s => s.categoryId === id);
      for (const srv of servicesToDelete) {
        await deleteDoc(doc(db, 'services', srv.id));
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `categories/${id}`);
    }
  };

  // SERVICIOS
  const handleAddService = async (srv: Omit<Service, 'id'>) => {
    const id = `srv-${Date.now()}`;
    const newSrv: Service = {
      id,
      ...srv
    };
    try {
      await setDoc(doc(db, 'services', id), newSrv);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `services/${id}`);
    }
  };

  const handleUpdateService = async (id: string, updated: Partial<Service>) => {
    try {
      await updateDoc(doc(db, 'services', id), cleanData(updated));
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `services/${id}`);
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'services', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `services/${id}`);
    }
  };

  // GASTOS FIJOS
  const handleAddFixedExpense = async (exp: Omit<FixedExpense, 'id'>) => {
    const id = `fe-${Date.now()}`;
    const newExp: FixedExpense = {
      id,
      ...exp
    };
    try {
      await setDoc(doc(db, 'fixedExpenses', id), newExp);
      await addAuditLog(
        'add_fixed_expense',
        `Registró un nuevo gasto fijo "${newExp.concept}" por un importe de ${newExp.amount} €`
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `fixedExpenses/${id}`);
    }
  };

  const handleUpdateFixedExpense = async (id: string, updated: Partial<FixedExpense>) => {
    try {
      const prevExp = fixedExpenses.find(e => e.id === id);
      await updateDoc(doc(db, 'fixedExpenses', id), cleanData(updated));
      const exp = { ...prevExp, ...updated };
      await addAuditLog(
        'update_fixed_expense',
        `Actualizó el gasto fijo "${prevExp?.concept || ''}" -> "${exp.concept}" por un importe de ${exp.amount} €`
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `fixedExpenses/${id}`);
    }
  };

  const handleDeleteFixedExpense = async (id: string) => {
    try {
      const exp = fixedExpenses.find(e => e.id === id);
      await deleteDoc(doc(db, 'fixedExpenses', id));
      if (exp) {
        await addAuditLog(
          'delete_fixed_expense',
          `Eliminó el gasto fijo "${exp.concept}" por un importe de ${exp.amount} €`
        );
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `fixedExpenses/${id}`);
    }
  };

  // GASTOS VARIABLES
  const handleAddVariableExpense = async (exp: Omit<VariableExpense, 'id'>) => {
    const id = `ve-${Date.now()}`;
    const newExp: VariableExpense = {
      id,
      ...exp
    };
    try {
      await setDoc(doc(db, 'variableExpenses', id), newExp);
      await addAuditLog(
        'add_variable_expense',
        `Registró un nuevo gasto variable "${newExp.concept}" por un importe de ${newExp.amount} € (Fecha: ${newExp.date})`
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `variableExpenses/${id}`);
    }
  };

  const handleUpdateVariableExpense = async (id: string, updated: Partial<VariableExpense>) => {
    try {
      const prevExp = variableExpenses.find(e => e.id === id);
      await updateDoc(doc(db, 'variableExpenses', id), cleanData(updated));
      const exp = { ...prevExp, ...updated };
      await addAuditLog(
        'update_variable_expense',
        `Actualizó el gasto variable "${prevExp?.concept || ''}" -> "${exp.concept}" por un importe de ${exp.amount} € (Fecha: ${exp.date})`
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `variableExpenses/${id}`);
    }
  };

  const handleDeleteVariableExpense = async (id: string) => {
    try {
      const exp = variableExpenses.find(e => e.id === id);
      await deleteDoc(doc(db, 'variableExpenses', id));
      if (exp) {
        await addAuditLog(
          'delete_variable_expense',
          `Eliminó el gasto variable "${exp.concept}" por un importe de ${exp.amount} € (Fecha: ${exp.date})`
        );
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `variableExpenses/${id}`);
    }
  };

  // TRABAJADORES (PERSONAL)
  const handleAddWorker = async (worker: Omit<User, 'id' | 'role'>) => {
    const id = `u-${Date.now()}`;
    const newWorker: User = {
      id,
      role: 'worker',
      ...worker
    };
    try {
      await setDoc(doc(db, 'users', id), cleanData(newWorker));
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${id}`);
    }
  };

  const handleUpdateWorker = async (id: string, updated: Partial<User>) => {
    try {
      await updateDoc(doc(db, 'users', id), cleanData(updated));
      if (currentUser && currentUser.id === id) {
        setCurrentUser((prev) => prev ? { ...prev, ...updated } : null);
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${id}`);
    }
  };

  const handleDeleteWorker = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${id}`);
    }
  };

  // CONFIGURACIÓN GLOBAL
  const handleUpdateSettings = async (newSettings: AppSettings) => {
    try {
      const prevRate = settings.globalCommissionRate;
      const prevBudget = settings.monthlyVariableBudget ?? 500;
      await setDoc(doc(db, 'settings', 'global'), newSettings);
      
      let logDetail = `Modificó la comisión global del personal del ${prevRate}% al ${newSettings.globalCommissionRate}%`;
      if (newSettings.monthlyVariableBudget !== undefined && newSettings.monthlyVariableBudget !== prevBudget) {
        logDetail += ` y el presupuesto de gastos variables de ${prevBudget} € a ${newSettings.monthlyVariableBudget} €`;
      }
      
      await addAuditLog(
        'update_settings',
        logDetail
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'settings/global');
    }
  };

  // REGISTRO DE PAGOS DE NÓMINA (BI-MENSUAL/QUINCENAL)
  const handleRegisterPayrollPayment = async (payment: Omit<PayrollPayment, 'id'>) => {
    const id = `pay-${Date.now()}`;
    const newPayment: PayrollPayment = {
      id,
      ...payment
    };
    try {
      await setDoc(doc(db, 'payrollPayments', id), cleanData(newPayment));
      
      const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      const periodLabel = payment.period === 'first-half' ? '1ª quincena (1-15)' : '2ª quincena (16-fin de mes)';
      await addAuditLog(
        'register_payroll_payment',
        `Registró un pago de nómina de ${payment.amountPaid} € a ${payment.workerName} (${periodLabel} de ${monthNames[payment.month]} de ${payment.year})`
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `payrollPayments/${id}`);
    }
  };

  const handleDeletePayrollPayment = async (id: string) => {
    try {
      const payObj = payrollPayments.find(p => p.id === id);
      await deleteDoc(doc(db, 'payrollPayments', id));
      if (payObj) {
        const monthNames = [
          'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        const periodLabel = payObj.period === 'first-half' ? '1ª quincena (1-15)' : '2ª quincena (16-fin de mes)';
        await addAuditLog(
          'delete_payroll_payment',
          `Eliminó el registro de pago de nómina de ${payObj.amountPaid} € a ${payObj.workerName} (${periodLabel} de ${monthNames[payObj.month]} de ${payObj.year})`
        );
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `payrollPayments/${id}`);
    }
  };

  // RESET DATABASE TRIGGER (Para el Administrador o facilidad de testing)
  const handleResetToDefaults = async () => {
    if (window.confirm('¿Seguro que quieres restaurar la base de datos a los valores de fábrica? Perderás tus registros nuevos.')) {
      try {
        for (const user of users) {
          await deleteDoc(doc(db, 'users', user.id));
        }
        for (const cat of categories) {
          await deleteDoc(doc(db, 'categories', cat.id));
        }
        for (const srv of services) {
          await deleteDoc(doc(db, 'services', srv.id));
        }
        for (const tk of tickets) {
          await deleteDoc(doc(db, 'tickets', tk.id));
        }
        for (const exp of fixedExpenses) {
          await deleteDoc(doc(db, 'fixedExpenses', exp.id));
        }
        for (const exp of variableExpenses) {
          await deleteDoc(doc(db, 'variableExpenses', exp.id));
        }
        await deleteDoc(doc(db, 'settings', 'global'));

        for (const user of INITIAL_USERS) {
          await setDoc(doc(db, 'users', user.id), user);
        }
        for (const cat of INITIAL_CATEGORIES) {
          await setDoc(doc(db, 'categories', cat.id), cat);
        }
        for (const srv of INITIAL_SERVICES) {
          await setDoc(doc(db, 'services', srv.id), srv);
        }
        //for (const tk of INITIAL_TICKETS) {
          //await setDoc(doc(db, 'tickets', tk.id), tk);
        //}
        for (const exp of INITIAL_FIXED_EXPENSES) {
          await setDoc(doc(db, 'fixedExpenses', exp.id), exp);
        }
        for (const exp of INITIAL_VARIABLE_EXPENSES) {
          await setDoc(doc(db, 'variableExpenses', exp.id), exp);
        }
        await setDoc(doc(db, 'settings', 'global'), INITIAL_SETTINGS);

        setCurrentUser(null);
        localStorage.clear();
        alert('¡Base de datos restaurada en Firestore!');
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, 'reset-database');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between selection:bg-amber-500/20 selection:text-amber-800">
      
      {/* Área Principal de Contenido */}
      <main className="flex-1">
        {!currentUser ? (
          <Login users={users} onLogin={handleLogin} />
        ) : currentUser.role === 'admin' ? (
          <AdminDashboard
            admin={currentUser}
            users={users}
            categories={categories}
            services={services}
            tickets={tickets}
            fixedExpenses={fixedExpenses}
            variableExpenses={variableExpenses}
            settings={settings}
            auditLogs={auditLogs}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            payrollPayments={payrollPayments}
            onRegisterPayrollPayment={handleRegisterPayrollPayment}
            onDeletePayrollPayment={handleDeletePayrollPayment}
            onAddTicket={handleAddTicket}
            onDeleteTicket={handleDeleteTicket}
            onRejectDeleteTicket={handleRejectDeleteTicket}
            onAddCategory={handleAddCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
            onAddService={handleAddService}
            onUpdateService={handleUpdateService}
            onDeleteService={handleDeleteService}
            onAddFixedExpense={handleAddFixedExpense}
            onUpdateFixedExpense={handleUpdateFixedExpense}
            onDeleteFixedExpense={handleDeleteFixedExpense}
            onAddVariableExpense={handleAddVariableExpense}
            onUpdateVariableExpense={handleUpdateVariableExpense}
            onDeleteVariableExpense={handleDeleteVariableExpense}
            onAddWorker={handleAddWorker}
            onUpdateWorker={handleUpdateWorker}
            onDeleteWorker={handleDeleteWorker}
            onUpdateSettings={handleUpdateSettings}
            onLogout={handleLogout}
            onChangeMonth={setSelectedMonth}
            onChangeYear={setSelectedYear}
          />
        ) : (
          <WorkerDashboard
            worker={currentUser}
            categories={categories}
            services={services}
            tickets={tickets}
            settings={settings}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            payrollPayments={payrollPayments}
            onAddTicket={handleAddTicket}
            onRequestDeleteTicket={handleRequestDeleteTicket}
            onCancelRequestDeleteTicket={handleCancelRequestDeleteTicket}
            onLogout={handleLogout}
            onChangeMonth={setSelectedMonth}
            onChangeYear={setSelectedYear}
          />
        )}
      </main>

      {/* Pie de Página Minimalista */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 font-medium">
        <div className="flex justify-center items-center gap-1.5 mb-1">
          <Scissors className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-display font-semibold tracking-tight text-slate-600">SalonProfit</span>
          <span className="text-slate-300">|</span>
          <span>Control Financiero Profesional</span>
        </div>
        <div>
          © 2026 SalonProfit Inc. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
