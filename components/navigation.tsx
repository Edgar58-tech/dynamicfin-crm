
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  Users, 
  Car, 
  UserCheck, 
  Settings, 
  BarChart3, 
  Monitor,
  Activity
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: Home,
  },
  {
    name: 'Prospectos',
    href: '/prospects',
    icon: UserCheck,
  },
  {
    name: 'Usuarios',
    href: '/users',
    icon: Users,
  },
  {
    name: 'Vehículos',
    href: '/vehicles',
    icon: Car,
  },
  {
    name: 'Reportes',
    href: '/reports',
    icon: BarChart3,
  },
  {
    name: 'Monitoreo',
    href: '/monitoring',
    icon: Monitor,
  },
  {
    name: 'Configuración',
    href: '/settings',
    icon: Settings,
  },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col space-y-1">
      {navigation.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link key={item.name} href={item.href}>
            <Button
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.name}
            </Button>
          </Link>
        );
      })}
    </nav>
  );
}
