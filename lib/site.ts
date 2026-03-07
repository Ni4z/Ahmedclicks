const normalizedSiteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
).replace(/\/+$/, '');

export const siteConfig = {
  name: 'Ahmed Photography',
  description:
    'Professional photographer specializing in wildlife, astrophotography, landscape, and travel photography.',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  siteUrl: normalizedSiteUrl,
  contactEmail:
    process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'hello@ahmedphotography.com',
};

export const withBasePath = (path: string): string => {
  if (!path) {
    return siteConfig.basePath || '/';
  }

  if (!path.startsWith('/')) {
    return siteConfig.basePath
      ? `${siteConfig.basePath}/${path}`
      : `/${path}`;
  }

  if (path === '/') {
    return siteConfig.basePath ? `${siteConfig.basePath}/` : '/';
  }

  return siteConfig.basePath ? `${siteConfig.basePath}${path}` : path;
};

export const absoluteUrl = (path: string): string =>
  new URL(withBasePath(path), `${siteConfig.siteUrl}/`).toString();
