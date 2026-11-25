// Edge Function "login" (ADR-002). R3: inicio de sesion con CEDULA.
// La app envia cedula + contrasena; aqui (servidor) se busca el correo con la clave de servicio,
// que nunca se expone en la app. Se devuelve solo la sesion del usuario.
// Desplegar con "Verify JWT" DESACTIVADO (el usuario aun no tiene sesion).
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  try {
    const { cedula, password } = await req.json();
    if (typeof cedula !== 'string' || !/^\d{10}$/.test(cedula) || typeof password !== 'string' || !password) {
      return json({ error: 'Cédula o contraseña incorrectas.' }, 400);
    }

    const url = Deno.env.get('SUPABASE_URL')!;
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
    const publico = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { auth: { persistSession: false } });

    const { data: perfil, error: errPerfil } = await admin
      .from('perfiles').select('correo').eq('cedula', cedula).maybeSingle();
    // Mismo mensaje si la cedula no existe: no se revela que cedulas estan registradas
    if (errPerfil || !perfil) return json({ error: 'Cédula o contraseña incorrectas.' }, 401);

    const { data, error } = await publico.auth.signInWithPassword({ email: perfil.correo, password });
    if (error || !data.session) {
      const msg = /not confirmed/i.test(error?.message ?? '')
        ? 'Debe confirmar su cuenta desde el correo recibido.'
        : 'Cédula o contraseña incorrectas.';
      return json({ error: msg }, 401);
    }

    return json({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
  } catch (_e) {
    return json({ error: 'Solicitud inválida.' }, 400);
  }
});
