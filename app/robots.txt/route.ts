import { NextResponse } from 'next/server';

export async function GET() {
  const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /private

# Specific rules for search engines
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

# Crawl delay
Crawl-delay: 1

# Sitemap location
Sitemap: https://ahmedphotography.com/sitemap.xml
`;

  return new NextResponse(robots, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
