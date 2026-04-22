import type { Metadata } from 'next'
import '@/styles/globals.css'

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'shakebase.co'
const SITE_URL = `https://${ROOT}`

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'ShakeBase — the cocktail canon for brands and bar teams',
    template: '%s · ShakeBase',
  },
  description:
    'The multi-tenant cocktail library built for spirits brands, bar groups, and creators. Your private library on your own subdomain, backed by a global catalog of ingredients and products.',
  applicationName: 'ShakeBase',
  keywords: [
    'cocktail database',
    'cocktail library',
    'bar management software',
    'recipe software for bars',
    'beverage program',
    'spirits brand platform',
    'menu analytics',
  ],
  authors: [{ name: 'ShakeBase' }],
  creator: 'ShakeBase',
  publisher: 'ShakeBase',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: 'ShakeBase',
    title: 'ShakeBase — the cocktail canon for brands and bar teams',
    description:
      'Your private cocktail library on your own subdomain, backed by a global catalog of ingredients and products.',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'ShakeBase',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShakeBase — the cocktail canon for brands and bar teams',
    description:
      'Your private cocktail library on your own subdomain, backed by a global catalog of ingredients and products.',
    images: ['/og.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [{ url: '/favicon.ico' }],
    apple: [{ url: '/apple-touch-icon.png' }],
  },
  alternates: { canonical: SITE_URL },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-type="technical" data-density="comfortable" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500&family=Inter:wght@400;500;600&family=Instrument+Serif&family=IBM+Plex+Sans:wght@400;500&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
