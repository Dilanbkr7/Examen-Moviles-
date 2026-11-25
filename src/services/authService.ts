// Capa de acceso a datos: autenticacion (ADR-002, Supabase Auth).
import { supabase } from '../config/supabase';
import type { Perfil } from '../models';

/**
 * R3: el usuario ve y escribe su CEDULA. La Edge Function "login" busca el correo
 * en el servidor (con la clave de servicio, que nunca llega a la app) y devuelve la sesion.
 */
export async function iniciarSesionConCedula(cedula: string, password: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('login', { body: { cedula, password } });
  if (error) {
    // El cuerpo del error trae el mensaje de la funcion
    let mensaje = error.message;
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx) mensaje = (await ctx.json()).error ?? mensaje;
    } catch {
      /* se conserva el mensaje original */
    }
    throw new Error(mensaje);
  }
  if (!data?.access_token || !data?.refresh_token) throw new Error('Respuesta de inicio de sesión inválida.');
  const { error: errSesion } = await supabase.auth.setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });
  if (errSesion) throw errSesion;
}

export async function cerrarSesion(): Promise<void> {
  await supabase.auth.signOut();
}

export async function obtenerPerfil(userId: string): Promise<Perfil | null> {
  const { data, error } = await supabase.from('perfiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data as Perfil | null;
}

/** R3: cambio obligatorio de contrasena en el primer acceso. */
export async function cambiarPassword(nueva: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: nueva });
  if (error) throw error;
  const { error: errFlag } = await supabase.rpc('marcar_password_cambiada');
  if (errFlag) throw errFlag;
}

/** R3: recuperacion por correo. Supabase envia un codigo de un solo uso al correo. */
export async function enviarCodigoRecuperacion(correo: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(correo.trim().toLowerCase());
  if (error) throw error;
}

export async function restablecerConCodigo(correo: string, codigo: string, nueva: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({
    email: correo.trim().toLowerCase(),
    token: codigo.trim(),
    type: 'recovery',
  });
  if (error) throw error;
  await cambiarPassword(nueva);
}
