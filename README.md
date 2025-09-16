
# 🚀 DynamicFin - Sistema Integral de Ventas Automotrices

## 📋 **Descripción**
**DynamicFin Optimization Suite** es un sistema CRM completo especializado para la industria automotriz, que incluye el revolucionario **Sistema de Perfilamiento y Potencial de Cliente (SPPC)** con 15 pilares de calificación.

## ✨ **Características Principales**

### 🎯 **Sistema SPPC - 15 Pilares de Calificación**
- Clasificación automática: **Elite**, **Calificado**, **A Madurar**, **Explorador**
- Evaluación en 3 fases con pesos estratégicos
- Dashboard de calificación en tiempo real

### 👔 **Dashboard Gerencial Avanzado**
- KPIs y métricas en tiempo real
- Control de pipeline de ventas
- Análisis de rendimiento por vendedor
- Alertas críticas automáticas

### 🏆 **Funcionalidades Completas**
- ✅ **Gestión de Prospectos** - CRUD completo con SPPC
- ✅ **Coaching de Vendedores** - Sesiones programadas y seguimiento
- ✅ **Reasignación de Leads** - Control gerencial
- ✅ **Forecasting** - Proyecciones de ventas
- ✅ **Reportes Avanzados** - Análisis detallados
- ✅ **Calendario Inteligente** - Actividades programadas
- ✅ **Usuarios y Roles** - Control de acceso granular

## 🔑 **Acceso Demo**

### **👔 GERENTE (Acceso Total):**
- **Email**: `gerente@demo.com`
- **Password**: `demo123`
- **Funciones**: Dashboard completo + gestión gerencial

### **👤 VENDEDOR (Prospectos):**  
- **Email**: `vendedor@demo.com`
- **Password**: `demo123`
- **Funciones**: Prospectos SPPC + calendario + optimización

## 🛠 **Tecnologías**

- **Frontend**: Next.js 14, React 18, TypeScript
- **UI**: Tailwind CSS, Shadcn/ui, Framer Motion
- **Backend**: Next.js API Routes, NextAuth.js
- **Base de Datos**: PostgreSQL + Prisma ORM
- **Deploy**: Vercel + Supabase

## 🚀 **Instalación Local**

```bash
# Clonar repositorio
git clone https://github.com/Edgar58-tech/sistema-de-calificacion-de-leads-y.git
cd sistema-de-calificacion-de-leads-y

# Instalar dependencias
yarn install

# Configurar base de datos
yarn prisma generate
yarn prisma db push

# Crear usuarios demo
yarn tsx scripts/create-temp-users.ts

# Ejecutar en desarrollo
yarn dev
```

**🌐 Abrir**: http://localhost:3000

## 🌐 **Variables de Ambiente**

```env
DATABASE_URL=tu_url_postgresql
NEXTAUTH_SECRET=tu_secret_key
NEXTAUTH_URL=http://localhost:3000
```

## 📊 **Estructura del Sistema SPPC**

### **Fase 1 - Necesidad y Presupuesto (50%)**
1. Necesidad Real (10%)
2. Urgencia de Compra (8%)
3. Presupuesto Definido (12%)
4. Autoridad Decisión (10%)
5. Timeline Compra (6%)

### **Fase 2 - Proceso y Confianza (34%)**
6. Información Previa (5%)
7. Experiencia Marca (7%)
8. Comparación Activa (6%)
9. Flexibilidad Opciones (5%)
10. Confianza Vendedor (8%)

### **Fase 3 - Cierre y Compromiso (16%)**
11. Satisfacción Proceso (7%)
12. Claridad Beneficios (6%)
13. Manejo Objeciones (5%)
14. Compromiso Verbal (9%)
15. Señales de Cierre (11%)

## 🎯 **Clasificaciones SPPC**
- **🥇 Elite**: 85-100 puntos - Cierre inmediato
- **🥈 Calificado**: 70-84 puntos - Seguimiento prioritario  
- **🥉 A Madurar**: 50-69 puntos - Nutrición requerida
- **🔍 Explorador**: 0-49 puntos - Largo plazo

## 📈 **Deploy en Producción**

1. **Configurar variables en Vercel**
2. **Conectar repositorio GitHub**
3. **Deploy automático**

## 🤝 **Contribuir**

1. Fork el proyecto
2. Crear feature branch
3. Commit cambios
4. Push al branch
5. Crear Pull Request

## 📝 **Licencia**

Proyecto desarrollado por **DynamicFin** - Sistema propietario

---

### 💡 **Desarrollado con ❤️ por DynamicFin Team**
*Sistema de Perfilamiento y Potencial de Cliente (SPPC)*
"# Deploy trigger" 
