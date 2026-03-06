import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = 'https://ahmedphotography.com';

  const routes = [
    '',
    'gallery',
    'about',
    'blog',
    'contact',
  ];

  const blogSlugs = ['capturing-wildlife-in-low-light', 'astrophotography-guide-for-beginners', 'composition-tips-landscape-photography'];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // Main routes
  routes.forEach((route) => {
    xml += `
  <url>
    <loc>${baseUrl}${route ? '/' + route : '/'}</loc>
    <changefreq>${route === '' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${route === '' ? '1.0' : '0.8'}</priority>
  </url>`;
  });

  // Blog posts
  blogSlugs.forEach((slug) => {
    xml += `
  <url>
    <loc>${baseUrl}/blog/${slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
  });

  xml += `
</urlset>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
