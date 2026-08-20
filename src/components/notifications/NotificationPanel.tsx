import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  CheckCheck,
  Trash2,
  Calendar,
  FileText,
  School,
  Clock,
  Sparkles,
  X,
  CheckCircle2,
  RotateCcw,
  Check,
  BookmarkCheck,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';
import { AcademicNotification, NotificationType, ActiveTab } from '../../types';
import { useApp } from '../../context/AppContext';
import { generateRealNotifications } from '../../utils/notificationGenerator';
import { safeGet, safeSet } from '../../utils/storage';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    exams,
    schedule,
    subjects,
    currentUser,
    setActiveTab,
  } = useApp();

  const panelRef = useRef<HTMLDivElement>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | NotificationType>('all');

  const userKey = currentUser?.email
    ? currentUser.email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_')
    : 'guest';

  const readStorageKey = `campusbloom_${userKey}_notifs_read_ids`;
  const dismissedStorageKey = `campusbloom_${userKey}_notifs_dismissed_ids`;

  // Persistent Sets of Read and Dismissed Notification IDs
  const [readIds, setReadIds] = useState<string[]>(() => {
    return safeGet<string[]>(readStorageKey, []);
  });

  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    return safeGet<string[]>(dismissedStorageKey, []);
  });

  // Sync to storage
  useEffect(() => {
    safeSet(readStorageKey, readIds);
  }, [readIds, readStorageKey]);

  useEffect(() => {
    safeSet(dismissedStorageKey, dismissedIds);
  }, [dismissedIds, dismissedStorageKey]);

  // Compute Real Notifications Dynamically
  const notifications: AcademicNotification[] = useMemo(() => {
    const raw = generateRealNotifications({
      exams,
      schedule,
      subjects,
      userKey,
    });

    return raw
      .filter((n) => !dismissedIds.includes(n.id))
      .map((n) => ({
        ...n,
        isRead: readIds.includes(n.id),
      }));
  }, [exams, schedule, subjects, userKey, dismissedIds, readIds]);

  // Close on Escape or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        const bellBtn = document.getElementById('header-notifications-bell-btn');
        if (bellBtn && bellBtn.contains(e.target as Node)) return;
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllAsRead = () => {
    const allVisibleIds = notifications.map((n) => n.id);
    setReadIds((prev) => Array.from(new Set([...prev, ...allVisibleIds])));
  };

  const handleToggleRead = (id: string) => {
    setReadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const handleClearAll = () => {
    const allVisibleIds = notifications.map((n) => n.id);
    setDismissedIds((prev) => Array.from(new Set([...prev, ...allVisibleIds])));
  };

  const handleRestoreDismissed = () => {
    setDismissedIds([]);
  };

  const handleNotificationClick = (notif: AcademicNotification) => {
    // Mark as read
    if (!readIds.includes(notif.id)) {
      setReadIds((prev) => [...prev, notif.id]);
    }

    // Navigate to appropriate tab based on notification type / tag
    if (notif.type === 'exam') {
      setActiveTab('examenes');
    } else if (notif.tag?.includes('Investigación') || notif.tag?.includes('Tesis') || notif.tag?.includes('Habilitación')) {
      setActiveTab('investigacion');
    } else if (notif.type === 'attendance') {
      setActiveTab('asistencia');
    } else {
      setActiveTab('cronograma');
    }

    onClose();
  };

  const filteredNotifications = notifications.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !item.isRead;
    return item.type === activeFilter;
  });

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'exam':
        return <Calendar className="w-4 h-4 text-[#864e5a]" />;
      case 'assignment':
        return <FileText className="w-4 h-4 text-[#8a5a44]" />;
      case 'campus':
        return <School className="w-4 h-4 text-[#4e6535]" />;
      case 'attendance':
        return <Clock className="w-4 h-4 text-[#2b6b60]" />;
      default:
        return <Sparkles className="w-4 h-4 text-[#864e5a]" />;
    }
  };

  const getNotificationColorStyles = (type: NotificationType, isRead: boolean) => {
    if (isRead) {
      return {
        badgeBg: 'bg-black/5 text-[#514345]',
        cardBg: 'bg-white/55 border-white/60 hover:bg-white/80',
        iconBg: 'bg-white/80',
      };
    }

    switch (type) {
      case 'exam':
        return {
          badgeBg: 'bg-[#ffd9df] text-[#783e4c] border-[#ffccd5]',
          cardBg: 'bg-gradient-to-r from-white/95 via-white/85 to-[#fff5f7] border-[#ffd9df] shadow-sm',
          iconBg: 'bg-[#ffd9df]/80',
        };
      case 'assignment':
        return {
          badgeBg: 'bg-[#fedbc7] text-[#6b3820] border-[#facbb2]',
          cardBg: 'bg-gradient-to-r from-white/95 via-white/85 to-[#fff9f5] border-[#fedbc7] shadow-sm',
          iconBg: 'bg-[#fedbc7]/80',
        };
      case 'campus':
        return {
          badgeBg: 'bg-[#cde9ac] text-[#374d20] border-[#b4cf95]',
          cardBg: 'bg-gradient-to-r from-white/95 via-white/85 to-[#f7fcf2] border-[#cde9ac] shadow-sm',
          iconBg: 'bg-[#cde9ac]/80',
        };
      case 'attendance':
        return {
          badgeBg: 'bg-[#c8e6c9] text-[#1b5e20] border-[#a5d6a7]',
          cardBg: 'bg-gradient-to-r from-white/95 via-white/85 to-[#f4faf4] border-[#c8e6c9] shadow-sm',
          iconBg: 'bg-[#c8e6c9]/80',
        };
      default:
        return {
          badgeBg: 'bg-[#ffd9df] text-[#783e4c]',
          cardBg: 'bg-white/90 border-white',
          iconBg: 'bg-[#ffd9df]/60',
        };
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          id="academic-notifications-dropdown-panel"
          initial={{ opacity: 0, y: -10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.96 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute right-3 sm:right-8 top-16 w-[calc(100vw-24px)] sm:w-[430px] max-h-[85vh] flex flex-col rounded-[26px] bg-white/85 backdrop-blur-2xl border border-white/90 shadow-2xl shadow-[#864e5a]/20 z-50 overflow-hidden text-[#1b1c1c]"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-black/5 flex items-center justify-between bg-gradient-to-b from-white/95 to-white/70">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-[#ffd9df] text-[#864e5a] shadow-xs">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-base font-extrabold text-[#1b1c1c] tracking-tight">
                    Rincón de Avisos
                  </h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#ba1a1a] text-white shadow-xs animate-pulse">
                      {unreadCount} nuevo{unreadCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#514345]/80 font-medium">
                  Alertas en tiempo real de tu calendario y materias
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  title="Marcar todas como leídas"
                  className="px-2.5 py-1.5 rounded-xl bg-white/80 hover:bg-[#cde9ac] text-[#4e6535] text-[11px] font-bold border border-white shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Leídas</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-[#514345] hover:text-[#1b1c1c] hover:bg-white/80 transition-colors cursor-pointer"
                aria-label="Cerrar panel de avisos"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="px-4 py-2.5 bg-black/[0.02] border-b border-black/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all text-[11px] cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-[#864e5a] text-white shadow-xs'
                  : 'bg-white/60 text-[#514345] hover:bg-white/90'
              }`}
            >
              Todas ({notifications.length})
            </button>

            <button
              onClick={() => setActiveFilter('unread')}
              className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all text-[11px] flex items-center gap-1 cursor-pointer ${
                activeFilter === 'unread'
                  ? 'bg-[#ba1a1a] text-white shadow-xs'
                  : 'bg-white/60 text-[#514345] hover:bg-white/90'
              }`}
            >
              No leídas ({unreadCount})
            </button>

            <button
              onClick={() => setActiveFilter('exam')}
              className={`px-2.5 py-1 rounded-xl font-semibold whitespace-nowrap transition-all text-[11px] cursor-pointer ${
                activeFilter === 'exam'
                  ? 'bg-[#4e6535] text-white shadow-xs'
                  : 'bg-white/60 text-[#514345] hover:bg-white/90'
              }`}
            >
              Exámenes
            </button>

            <button
              onClick={() => setActiveFilter('assignment')}
              className={`px-2.5 py-1 rounded-xl font-semibold whitespace-nowrap transition-all text-[11px] cursor-pointer ${
                activeFilter === 'assignment'
                  ? 'bg-[#4e6535] text-white shadow-xs'
                  : 'bg-white/60 text-[#514345] hover:bg-white/90'
              }`}
            >
              Entregas / Tesis
            </button>

            <button
              onClick={() => setActiveFilter('campus')}
              className={`px-2.5 py-1 rounded-xl font-semibold whitespace-nowrap transition-all text-[11px] cursor-pointer ${
                activeFilter === 'campus'
                  ? 'bg-[#4e6535] text-white shadow-xs'
                  : 'bg-white/60 text-[#514345] hover:bg-white/90'
              }`}
            >
              Agenda
            </button>
          </div>

          {/* Notifications Scrollable List */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 max-h-[50vh] min-h-[160px]">
            {filteredNotifications.length === 0 ? (
              <div className="py-10 px-4 flex flex-col items-center justify-center text-center text-[#514345] space-y-2.5">
                <div className="w-12 h-12 rounded-2xl bg-white/80 border border-white flex items-center justify-center text-[#6ca561] shadow-sm">
                  <BookmarkCheck className="w-6 h-6 text-[#4e6535]" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-extrabold text-[#1b1c1c]">
                    {activeFilter === 'unread'
                      ? '¡Estás al día con todos tus avisos!'
                      : 'Sin avisos pendientes por el momento ✨'}
                  </p>
                  <p className="text-xs text-[#514345]/75 max-w-[280px] leading-relaxed mx-auto">
                    {activeFilter === 'unread'
                      ? 'No tienes notificaciones pendientes de lectura.'
                      : 'Tus alertas automáticas de exámenes próximos, clases y requisitos de investigación aparecerán aquí.'}
                  </p>
                </div>

                {dismissedIds.length > 0 && (
                  <button
                    onClick={handleRestoreDismissed}
                    className="mt-1 px-3.5 py-1.5 rounded-xl bg-[#cde9ac] hover:bg-[#b8da93] text-[#374d20] text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Restaurar avisos descartados ({dismissedIds.length})
                  </button>
                )}
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const styles = getNotificationColorStyles(notif.type, notif.isRead);
                return (
                  <motion.div
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.18 }}
                    className={`p-3.5 rounded-2xl border transition-all duration-200 flex flex-col gap-2 relative group ${styles.cardBg}`}
                  >
                    {/* Top Row: Type Tag, Timestamp, Unread status dot */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <div className={`p-1 rounded-lg ${styles.iconBg}`}>
                          {getNotificationIcon(notif.type)}
                        </div>
                        {notif.tag && (
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${styles.badgeBg}`}
                          >
                            {notif.tag}
                          </span>
                        )}
                        {!notif.isRead && (
                          <span className="flex h-2 w-2 relative" title="No leído">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ba1a1a] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ba1a1a]"></span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-[#514345]/75">
                          {notif.timestamp}
                        </span>

                        {/* Quick Dismiss Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDismiss(notif.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-[#514345] hover:text-[#ba1a1a] hover:bg-black/5 transition-all cursor-pointer"
                          title="Descartar aviso"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Content (Click to Navigate) */}
                    <div
                      onClick={() => handleNotificationClick(notif)}
                      className="cursor-pointer space-y-1 hover:opacity-90 transition-opacity"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4
                          className={`text-[13px] font-bold tracking-tight leading-snug ${
                            notif.isRead ? 'text-[#3b3335]' : 'text-[#1b1c1c] font-extrabold'
                          }`}
                        >
                          {notif.title}
                        </h4>
                        <ArrowRight className="w-3.5 h-3.5 text-[#864e5a] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                      </div>
                      <p className="text-[11.5px] text-[#514345] leading-relaxed font-medium">
                        {notif.description}
                      </p>
                    </div>

                    {/* Footer Row: Date & Mark as Read Toggle */}
                    <div className="flex items-center justify-between pt-1 border-t border-black/[0.04] text-[11px]">
                      <span className="text-[10px] font-bold text-[#864e5a] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#864e5a]" /> {notif.date}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleRead(notif.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            notif.isRead
                              ? 'text-[#514345] hover:bg-black/5'
                              : 'bg-[#4e6535] text-white hover:bg-[#3d5029] shadow-2xs'
                          }`}
                        >
                          {notif.isRead ? (
                            <>
                              <Check className="w-3 h-3 text-[#4e6535]" /> Leído
                            </>
                          ) : (
                            <>Marcar leído</>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          {notifications.length > 0 && (
            <div className="p-3 px-4 border-t border-black/5 bg-white/80 flex items-center justify-between text-xs text-[#514345]">
              <span className="text-[11px] font-medium">
                {unreadCount > 0 ? (
                  <span>
                    <strong>{unreadCount}</strong> aviso{unreadCount > 1 ? 's' : ''} pendiente{unreadCount > 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="text-[#374d20] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#4e6535]" /> Al día con tus avisos
                  </span>
                )}
              </span>

              <button
                onClick={handleClearAll}
                className="text-[11px] font-bold text-[#ba1a1a] hover:underline flex items-center gap-1 transition-opacity cursor-pointer"
              >
                <Trash2 className="w-3 h-3" /> Limpiar avisos
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
