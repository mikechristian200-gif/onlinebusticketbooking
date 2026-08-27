import './ui/global.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Golden Express | Bus Ticket Booking',
    template: '%s | Golden Express',
  },
  description: 'Book comfortable bus journeys across Cameroon with Golden Express.',
  applicationName: 'Golden Express',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'Golden Express | Bus Ticket Booking',
    description: 'Book comfortable bus journeys across Cameroon with Golden Express.',
    siteName: 'Golden Express',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
