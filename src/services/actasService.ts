// Capa de acceso a datos: actas y votos (R6). La validacion final ocurre en PostgreSQL.
import { supabase } from '../config/supabase';
import type { Acta, Candidatura, Dignidad, DetalleVoto, Ubicacion } from '../models';

export async function listarCandidaturas(dignidad: Dignidad): Promise<Candidatura[]> {
  const { data, error } = await supabase
    .from('candidaturas')
    .select('id, dignidad, nombre_candidato, organizacion:organizaciones(nombre, siglas, lista)')
    .eq('dignidad', dignidad)
    .order('organizacion_id');
  if (error) throw error;
  return (data ?? []) as unknown as Candidatura[];
}

export async function obtenerActa(jrvId: number, dignidad: Dignidad): Promise<Acta | null> {
  const { data, error } = await supabase
    .from('actas')
    .select('*, detalle_votos(candidatura_id, votos)')
    .eq('jrv_id', jrvId)
    .eq('dignidad', dignidad)
    .maybeSingle();
  if (error) throw error;
  return data as Acta | null;
}

export interface DatosActa {
  jrvId: number;
  dignidad: Dignidad;
  totalSufragantes: number;
  nulos: number;
  blancos: number;
  votos: DetalleVoto[];
  ubicacion: Ubicacion | null;
}

/** Guarda o corrige el acta en una sola transaccion (RPC guardar_acta). Devuelve el id del acta. */
export async function guardarActa(d: DatosActa): Promise<string> {
  const { data, error } = await supabase.rpc('guardar_acta', {
    p_jrv_id: d.jrvId,
    p_dignidad: d.dignidad,
    p_total: d.totalSufragantes,
    p_nulos: d.nulos,
    p_blancos: d.blancos,
    p_votos: d.votos,
    p_latitud: d.ubicacion?.latitud ?? null,
    p_longitud: d.ubicacion?.longitud ?? null,
    p_precision: d.ubicacion?.precision ?? null,
  });
  if (error) throw error;
  return data as string;
}

export async function registrarFotoActa(actaId: string, ruta: string, nitidez: number): Promise<void> {
  const { error } = await supabase.from('actas').update({ foto_url: ruta, nitidez }).eq('id', actaId);
  if (error) throw error;
}
