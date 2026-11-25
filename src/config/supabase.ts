import { createClient } from '@supabase/supabase-js';
import { Preferences } from '@capacitor/preferences';

// ADR-002: cliente oficial de Supabase. Solo se usa la clave PUBLICA (anon/publishable).
// La service_role nunca esta en la app: vive solo en las Edge Functions.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Mensaje claro si falta el archivo .env (ver .env.example)
  console.error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el archivo .env');
}

// ADR-004: @capacitor/preferences guarda la sesion en el almacenamiento nativo del dispositivo.
const almacenamientoSesion = {
  getItem: async (key: string) => (await Preferences.get({ key })).value,
  setItem: async (key: string, value: string) => {
    await Preferences.set({ key, value });
  },
  removeItem: async (key: string) => {
    await Preferences.remove({ key });
  },
};

export const supabase = createClient(url ?? '', anonKey ?? '', {
  auth: {
    storage: almacenamientoSesion,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export const BUCKET_ACTAS = 'actas';
