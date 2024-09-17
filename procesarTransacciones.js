const fs = require('fs');
const axios = require('axios');
const path = require('path');

// Leer el archivo JSON con las transacciones
const filePath = path.join(__dirname, 'transacciones.json');
const url = 'https://api.sandbox.claropagos.com/v1'; // Cambiar por la URL correcta
const token = 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiMjExNDNiZDllMDBmYWRhZDc2MmE1NWJiNWQ2NTUwNGFlOTAzZjMwYThlNjZhMjVmNzA3NjUyYTk3YjBjN2U5Y2U1MTVmMmZkYmMwMzc3YWIiLCJpYXQiOjE3MjE0NDE3MjAuMDE3MTkxLCJuYmYiOjE3MjE0NDE3MjAuMDE3MTk2LCJleHAiOjE3ODQ1MTM3MjAuMDExNTI2LCJzdWIiOiIxMjYiLCJzY29wZXMiOlsiY2xpZW50ZS10YXJqZXRhcyIsImNsaWVudGUtdHJhbnNhY2Npb25lcyIsImNsaWVudGUtY2xpZW50ZXMiLCJjbGllbnRlLXN1c2NyaXBjaW9uZXMiLCJjbGllbnRlLXBsYW5lcyIsImNsaWVudGUtYW50aWZyYXVkZSIsImNsaWVudGUtd2ViaG9va3MiXX0.jzCf5AFt30FkaEZFuJdK9KZHVVxkLRP6oBGDr4Jdlhz4CtVj5_2V8acSax4jyHyAdsOkMt9ANyyZlciX_6UHHEO5bsmVBeuAAX125jcsqH1Tyac7NU3qKAfQdPGHarWGXqrHvDz6DBICgTYiLIBWRZROE9Ctue6ooj-rpyFxC3GU7nFzLie4NtSsK9AQXb5kSQUXb3cuPA_UI6BMANZRHyxpzxcIAl3I_NC6xFSU5F6q6MoZV4cO8S5FCyjAStpp8RaCPQrPa1UlgfM4l5q8fAhVNwvmp1-C28t7yXC7WQewbNemqn0uSIH2o-8g1N98QT9axS-Oss3R9TE2k6vW2LL-um2b1vLW60zNp0mmZ4_eGpU4q0KL6bEAapKtiHVsfwIwBobWwkyhQbibaxs88SdA76ewKJzMuIHnzpvg_Nc8tO80Bv3hiqCkOTU-YFjY3EEJvHGBnQj-f2swXq5HvQYqRjRk5nutjcmc7NfyKLjfm2TEihOIoy4MKNMZ6FYeWf_4GUzFK720_Q5JPNSXiUUs7SeMCmohpagVmGA3-mirFc5CbSrMyMiVqAwQeXiKTe6J__lWkWCA1Z8KEmA3KqRNl3en_0Dc-wdO7oroOo63iRzylxw0BEU4L4EEjdF63sMoNbWDnpuY1GLZ-zOMLEtMlLbZYMuoQbsXT6PfwMg '; // Cambiar por el token de autenticación

// Cargar las transacciones desde el archivo JSON
fs.readFile(filePath, 'utf-8', async (err, data) => {
  if (err) {
    console.error('Error al leer el archivo:', err);
    return;
  }

  try {
    const transacciones = JSON.parse(data).transacciones;

    for (const transaccion of transacciones) {
      let logMessage = '';
      
      // Verificar el estado de la transacción
      if (transaccion.status === 'Cargo Autorizado') {
        // Procesar la transacción autorizada
        logMessage = `Transacción ${transaccion.id}: Cargo Autorizado. Monto: ${transaccion.monto}`;
        await enviarTransaccion(transaccion, 'autorizacion.log');
      } else if (transaccion.status === 'Cargo Rechazado') {
        // Procesar la transacción rechazada
        logMessage = `Transacción ${transaccion.id}: Cargo Rechazado. Monto: ${transaccion.monto}`;
        await enviarTransaccion(transaccion, 'cancelacion.log');
      }

      // Log de cancelación o reembolso si es necesario
      if (transaccion.status === 'Cargo Autorizado' || transaccion.status === 'Cargo Rechazado') {
        await realizarReembolso(transaccion);
      }
    }
  } catch (error) {
    console.error('Error procesando las transacciones:', error);
  }
});

// Función para enviar la transacción a la API
async function enviarTransaccion(transaccion, logFile) {
  try {
    const response = await axios.post(url, transaccion, {
      headers: {
        Authorization: token,
        'Content-Type': 'application/json'
      }
    });

    const logMessage = `Transacción ${transaccion.id} procesada con éxito: ${response.statusText}`;
    escribirLog(logFile, logMessage);
  } catch (error) {
    const logMessage = `Error al procesar la transacción ${transaccion.id}: ${error.message}`;
    escribirLog(logFile, logMessage);
  }
}

// Función para realizar reembolso o cancelación
async function realizarReembolso(transaccion) {
  const logMessage = `Realizando reembolso/cancelación para la transacción ${transaccion.id}`;
  escribirLog('reembolso.log', logMessage);
}

// Función para escribir en los logs
function escribirLog(logFile, mensaje) {
  const logPath = path.join(__dirname, 'logs', logFile);
  const logMessage = `${new Date().toISOString()} - ${mensaje}\n`;
  
  fs.appendFile(logPath, logMessage, (err) => {
    if (err) {
      console.error(`Error escribiendo en ${logFile}:`, err);
    } else {
      console.log(`Log actualizado en ${logFile}`);
    }
  });
}
