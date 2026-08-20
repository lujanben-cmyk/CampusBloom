import React, { useState } from 'react';
import { X, Image as ImageIcon, Check, Sliders, Link2, Upload } from 'lucide-react';
import { BackgroundTheme } from '../../types';
import { BACKGROUND_THEMES } from '../../data/initialData';

interface ChangeBackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBg: BackgroundTheme;
  onSelectBackground: (theme: BackgroundTheme) => void;
  customOverlay: number;
  setCustomOverlay: (val: number) => void;
}

export const ChangeBackgroundModal: React.FC<ChangeBackgroundModalProps> = ({
  isOpen,
  onClose,
  currentBg,
  onSelectBackground,
  customOverlay,
  setCustomOverlay,
}) => {
  const [customUrl, setCustomUrl] = useState<string>('');

  if (!isOpen) return null;

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    const customTheme: BackgroundTheme = {
      id: `custom-${Date.now()}`,
      name: 'Fondo Personalizado',
      category: 'URL Externa',
      thumbnail: customUrl,
      url: customUrl,
      overlayOpacity: customOverlay,
    };
    onSelectBackground(customTheme);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const resultUrl = uploadEvent.target?.result as string;
        if (resultUrl) {
          const customTheme: BackgroundTheme = {
            id: `upload-${Date.now()}`,
            name: file.name,
            category: 'Subida Local',
            thumbnail: resultUrl,
            url: resultUrl,
            overlayOpacity: customOverlay,
          };
          onSelectBackground(customTheme);
          onClose();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-[30px] glass-card p-6 sm:p-7 shadow-2xl border border-white flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#4e6535] text-white flex items-center justify-center shadow-md">
              <ImageIcon className="w-5 h-5 text-[#cde9ac]" />
            </div>
            <div>
              <h3 className="font-heading text-lg sm:text-xl font-bold text-[#1b1c1c]">
                Cambiar Fondo de Pantalla
              </h3>
              <p className="text-xs text-[#514345]/80">
                Selecciona una atmósfera botánica o usa un enlace directo de imagen.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#514345] hover:bg-black/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gallery of Presets */}
        <div>
          <h4 className="text-xs font-bold text-[#1b1c1c] uppercase tracking-wider mb-2.5">
            Fondos Botánicos & Estéticos
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {BACKGROUND_THEMES.map((theme) => {
              const isSelected = currentBg.id === theme.id;
              return (
                <div
                  key={theme.id}
                  onClick={() => {
                    onSelectBackground(theme);
                  }}
                  className={`group cursor-pointer rounded-2xl overflow-hidden p-1.5 transition-all flex flex-col gap-1 border ${
                    isSelected
                      ? 'bg-[#cde9ac] border-[#4e6535] shadow-md scale-[1.02]'
                      : 'glass-inner border-white/80 hover:bg-white/90 hover:scale-105'
                  }`}
                >
                  <div className="relative aspect-video rounded-xl overflow-hidden">
                    <img
                      src={theme.thumbnail}
                      alt={theme.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-[#4e6535]/35 flex items-center justify-center">
                        <Check className="w-6 h-6 text-white stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <div className="px-1 text-center py-0.5">
                    <p className="text-xs font-bold text-[#1b1c1c] truncate">{theme.name}</p>
                    <p className="text-[10px] text-[#514345]/70 truncate">{theme.category}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Opacity Adjustment */}
        <div className="p-4 rounded-2xl glass-inner border border-white/90 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#1b1c1c]">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-[#864e5a]" /> Transparencia del Velo Suave:
            </span>
            <span className="text-[#864e5a]">{Math.round(customOverlay * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="0.6"
            step="0.05"
            value={customOverlay}
            onChange={(e) => setCustomOverlay(parseFloat(e.target.value))}
            className="w-full accent-[#864e5a] h-1.5 bg-black/10 rounded-lg cursor-pointer"
          />
        </div>

        {/* Custom Image URL or Upload */}
        <div className="p-4 rounded-2xl bg-white/60 border border-white/90 space-y-3">
          <h4 className="text-xs font-bold text-[#1b1c1c] flex items-center gap-1.5">
            <Link2 className="w-4 h-4 text-[#4e6535]" /> Usar enlace directo de imagen o archivo
          </h4>

          <form onSubmit={handleApplyCustomUrl} className="flex gap-2">
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://ejemplo.com/mi-fondo-estudio.jpg"
              className="flex-1 p-2.5 rounded-xl glass-inner text-xs border border-white outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#4e6535] text-white text-xs font-bold shadow-md hover:bg-[#3d5029]"
            >
              Aplicar URL
            </button>
          </form>

          <div className="flex items-center justify-center">
            <label className="flex items-center gap-2 px-4 py-2 rounded-xl glass-inner text-xs font-bold text-[#514345] hover:bg-white/80 cursor-pointer border border-white">
              <Upload className="w-4 h-4 text-[#864e5a]" />
              <span>Subir imagen desde tu dispositivo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#864e5a] text-white text-xs font-bold shadow-md hover:bg-[#6b3743]"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
