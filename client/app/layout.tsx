import type { Metadata } from 'next';
import { ReactNode } from 'react';
import '../src/styles/styles.css';
import '../src/styles/animations.css';
import '../src/styles/buttons.css';
import '../src/styles/colors.css';
import '../src/styles/basketball.css';
import '../src/styles/football.css';

export const metadata: Metadata = {
  title: 'Touchdown',
  description: 'Fantasy sports picks and predictions',
  openGraph: {
    title: 'Touchdown',
    description: 'Fantasy sports picks and predictions',
    type: 'website',
  },
};

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
        {children}
      </body>
    </html>
  );
}
