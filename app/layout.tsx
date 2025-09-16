
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DynamicFin Optimization Suite',
  description: 'Sistema Integral de Ventas Automotrices - Plataforma de Optimización',
  keywords: 'automotive, sales, optimization, CRM, SPPC',
  authors: [{ name: 'DynamicFin' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
