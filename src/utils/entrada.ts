// Control de lo que el usuario puede escribir en cada campo (R9: UX y validaciones).
// Primero se impide escribir de mas (este archivo) y luego se valida el contenido (validaciones.ts).
// La base de datos y las Edge Functions repiten las reglas importantes.

/** Maximo de caracteres por campo. */
export const LIMITES = {
  cedula: 10, // cedula ecuatoriana: 10 digitos
  telefono: 10, // celular: 09 + 8 digitos
  nombre: 30, // nombres o apellidos (dos palabras, p. ej. "Maria Fernanda")
  correo: 60,
  password: 30,
  codigo: 10, // codigo de recuperacion que llega al correo
  recinto: 60, // nombre del recinto electoral
  direccion: 100,
  numJrv: 3, // cantidad de mesas: 1 a 200
  votos: 3, // una JRV tiene alrededor de 350 electores: maximo 999
} as const;

/** Que caracteres acepta cada tipo de campo. */
export const FILTROS = {
  digitos: /\D/g, // borra todo lo que no sea numero
  letras: /[^A-Za-zÁÉÍÓÚáéíóúÑñÜü' ]/g, // borra numeros y simbolos
  sinEspacios: /\s/g, // correo: sin espacios
} as const;

interface EventoEntrada {
  detail: { value?: string | null };
  target: { value?: string | number | null };
}

/**
 * Limpia el texto mientras el usuario escribe: quita caracteres no permitidos y corta en el maximo.
 * Tambien corrige el campo en pantalla para que el caracter rechazado no llegue a verse.
 */
export function limpiarEntrada(e: EventoEntrada, max: number, filtro?: RegExp): string {
  let valor = String(e.detail.value ?? '');
  if (filtro) valor = valor.replace(filtro, '');
  valor = valor.slice(0, max);
  if (e.target.value !== valor) e.target.value = valor;
  return valor;
}
