import React, { useEffect, useState, useMemo } from 'react';
import { Sparkles, HeartPulse, Clock, Menu, Bell, Headphones, LogOut, User, Mic } from 'lucide-react';
import { NotificationPanel } from './notifications/NotificationPanel';
import { SpotifyPlayerModal } from './spotify/SpotifyPlayerModal';
import { AuthUser } from '../types';
import { useApp } from '../context/AppContext';
import { generateRealNotifications } from '../utils/notificationGenerator';
import { safeGet } from '../utils/storage';

interface HeaderProps {
  onToggleSidebar?: () => void;
  isPetalsActive: boolean;
  setIsPetalsActive: (val: boolean | ((prev: boolean) => boolean)) => void;
  onOpenBackgroundModal: () => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  onNavigateToProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  isPetalsActive,
  setIsPetalsActive,
  onOpenBackgroundModal,
  currentUser,
  onLogout,
  onNavigateToProfile,
}) => {
  const {
    activeSpotifyPlaylist,
    isSpotifyModalOpen,
    setIsSpotifyModalOpen,
    isVoiceModalOpen,
    setIsVoiceModalOpen,
    openVoiceModalWithPrompt,
    exams,
    schedule,
    subjects,
  } = useApp();

  const [time, setTime] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);

  // Compute unread count for the notification badge based on real data
  const userKey = currentUser?.email
    ? currentUser.email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_')
    : 'guest';

  const unreadCount = useMemo(() => {
    const readIds = safeGet<string[]>(`campusbloom_${userKey}_notifs_read_ids`, []);
    const dismissedIds = safeGet<string[]>(`campusbloom_${userKey}_notifs_dismissed_ids`, []);

    const raw = generateRealNotifications({
      exams,
      schedule,
      subjects,
      userKey,
    });

    return raw.filter((n) => !dismissedIds.includes(n.id) && !readIds.includes(n.id)).length;
  }, [exams, schedule, subjects, userKey, isNotificationsOpen]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
      setDateStr(
        now.toLocaleDateString('es-ES', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header id="campusbloom-header" className="w-full flex items-center justify-between px-4 sm:px-8 py-3.5 z-30 relative">
      {/* Brand Identity matching the screenshot */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            id="mobile-sidebar-toggle-btn"
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-2xl glass-card text-[#514345] hover:bg-white/80 transition-colors"
            aria-label="Abrir menú de navegación"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-3.5 group cursor-pointer" onClick={onOpenBackgroundModal}>
          {/* Logo badge with stethoscope in matcha green circle */}
          <div className="w-11 h-11 rounded-2xl bg-[#4e6535]/90 shadow-md shadow-[#4e6535]/25 border border-white/60 flex items-center justify-center text-white transition-transform group-hover:scale-105">
            <HeartPulse className="w-6 h-6 text-[#cde9ac]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-2xl sm:text-[26px] font-bold tracking-tight text-[#1b1c1c] drop-shadow-sm">
                Campus<span className="text-[#864e5a]">Bloom</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#ffb7c5]/40 text-[#7b4551] border border-[#ffb7c5]/60 truncate max-w-[170px]" title={currentUser?.university || 'FCM • Medicina'}>
                {currentUser?.university ? currentUser.university.split('-')[0].trim() : 'FCM • Medicina'}
              </span>
            </div>
            <p className="text-[12px] text-[#514345]/80 font-medium hidden sm:block capitalize">
              {dateStr}
            </p>
          </div>
        </div>
      </div>

      {/* Right Quick Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Clock Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl glass-inner text-xs font-semibold text-[#514345]">
          <Clock className="w-3.5 h-3.5 text-[#864e5a]" />
          <span>{time}</span>
        </div>

        {/* Interactive Notification Bell Button */}
        <div className="relative">
          <button
            id="header-notifications-bell-btn"
            onClick={() => {
              setIsNotificationsOpen((prev) => !prev);
              if (isSpotifyModalOpen) setIsSpotifyModalOpen(false);
            }}
            title="Rincón de Avisos Académicos"
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-xs font-semibold transition-all ${
              isNotificationsOpen
                ? 'bg-[#ffd9df] text-[#6b3743] border-[#ffb7c5] shadow-sm shadow-[#864e5a]/15 ring-2 ring-[#864e5a]/20'
                : unreadCount > 0
                ? 'glass-inner text-[#1b1c1c] hover:bg-white/90 shadow-2xs'
                : 'glass-inner text-[#514345] hover:bg-white/80'
            }`}
          >
            <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'text-[#864e5a]' : 'text-[#837375]'}`} />
            <span className="hidden sm:inline">Avisos</span>

            {/* Unread Badge Counter / Pulse Dot */}
            {unreadCount > 0 && (
              <span
                id="header-unread-notification-badge"
                className="ml-0.5 px-1.5 py-0.2 rounded-full bg-[#ba1a1a] text-white text-[10px] font-extrabold flex items-center justify-center shadow-xs"
              >
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Spotify Integration Button */}
        <div className="relative">
          <button
            id="header-spotify-player-toggle-btn"
            onClick={() => {
              setIsSpotifyModalOpen(!isSpotifyModalOpen);
              if (isNotificationsOpen) setIsNotificationsOpen(false);
            }}
            title="Abrir reproductor y selector de Spotify"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-xs font-semibold transition-all ${
              isSpotifyModalOpen
                ? 'bg-[#cde9ac] text-[#374d20] border-[#b4cf95] shadow-sm shadow-[#4e6535]/20 ring-2 ring-[#4e6535]/20'
                : 'glass-inner text-[#1b1c1c] hover:bg-white/90 shadow-2xs'
            }`}
          >
            {/* Spotify Official Icon */}
            <svg
              className={`w-4 h-4 transition-colors ${
                isSpotifyModalOpen ? 'text-[#1DB954]' : 'text-[#1DB954]'
              } fill-current`}
              viewBox="0 0 24 24"
            >
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.494 17.315c-.216.353-.674.464-1.027.248-2.813-1.718-6.352-2.107-10.523-1.155-.403.092-.807-.16-.899-.562-.092-.402.16-.807.562-.899 4.568-1.043 8.49-.603 11.64 1.341.353.216.464.674.247 1.027zm1.464-3.256c-.272.44-.849.579-1.289.307-3.22-1.978-8.128-2.55-11.936-1.393-.497.151-1.026-.134-1.177-.63-.151-.497.134-1.026.63-1.177 4.354-1.321 9.772-.682 13.465 1.585.44.272.579.849.307 1.308zm.126-3.398C15.228 8.39 8.877 8.18 5.166 9.307c-.6.182-1.23-.162-1.412-.762-.182-.6.162-1.23.762-1.412 4.267-1.295 11.284-1.053 15.654 1.542.54.32.716 1.022.396 1.562-.32.54-1.022.716-1.562.396z" />
            </svg>
            <span className="hidden sm:inline">Spotify</span>
            <span className="hidden xl:inline text-[10px] opacity-75 font-normal truncate max-w-[80px]">
              • {activeSpotifyPlaylist.name.split(' ')[0]}
            </span>
          </button>
        </div>

        {/* Petals Toggle */}
        <button
          id="header-sakura-petals-toggle-btn"
          onClick={() => setIsPetalsActive((p) => !p)}
          title={isPetalsActive ? 'Ocultar lluvia de pétalos' : 'Activar lluvia de pétalos Sakura'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-xs font-semibold transition-all ${
            isPetalsActive
              ? 'bg-[#ffd9df] text-[#6b3743] border-[#ffb7c5]'
              : 'glass-inner text-[#837375] hover:bg-white/80'
          }`}
        >
          <Sparkles className={`w-4 h-4 ${isPetalsActive ? 'text-[#864e5a]' : 'text-[#837375]'}`} />
          <span className="hidden sm:inline">Pétalos</span>
        </button>

        {/* Current User Profile Pill & Quick Logout */}
        {currentUser && (
          <div className="flex items-center gap-1.5 pl-1">
            <button
              id="header-user-profile-btn"
              onClick={onNavigateToProfile}
              title={`Ver perfil de ${currentUser.name} (${currentUser.university || 'Universidad'})`}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-2xl bg-white/80 hover:bg-white text-[#1b1c1c] border border-white/90 shadow-2xs transition-all hover:scale-105 cursor-pointer"
            >
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-5 h-5 rounded-full object-cover border border-[#864e5a]/30"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-[#864e5a] text-white flex items-center justify-center text-[10px] font-bold">
                  {currentUser.name.charAt(0)}
                </div>
              )}
              <div className="flex flex-col text-left leading-tight hidden md:flex">
                <span className="text-xs font-bold text-[#1b1c1c] truncate max-w-[120px]">
                  {currentUser.name}
                </span>
                {currentUser.university && (
                  <span className="text-[9px] text-[#514345]/70 font-semibold truncate max-w-[120px]">
                    {currentUser.university.split('-')[0].trim()}
                  </span>
                )}
              </div>
            </button>

            {onLogout && (
              <button
                id="header-quick-logout-btn"
                onClick={onLogout}
                title="Cerrar Sesión"
                className="p-2 rounded-2xl bg-white/70 hover:bg-[#ffdad6] text-[#837375] hover:text-[#ba1a1a] border border-white/80 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Floating Spotify Player Modal */}
      <SpotifyPlayerModal />

      {/* Floating Notification Panel */}
      <NotificationPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </header>
  );
};

