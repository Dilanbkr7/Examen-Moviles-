# Acta de consenso · Línea base arquitectónica

**Proyecto:** Control electoral para una organización política (Prueba 2 · Desarrollo de Aplicaciones Móviles · ESFOT)

**Grupo:** 1

**Integrantes:** Ariel Alexander Arias Toasa y Dilan Artemio Obando Suárez

**Fecha de reunión:** 23/11/2026

**Enlace al video:** https://youtu.be/acl_hGWJ8hk

## Acuerdos e índice de minutos del video por ADR

| ADR | Decisión acordada | Requisitos | Minuto del video |
| --- | --- | --- | --- |
| [ADR-001](adr/ADR-001-ionic-react.md) | Ionic React con TypeScript como framework móvil | R9 | 00:25 – 03:58 |
| [ADR-002](adr/ADR-002-supabase.md) | Supabase como backend (Auth, base de datos, Storage, Edge Functions) | R2, R3, R8 | 04:01 – 06:22 |
| [ADR-003](adr/ADR-003-supabase-storage.md) | Supabase Storage para las fotografías de las actas | R7, R8 | 06:25 – 09:10 |
| [ADR-004](adr/ADR-004-capacitor.md) | Capacitor para cámara, geolocalización y conectividad | R7 | 09:13 – 11:56 |
| [ADR-005](adr/ADR-005-react-context-api.md) | React Context API para el estado compartido | R9 | 12:00 – 14:42 |
| [ADR-006](adr/ADR-006-postgresql.md) | PostgreSQL como base de datos relacional | R1, R8 | 14:47 – 17:26 |

[ADR-007](adr/ADR-007-nitidez-foto-acta.md) (nitidez de la foto con la varianza del Laplaciano) es una decisión individual de implementación. Complementa la línea base sin reemplazar ningún ADR grupal, por eso no tiene minuto en el video.

## Compromiso

Todos los integrantes reconocen esta línea base y documentarán cualquier sustitución mediante un nuevo ADR. Cada integrante desarrolla su propia aplicación y su propio repositorio respetando estas decisiones.
