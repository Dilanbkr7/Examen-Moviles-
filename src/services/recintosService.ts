// Capa de acceso a datos: recintos, parroquias y asignacion de coordinadores (R1, R4).
import { supabase } from '../config/supabase';
import type { AvanceRecinto, Parroquia } from '../models';

export async function listarAvanceRecintos(): Promise<AvanceRecinto[]> {
  const { data, error } = await supabase.from('v_avance_recintos').select('*').order('recinto');
  if (error) throw error;
  return (data ?? []) as AvanceRecinto[];
}

export async function obtenerAvanceRecinto(recintoId: number): Promise<AvanceRecinto | null> {
  const { data, error } = await supabase.from('v_avance_recintos').select('*').eq('recinto_id', recintoId).maybeSingle();
  if (error) throw error;
  return data as AvanceRecinto | null;
}

export async function listarParroquias(): Promise<Parroquia[]> {
  const { data, error } = await supabase
    .from('parroquias')
    .select('id, nombre, cantones(nombre)')
    .order('nombre');
  if (error) throw error;
  return (data ?? []).map((p) => {
    const c = p.cantones as unknown as { nombre: string } | { nombre: string }[] | null;
    const canton = Array.isArray(c) ? c[0]?.nombre ?? '' : c?.nombre ?? '';
    return { id: p.id as number, nombre: p.nombre as string, canton };
  });
}

export async function crearRecinto(r: { parroquia_id: number; nombre: string; direccion: string; num_jrv: number }): Promise<void> {
  const { error } = await supabase.from('recintos').insert({
    parroquia_id: r.parroquia_id,
    nombre: r.nombre.trim(),
    direccion: r.direccion.trim() || null,
    num_jrv: r.num_jrv,
  });
  if (error) throw error;
}

/** R4: un coordinador por recinto. Si ya hay uno, se reemplaza (update); si no, se inserta. */
export async function asignarCoordinador(recintoId: number, usuarioId: string, asignadoPor: string): Promise<void> {
  const { data: actual, error: e1 } = await supabase
    .from('asignaciones')
    .select('id')
    .eq('recinto_id', recintoId)
    .eq('tipo', 'coordinador_recinto')
    .maybeSingle();
  if (e1) throw e1;
  if (actual) {
    const { error } = await supabase
      .from('asignaciones')
      .update({ usuario_id: usuarioId, asignado_por: asignadoPor, updated_at: new Date().toISOString() })
      .eq('id', actual.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('asignaciones')
      .insert({ usuario_id: usuarioId, tipo: 'coordinador_recinto', recinto_id: recintoId, asignado_por: asignadoPor });
    if (error) throw error;
  }
}

/** Ids de coordinadores que ya tienen recinto (para no ofrecerlos de nuevo). */
export async function coordinadoresAsignados(): Promise<Map<string, number>> {
  const { data, error } = await supabase.from('asignaciones').select('usuario_id, recinto_id').eq('tipo', 'coordinador_recinto');
  if (error) throw error;
  return new Map((data ?? []).map((a) => [a.usuario_id as string, a.recinto_id as number]));
}

/** Recinto que coordina el usuario actual (RLS solo devuelve sus asignaciones). */
export async function miRecinto(usuarioId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('asignaciones')
    .select('recinto_id')
    .eq('usuario_id', usuarioId)
    .eq('tipo', 'coordinador_recinto')
    .maybeSingle();
  if (error) throw error;
  return (data?.recinto_id as number | undefined) ?? null;
}
