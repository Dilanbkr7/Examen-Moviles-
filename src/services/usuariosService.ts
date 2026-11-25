// Capa de acceso a datos: cuentas de usuario (R2). Sin autorregistro.
import { supabase } from '../config/supabase';
import type { NuevoUsuario, Perfil, Rol } from '../models';

export interface ResultadoCreacion {
  id: string;
  correo_enviado: boolean;
  mensaje: string;
}

/**
 * Crea un coordinador de recinto (lo hace el provincial) o un veedor (lo hace el coordinador de recinto).
 * Se ejecuta en la Edge Function "crear-usuario", que valida el rol de quien llama en el servidor.
 */
export async function crearUsuario(datos: NuevoUsuario, rol: Exclude<Rol, 'coordinador_provincial'>): Promise<ResultadoCreacion> {
  const { data, error } = await supabase.functions.invoke('crear-usuario', { body: { ...datos, rol } });
  if (error) {
    let mensaje = error.message;
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx) mensaje = (await ctx.json()).error ?? mensaje;
    } catch {
      /* se conserva el mensaje original */
    }
    throw new Error(mensaje);
  }
  return data as ResultadoCreacion;
}

/** Lista perfiles visibles por RLS con un rol dado. */
export async function listarPorRol(rol: Rol): Promise<Perfil[]> {
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .eq('rol', rol)
    .order('apellidos');
  if (error) throw error;
  return (data ?? []) as Perfil[];
}
