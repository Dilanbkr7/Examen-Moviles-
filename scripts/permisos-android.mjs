// Agrega los permisos de camara y ubicacion al AndroidManifest.xml (ADR-004).
// Uso: despues de "npx cap add android", ejecutar "npm run android:permisos".
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const ruta = 'android/app/src/main/AndroidManifest.xml';
if (!existsSync(ruta)) {
  console.error(`No existe ${ruta}. Ejecute primero: npx cap add android`);
  process.exit(1);
}
let xml = readFileSync(ruta, 'utf8');
const permisos = [
  '<uses-permission android:name="android.permission.CAMERA" />',
  '<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />',
  '<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />',
  '<uses-feature android:name="android.hardware.location.gps" android:required="false" />',
  '<uses-feature android:name="android.hardware.camera" android:required="false" />',
];
const faltantes = permisos.filter((p) => !xml.includes(p.match(/name="([^"]+)"/)[1]));
if (faltantes.length === 0) {
  console.log('Los permisos ya estaban configurados.');
} else {
  xml = xml.replace('</manifest>', `    ${faltantes.join('\n    ')}\n</manifest>`);
  writeFileSync(ruta, xml);
  console.log(`Permisos agregados:\n  ${faltantes.join('\n  ')}`);
}
