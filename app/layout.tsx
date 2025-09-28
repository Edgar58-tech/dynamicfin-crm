
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DynamicFin CRM - Sistema Integral',
  description: 'Sistema Integral de Ventas Automotrices con Monitoreo y Testing - Plataforma de Optimización',
  keywords: 'automotive, sales, optimization, CRM, SPPC, monitoring, testing',
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
