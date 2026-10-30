import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import Script from 'next/script';
import '@/styles/globals.css';
import Layout from '@/components/layout/Layout';
import { getFeaturedPhotos } from '@/lib/gallery';
import {
  absoluteUrl,
  siteConfig,
  withBasePath,
  withPhotoAssetPath,
} from '@/lib/site';

const playfair = localFont({
  src: './fonts/PlayfairDisplay-latin.woff2',
  variable: '--font-serif',
  weight: '700 900',
  display: 'swap',
  adjustFontFallback: 'Times New Roman',
});

const inter = localFont({
  src: './fonts/Inter-latin.woff2',
  variable: '--font-sans',
  weight: '300 700',
  display: 'swap',
});

const allura = localFont({
  src: './fonts/Allura-latin.woff2',
  variable: '--font-signature',
  weight: '400',
  display: 'swap',
  adjustFontFallback: false,
});

const socialImage =
  getFeaturedPhotos(1)[0]?.image ||
  withPhotoAssetPath('/photos/wildlife/DSC03370.jpg');

const themeInitScript = `
  (() => {
    const storageKey = 'niaz-theme';

    try {
      const savedTheme = window.localStorage.getItem(storageKey);
      const theme = savedTheme === 'light' || savedTheme === 'dark'
        ? savedTheme
        : 'light';

      document.documentElement.dataset.theme = theme;
    } catch {
      document.documentElement.dataset.theme = 'light';
    }
  })();
`;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: 'NiazPhotography',
  description: siteConfig.description,
  keywords: [
    'photography',
    'video',
    'videography',
    'portfolio',
    'wildlife',
    'astrophotography',
    'landscape',
    'roads',
    'trees',
    'humans',
    'professional',
  ],
  authors: [{ name: 'NiazPhotography' }],
  icons: {
    icon: withBasePath('/favicon.svg'),
  },
  // No url/title/description here: pages inherit this object, so each page's own title and description fill it in.
  openGraph: {
    type: 'website',
    siteName: siteConfig.name,
    locale: 'en_US',
    images: [
      {
        url: absoluteUrl(socialImage),
        alt: 'Featured photograph from the NiazPhotography portfolio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const googleAnalyticsId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html
      lang="en"
      data-theme="light"
      className={`${playfair.variable} ${inter.variable} ${allura.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-dark text-foreground">
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        {googleAnalyticsId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${googleAnalyticsId}');
              `}
            </Script>
          </>
        ) : null}
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
