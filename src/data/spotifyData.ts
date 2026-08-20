import { SpotifyPlaylistPreset } from '../types';

export const PRESET_PLAYLISTS: SpotifyPlaylistPreset[] = [
  {
    id: 'preset-lofi-beats',
    name: 'Lofi Study Beats',
    tagline: 'Ritmos relajantes y suaves para sesiones intensas de estudio',
    category: 'lofi',
    embedUrl: 'https://open.spotify.com/embed/playlist/0vvXsW14ReMVt3NVW1U4ag?utm_source=generator&theme=0',
    iconName: 'lofi',
    colorTheme: {
      bg: 'bg-[#ffd9df]',
      text: 'text-[#783e4c]',
      border: 'border-[#ffb7c5]',
    },
  },
  {
    id: 'preset-piano-focus',
    name: 'Piano de Concentración',
    tagline: 'Melodías acústicas minimalistas que facilitan la memoria a largo plazo',
    category: 'piano',
    embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX4sWSpwq3LiO?utm_source=generator&theme=0',
    iconName: 'piano',
    colorTheme: {
      bg: 'bg-[#fedbc7]',
      text: 'text-[#6b3820]',
      border: 'border-[#facbb2]',
    },
  },
  {
    id: 'preset-ambient-botanic',
    name: 'Ambiente Botánico & Zen',
    tagline: 'Ondas alpha, naturaleza y frecuencias verdes curativas',
    category: 'ambient',
    embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX3Ogo9pFvBkY?utm_source=generator&theme=0',
    iconName: 'ambient',
    colorTheme: {
      bg: 'bg-[#cde9ac]',
      text: 'text-[#374d20]',
      border: 'border-[#b4cf95]',
    },
  },
  {
    id: 'preset-rainy-coffee',
    name: 'Café de Estudio Lluvioso',
    tagline: 'Atmósfera acogedora con llovizna suave y acordes cálidos',
    category: 'focus',
    embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DWZqd5JICZI0u?utm_source=generator&theme=0',
    iconName: 'coffee',
    colorTheme: {
      bg: 'bg-[#d8e2dc]',
      text: 'text-[#284b63]',
      border: 'border-[#b9c9c0]',
    },
  },
  {
    id: 'preset-deep-focus-med',
    name: 'Deep Focus • Medicina FCM',
    tagline: 'Frecuencias binaurales e instrumental profundo para memorizar',
    category: 'focus',
    embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DXdLEN7aqioXM?utm_source=generator&theme=0',
    iconName: 'focus',
    colorTheme: {
      bg: 'bg-[#e2d4f0]',
      text: 'text-[#4c2d73]',
      border: 'border-[#ceb9e6]',
    },
  },
  {
    id: 'preset-classical-study',
    name: 'Clásica para Rendimiento',
    tagline: 'Mozart, Bach y Chopin optimizados para la agilidad cognitiva',
    category: 'classical',
    embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DWZeKCadgRdKQ?utm_source=generator&theme=0',
    iconName: 'classical',
    colorTheme: {
      bg: 'bg-[#fce1e4]',
      text: 'text-[#73333e]',
      border: 'border-[#f7c2c9]',
    },
  },
];

/**
 * Normalizes any Spotify URL or mobile share link by extracting the type and ID
 * and stripping any query parameters (?si=..., etc.)
 */
export function convertToSpotifyEmbedUrl(inputUrl: string): string | null {
  const trimmed = inputUrl.trim();
  if (!trimmed) return null;

  // 1. Matches Spotify web URLs (including open.spotify.com, embed URLs, intl prefixes like /intl-es/, and query params like ?si=...)
  const webMatch = trimmed.match(
    /(?:https?:\/\/)?(?:open\.)?spotify\.com\/(?:embed\/)?(?:[a-z]{2,5}(?:-[a-z]{2,5})?\/)?(playlist|album|track|episode|show)\/([a-zA-Z0-9]+)/i
  );
  if (webMatch) {
    const type = webMatch[1].toLowerCase();
    const id = webMatch[2];
    return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
  }

  // 2. Matches spotify URI: spotify:playlist:ID, spotify:track:ID, etc.
  const uriMatch = trimmed.match(/spotify:(playlist|album|track|episode|show):([a-zA-Z0-9]+)/i);
  if (uriMatch) {
    const type = uriMatch[1].toLowerCase();
    const id = uriMatch[2];
    return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
  }

  return null;
}

/**
 * Creates a SpotifyPlaylistPreset object from a custom user URL
 */
export function createCustomSpotifyPreset(rawUrl: string, name?: string): SpotifyPlaylistPreset | null {
  const embedUrl = convertToSpotifyEmbedUrl(rawUrl);
  if (!embedUrl) return null;

  return {
    id: 'custom-user-playlist',
    name: name?.trim() || 'Mi Playlist Personalizada',
    tagline: 'Lista de reproducción personalizada de Spotify',
    category: 'custom',
    embedUrl,
    iconName: 'custom',
    isCustom: true,
    colorTheme: {
      bg: 'bg-[#cde9ac]',
      text: 'text-[#374d20]',
      border: 'border-[#b4cf95]',
    },
  };
}
