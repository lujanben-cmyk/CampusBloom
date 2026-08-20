import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Music2, Sliders } from 'lucide-react';
import { MUSIC_PLAYLIST } from '../../data/initialData';
import { MusicTrack } from '../../types';
import { soundEngine } from '../../utils/audioSynthesizer';

export const SpotifyWidget: React.FC = () => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(38); // 38% matching the screenshot visual
  const [volume, setVolume] = useState<number>(70);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [useSpotifyEmbed, setUseSpotifyEmbed] = useState<boolean>(false);

  const currentTrack: MusicTrack = MUSIC_PLAYLIST[currentTrackIndex] || MUSIC_PLAYLIST[0];

  useEffect(() => {
    let timer: number;
    if (isPlaying && !useSpotifyEmbed) {
      timer = window.setInterval(() => {
        setProgress((prev) => (prev >= 100 ? 0 : prev + 0.5));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, useSpotifyEmbed]);

  const togglePlay = () => {
    if (isPlaying) {
      soundEngine.stop();
      setIsPlaying(false);
    } else {
      soundEngine.play(currentTrack.soundType);
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    const nextIdx = (currentTrackIndex + 1) % MUSIC_PLAYLIST.length;
    setCurrentTrackIndex(nextIdx);
    if (isPlaying) {
      soundEngine.play(MUSIC_PLAYLIST[nextIdx].soundType);
    }
  };

  const handlePrev = () => {
    const prevIdx = (currentTrackIndex - 1 + MUSIC_PLAYLIST.length) % MUSIC_PLAYLIST.length;
    setCurrentTrackIndex(prevIdx);
    if (isPlaying) {
      soundEngine.play(MUSIC_PLAYLIST[prevIdx].soundType);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    soundEngine.setVolume(val / 100);
  };

  return (
    <div
      id="spotify-embed-widget-container"
      className="w-full rounded-[24px] glass-card p-4 sm:p-5 flex flex-col gap-3 shadow-md shadow-[#864e5a]/10 border border-white/80 transition-all hover:shadow-lg"
    >
      {/* Widget Header matching the screenshot */}
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-[15px] sm:text-[16px] font-bold text-[#1b1c1c] tracking-tight">
          Widget de Spotify Embebido
        </h3>
        <button
          id="spotify-widget-settings-toggle"
          onClick={() => setShowSettings(!showSettings)}
          className="p-1 rounded-lg text-[#514345]/70 hover:text-[#1b1c1c] hover:bg-white/60 transition-colors"
          title="Ajustes de audio"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>

      {showSettings && (
        <div className="p-3 rounded-xl bg-white/70 border border-white/90 text-xs flex flex-col gap-2 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#514345]">Modo de Reproducción:</span>
            <button
              onClick={() => {
                if (isPlaying) {
                  soundEngine.stop();
                  setIsPlaying(false);
                }
                setUseSpotifyEmbed(!useSpotifyEmbed);
              }}
              className="px-2 py-0.5 rounded-lg bg-[#cde9ac] text-[#374d20] font-bold"
            >
              {useSpotifyEmbed ? 'Embed Spotify' : 'Sintetizador Lo-Fi'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-[#514345]" />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full accent-[#4e6535] h-1.5 bg-black/10 rounded-lg cursor-pointer"
            />
            <span className="text-[#514345] font-medium w-7 text-right">{volume}%</span>
          </div>
        </div>
      )}

      {useSpotifyEmbed ? (
        <div className="rounded-2xl overflow-hidden shadow-inner border border-black/5">
          <iframe
            style={{ borderRadius: '16px' }}
            src="https://open.spotify.com/embed/playlist/0vvXsW14ReMVt3NVW1U4ag?utm_source=generator&theme=0"
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title="Spotify Lo-Fi Playlist"
          />
        </div>
      ) : (
        /* Native Player Styled exactly like the screenshot */
        <div className="p-3.5 sm:p-4 rounded-[20px] bg-[#665e5f]/90 text-white shadow-inner flex flex-col gap-3 relative overflow-hidden backdrop-blur-md">
          {/* Subtle Spotify header bar */}
          <div className="flex items-center justify-between text-xs text-white/80">
            <span className="font-semibold tracking-wide text-[12px]">{currentTrack.artist}</span>
            {/* Spotify circular SVG icon */}
            <svg
              className="w-4 h-4 text-white fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.494 17.315c-.216.353-.674.464-1.027.248-2.813-1.718-6.352-2.107-10.523-1.155-.403.092-.807-.16-.899-.562-.092-.402.16-.807.562-.899 4.568-1.043 8.49-.603 11.64 1.341.353.216.464.674.247 1.027zm1.464-3.256c-.272.44-.849.579-1.289.307-3.22-1.978-8.128-2.55-11.936-1.393-.497.151-1.026-.134-1.177-.63-.151-.497.134-1.026.63-1.177 4.354-1.321 9.772-.682 13.465 1.585.44.272.579.849.307 1.308zm.126-3.398C15.228 8.39 8.877 8.18 5.166 9.307c-.6.182-1.23-.162-1.412-.762-.182-.6.162-1.23.762-1.412 4.267-1.295 11.284-1.053 15.654 1.542.54.32.716 1.022.396 1.562-.32.54-1.022.716-1.562.396z" />
            </svg>
          </div>

          {/* Album artwork + Track Controls */}
          <div className="flex items-center justify-between gap-3">
            {/* Artwork thumbnail */}
            <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 shadow-md border border-white/20">
              <img
                src={currentTrack.coverUrl}
                alt="Lo-Fi Study Artwork"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <span className="absolute bottom-1 left-1 right-1 text-[8px] font-bold text-white/90 text-center leading-tight truncate">
                Lo-Fi Study
              </span>
            </div>

            {/* Playback action buttons */}
            <div className="flex items-center gap-3">
              <button
                id="spotify-widget-prev-btn"
                onClick={handlePrev}
                className="text-white/80 hover:text-white transition-colors p-1"
                aria-label="Pista anterior"
              >
                <SkipBack className="w-5 h-5 fill-current" />
              </button>

              <button
                id="spotify-widget-play-toggle-btn"
                onClick={togglePlay}
                className="text-white hover:scale-105 transition-transform p-1"
                aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                )}
              </button>

              <button
                id="spotify-widget-next-btn"
                onClick={handleNext}
                className="text-white/80 hover:text-white transition-colors p-1"
                aria-label="Siguiente pista"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </button>
            </div>
          </div>

          {/* Track title matching the screenshot */}
          <div className="flex items-center gap-1.5">
            <Music2 className="w-3.5 h-3.5 text-[#cde9ac] flex-shrink-0" />
            <p className="text-[12px] font-medium text-white/95 truncate">
              {currentTrack.title}
            </p>
          </div>

          {/* Progress bar + Green Play/Pause icon badge */}
          <div className="flex items-center gap-2.5 mt-0.5">
            <div
              className="flex-1 h-1.5 bg-white/25 rounded-full overflow-hidden cursor-pointer relative"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const newPercent = Math.min(100, Math.max(0, (clickX / rect.width) * 100));
                setProgress(newPercent);
              }}
            >
              <div
                className="h-full bg-[#a3e635] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Green circular Spotify action icon matching screenshot */}
            <button
              id="spotify-widget-mini-play-btn"
              onClick={togglePlay}
              className="w-6 h-6 rounded-full bg-[#22c55e] flex items-center justify-center text-white shadow-sm hover:scale-110 transition-transform flex-shrink-0"
              aria-label="Toggle Play"
            >
              {isPlaying ? (
                <Pause className="w-3 h-3 fill-current" />
              ) : (
                <Play className="w-3 h-3 fill-current ml-0.5" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
