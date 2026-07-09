/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Scissors, Lock, User as UserIcon, AlertCircle, ArrowRight, Mail, ShieldCheck, Briefcase } from 'lucide-react';
import { motion } from 'motion/react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface LoginProps {
  users: User[];
  onLogin: (user: User) => void;
}

export default function Login({ users, onLogin }: LoginProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Campos de Login
  const [loginIdentifier, setLoginIdentifier] = useState(''); // Puede ser email o username
  const [loginPassword, setLoginPassword] = useState('');

  // Campos de Registro
  const [registerName, setRegisterName] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerRole, setRegisterRole] = useState<UserRole>('worker');

  // Traducir códigos de error de Firebase Auth a mensajes amigables en español
  const getFriendlyErrorMessage = (err: any): string => {
    if (!err) return 'Ocurrió un error inesperado.';
    const code = err.code;
    switch (code) {
      case 'auth/invalid-email':
        return 'El correo electrónico ingresado no es válido.';
      case 'auth/user-disabled':
        return 'Esta cuenta ha sido deshabilitada.';
      case 'auth/user-not-found':
      case 'auth/invalid-credential':
        return 'Usuario, correo o contraseña incorrectos.';
      case 'auth/wrong-password':
        return 'La contraseña es incorrecta.';
      case 'auth/email-already-in-use':
        return 'Este correo electrónico ya está registrado en el sistema.';
      case 'auth/weak-password':
        return 'La contraseña debe tener al menos 6 caracteres.';
      case 'auth/operation-not-allowed':
        return 'El inicio de sesión con correo y contraseña no está configurado.';
      default:
        return err.message || 'Error al conectar con la autenticación de Firebase.';
    }
  };

  // Lógica para intentar iniciar sesión y manejar usuarios legacy sobre la marcha
  const attemptLogin = async (email: string, passwordToUse: string, matchingUser?: User) => {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, passwordToUse);
      
      // Si el inicio de sesión tiene éxito, buscamos o actualizamos su perfil en Firestore
      const uid = userCred.user.uid;
      
      // Si era un usuario inicial / predefinido que no existía en el Auth, lo vinculamos.
      if (matchingUser && matchingUser.id !== uid) {
        // Para que se sincronice con su historial correctamente, actualizamos su doc en Firestore con su nuevo uid
        const userRef = doc(db, 'users', uid);
        await setDoc(userRef, {
          id: uid,
          name: matchingUser.name,
          username: matchingUser.username,
          email: email,
          role: matchingUser.role,
          password: passwordToUse
        });
      }
    } catch (err: any) {
      // Si el usuario no existe en Firebase Auth, pero coincide con un usuario local válido,
      // procedemos a registrarlo automáticamente para mantener la facilidad de testeo y retrocompatibilidad.
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        const legacyUser = matchingUser || users.find(
          u => u.username.toLowerCase() === loginIdentifier.trim().toLowerCase() ||
               (u.email && u.email.toLowerCase() === loginIdentifier.trim().toLowerCase())
        );

        if (legacyUser && legacyUser.password === passwordToUse) {
          // Auto-registro en Firebase Auth de usuario preexistente
          try {
            const userCred = await createUserWithEmailAndPassword(auth, email, passwordToUse);
            const uid = userCred.user.uid;
            
            // Creamos su perfil en la base de datos de Firestore
            await setDoc(doc(db, 'users', uid), {
              id: uid,
              name: legacyUser.name,
              username: legacyUser.username,
              email: email,
              role: legacyUser.role,
              password: passwordToUse
            });
            return;
          } catch (regErr) {
            console.error("Error al registrar automáticamente usuario inicial en Auth:", regErr);
            throw err;
          }
        }
      }
      throw err;
    }
  };

  // Manejar Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const input = loginIdentifier.trim();
    let email = input;
    let matchingUser = users.find(u => u.username.toLowerCase() === input.toLowerCase());

    // Si no contiene '@', asumimos que es un nombre de usuario y lo mapeamos a su respectivo correo
    if (!input.includes('@')) {
      if (matchingUser) {
        email = matchingUser.email || `${matchingUser.username.toLowerCase()}@salonprofit.com`;
      } else {
        email = `${input.toLowerCase()}@salonprofit.com`;
      }
    } else {
      // Si ingresó un email, buscar el usuario correspondiente por email
      matchingUser = users.find(u => u.email?.toLowerCase() === input.toLowerCase());
    }

    try {
      await attemptLogin(email, loginPassword, matchingUser);
      setSuccessMsg('¡Sesión iniciada con éxito!');
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Manejar Registro (Sign Up)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const usernameTrimmed = registerUsername.trim().toLowerCase();
    const emailTrimmed = registerEmail.trim().toLowerCase();

    // Validar nombre de usuario duplicado localmente
    const duplicateUsername = users.some(u => u.username.toLowerCase() === usernameTrimmed);
    if (duplicateUsername) {
      setError('El nombre de usuario ya está en uso. Por favor elige otro.');
      setLoading(false);
      return;
    }

    try {
      // 1. Crear usuario en Firebase Authentication
      const userCred = await createUserWithEmailAndPassword(auth, emailTrimmed, registerPassword);
      const uid = userCred.user.uid;

      // 2. Guardar perfil adicional en Firestore
      await setDoc(doc(db, 'users', uid), {
        id: uid,
        name: registerName.trim(),
        username: usernameTrimmed,
        email: emailTrimmed,
        role: registerRole,
        password: registerPassword // Guardado para compatibilidad y fácil testing
      });

      setSuccessMsg('¡Cuenta registrada con éxito! Iniciando sesión...');
      // Limpiar campos
      setRegisterName('');
      setRegisterUsername('');
      setRegisterEmail('');
      setRegisterPassword('');
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Acceso Rápido para Pruebas (Admin y Trabajadores Iniciales)
  const handleQuickLogin = async (user: User) => {
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const email = user.email || `${user.username.toLowerCase()}@salonprofit.com`;
    const password = user.password || '123456';

    try {
      // Rellenar campos visualmente
      setLoginIdentifier(user.username);
      setLoginPassword(password);

      await attemptLogin(email, password, user);
      setSuccessMsg('¡Sesión iniciada mediante Acceso Rápido!');
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-lg" id="login-card-container">
        {/* Header de la marca */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/20 mb-3 animate-bounce">
            <Scissors className="w-7 h-7" />
          </div>
          <h1 className="font-display text-3xl font-bold text-slate-800 tracking-tight">
            SalonProfit
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Control de Finanzas e Ingresos con Autenticación de Firebase
          </p>
        </div>

        {/* Caja Principal con pestañas */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden"
        >
          {/* Pestanas superiores de navegación */}
          <div className="flex border-b border-slate-100 bg-slate-50/50">
            <button
              onClick={() => {
                setActiveTab('login');
                setError('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-4 text-center font-semibold text-sm transition-all relative cursor-pointer ${
                activeTab === 'login' ? 'text-amber-600 bg-white' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Iniciar Sesión
              {activeTab === 'login' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('register');
                setError('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-4 text-center font-semibold text-sm transition-all relative cursor-pointer ${
                activeTab === 'register' ? 'text-amber-600 bg-white' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Crear Cuenta (Registro)
              {activeTab === 'register' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
              )}
            </button>
          </div>

          <div className="p-8">
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 mb-5 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-start gap-2.5 p-3.5 mb-5 rounded-xl bg-emerald-50 text-emerald-600 text-sm border border-emerald-100 font-medium">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                <span>{successMsg}</span>
              </div>
            )}

            {activeTab === 'login' ? (
              /* FORMULARIO DE INICIO DE SESIÓN */
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Usuario o Correo Electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      id="login-identifier-input"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
                      placeholder="ej. sofia@salonprofit.com o sofia"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      id="login-password-input"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  id="login-submit-button"
                  disabled={loading}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-medium rounded-xl transition-all shadow-md shadow-amber-500/15 flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
                >
                  <span>{loading ? 'Iniciando sesión...' : 'Ingresar al Sistema'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* FORMULARIO DE REGISTRO */
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      id="register-name-input"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
                      placeholder="ej. Eduardo Castro"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      Nombre de Usuario
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <span className="text-xs font-bold font-mono">@</span>
                      </div>
                      <input
                        type="text"
                        required
                        id="register-username-input"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
                        placeholder="ej. eduardo"
                        value={registerUsername}
                        onChange={(e) => setRegisterUsername(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        id="register-email-input"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
                        placeholder="ej. eduardo@gmail.com"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      id="register-password-input"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
                      placeholder="Mínimo 6 caracteres"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Selección de Rol */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Rol en el Sistema
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRegisterRole('worker')}
                      className={`py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        registerRole === 'worker'
                          ? 'border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-500/10'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <Briefcase className="w-4 h-4" />
                      <span>Estilista (Trabajador)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegisterRole('admin')}
                      className={`py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        registerRole === 'admin'
                          ? 'border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-500/10'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Administrador</span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  id="register-submit-button"
                  disabled={loading}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-medium rounded-xl transition-all shadow-md shadow-amber-500/15 flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-50"
                >
                  <span>{loading ? 'Creando cuenta...' : 'Crear Cuenta y Entrar'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Divisor */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider">
                  Acceso Rápido de Prueba
                </span>
              </div>
            </div>

            {/* Botones de acceso rápido */}
            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold text-slate-400 mb-2">Administrador:</div>
                <button
                  type="button"
                  id="btn-quick-admin"
                  onClick={() => handleQuickLogin(users[0] || { id: 'u-admin', username: 'admin', name: 'Eduardo Castro (Admin)', role: 'admin', password: 'admin123' })}
                  disabled={loading}
                  className="w-full py-2 px-3 text-left border border-slate-200 hover:border-amber-500 hover:bg-amber-50/30 text-slate-700 hover:text-amber-800 rounded-xl text-xs transition-all flex items-center justify-between cursor-pointer disabled:opacity-50"
                >
                  <span className="font-medium">Eduardo Castro (Admin)</span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
                    User: admin / Pass: admin123
                  </span>
                </button>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-400 mb-2">Trabajadores de la plantilla:</div>
                <div className="grid grid-cols-2 gap-2">
                  {users.slice(1, 5).map((worker) => (
                    <button
                      key={worker.id}
                      type="button"
                      id={`btn-quick-${worker.username}`}
                      onClick={() => handleQuickLogin(worker)}
                      disabled={loading}
                      className="py-2 px-3 text-left border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-slate-700 rounded-xl text-xs transition-all flex flex-col gap-0.5 cursor-pointer disabled:opacity-50"
                    >
                      <span className="font-medium truncate">{worker.name.split(' ')[0]}</span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        User: {worker.username} / Pass: {worker.password || '123456'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
