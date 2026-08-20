import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Music,
  Headphones,
  ExternalLink,
  Sparkles,
  Check,
  X,
  ListMusic,
  Plus,
  Play,
  CheckCircle2,
  Flame,
  Coffee,
  Trees,
  BookOpen,
  Link2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SpotifyPlaylistPreset } from '../../types';
import {
  PRESET_PLAYLISTS,
  convertToSpotifyEmbedUrl,
  createCustomSpotifyPreset,
} from '../../data/spotifyData';

export { PRESET_PLAYLISTS, convertToSpotifyEmbedUrl, createCustomSpotifyPreset };
export type { SpotifyPlaylistPreset };

interface SpotifyPlayerModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  activePlaylist?: SpotifyPlaylistPreset;
  onSelectPlaylist?: (playlist: SpotifyPlaylistPreset) => void;
}

export const SpotifyPlayerModal: React.FC<SpotifyPlayerModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  activePlaylist: propActivePlaylist,
  onSelectPlaylist: propOnSelectPlaylist,
}) => {
  const {
    activeSpotifyPlaylist: ctxActivePlaylist,
    setActiveSpotifyPlaylist: ctxSetActivePlaylist,
    customSpotifyUrl,
    saveCustomPlaylist,
    isSpotifyModalOpen,
    setIsSpotifyModalOpen,
  } = useApp();

  const isOpen = propIsOpen !== undefined ? propIsOpen : isSpotifyModalOpen;
  const onClose = propOnClose || (() => setIsSpotifyModalOpen(false));
  const activePlaylist = propActivePlaylist || ctxActivePlaylist;
  const onSelectPlaylist = propOnSelectPlaylist || ctxSetActivePlaylist;

  const modalRef = useRef<HTMLDivElement>(null);
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [customNameInput, setCustomNameInput] = useState<string>('');
  const [customUrlError, setCustomUrlError] = useState<string | null>(null);
  const [customSuccessMsg, setCustomSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'player' | 'presets' | 'custom'>('custom');

  useEffect(() => {
    if (customSpotifyUrl && !customUrlInput) {
      setCustomUrlInput(customSpotifyUrl);
    }
  }, [customSpotifyUrl, customUrlInput]);

  // Handle escape and click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        const triggerBtn = document.getElementById('header-spotify-player-toggle-btn');
        if (triggerBtn && triggerBtn.contains(e.target as Node)) return;
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

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomUrlError(null);
    setCustomSuccessMsg(null);

    const embedUrl = convertToSpotifyEmbedUrl(customUrlInput);
    if (!embedUrl) {
      setCustomUrlError('Por favor introduce un enlace válido de Spotify (ej: https://open.spotify.com/playlist/... o link de app móvil)');
      return;
    }

    const saved = saveCustomPlaylist(customUrlInput, true, customNameInput.trim() || undefined);
    if (saved) {
      setCustomSuccessMsg('¡Playlist personalizada guardada y activada en el reproductor!');
      setTimeout(() => {
        setCustomSuccessMsg(null);
        setActiveTab('player');
      }, 1000);
    } else {
      setCustomUrlError('No pudimos procesar la URL proporcionada.');
    }
  };

  const getPlaylistIcon = (icon: string) => {
    switch (icon) {
      case 'piano':
        return <Music className="w-4 h-4" />;
      case 'ambient':
        return <Trees className="w-4 h-4" />;
      case 'coffee':
        return <Coffee className="w-4 h-4" />;
      case 'focus':
        return <Flame className="w-4 h-4" />;
      case 'classical':
        return <BookOpen className="w-4 h-4" />;
      default:
        return <Headphones className="w-4 h-4" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/30 backdrop-blur-sm">
          <motion.div
            ref={modalRef}
            id="spotify-floating-player-modal"
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[480px] max-h-[90vh] flex flex-col rounded-[28px] bg-white/95 backdrop-blur-2xl border border-white/90 shadow-2xl shadow-[#4e6535]/20 overflow-hidden text-[#1b1c1c]"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-black/5 bg-gradient-to-b from-white to-white/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Spotify Official Green Icon */}
                <div className="w-10 h-10 rounded-2xl bg-[#1DB954] shadow-md shadow-[#1DB954]/25 flex items-center justify-center text-white flex-shrink-0">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.494 17.315c-.216.353-.674.464-1.027.248-2.813-1.718-6.352-2.107-10.523-1.155-.403.092-.807-.16-.899-.562-.092-.402.16-.807.562-.899 4.568-1.043 8.49-.603 11.64 1.341.353.216.464.674.247 1.027zm1.464-3.256c-.272.44-.849.579-1.289.307-3.22-1.978-8.128-2.55-11.936-1.393-.497.151-1.026-.134-1.177-.63-.151-.497.134-1.026.63-1.177 4.354-1.321 9.772-.682 13.465 1.585.44.272.579.849.307 1.308zm.126-3.398C15.228 8.39 8.877 8.18 5.166 9.307c-.6.182-1.23-.162-1.412-.762-.182-.6.162-1.23.762-1.412 4.267-1.295 11.284-1.053 15.654 1.542.54.32.716 1.022.396 1.562-.32.54-1.022.716-1.562.396z" />
                  </svg>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-base font-extrabold text-[#1b1c1c] tracking-tight">
                      Spotify Focus & Estudio
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#cde9ac] text-[#374d20] border border-[#b4cf95]">
                      FCM Música
                    </span>
                  </div>
                  <p className="text-[11.5px] text-[#514345]/80 font-medium truncate max-w-[220px]">
                    {activePlaylist.name}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-[#514345] hover:text-[#1b1c1c] hover:bg-black/5 transition-colors"
                aria-label="Cerrar reproductor Spotify"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nav Tabs */}
            <div className="px-4 py-2.5 bg-black/[0.02] border-b border-black/5 flex items-center justify-between gap-1.5 text-xs font-semibold">
              <div className="flex items-center gap-1.5 w-full">
                <button
                  onClick={() => setActiveTab('custom')}
                  className={`flex-1 py-1.5 px-3 rounded-xl font-bold transition-all text-[11.5px] flex items-center justify-center gap-1.5 ${
                    activeTab === 'custom'
                      ? 'bg-[#4e6535] text-white shadow-xs'
                      : 'bg-white/80 text-[#514345] hover:bg-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" /> Mi Enlace
                </button>

                <button
                  onClick={() => setActiveTab('presets')}
                  className={`flex-1 py-1.5 px-3 rounded-xl font-bold transition-all text-[11.5px] flex items-center justify-center gap-1.5 ${
                    activeTab === 'presets'
                      ? 'bg-[#864e5a] text-white shadow-xs'
                      : 'bg-white/80 text-[#514345] hover:bg-white'
                  }`}
                >
                  <ListMusic className="w-3.5 h-3.5" /> Playlists ({PRESET_PLAYLISTS.length})
                </button>

                <button
                  onClick={() => setActiveTab('player')}
                  className={`flex-1 py-1.5 px-3 rounded-xl font-bold transition-all text-[11.5px] flex items-center justify-center gap-1.5 ${
                    activeTab === 'player'
                      ? 'bg-[#4e6535] text-white shadow-xs'
                      : 'bg-white/80 text-[#514345] hover:bg-white'
                  }`}
                >
                  <Headphones className="w-3.5 h-3.5" /> Vista Previa
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 flex-1 overflow-y-auto max-h-[60vh]">
              {activeTab === 'custom' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-[#f4faf0] border border-[#b4cf95] space-y-1.5">
                    <div className="flex items-center gap-2 text-[#4e6535]">
                      <Sparkles className="w-4 h-4 text-[#4e6535]" />
                      <h4 className="text-xs font-bold text-[#1b1c1c]">Usa tu propia Playlist o Canción</h4>
                    </div>
                    <p className="text-[11.5px] text-[#514345] leading-relaxed">
                      Pega cualquier enlace de Spotify (de la app móvil o de la web) para que se mantenga como tu música de estudio fija.
                    </p>
                  </div>

                  <form onSubmit={handleApplyCustomUrl} className="space-y-3.5">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[#514345] block">
                        Enlace o URL de Spotify:
                      </label>
                      <input
                        type="text"
                        placeholder="https://open.spotify.com/playlist/... o link compartido"
                        value={customUrlInput}
                        onChange={(e) => setCustomUrlInput(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/15 focus:border-[#4e6535] focus:ring-2 focus:ring-[#4e6535]/20 text-xs font-medium outline-none transition-all placeholder:text-[#514345]/50 shadow-inner"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[#514345] block">
                        Nombre personalizado (opcional):
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Mis Temas de Anatomía y Farmacología"
                        value={customNameInput}
                        onChange={(e) => setCustomNameInput(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-black/15 focus:border-[#4e6535] text-xs font-medium outline-none transition-all placeholder:text-[#514345]/50 shadow-inner"
                      />
                    </div>

                    {customUrlError && (
                      <p className="text-[11px] text-[#ba1a1a] font-semibold bg-[#ba1a1a]/10 p-2.5 rounded-xl border border-[#ba1a1a]/20">
                        {customUrlError}
                      </p>
                    )}

                    {customSuccessMsg && (
                      <p className="text-[11px] text-[#374d20] font-semibold bg-[#cde9ac] p-2.5 rounded-xl border border-[#b4cf95] flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-[#4e6535]" /> {customSuccessMsg}
                      </p>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3 rounded-2xl bg-[#4e6535] hover:bg-[#3d5029] text-white text-xs font-bold transition-all shadow-md shadow-[#4e6535]/20 flex items-center justify-center gap-2"
                    >
                      <Link2 className="w-4 h-4" /> Guardar y Activar como Mi Playlist
                    </button>
                  </form>

                  {customSpotifyUrl && (
                    <div className="p-3 rounded-xl bg-black/[0.03] border border-black/5 text-[11px] space-y-1">
                      <span className="font-bold text-[#514345]">Tu enlace guardado actualmente:</span>
                      <p className="font-mono text-[10px] text-[#4e6535] truncate">{customSpotifyUrl}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'presets' && (
                <div className="space-y-2.5">
                  <p className="text-xs text-[#514345] font-medium mb-1">
                    Selecciona una de las 6 listas temáticas diseñadas para el estudio:
                  </p>
                  {PRESET_PLAYLISTS.map((preset) => {
                    const isCurrent = preset.id === activePlaylist.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => {
                          onSelectPlaylist(preset);
                          setActiveTab('player');
                        }}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isCurrent
                            ? 'bg-gradient-to-r from-white to-[#f4faf0] border-[#b4cf95] shadow-sm ring-1 ring-[#4e6535]/30'
                            : 'bg-white/80 hover:bg-white border-black/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${preset.colorTheme.bg} ${preset.colorTheme.text} shadow-2xs`}>
                            {getPlaylistIcon(preset.iconName)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-bold text-[#1b1c1c]">{preset.name}</h4>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded-md bg-[#4e6535] text-white text-[9px] font-bold">
                                  Activa
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#514345]/80 line-clamp-1">
                              {preset.tagline}
                            </p>
                          </div>
                        </div>

                        <div className="flex-shrink-0">
                          {isCurrent ? (
                            <div className="w-7 h-7 rounded-xl bg-[#cde9ac] text-[#374d20] flex items-center justify-center shadow-xs">
                              <Check className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="w-7 h-7 rounded-xl bg-white hover:bg-[#ffd9df] text-[#864e5a] flex items-center justify-center border border-black/5 shadow-2xs">
                              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === 'player' && (
                <div className="space-y-3.5">
                  {/* Embedded Spotify Iframe Preview */}
                  <div className="rounded-[20px] overflow-hidden shadow-md border border-black/10 bg-[#121212]">
                    <iframe
                      key={activePlaylist.embedUrl}
                      style={{ borderRadius: '18px' }}
                      src={activePlaylist.embedUrl}
                      width="100%"
                      height="152"
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      title={`Spotify Player - ${activePlaylist.name}`}
                    />
                  </div>

                  {/* Current Active Info Card */}
                  <div className="p-3.5 rounded-2xl bg-white border border-black/5 flex items-start justify-between gap-3 shadow-2xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border ${activePlaylist.colorTheme.bg} ${activePlaylist.colorTheme.text} ${activePlaylist.colorTheme.border}`}>
                          {activePlaylist.isCustom ? 'Mi Playlist' : 'Lista Curada'}
                        </span>
                        <h4 className="text-[13px] font-bold text-[#1b1c1c]">
                          {activePlaylist.name}
                        </h4>
                      </div>
                      <p className="text-[11.5px] text-[#514345] leading-relaxed font-medium">
                        {activePlaylist.tagline}
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveTab('custom')}
                      className="p-2 rounded-xl bg-black/5 hover:bg-[#cde9ac] text-[#4e6535] transition-colors flex-shrink-0"
                      title="Editar enlace"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Bar */}
            <div className="p-3.5 px-5 border-t border-black/5 bg-white flex items-center justify-between text-xs text-[#514345]">
              <span className="text-[11px] font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#1DB954] animate-pulse"></span>
                Reproductor Fijo de Fondo Activo
              </span>

              <button
                onClick={onClose}
                className="text-[11px] font-bold px-3 py-1 rounded-xl bg-[#4e6535] text-white hover:bg-[#3d5029] transition-colors"
              >
                Listo
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
