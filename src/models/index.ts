// Capa de modelos: tipos que reflejan las tablas de PostgreSQL (ADR-006).

export type Rol = 'coordinador_provincial' | 'coordinador_recinto' | 'veedor';
export type Dignidad = 'alcalde' | 'prefecto';

export interface Perfil {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  correo: string;
  rol: Rol;
  debe_cambiar_password: boolean;
  creado_por?: string | null;
}

export interface Parroquia {
  id: number;
  nombre: string;
  canton: string;
}

export interface AvanceRecinto {
  recinto_id: number;
  recinto: string;
  parroquia: string;
  canton: string;
  num_jrv: number;
  actas_esperadas: number;
  actas_registradas: number;
  actas_con_foto: number;
  coordinador: string | null;
}

export interface Mesa {
  jrv_id: number;
  numero: number;
  recinto_id: number;
  recinto: string;
  veedor_id: string | null;
  veedor: string | null;
  acta_alcalde: boolean;
  acta_prefecto: boolean;
}

export interface Candidatura {
  id: number;
  dignidad: Dignidad;
  nombre_candidato: string;
  organizacion: { nombre: string; siglas: string; lista: string };
}

export interface DetalleVoto {
  candidatura_id: number;
  votos: number;
}

export interface Acta {
  id: string;
  jrv_id: number;
  dignidad: Dignidad;
  total_sufragantes: number;
  votos_nulos: number;
  votos_blancos: number;
  foto_url: string | null;
  nitidez: number | null;
  latitud: number | null;
  longitud: number | null;
  precision_gps: number | null;
  updated_at: string;
  detalle_votos: DetalleVoto[];
}

export interface Ubicacion {
  latitud: number;
  longitud: number;
  precision: number;
}

export interface ResultadoVoto {
  recinto_id: number;
  recinto: string;
  dignidad: Dignidad;
  candidatura_id: number;
  nombre_candidato: string;
  siglas: string;
  organizacion: string;
  votos: number;
}

export interface UbicacionActa {
  acta_id: string;
  dignidad: Dignidad;
  jrv: number;
  recinto: string;
  latitud: number | null;
  longitud: number | null;
  precision_gps: number | null;
  created_at: string;
}

export interface NuevoUsuario {
  cedula: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  correo: string;
}

export const NOMBRE_ROL: Record<Rol, string> = {
  coordinador_provincial: 'Coordinador provincial',
  coordinador_recinto: 'Coordinador de recinto',
  veedor: 'Veedor de mesa',
};
