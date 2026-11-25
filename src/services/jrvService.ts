// Capa de acceso a datos: JRV (mesas) y asignacion de veedores (R5, R6).
import { supabase } from '../config/supabase';
import type { Mesa } from '../models';

/** Mesas visibles para el usuario. RLS filtra: el veedor solo recibe las suyas (R8). */
export async function listarMesas(recintoId?: number): Promise<Mesa[]> {
  let q = supabase.from('v_mesas').select('*').order('recinto').order('numero');
  if (recintoId) q = q.eq('recinto_id', recintoId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Mesa[];
}

/** R5: asignar o reasignar el veedor de una JRV (un veedor por JRV). */
export async function asignarVeedor(jrvId: number, recintoId: number, veedorId: string, asignadoPor: string): Promise<void> {
  const { data: actual, error: e1 } = await supabase
    .from('asignaciones')
    .select('id')
    .eq('jrv_id', jrvId)
    .eq('tipo', 'veedor')
    .maybeSingle();
  if (e1) throw e1;
  if (actual) {
    const { error } = await supabase
      .from('asignaciones')
      .update({ usuario_id: veedorId, asignado_por: asignadoPor, updated_at: new Date().toISOString() })
      .eq('id', actual.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('asignaciones')
      .insert({ usuario_id: veedorId, tipo: 'veedor', recinto_id: recintoId, jrv_id: jrvId, asignado_por: asignadoPor });
    if (error) throw error;
  }
}

/** Prueba de seguridad R8: intenta leer una JRV por id. Para un veedor ajeno, RLS devuelve null. */
export async function intentarLeerJrv(jrvId: number): Promise<boolean> {
  const { data, error } = await supabase.from('jrv').select('id').eq('id', jrvId).maybeSingle();
  if (error) throw error;
  return data !== null;
}
