// ADR-007: comprobacion de nitidez con la varianza del Laplaciano (sin dependencias).
// Imagen nitida -> bordes marcados -> varianza alta. Imagen borrosa -> varianza baja.

export const UMBRAL_NITIDEZ = 60;
const ANCHO_MAXIMO = 800;

function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo leer la imagen capturada.'));
    img.src = src;
  });
}

/** Devuelve el puntaje de nitidez (varianza del Laplaciano) de una imagen dataURL. */
export async function calcularNitidez(dataUrl: string): Promise<number> {
  const img = await cargarImagen(dataUrl);
  const escala = Math.min(1, ANCHO_MAXIMO / img.width);
  const ancho = Math.max(3, Math.round(img.width * escala));
  const alto = Math.max(3, Math.round(img.height * escala));

  const canvas = document.createElement('canvas');
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('El dispositivo no permite analizar la imagen.');
  ctx.drawImage(img, 0, 0, ancho, alto);
  const { data } = ctx.getImageData(0, 0, ancho, alto);

  // Escala de grises (luminancia)
  const gris = new Float32Array(ancho * alto);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    gris[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  // Laplaciano 3x3 [0 1 0; 1 -4 1; 0 1 0] y su varianza
  let suma = 0;
  let sumaCuadrados = 0;
  let n = 0;
  for (let y = 1; y < alto - 1; y++) {
    for (let x = 1; x < ancho - 1; x++) {
      const i = y * ancho + x;
      const lap = gris[i - ancho] + gris[i + ancho] + gris[i - 1] + gris[i + 1] - 4 * gris[i];
      suma += lap;
      sumaCuadrados += lap * lap;
      n++;
    }
  }
  const media = suma / n;
  return Math.round((sumaCuadrados / n - media * media) * 10) / 10;
}

export function esNitida(puntaje: number): boolean {
  return puntaje >= UMBRAL_NITIDEZ;
}
