// Capa de logica de negocio: validaciones puras, sin dependencias de UI ni de datos.
// La misma regla de totales se repite en la base de datos (trigger validar_totales_acta).

import type { NuevoUsuario } from '../models';
import { LIMITES } from './entrada';

export const PASSWORD_INICIAL = 'Ecuador2026';

/**
 * Valida una cedula ecuatoriana (R2):
 * 10 digitos, provincia 01-24 o 30, tercer digito < 6 y digito verificador modulo 10.
 */
export function validarCedula(cedula: string): string | null {
  if (!/^\d{10}$/.test(cedula)) return 'La cédula debe tener 10 dígitos.';
  const provincia = Number(cedula.substring(0, 2));
  if (!((provincia >= 1 && provincia <= 24) || provincia === 30)) return 'Código de provincia inválido.';
  const tercero = Number(cedula[2]);
  if (tercero >= 6) return 'El tercer dígito no corresponde a una persona natural.';
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let valor = Number(cedula[i]) * coeficientes[i];
    if (valor >= 10) valor -= 9;
    suma += valor;
  }
  const verificador = (10 - (suma % 10)) % 10;
  if (verificador !== Number(cedula[9])) return 'Cédula inválida (dígito verificador incorrecto).';
  return null;
}

export function validarCorreo(correo: string): string | null {
  if (!correo.trim()) return 'El correo es obligatorio.';
  if (correo.trim().length > LIMITES.correo) return `El correo admite máximo ${LIMITES.correo} caracteres.`;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo.trim()) ? null : 'Correo electrónico inválido.';
}

export function validarTelefono(telefono: string): string | null {
  return /^09\d{8}$/.test(telefono) ? null : 'El celular debe tener 10 dígitos y empezar con 09.';
}

export function validarNombre(valor: string, campo: string): string | null {
  const limpio = valor.trim();
  if (limpio.length < 2) return `${campo} es obligatorio.`;
  if (limpio.length > LIMITES.nombre) return `${campo}: máximo ${LIMITES.nombre} caracteres.`;
  return /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü' ]+$/.test(limpio) ? null : `${campo} solo admite letras.`;
}

export function validarNuevaPassword(password: string, confirmacion: string): string | null {
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if (password.length > LIMITES.password) return `La contraseña admite máximo ${LIMITES.password} caracteres.`;
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Debe combinar letras y números.';
  if (password === PASSWORD_INICIAL) return 'No puede reutilizar la contraseña inicial.';
  if (password !== confirmacion) return 'Las contraseñas no coinciden.';
  return null;
}

export type ErroresUsuario = Partial<Record<keyof NuevoUsuario, string>>;

export function validarNuevoUsuario(u: NuevoUsuario): ErroresUsuario {
  const errores: ErroresUsuario = {};
  const cedula = validarCedula(u.cedula);
  if (cedula) errores.cedula = cedula;
  const nombres = validarNombre(u.nombres, 'Nombres');
  if (nombres) errores.nombres = nombres;
  const apellidos = validarNombre(u.apellidos, 'Apellidos');
  if (apellidos) errores.apellidos = apellidos;
  const telefono = validarTelefono(u.telefono);
  if (telefono) errores.telefono = telefono;
  const correo = validarCorreo(u.correo);
  if (correo) errores.correo = correo;
  return errores;
}

/** Convierte el texto de un campo numerico en entero >= 0, o null si no es valido. */
export function aEnteroNoNegativo(valor: string): number | null {
  if (!/^\d+$/.test(valor.trim())) return null;
  const n = Number(valor);
  return Number.isSafeInteger(n) ? n : null;
}

export interface ResumenTotales {
  validos: number;
  sumaTotal: number;
  cuadra: boolean;
  mensaje: string | null;
}

/** R6: votos validos + nulos + blancos debe ser igual al total de sufragantes. */
export function validarTotalesActa(
  votosOrganizaciones: (number | null)[],
  nulos: number | null,
  blancos: number | null,
  totalSufragantes: number | null,
): ResumenTotales {
  if (votosOrganizaciones.some((v) => v === null) || nulos === null || blancos === null || totalSufragantes === null) {
    return { validos: 0, sumaTotal: 0, cuadra: false, mensaje: 'Complete todos los campos con números enteros (0 o más).' };
  }
  const validos = (votosOrganizaciones as number[]).reduce((a, b) => a + b, 0);
  const sumaTotal = validos + nulos + blancos;
  if (totalSufragantes <= 0) {
    return { validos, sumaTotal, cuadra: false, mensaje: 'El total de sufragantes debe ser mayor que 0.' };
  }
  if (sumaTotal !== totalSufragantes) {
    const diferencia = totalSufragantes - sumaTotal;
    return {
      validos,
      sumaTotal,
      cuadra: false,
      mensaje: `No cuadra: válidos (${validos}) + nulos (${nulos}) + blancos (${blancos}) = ${sumaTotal}, ` +
        `pero el total de sufragantes es ${totalSufragantes} (diferencia ${diferencia > 0 ? '+' : ''}${diferencia}).`,
    };
  }
  return { validos, sumaTotal, cuadra: true, mensaje: null };
}
