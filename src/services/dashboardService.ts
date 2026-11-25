// Capa de acceso a datos: resultados consolidados y ubicaciones (R4).
import { supabase } from '../config/supabase';
import type { Dignidad, ResultadoVoto, UbicacionActa } from '../models';

export async function obtenerResultados(dignidad: Dignidad): Promise<ResultadoVoto[]> {
  const { data, error } = await supabase.from('v_resultados').select('*').eq('dignidad', dignidad);
  if (error) throw error;
  return (data ?? []) as ResultadoVoto[];
}

export async function obtenerUbicacionesActas(): Promise<UbicacionActa[]> {
  const { data, error } = await supabase.from('v_ubicaciones_actas').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as UbicacionActa[];
}

export interface FilaConsolidada {
  candidatura_id: number;
  nombre_candidato: string;
  siglas: string;
  votos: number;
  porcentaje: number;
}

/** Logica de negocio: consolida los votos por candidato (todos los recintos o uno). */
export function consolidar(resultados: ResultadoVoto[], recintoId?: number): FilaConsolidada[] {
  const filtrados = recintoId ? resultados.filter((r) => r.recinto_id === recintoId) : resultados;
  const mapa = new Map<number, FilaConsolidada>();
  for (const r of filtrados) {
    const fila = mapa.get(r.candidatura_id) ?? {
      candidatura_id: r.candidatura_id,
      nombre_candidato: r.nombre_candidato,
      siglas: r.siglas,
      votos: 0,
      porcentaje: 0,
    };
    fila.votos += r.votos;
    mapa.set(r.candidatura_id, fila);
  }
  const filas = [...mapa.values()];
  const total = filas.reduce((a, f) => a + f.votos, 0);
  for (const f of filas) f.porcentaje = total > 0 ? Math.round((f.votos / total) * 1000) / 10 : 0;
  return filas.sort((a, b) => b.votos - a.votos);
}
