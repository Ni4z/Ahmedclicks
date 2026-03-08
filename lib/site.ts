const normalizedSiteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
).replace(/\/+$/, '');

export const siteConfig = {
  name: 'NiazPhotography',
  description:
    'Photography and video portfolio of NiazPhotography featuring wildlife, landscapes, roads, trees, portraits, astrophotography, and motion work.',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  siteUrl: normalizedSiteUrl,
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || '',
  instagramUrl:
    process.env.NEXT_PUBLIC_INSTAGRAM_URL || 'https://instagram.com/hmed_niaz',
};

export const withBasePath = (path: string): string => {
  if (!path) {
    return siteConfig.basePath || '/';
  }

  if (/^https?:\/\//.test(path)) {
    return path;
  }

  if (
    siteConfig.basePath &&
    (path === siteConfig.basePath || path.startsWith(`${siteConfig.basePath}/`))
  ) {
    return path;
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

export const withPhotoAssetPath = (
  path: string,
  variant: 'image' | 'thumbnail' = 'image'
): string => {
  if (!path.startsWith('/photos/')) {
    return withBasePath(path);
  }

  const assetRoot =
    variant === 'thumbnail' ? '/photos-thumb/' : '/photos-web/';

  return withBasePath(path.replace(/^\/photos\//, assetRoot));
};

export const absoluteUrl = (path: string): string =>
  new URL(withBasePath(path), `${siteConfig.siteUrl}/`).toString();
