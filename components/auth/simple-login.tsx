
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { Loader2, Shield, User, HeadphonesIcon } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';

export function SimpleLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const quickLogin = async (role: 'gerente' | 'vendedor' | 'centro-leads') => {
    setIsLoading(true);
    
    const credentials = {
      gerente: { email: 'gerenteaudi@demo.com', password: 'gerente1213' },
      vendedor: { email: 'vendedoraudi@demo.com', password: 'vendedor123' },
      'centro-leads': { email: 'recepaudi@demo.com', password: 'recep123' }
    };

    try {
      const result = await signIn('credentials', {
        email: credentials[role].email,
        password: credentials[role].password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Error al iniciar sesión');
      } else {
        const welcomeText = role === 'gerente' ? 'Gerente de Ventas' : 
                           role === 'vendedor' ? 'Vendedor' : 
                           'Coordinador Centro de Leads';
        toast.success(`¡Bienvenido ${welcomeText}!`);
        router.push('/dashboard');
        router.refresh();
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoading(true);
    
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Credenciales incorrectas');
      } else {
        toast.success('¡Bienvenido!');
        router.push('/dashboard');
        router.refresh();
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          {/* Logo */}
          <div className="relative mx-auto w-20 h-20 bg-slate-900 rounded-lg flex items-center justify-center mb-4">
            <Image
              src="/images/LOGO-DynamicFin-white.png"
              alt="DynamicFin"
              fill
              className="object-contain p-2"
              priority
            />
          </div>
          
          <CardTitle className="text-2xl font-bold text-slate-800">
            Optimization Suite
          </CardTitle>
          <CardDescription>
            Sistema Integral de Ventas Automotrices
            <br />
            <span className="text-blue-600 font-medium">
              Sistema de Perfilamiento y Potencial de Cliente
            </span>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Acceso Rápido */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-600 text-center">
              🚀 Acceso Rápido Demo
            </h3>
            
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => quickLogin('gerente')}
                disabled={isLoading}
                variant="outline"
                className="flex flex-col h-auto py-3 px-2"
              >
                <Shield className="w-5 h-5 mb-1 text-blue-600" />
                <span className="text-xs font-medium">Gerente</span>
                <span className="text-xs text-slate-500">Demo</span>
              </Button>
              
              <Button
                onClick={() => quickLogin('vendedor')}
                disabled={isLoading}
                variant="outline"
                className="flex flex-col h-auto py-3 px-2"
              >
                <User className="w-5 h-5 mb-1 text-green-600" />
                <span className="text-xs font-medium">Vendedor</span>
                <span className="text-xs text-slate-500">Demo</span>
              </Button>

              <Button
                onClick={() => quickLogin('centro-leads')}
                disabled={isLoading}
                variant="outline"
                className="flex flex-col h-auto py-3 px-2"
              >
                <HeadphonesIcon className="w-5 h-5 mb-1 text-purple-600" />
                <span className="text-xs font-medium">Centro Leads</span>
                <span className="text-xs text-slate-500">Demo</span>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                O acceso manual
              </span>
            </div>
          </div>

          {/* Login Manual */}
          <form onSubmit={handleManualLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@ejemplo.com"
                disabled={isLoading}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Iniciando Sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>

          {/* Información de Credenciales */}
          <div className="bg-blue-50 rounded-lg p-4 text-sm">
            <h4 className="font-semibold text-blue-800 mb-2">💡 Credenciales Demo:</h4>
            <div className="space-y-1 text-blue-700 text-xs">
              <div>👔 <strong>Gerente:</strong> gerenteaudi@demo.com / gerente1213</div>
              <div>👤 <strong>Vendedor:</strong> vendedoraudi@demo.com / vendedor123</div>
              <div>🎧 <strong>Centro de Leads:</strong> recepaudi@demo.com / recep123</div>
            </div>
          </div>
        </CardContent>
        
        <div className="text-center text-xs text-slate-500 pb-4">
          Powered by <span className="text-blue-600 font-medium">DynamicFin</span>
        </div>
      </Card>
    </div>
  );
}
