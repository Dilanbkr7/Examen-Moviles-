// Capa de acceso a datos: fotos de actas en Supabase Storage (ADR-003).
import { supabase, BUCKET_ACTAS } from '../config/supabase';

const TAMANO_MAXIMO = 10 * 1024 * 1024; // 10 MB, igual que el bucket

function dataUrlABlob(dataUrl: string): Blob {
  const [cabecera, base64] = dataUrl.split(',');
  const tipo = /data:(.*?);/.exec(cabecera)?.[1] ?? 'image/jpeg';
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return new Blob([bytes], { type: tipo });
}

/** Sube la foto a la ruta ID_JRV/ID_ACTA.jpg y devuelve la ruta (no una URL publica). */
export async function subirFotoActa(jrvId: number, actaId: string, dataUrl: string): Promise<string> {
  const blob = dataUrlABlob(dataUrl);
  if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(blob.type)) {
    throw new Error('Formato de imagen no permitido. Use JPEG, PNG o WebP.');
  }
  if (blob.size > TAMANO_MAXIMO) throw new Error('La foto supera los 10 MB permitidos.');
  const ruta = `${jrvId}/${actaId}.jpg`;
  const { error } = await supabase.storage.from(BUCKET_ACTAS).upload(ruta, blob, {
    contentType: blob.type,
    upsert: true,
  });
  if (error) throw error;
  return ruta;
}

/** URL firmada temporal (1 hora) para ver una foto privada si el usuario esta autorizado. */
export async function urlFirmada(ruta: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET_ACTAS).createSignedUrl(ruta, 3600);
  if (error) throw error;
  return data.signedUrl;
}
