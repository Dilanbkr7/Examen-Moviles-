// Acceso a hardware: camara mediante @capacitor/camera (ADR-004, R7).
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export class PermisoDenegadoError extends Error {}

/** Verifica y solicita el permiso de camara; lanza PermisoDenegadoError si el usuario lo niega. */
async function asegurarPermisoCamara(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return; // en navegador el permiso lo gestiona el propio navegador
  let estado = await Camera.checkPermissions();
  if (estado.camera !== 'granted') {
    estado = await Camera.requestPermissions({ permissions: ['camera'] });
  }
  if (estado.camera !== 'granted') {
    throw new PermisoDenegadoError(
      'Permiso de cámara denegado. Actívelo en Ajustes > Aplicaciones > Control Electoral > Permisos.',
    );
  }
}

/** Abre la camara y devuelve la foto como dataURL (JPEG). Devuelve null si el usuario cancela. */
export async function tomarFotoActa(): Promise<string | null> {
  await asegurarPermisoCamara();
  try {
    const foto = await Camera.getPhoto({
      source: CameraSource.Camera,
      resultType: CameraResultType.DataUrl,
      quality: 80,
      width: 1600,
      correctOrientation: true,
      saveToGallery: false,
    });
    return foto.dataUrl ?? null;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/cancel/i.test(msg)) return null;
    if (/denied|permission/i.test(msg)) throw new PermisoDenegadoError('Permiso de cámara denegado.');
    throw new Error(`No se pudo usar la cámara: ${msg}`);
  }
}
