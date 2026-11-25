// Edge Function "crear-usuario" (ADR-002). R2: no hay autorregistro.
//  - coordinador_provincial  -> puede crear coordinador_recinto
//  - coordinador_recinto     -> puede crear veedor
// El rol de quien llama se verifica AQUI con su token; la clave de servicio nunca sale del servidor.
// Desplegar con "Verify JWT" DESACTIVADO: la verificacion del token se hace manualmente abajo.
import { createClient } from 'npm:@supabase/supabase-js@2';

const PASSWORD_INICIAL = 'Ecuador2026';
const PERMITIDO: Record<string, string> = {
  coordinador_provincial: 'coordinador_recinto',
  coordinador_recinto: 'veedor',
};

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

function cedulaValida(c: string): boolean {
  if (!/^\d{10}$/.test(c)) return false;
  const prov = Number(c.slice(0, 2));
  if (!((prov >= 1 && prov <= 24) || prov === 30) || Number(c[2]) >= 6) return false;
  const coef = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let v = Number(c[i]) * coef[i];
    if (v >= 10) v -= 9;
    suma += v;
  }
  return (10 - (suma % 10)) % 10 === Number(c[9]);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

  // 1. Quien llama
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data: quien, error: errQuien } = await admin.auth.getUser(token);
  if (errQuien || !quien.user) return json({ error: 'Sesión inválida. Inicie sesión de nuevo.' }, 401);

  const { data: creador } = await admin.from('perfiles').select('id, rol').eq('id', quien.user.id).maybeSingle();
  if (!creador) return json({ error: 'Perfil no encontrado.' }, 403);

  // 2. Datos y validaciones (las mismas que en la app, repetidas en el servidor)
  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Solicitud inválida.' }, 400);
  }
  const rol = String(body.rol ?? '');
  if (PERMITIDO[creador.rol] !== rol) {
    return json({ error: 'No autorizado: su rol no puede crear este tipo de cuenta.' }, 403);
  }
  const cedula = String(body.cedula ?? '').trim();
  const nombres = String(body.nombres ?? '').trim();
  const apellidos = String(body.apellidos ?? '').trim();
  const telefono = String(body.telefono ?? '').trim();
  const correo = String(body.correo ?? '').trim().toLowerCase();
  if (!cedulaValida(cedula)) return json({ error: 'Cédula ecuatoriana inválida.' }, 400);
  if (nombres.length < 2 || apellidos.length < 2) return json({ error: 'Nombres y apellidos son obligatorios.' }, 400);
  if (!/^09\d{8}$/.test(telefono)) return json({ error: 'Celular inválido (10 dígitos, empieza con 09).' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) return json({ error: 'Correo inválido.' }, 400);

  const { data: porCedula } = await admin.from('perfiles').select('id').eq('cedula', cedula).limit(1);
  if (porCedula && porCedula.length) return json({ error: 'Ya existe una cuenta con esa cédula.' }, 409);
  const { data: porCorreo } = await admin.from('perfiles').select('id').eq('correo', correo).limit(1);
  if (porCorreo && porCorreo.length) return json({ error: 'Ya existe una cuenta con ese correo.' }, 409);

  // 3. Crear la cuenta y enviar la confirmacion por correo (invitacion de Supabase Auth).
  //    Si el servidor de correo no permite enviar, se crea igual y se informa.
  let userId: string;
  let correoEnviado = true;
  let mensaje = 'correo de confirmación enviado';
  const invitacion = await admin.auth.admin.inviteUserByEmail(correo, { data: { cedula, rol } });
  if (invitacion.error || !invitacion.data.user) {
    correoEnviado = false;
    mensaje = `no se pudo enviar el correo: ${invitacion.error?.message ?? 'desconocido'}`;
    const creado = await admin.auth.admin.createUser({
      email: correo, password: PASSWORD_INICIAL, email_confirm: true, user_metadata: { cedula, rol },
    });
    if (creado.error || !creado.data.user) return json({ error: creado.error?.message ?? 'No se pudo crear la cuenta.' }, 400);
    userId = creado.data.user.id;
  } else {
    userId = invitacion.data.user.id;
    // Contrasena inicial (R3) y cuenta habilitada para el primer acceso
    const upd = await admin.auth.admin.updateUserById(userId, { password: PASSWORD_INICIAL, email_confirm: true });
    if (upd.error) {
      await admin.auth.admin.deleteUser(userId);
      return json({ error: upd.error.message }, 400);
    }
  }

  // 4. Perfil con rol y bandera de cambio obligatorio de contrasena
  const { error: errPerfil } = await admin.from('perfiles').insert({
    id: userId, cedula, nombres, apellidos, telefono, correo, rol, debe_cambiar_password: true, creado_por: creador.id,
  });
  if (errPerfil) {
    await admin.auth.admin.deleteUser(userId);
    return json({ error: `No se pudo guardar el perfil: ${errPerfil.message}` }, 400);
  }

  return json({ id: userId, correo_enviado: correoEnviado, mensaje });
});
