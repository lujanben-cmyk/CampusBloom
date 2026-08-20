import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  HeartPulse,
  Mail,
  Lock,
  User,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  School,
  ShieldCheck,
  Flower2,
} from 'lucide-react';
import { AuthUser } from '../../types';

interface AuthViewProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess }) => {
  // Form Fields - Clean Slate (Blank by default)
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [university, setUniversity] = useState<string>('');
  const [career, setCareer] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Status
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanUniversity = university.trim() || 'Tu Universidad';
    const cleanCareer = career.trim() || 'Tu Carrera';

    if (!cleanName) {
      setErrorMessage('Por favor ingresa tu Nombre Completo.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Por favor ingresa un Correo Institucional o Personal válido (ej. usuario@universidad.edu).');
      return;
    }

    if (!password.trim() || password.length < 4) {
      setErrorMessage('Por favor ingresa tu contraseña de acceso (mínimo 4 caracteres).');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      try {
        const raw = localStorage.getItem('campusbloom_registered_users');
        const users: AuthUser[] = raw ? JSON.parse(raw) : [];

        let existing = users.find((u) => u.email.toLowerCase() === cleanEmail);

        const authenticatedUser: AuthUser = {
          id: existing?.id || `user-${Date.now()}`,
          name: cleanName,
          email: cleanEmail,
          career: cleanCareer,
          university: cleanUniversity,
          avatarUrl: existing?.avatarUrl || '',
          createdAt: existing?.createdAt || new Date().toISOString().split('T')[0],
        };

        if (existing) {
          const index = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);
          users[index] = authenticatedUser;
        } else {
          users.push(authenticatedUser);
        }

        localStorage.setItem('campusbloom_registered_users', JSON.stringify(users));

        setSuccessMessage(`¡Bienvenido/a a CampusBloom, ${cleanName.split(' ')[0]}!`);
        setTimeout(() => {
          onLoginSuccess(authenticatedUser);
        }, 400);
      } catch (err) {
        console.error('Auth error', err);
        setErrorMessage('Ocurrió un error al procesar el inicio de sesión.');
      } finally {
        setIsLoading(false);
      }
    }, 450);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-20 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg rounded-[32px] bg-white/90 backdrop-blur-2xl border border-white/80 p-6 sm:p-9 shadow-2xl shadow-[#864e5a]/15 flex flex-col gap-6 relative overflow-hidden"
      >
        {/* Decorative Top Ambient Glows */}
        <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-[#ffd9df]/60 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-[#cde9ac]/50 blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-2.5 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-[#4e6535] shadow-lg shadow-[#4e6535]/30 border-2 border-white flex items-center justify-center text-white mb-1">
            <HeartPulse className="w-8 h-8 text-[#cde9ac] animate-pulse" />
          </div>

          <div className="flex items-center gap-2">
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1b1c1c]">
              Campus<span className="text-[#864e5a]">Bloom</span>
            </h1>
          </div>

          <p className="text-xs font-semibold text-[#514345]">
            Portal Académico Universitario & Control de Rendimiento
          </p>
        </div>

        {/* Authentication Card Title */}
        <div className="flex items-center justify-between px-1 pb-1 border-b border-black/5">
          <div className="flex items-center gap-2 text-xs font-extrabold text-[#864e5a] uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-[#864e5a]" />
            <span>Configuración de Perfil & Acceso</span>
          </div>
          <span className="text-[11px] font-bold text-[#4e6535] flex items-center gap-1">
            <Flower2 className="w-3.5 h-3.5" />
            Lienzo en Blanco
          </span>
        </div>

        {/* Status Alerts */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 rounded-2xl bg-[#ffdad6] text-[#ba1a1a] border border-[#ffb4ab] flex items-center gap-2 text-xs font-semibold"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 rounded-2xl bg-[#cde9ac] text-[#374d20] border border-[#b4cf95] flex items-center gap-2 text-xs font-bold"
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Authentication Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* 1. Nombre del Estudiante */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#514345] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#864e5a]" />
              <span>Nombre del Estudiante:</span>
              <span className="text-[#ba1a1a] text-xs">*</span>
            </label>
            <input
              id="auth-input-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Tu Nombre y Apellido"
              className="w-full px-4 py-2.5 rounded-2xl bg-black/[0.03] border border-black/10 text-sm font-medium text-[#1b1c1c] placeholder:text-[#837375] focus:bg-white focus:ring-2 focus:ring-[#864e5a]/25 focus:border-[#864e5a] outline-none transition-all"
            />
          </div>

          {/* 2. Correo Institucional */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#514345] flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#864e5a]" />
              <span>Correo Institucional / Académico:</span>
              <span className="text-[#ba1a1a] text-xs">*</span>
            </label>
            <input
              id="auth-input-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ej: tu.usuario@universidad.edu"
              className="w-full px-4 py-2.5 rounded-2xl bg-black/[0.03] border border-black/10 text-sm font-medium text-[#1b1c1c] placeholder:text-[#837375] focus:bg-white focus:ring-2 focus:ring-[#864e5a]/25 focus:border-[#864e5a] outline-none transition-all"
            />
          </div>

          {/* 3. Universidad / Facultad & 4. Carrera / Año */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#514345] flex items-center gap-1">
                <School className="w-3 h-3 text-[#4e6535]" />
                <span>Universidad / Facultad:</span>
              </label>
              <input
                id="auth-input-university"
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="Ej: Tu Universidad"
                className="w-full px-3 py-2 rounded-xl bg-black/[0.03] border border-black/10 text-xs font-medium text-[#1b1c1c] outline-none focus:bg-white focus:border-[#4e6535] transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#514345] flex items-center gap-1">
                <GraduationCap className="w-3 h-3 text-[#4e6535]" />
                <span>Carrera / Semestre:</span>
              </label>
              <input
                id="auth-input-career"
                type="text"
                value={career}
                onChange={(e) => setCareer(e.target.value)}
                placeholder="Ej: Tu Carrera"
                className="w-full px-3 py-2 rounded-xl bg-black/[0.03] border border-black/10 text-xs font-medium text-[#1b1c1c] outline-none focus:bg-white focus:border-[#4e6535] transition-all"
              />
            </div>
          </div>

          {/* Password (Required) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#514345] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#864e5a]" />
              <span>Contraseña de Acceso:</span>
              <span className="text-[#ba1a1a] text-xs">*</span>
            </label>
            <div className="relative">
              <input
                id="auth-input-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 pr-11 rounded-2xl bg-black/[0.03] border border-black/10 text-sm font-medium text-[#1b1c1c] placeholder:text-[#837375] focus:bg-white focus:ring-2 focus:ring-[#864e5a]/25 focus:border-[#864e5a] outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#837375] hover:text-[#1b1c1c] p-1"
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            id="auth-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#4e6535] to-[#3d5029] hover:from-[#43572d] hover:to-[#334322] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#4e6535]/25 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <>
                <span>Ingresar a CampusBloom</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Privacy & Persistence Note */}
        <div className="text-center pt-2 border-t border-black/5">
          <p className="text-[11px] text-[#514345]/75 leading-relaxed">
            🔒 <strong>Privacidad & Persistencia:</strong> Tus materias, cronograma y notas se guardan de forma segura y personalizada para tu perfil en este dispositivo.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
