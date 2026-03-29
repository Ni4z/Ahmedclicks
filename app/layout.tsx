import type { Metadata, Viewport } from 'next';
import { Playfair_Display, Inter, Allura } from 'next/font/google';
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

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['700', '800', '900'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700'],
});

const allura = Allura({
  subsets: ['latin'],
  variable: '--font-signature',
  weight: ['400'],
});

const socialImage =
  getFeaturedPhotos(1)[0]?.image ||
  withPhotoAssetPath('/photos/wildlife/DSC03370.jpg');

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
  openGraph: {
    type: 'website',
    url: absoluteUrl('/'),
    title: 'NiazPhotography',
    description:
      'A portfolio of wildlife, landscapes, roads, trees, portraits, night-sky photography, and video work.',
    images: [
      {
        url: absoluteUrl(socialImage),
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@NiazPhotography',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a0a',
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
      className={`${playfair.variable} ${inter.variable} ${allura.variable} dark`}
      suppressHydrationWarning
    >
      <body className="bg-dark text-white">
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
