import type { Metadata } from 'next';
import Script from 'next/script';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'AgroVista Monthly — Agriculture Industry E-Magazine',
  description:
    'AgroVista Monthly is a paid monthly e-magazine covering technology, markets, sustainability and people shaping the agriculture industry. Sign in and unlock any issue to read online.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400&family=Playfair+Display:wght@700;900&display=swap"
          rel="stylesheet"
        />
        <link href="/css/bootstrap.min.css" rel="stylesheet" />
        <link href="/css/bootstrap-icons.css" rel="stylesheet" />
        <link href="/css/style.css" rel="stylesheet" />
      </head>
      <body>
        {children}
        <Toaster position="top-right" />
        <Script src="/js/bootstrap.bundle.min.js" strategy="beforeInteractive" />
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
