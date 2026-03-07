import type { Metadata, Viewport } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import Script from 'next/script';
import '@/styles/globals.css';
import Layout from '@/components/layout/Layout';
import { absoluteUrl, siteConfig, withBasePath } from '@/lib/site';

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

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: 'NiazClicks',
  description: siteConfig.description,
  keywords: [
    'photography',
    'portfolio',
    'wildlife',
    'astrophotography',
    'landscape',
    'roads',
    'trees',
    'humans',
    'professional',
  ],
  authors: [{ name: 'NiazClicks' }],
  icons: {
    icon: withBasePath('/favicon.svg'),
  },
  openGraph: {
    type: 'website',
    url: absoluteUrl('/'),
    title: 'NiazClicks',
    description:
      'A portfolio of wildlife, landscapes, roads, trees, portraits, and night-sky photography.',
    images: [
      {
        url: absoluteUrl('/photos/wildlife/DSC03370.jpg'),
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@niazclicks',
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
      className={`${playfair.variable} ${inter.variable} dark`}
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
