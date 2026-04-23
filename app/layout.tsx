import type { Metadata } from 'next'
import Script from 'next/script'
import {
  Fraunces,
  Inter,
  Instrument_Serif,
  IBM_Plex_Sans,
  IBM_Plex_Mono,
} from 'next/font/google'
import '@/styles/globals.css'

const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? 'G-H9NNE5P044'

// next/font self-hosts and inlines fallback metrics, which removes the
// render-blocking <link> to fonts.googleapis.com and cuts the font-
// network chain that Lighthouse flagged on the landing page.
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-fraunces',
  display: 'swap',
})
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
})
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-instrument-serif',
  display: 'swap',
})
const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-ibm-plex-sans',
  display: 'swap',
})
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
})

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'shakebase.co'
const SITE_URL = `https://${ROOT}`

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'ShakeBase — The Cocktail Canon for Brands and Bar Teams',
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
    title: 'ShakeBase — The Cocktail Canon for Brands and Bar Teams',
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
    title: 'ShakeBase — The Cocktail Canon for Brands and Bar Teams',
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
  const fontClass = `${fraunces.variable} ${inter.variable} ${instrumentSerif.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable}`
  return (
    <html
      lang="en"
      data-type="technical"
      data-density="comfortable"
      suppressHydrationWarning
      className={fontClass}
    >
      <body>
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}
        {children}
      </body>
    </html>
  )
}
