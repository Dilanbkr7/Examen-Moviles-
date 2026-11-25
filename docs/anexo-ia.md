# Anexo: uso de inteligencia artificial

**Estudiante:** Dilan Artemio Obando Suárez

## Herramientas

| Herramienta | Fase | Uso |
| --- | --- | --- |
| ChatGPT | Propuestas y deliberación grupal (ADR-001 a ADR-006) | Comparar alternativas (Ionic React/Angular, Supabase/Firebase, Context/Zustand, PostgreSQL/MySQL/MongoDB, Capacitor/nativo) |
| Claude (Anthropic) | Implementación individual | Revisar el enunciado contra la rúbrica y los ADR, generar el esquema SQL, las Edge Functions, el código Ionic React, el README y este anexo |

## Ejemplos de instrucciones dadas

1. "Analiza a detalle el documento del examen, la rúbrica en Excel y los ADR que acordamos. No agregues nada que no esté contemplado en los ADR."
2. "Agrega el proyecto en la ruta `C:\Users\pauly\examen_moviles`; el proyecto está nuevo, aún no tengo pruebas ni nada."
3. Decisión sobre la nitidez de la foto (R7): se pidió una opción sin librerías nuevas. Se eligió la varianza del Laplaciano y se registró como ADR-007.

## Qué se aceptó, qué se descartó y qué se corrigió

| Sugerencia o resultado de la IA | Decisión | Motivo |
| --- | --- | --- |
| Usar solo las tecnologías de ADR-001 a ADR-006 | Aceptado | Regla del equipo: no salir de la línea base |
| Librería de gráficos para el dashboard | Descartado | No estaba en los ADR; se usan barras con CSS y componentes Ionic |
| Librería de formularios y validación | Descartado | No estaba en los ADR; se usan funciones puras en `src/utils/validaciones.ts` |
| Servicio externo para medir nitidez | Descartado | Requiere red y tecnología nueva; se calcula en el teléfono (ADR-007) |
| Recuperación de contraseña con enlace profundo (*deep link*) | Descartado | Requiere configurar enlaces nativos; se usa un código de un solo uso enviado por correo (Supabase Auth) |
| Buscar el correo por cédula con una función pública | Descartado | Permitiría averiguar el correo de cualquier cédula; se hace dentro de la Edge Function `login` |
| ADR-005 mencionaba Zustand en título y beneficios | Corregido | La decisión acordada fue solo React Context API |
| ADR-001 incompleto en la versión .md | Corregido | Se completó con el contenido acordado en el documento grupal |
| Trigger `validar_totales_acta`: la primera versión fallaba con `record "old" has no field "acta_id"` | Corregido | La prueba local con roles simulados detectó el error; se reemplazó el `CASE` por `IF/ELSIF` |

## Cómo se verificó

- **Compilación:** `npm run typecheck` y `npm run build` sin errores.
- **Base de datos:** se cargaron los scripts en un PostgreSQL local y se simularon los 3 roles. Resultados:
  - El veedor A solo ve su JRV y recibe `NO_AUTORIZADO` al guardar en la JRV del veedor B.
  - Las actas descuadradas, sin las 5 candidaturas o con votos de otra dignidad se rechazan con `ACTA_INCONSISTENTE`.
  - El coordinador no puede crear recintos ni asignar veedores fuera de su recinto.
  - El provincial ve todos los recintos y el consolidado, pero no puede escribir actas.
  - Al reasignar una JRV, el veedor anterior deja de verla.
- **En el teléfono (verificación del estudiante):** completar con lo probado.
  - [ ] Permiso de cámara concedido y negado
  - [ ] Foto nítida aceptada y foto movida rechazada (anotar puntajes y ajustar `UMBRAL_NITIDEZ` si hace falta)
  - [ ] GPS con permiso, sin permiso y con el GPS apagado
  - [ ] Flujo completo de los 3 roles con el APK instalado
  - [ ] `supabase/05_pruebas_rls.sql` ejecutado con usuarios reales

## Límites reconocidos

- La IA no conoce el proyecto Supabase real; las políticas se comprobaron ejecutándolas, no leyéndolas.
- El umbral de nitidez es un valor inicial y debe calibrarse con fotos reales de actas.
- El servidor de correo incluido en Supabase limita los envíos; sin SMTP propio, algunas confirmaciones pueden no llegar (la app lo informa).
- R10 (modo offline con sincronización) no se implementó.
