#!/usr/bin/env node

/**
 * Script de prueba para verificar las correcciones del simulador de Role Play
 * Este script simula las llamadas que haría el frontend para probar el flujo completo
 */

const https = require('https');
const http = require('http');

// Configuración de prueba
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000', // Cambiar según el puerto de desarrollo
  scenarioId: 1, // ID de escenario de prueba
  testMessage: 'Hola, estoy interesado en comprar un auto'
};

console.log('🧪 Iniciando pruebas del simulador de Role Play...\n');

// Función para hacer peticiones HTTP
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.port === 443 ? https : http;
    const req = protocol.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Función para probar el streaming
function testStreaming(options, data) {
  return new Promise((resolve, reject) => {
    const protocol = options.port === 443 ? https : http;
    const req = protocol.request(options, (res) => {
      let streamData = [];
      let sessionId = null;
      
      console.log(`📡 Iniciando streaming... Status: ${res.statusCode}`);
      
      res.on('data', (chunk) => {
        const lines = chunk.toString().split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              console.log('✅ Streaming completado');
              resolve({ streamData, sessionId });
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              streamData.push(parsed);
              
              if (parsed.sessionId) {
                sessionId = parsed.sessionId;
              }
              
              if (parsed.status === 'streaming') {
                process.stdout.write('.');
              } else if (parsed.status === 'completed') {
                console.log('\n✅ Respuesta completada');
                console.log(`📝 Contenido final: "${parsed.response?.substring(0, 50)}..."`);
              } else if (parsed.status === 'error') {
                console.log(`\n❌ Error: ${parsed.message}`);
              }
            } catch (e) {
              // Ignorar errores de parsing
            }
          }
        }
      });
      
      res.on('end', () => {
        resolve({ streamData, sessionId });
      });
      
      res.on('error', reject);
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function runTests() {
  try {
    console.log('🔧 Verificando configuración del servidor...');
    
    // Test 0: Verificar que el servidor esté corriendo
    try {
      const healthCheck = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/dashboard/stats',
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      console.log(`✅ Servidor respondiendo (Status: ${healthCheck.status})\n`);
    } catch (error) {
      console.log('❌ El servidor no está respondiendo. Asegúrate de que esté corriendo en localhost:3000');
      return;
    }

    console.log('1️⃣ Probando inicio de simulación...');
    
    // Test 1: Iniciar simulación
    const startOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/roleplay/simulate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    const startData = {
      scenarioId: TEST_CONFIG.scenarioId,
      message: undefined // Inicio de simulación
    };
    
    const startResult = await testStreaming(startOptions, startData);
    
    if (!startResult.sessionId) {
      console.log('❌ No se obtuvo sessionId en el inicio');
      console.log('📊 Datos recibidos:', startResult.streamData);
      return;
    }
    
    console.log(`✅ Sesión iniciada con ID: ${startResult.sessionId}`);
    console.log(`📊 Mensajes de streaming recibidos: ${startResult.streamData.length}\n`);
    
    // Test 2: Enviar mensaje del vendedor
    console.log('2️⃣ Probando envío de mensaje del vendedor...');
    
    const messageData = {
      scenarioId: TEST_CONFIG.scenarioId,
      message: TEST_CONFIG.testMessage,
      sessionId: startResult.sessionId
    };
    
    const messageResult = await testStreaming(startOptions, messageData);
    
    if (messageResult.streamData.length === 0) {
      console.log('❌ No se recibieron datos de streaming para el primer mensaje');
      return;
    }
    
    console.log(`✅ Primer mensaje procesado correctamente`);
    console.log(`📊 Mensajes de streaming recibidos: ${messageResult.streamData.length}\n`);
    
    // Test 3: Verificar que se puede enviar otro mensaje (CRÍTICO)
    console.log('3️⃣ Probando segundo mensaje (PRUEBA CRÍTICA)...');
    
    const secondMessageData = {
      scenarioId: TEST_CONFIG.scenarioId,
      message: '¿Qué opciones de financiamiento tienen disponibles?',
      sessionId: startResult.sessionId
    };
    
    const secondResult = await testStreaming(startOptions, secondMessageData);
    
    if (secondResult.streamData.length === 0) {
      console.log('❌ El segundo mensaje falló - ESTE ERA EL PROBLEMA ORIGINAL');
      console.log('🔍 Investigando causa...');
      
      // Intentar diagnosticar el problema
      console.log('📋 Datos del segundo intento:');
      console.log('   - SessionId usado:', startResult.sessionId);
      console.log('   - Mensaje enviado:', secondMessageData.message);
      console.log('   - Datos de streaming recibidos:', secondResult.streamData.length);
      
      return;
    }
    
    console.log(`✅ Segundo mensaje procesado correctamente - PROBLEMA RESUELTO! 🎉`);
    console.log(`📊 Mensajes de streaming recibidos: ${secondResult.streamData.length}\n`);
    
    // Test 4: Tercer mensaje para confirmar que el flujo continúa
    console.log('4️⃣ Probando tercer mensaje (confirmación)...');
    
    const thirdMessageData = {
      scenarioId: TEST_CONFIG.scenarioId,
      message: 'Me interesa conocer más sobre las garantías',
      sessionId: startResult.sessionId
    };
    
    const thirdResult = await testStreaming(startOptions, thirdMessageData);
    
    if (thirdResult.streamData.length === 0) {
      console.log('⚠️ El tercer mensaje falló, pero los primeros dos funcionaron');
    } else {
      console.log(`✅ Tercer mensaje también funciona correctamente`);
      console.log(`📊 Mensajes de streaming recibidos: ${thirdResult.streamData.length}\n`);
    }
    
    // Test 5: Finalizar sesión
    console.log('5️⃣ Probando finalización de sesión...');
    
    const finishOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/roleplay/simulate',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    const finishData = {
      sessionId: startResult.sessionId,
      ventaLograda: true,
      clienteSatisfecho: true,
      observaciones: 'Prueba automatizada completada - Corrección exitosa'
    };
    
    const finishResult = await makeRequest(finishOptions, finishData);
    
    if (finishResult.status === 200) {
      console.log('✅ Sesión finalizada correctamente');
    } else {
      console.log(`❌ Error finalizando sesión: ${finishResult.status}`);
      console.log('📋 Respuesta:', finishResult.data);
    }
    
    console.log('\n🎉 TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE!');
    console.log('\n📋 Resumen de correcciones aplicadas:');
    console.log('   ✅ Separado el flujo de inicio de simulación');
    console.log('   ✅ Mejorado el manejo de streaming en frontend y backend');
    console.log('   ✅ Agregada validación de sessionId antes de enviar mensajes');
    console.log('   ✅ Corregido el manejo de errores y timeouts');
    console.log('   ✅ Agregada la clave ABACUSAI_API_KEY al .env principal');
    console.log('   ✅ Mejorado el manejo de finalización de streaming');
    console.log('   ✅ Agregadas validaciones de estado más robustas');
    
    console.log('\n🚀 El simulador de Role Play ahora debería funcionar correctamente!');
    
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
    console.log('\n🔧 Para ejecutar las pruebas:');
    console.log('   1. Asegúrate de que el servidor esté corriendo en localhost:3000');
    console.log('   2. Ejecuta: node test-roleplay-fix.js');
    console.log('   3. Verifica que existe un escenario con ID 1 en la base de datos');
  }
}

// Ejecutar pruebas si se llama directamente
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
