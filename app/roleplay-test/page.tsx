'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PlayCircle, 
  BookOpen, 
  Target, 
  TrendingUp,
  Award,
  Clock,
  MessageSquare,
  Brain,
  Star,
  Trophy,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Calendar,
  Users,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import RolePlaySimulator from '@/components/roleplay-simulator';
import RolePlayScenarios from '@/components/roleplay-scenarios';

export default function RolePlayTestPage() {
  const [activeTab, setActiveTab] = useState('escenarios');
  const [selectedScenario, setSelectedScenario] = useState(null);

  const handleScenarioSelect = (scenario: any) => {
    setSelectedScenario(scenario);
    setActiveTab('simulador');
  };

  const handleStartSimulation = (scenario: any) => {
    setSelectedScenario(scenario);
    setActiveTab('simulador');
  };

  const handleSessionComplete = (sessionData: any) => {
    console.log('Session completed:', sessionData);
  };

  const handleViewEvaluation = (sessionId: number) => {
    console.log('View evaluation:', sessionId);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            🎭 Entrenamiento Role Play - Test
          </h1>
          <p className="text-slate-600 mt-1">
            Página de prueba para corregir errores del componente Select
          </p>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="simulador" className="gap-2">
            <Brain className="w-4 h-4" />
            Simulador
          </TabsTrigger>
          <TabsTrigger value="escenarios" className="gap-2">
            <BookOpen className="w-4 h-4" />
            Escenarios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="simulador" className="space-y-6">
          <RolePlaySimulator
            scenario={selectedScenario}
            onComplete={handleSessionComplete}
            onEvaluate={handleViewEvaluation}
          />
        </TabsContent>

        <TabsContent value="escenarios" className="space-y-6">
          <RolePlayScenarios
            selectedScenario={selectedScenario}
            onSelectScenario={handleScenarioSelect}
            onStartSimulation={handleStartSimulation}
            showManagement={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
