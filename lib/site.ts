const normalizedSiteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
).replace(/\/+$/, '');
const normalizedMediaBaseUrl = (
  process.env.NEXT_PUBLIC_MEDIA_BASE_URL || ''
).replace(/\/+$/, '');
const defaultPaypalSupportUrl =
  'https://www.paypal.com/paypalme/ahmedniaz10/1EUR';

export const siteConfig = {
  name: 'NiazPhotography',
  description:
    'Photography and video portfolio of NiazPhotography featuring wildlife, landscapes, roads, trees, portraits, astrophotography, and motion work.',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  siteUrl: normalizedSiteUrl,
  mediaBaseUrl: normalizedMediaBaseUrl,
  imageBaseUrl: (
    process.env.NEXT_PUBLIC_IMAGE_BASE_URL || normalizedMediaBaseUrl
  ).replace(/\/+$/, ''),
  videoBaseUrl: (
    process.env.NEXT_PUBLIC_VIDEO_BASE_URL || normalizedMediaBaseUrl
  ).replace(/\/+$/, ''),
  contactEmail:
    process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'niazphotography.com@gmail.com',
  instagramUrl:
    process.env.NEXT_PUBLIC_INSTAGRAM_URL || 'https://instagram.com/niazphotograph_y',
  linkedinUrl:
    process.env.NEXT_PUBLIC_LINKEDIN_URL ||
    'https://www.linkedin.com/in/hmedniaz/',
  paypalSupportUrl:
    process.env.NEXT_PUBLIC_PAYPAL_SUPPORT_URL || defaultPaypalSupportUrl,
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

  const assetPath = path.replace(/^\/photos\//, assetRoot);

  if (siteConfig.imageBaseUrl) {
    return `${siteConfig.imageBaseUrl}${assetPath}`;
  }

  return withBasePath(assetPath);
};

export const absoluteUrl = (path: string): string =>
  new URL(withBasePath(path), `${siteConfig.siteUrl}/`).toString();
