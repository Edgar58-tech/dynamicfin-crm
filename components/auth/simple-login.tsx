
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { Loader2, Shield, User } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';

export function SimpleLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const quickLogin = async (role: 'gerente' | 'vendedor') => {
    setIsLoading(true);
    
    const credentials = {
      gerente: { email: 'gerente@demo.com', password: 'demo123' },
      vendedor: { email: 'vendedor@demo.com', password: 'demo123' }
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
        toast.success(`¡Bienvenido ${role === 'gerente' ? 'Gerente' : 'Vendedor'}!`);
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
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => quickLogin('gerente')}
                disabled={isLoading}
                variant="outline"
                className="flex flex-col h-auto py-4 px-3"
              >
                <Shield className="w-6 h-6 mb-2 text-blue-600" />
                <span className="text-xs font-medium">Gerente</span>
                <span className="text-xs text-slate-500">Acceso Total</span>
              </Button>
              
              <Button
                onClick={() => quickLogin('vendedor')}
                disabled={isLoading}
                variant="outline"
                className="flex flex-col h-auto py-4 px-3"
              >
                <User className="w-6 h-6 mb-2 text-green-600" />
                <span className="text-xs font-medium">Vendedor</span>
                <span className="text-xs text-slate-500">Prospectos</span>
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
            <div className="space-y-1 text-blue-700">
              <div>👔 <strong>Gerente:</strong> gerente@demo.com / demo123</div>
              <div>👤 <strong>Vendedor:</strong> vendedor@demo.com / demo123</div>
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
