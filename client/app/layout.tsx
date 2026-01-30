import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { ClientProviders } from '../src/providers/ClientProviders';
import '../src/styles/styles.css';
import '../src/styles/animations.css';
import '../src/styles/buttons.css';
import '../src/styles/colors.css';
import '../src/styles/basketball.css';
import '../src/styles/football.css';

export const metadata: Metadata = {
  title: 'Touchdown - Manage your players, rack up points!',
  description: 'Manage your players, rack up points! Fantasy sports picks and predictions for NFL, NBA and more',
  metadataBase: new URL('https://touchdown-882290629693.us-central1.run.app'),
  icons: {
    icon: 'https://touchdown-882290629693.us-central1.run.app/logos/Drive-logo.png',
  },
  other: {
    'og:logo': 'https://touchdown-882290629693.us-central1.run.app/logos/Drive-logo.png',
  },
  openGraph: {
    title: 'Touchdown - Manage your players, rack up points!',
    description: 'Manage your players, rack up points! Fantasy sports picks and predictions for NFL, NBA and more',
    type: 'website',
    url: 'https://touchdown-882290629693.us-central1.run.app',
    images: [
      {
        url: 'https://touchdown-882290629693.us-central1.run.app/logos/opengraph.jpg',
        width: 1600,
        height: 630,
        alt: 'Touchdown - Fantasy Sports',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Touchdown - Manage your players, rack up points!',
    description: 'Manage your players, rack up points! Fantasy sports picks and predictions for NFL, NBA and more',
    images: ['https://touchdown-882290629693.us-central1.run.app/logos/opengraph.jpg'],
  },
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Savate:ital,wght@0,200..900;1,200..900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Audiowide&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Sansation:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
