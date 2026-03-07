import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'HIVE — Campus Infrastructure',
    short_name: 'HIVE',
    description: 'Say something. Your campus responds.',
    start_url: '/discover',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/assets/icon-192.png',
        type: 'image/png',
        sizes: '192x192',
        purpose: 'any',
      },
      {
        src: '/assets/icon-512.png',
        type: 'image/png',
        sizes: '512x512',
        purpose: 'any',
      },
    ],
    categories: ['social', 'education'],
    lang: 'en-US',
    dir: 'ltr',
    scope: '/',
    prefer_related_applications: false,
  };
}
