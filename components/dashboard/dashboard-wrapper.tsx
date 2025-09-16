
'use client';

import { SessionProvider } from 'next-auth/react';
import { DashboardClient } from '@/components/dashboard/dashboard-client';

interface DashboardWrapperProps {
  children: React.ReactNode;
  session: any;
}

export function DashboardWrapper({ children, session }: DashboardWrapperProps) {
  return (
    <SessionProvider session={session}>
      <DashboardClient>{children}</DashboardClient>
    </SessionProvider>
  );
}
