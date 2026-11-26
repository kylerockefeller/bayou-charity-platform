import type { Metadata } from 'next';
import { Lora, Playfair_Display, Caveat } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import Nav from '@/components/shared/Nav';
import Footer from '@/components/shared/Footer';
import { ServiceWorkerRegistrar } from '@/components/shared/ServiceWorkerRegistrar';
import Providers from './providers';
import './globals.css';

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Bayou Charity',
  description: 'Bayou Family Fishing — Louisiana fishing charity dedicated to community and conservation.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Bayou Charity',
  },
  icons: {
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Bayou Family Fishing',
    description: 'Louisiana fishing charity taking veterans and underserved youth fishing in the bayous of Plaquemines Parish.',
    url: 'https://bayoucharity.org',
    siteName: 'Bayou Charity',
    images: [
      {
        url: 'https://bayoucharity.org/Photos/skyline-og.jpg',
        width: 1920,
        height: 887,
        alt: 'Golden hour over the Louisiana bayou — Bayou Family Fishing',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bayou Family Fishing',
    description: 'Louisiana fishing charity taking veterans and underserved youth fishing in the bayous of Plaquemines Parish.',
    images: ['https://bayoucharity.org/Photos/skyline-og.jpg'],
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
      suppressHydrationWarning
      className={`${lora.variable} ${playfairDisplay.variable} ${caveat.variable}`}
    >
      <head>
        <meta name="theme-color" content="#e8923a" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="font-serif bg-green-deep text-text-dark dark:text-cream antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <ServiceWorkerRegistrar />
          <Nav />
          <Providers>
            {children}
          </Providers>
          <div className="relative z-10">
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
