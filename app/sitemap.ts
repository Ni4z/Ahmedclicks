import type { MetadataRoute } from 'next';
import { getPhotos } from '@/lib/gallery';
import { blogPosts } from '@/data/portfolio';
import { absoluteUrl } from '@/lib/site';

export const dynamic = 'force-static';

const staticRoutes: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority: number;
}> = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/gallery/', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/videos/', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/about/', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/prints/', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/blog/', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/contact/', changeFrequency: 'yearly', priority: 0.5 },
  { path: '/privacy/', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/terms/', changeFrequency: 'yearly', priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = staticRoutes.map(
    ({ path, changeFrequency, priority }) => ({
      url: absoluteUrl(path),
      changeFrequency,
      priority,
    })
  );

  const photoPages: MetadataRoute.Sitemap = getPhotos().map((photo) => ({
    url: absoluteUrl(`/gallery/${photo.id}/`),
    lastModified: new Date(photo.date),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}/`),
    lastModified: new Date(post.date),
    changeFrequency: 'yearly',
    priority: 0.5,
  }));

  return [...pages, ...photoPages, ...blogPages];
}
