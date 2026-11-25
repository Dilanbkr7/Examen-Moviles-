// Traduce errores tecnicos (Supabase, red, plugins) a mensajes claros para el usuario (R9).

export function mensajeError(error: unknown, porDefecto = 'Ocurrió un error inesperado.'): string {
  const texto =
    typeof error === 'string'
      ? error
      : error && typeof error === 'object' && 'message' in error
        ? String((error as { message: unknown }).message)
        : '';

  if (!texto) return porDefecto;
  if (/Failed to fetch|NetworkError|network|ERR_INTERNET/i.test(texto)) {
    return 'Sin conexión con el servidor. Revise su internet e intente de nuevo.';
  }
  if (/ACTA_INCONSISTENTE:/.test(texto)) return texto.replace(/.*ACTA_INCONSISTENTE:\s*/, 'El servidor rechazó el acta: ');
  if (/NO_AUTORIZADO:/.test(texto)) return texto.replace(/.*NO_AUTORIZADO:\s*/, 'No autorizado: ');
  if (/row-level security|violates row-level/i.test(texto)) return 'No tiene permiso para realizar esta operación.';
  if (/duplicate key|already exists|ya existe/i.test(texto)) return 'El registro ya existe.';
  if (/Invalid login credentials/i.test(texto)) return 'Cédula o contraseña incorrectas.';
  if (/Email not confirmed/i.test(texto)) return 'Debe confirmar su cuenta desde el correo recibido.';
  if (/Token has expired|invalid.*token|otp/i.test(texto)) return 'El código es inválido o ya expiró.';
  if (/rate limit/i.test(texto)) return 'Demasiados intentos. Espere unos minutos.';
  return texto;
}
