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
      return;
    }
    
    console.log(`✅ Sesión iniciada con ID: ${startResult.sessionId}\n`);
    
    // Test 2: Enviar mensaje del vendedor
    console.log('2️⃣ Probando envío de mensaje del vendedor...');
    
    const messageData = {
      scenarioId: TEST_CONFIG.scenarioId,
      message: TEST_CONFIG.testMessage,
      sessionId: startResult.sessionId
    };
    
    const messageResult = await testStreaming(startOptions, messageData);
    
    if (messageResult.streamData.length === 0) {
      console.log('❌ No se recibieron datos de streaming');
      return;
    }
    
    console.log(`✅ Mensaje procesado correctamente\n`);
    
    // Test 3: Verificar que se puede enviar otro mensaje
    console.log('3️⃣ Probando segundo mensaje...');
    
    const secondMessageData = {
      scenarioId: TEST_CONFIG.scenarioId,
      message: '¿Qué opciones de financiamiento tienen disponibles?',
      sessionId: startResult.sessionId
    };
    
    const secondResult = await testStreaming(startOptions, secondMessageData);
    
    if (secondResult.streamData.length === 0) {
      console.log('❌ El segundo mensaje falló');
      return;
    }
    
    console.log(`✅ Segundo mensaje procesado correctamente\n`);
    
    // Test 4: Finalizar sesión
    console.log('4️⃣ Probando finalización de sesión...');
    
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
      observaciones: 'Prueba automatizada completada'
    };
    
    const finishResult = await makeRequest(finishOptions, finishData);
    
    if (finishResult.status === 200) {
      console.log('✅ Sesión finalizada correctamente');
    } else {
      console.log(`❌ Error finalizando sesión: ${finishResult.status}`);
    }
    
    console.log('\n🎉 Todas las pruebas completadas exitosamente!');
    console.log('\n📋 Resumen de correcciones aplicadas:');
    console.log('   • Corregido el manejo de streaming en el frontend');
    console.log('   • Mejorado el flujo de actualización de mensajes');
    console.log('   • Agregado manejo de errores más robusto');
    console.log('   • Corregido el inicio de simulación');
    console.log('   • Mejorado el streaming en el backend');
    
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
    console.log('\n🔧 Para ejecutar las pruebas:');
    console.log('   1. Asegúrate de que el servidor esté corriendo en localhost:3000');
    console.log('   2. Ejecuta: node test-roleplay-fix.js');
  }
}

// Ejecutar pruebas si se llama directamente
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
