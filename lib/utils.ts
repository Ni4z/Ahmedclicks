import { Photo } from '@/lib/types';

export const getPhotosByCategory = (photos: Photo[], category: string): Photo[] => {
  return photos.filter((photo) => photo.category === category);
};

export const getFeaturedPhotos = (photos: Photo[]): Photo[] => {
  return photos.filter((photo) => photo.featured).slice(0, 6);
};

export const getPhotoById = (photos: Photo[], id: string): Photo | undefined => {
  return photos.find((photo) => photo.id === id);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const generateSitemap = (baseUrl: string): string => {
  const urls = [
    { loc: '/', priority: '1.0', changefreq: 'weekly' },
    { loc: '/gallery', priority: '0.9', changefreq: 'weekly' },
    { loc: '/about', priority: '0.7', changefreq: 'monthly' },
    { loc: '/blog', priority: '0.8', changefreq: 'weekly' },
    { loc: '/contact', priority: '0.7', changefreq: 'monthly' },
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${baseUrl}${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
};
