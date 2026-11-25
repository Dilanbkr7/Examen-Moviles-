// Acceso a hardware: GPS mediante @capacitor/geolocation (ADR-004, R7).
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import type { Ubicacion } from '../models';

/** Obtiene la ubicacion actual con alta precision. Lanza errores con mensajes claros. */
export async function obtenerUbicacion(): Promise<Ubicacion> {
  if (Capacitor.isNativePlatform()) {
    let estado = await Geolocation.checkPermissions();
    if (estado.location !== 'granted') {
      estado = await Geolocation.requestPermissions({ permissions: ['location'] });
    }
    if (estado.location !== 'granted') {
      throw new Error('Permiso de ubicación denegado. Actívelo en Ajustes > Aplicaciones > Control Electoral > Permisos.');
    }
  }
  try {
    const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
    return {
      latitud: pos.coords.latitude,
      longitud: pos.coords.longitude,
      precision: Math.round(pos.coords.accuracy),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/location disabled|services are not enabled|disabled/i.test(msg)) {
      throw new Error('El GPS del teléfono está apagado. Enciéndalo e intente de nuevo.');
    }
    if (/timeout|timed out/i.test(msg)) throw new Error('No se obtuvo la ubicación a tiempo. Intente al aire libre.');
    if (/denied|permission/i.test(msg)) throw new Error('Permiso de ubicación denegado.');
    throw new Error(`No se pudo obtener la ubicación: ${msg}`);
  }
}
