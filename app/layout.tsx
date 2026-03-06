import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import '@/styles/globals.css';
import Layout from '@/components/layout/Layout';

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
  title: 'Ahmed - Professional Photography Portfolio',
  description: 'Professional photographer specializing in wildlife, astrophotography, landscape, and travel photography.',
  keywords: [
    'photography',
    'portfolio',
    'wildlife',
    'astrophotography',
    'landscape',
    'travel',
    'professional',
  ],
  viewport: 'width=device-width, initial-scale=1',
  authors: [{ name: 'Ahmed' }],
  openGraph: {
    type: 'website',
    url: 'https://ahmedphotography.com',
    title: 'Ahmed - Professional Photography Portfolio',
    description: 'Stunning photography showcasing the worlds beauty',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1200&h=630&fit=crop',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@ahmedphotography',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} dark`}
      suppressHydrationWarning
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#0a0a0a" />
        <link rel="icon" href="/favicon.ico" />
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=YOUR-GA-ID"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'YOUR-GA-ID');
            `,
          }}
        />
      </head>
      <body className="bg-dark text-white">
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
