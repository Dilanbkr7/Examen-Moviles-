# ADR-003: Supabase Storage permite almacenar fotografías de las actas electorales

## Estado

Aceptado.

## Fecha

2026-11-23

## Autor(es) y equipo

**Autores de la decisión:** Ariel Alexander Arias Toasa y Dilan Artemio Obando Suárez.

**Modalidad:** Decisión arquitectónica grupal, acordada durante la reunión de planificación del proyecto.

**Implementación en este repositorio:** [Repositorio](https://github.com/Dilanbkr7/Examen-Moviles-) — Dilan Artemio Obando Suárez.

Cada integrante realizará la implementación correspondiente en su propio repositorio de GitHub.
## Requisitos relacionados

- **R7:** Cada acta debe contar con una fotografía como evidencia del registro electoral, considerando la captura de imágenes y la gestión de permisos.
- **R8:** Las fotografías deben almacenarse de forma persistente y su acceso debe estar restringido según los permisos del usuario.
- **R9:** La gestión de archivos debe mantenerse separada de la presentación y de la lógica de negocio.

## Contexto

El Sistema de Control Electoral CNE requiere almacenar fotografías de las actas registradas por los veedores de mesa. Estas imágenes constituyen evidencias que complementan los resultados ingresados en la aplicación.

El almacenamiento debe permitir cargar, consultar y actualizar fotografías, manteniendo una relación entre cada archivo y el acta correspondiente.

Además, las imágenes no deben quedar disponibles públicamente, debido a que forman parte de la información de un proceso electoral. Su acceso debe estar limitado a usuarios autorizados según sus roles y asignaciones.

Entre los criterios considerados se encuentran la integración con la plataforma backend, la seguridad de los archivos, la persistencia, la facilidad de administración y la posibilidad de asociar cada fotografía con un registro de la base de datos.

## Alternativas consideradas

- **Firebase Storage:** servicio de almacenamiento de archivos de Firebase que permite cargar y consultar imágenes mediante reglas de seguridad. Se consideró por su integración con el ecosistema de Firebase.
- **Supabase Storage:** servicio de almacenamiento de archivos integrado con Supabase, que permite utilizar buckets y políticas de acceso relacionadas con la base de datos y la autenticación.

## Decisión

Se selecciona **Supabase Storage** para almacenar las fotografías de las actas electorales.

La configuración contempla:

- Un bucket privado denominado `actas`.
- Restricción de formatos de imagen a JPEG, JPG, PNG y WebP.
- Tamaño máximo configurado de 10 MB por archivo.
- Organización de los archivos mediante una ruta asociada a la JRV y al identificador del acta.
- Políticas de acceso para controlar las operaciones de lectura, inserción y actualización.
- Restricción del acceso según el usuario autenticado, sus asignaciones y el estado del acta.

La ruta de almacenamiento seguirá el siguiente formato:

```text
actas/
└── ID_JRV/
    └── ID_ACTA.jpg
```

En la tabla `actas`, el campo `foto_url` almacenará la ruta del archivo dentro del bucket y no una URL pública.

Para visualizar una fotografía, se utilizarán enlaces firmados temporales generados por Supabase Storage, previa autorización del usuario.

La carga de una fotografía se realizará después de crear el registro del acta, utilizando su identificador como parte de la ruta del archivo.

## Consecuencias

### Beneficios

- Permite almacenar fotografías sin utilizar directamente la base de datos para guardar los archivos binarios.
- Mantiene los archivos organizados mediante identificadores de JRV y actas.
- Permite restringir el acceso mediante un bucket privado.
- Facilita la integración con Supabase Auth y PostgreSQL.
- Permite actualizar fotografías sin crear necesariamente nuevos registros de actas.
- Facilita la generación de enlaces firmados temporales para visualizar imágenes autorizadas.

### Obligaciones

- Validar el formato y tamaño de las fotografías antes de cargarlas.
- Comprobar los permisos de cámara y almacenamiento cuando corresponda.
- Mantener correctamente relacionadas las rutas de los archivos con los registros de actas.
- Aplicar políticas de acceso en las operaciones de lectura, inserción y actualización.
- Gestionar errores de carga, consulta y actualización de fotografías.
- Evitar la exposición pública de las imágenes.

### Limitaciones y riesgos

- La carga y consulta de fotografías dependen de la conectividad con Supabase.
- Los archivos de gran tamaño pueden incrementar el tiempo de carga y consumo de datos.
- Una configuración incorrecta de las políticas de almacenamiento podría permitir accesos no autorizados.
- Si se elimina o modifica incorrectamente un archivo, el registro del acta podría conservar una ruta que ya no corresponda a una fotografía disponible.
- Los enlaces firmados tienen un periodo de vigencia y deben generarse nuevamente cuando sea necesario.

## Verificación

La decisión se verifica mediante los siguientes elementos:

**Configuración en Supabase:**

- Bucket `actas` creado como privado.
- Tamaño máximo configurado en 10 MB.
- Tipos MIME permitidos: JPEG, PNG y WebP.
- Políticas de inserción, lectura y actualización.
- Restricción de acceso mediante la función `usuario_puede_acceder_jrv`.

**Estructura de la base de datos:**

- Tabla `actas`.
- Campo `foto_url`, utilizado para almacenar la ruta del archivo.

**Comportamiento esperado:**

1. Crear un registro de acta y obtener su identificador.
2. Cargar la fotografía en la ruta correspondiente a la JRV y al acta.
3. Guardar la ruta del archivo en `foto_url`.
4. Consultar la fotografía mediante un enlace firmado temporal.
5. Verificar que los usuarios sin autorización no puedan consultar ni modificar el archivo.

Las pruebas funcionales de carga y visualización desde la aplicación móvil deberán registrarse cuando se complete la integración del servicio.

## Uso de IA

- **Herramienta:** ChatGPT.
- **Consulta realizada:** análisis de alternativas para almacenar fotografías de actas electorales, considerando seguridad, persistencia, integración con Supabase y control de acceso por roles.
- **Respuesta sugerida:** utilizar Supabase Storage con un bucket privado y políticas de acceso relacionadas con los registros de actas.
- **Aceptación:** ambos integrantes acordaron utilizar Supabase Storage durante la reunión de definición arquitectónica.
- **Verificación humana:** Dilan Artemio Obando Suárez creó el bucket privado `actas` con `supabase/03_storage.sql`, comprobó que la foto se sube a `ID_JRV/ID_ACTA.jpg`, que se visualiza con URL firmada y que un veedor de otra JRV no puede subirla ni leerla. El uso de IA durante la implementación individual se detalla en `docs/anexo-ia.md`.

## Trazabilidad

- **Commit de documentación ADR:** [eca5b01](https://github.com/Dilanbkr7/Examen-Moviles-/commit/eca5b01).
- **Commit de implementación:** [5156ba0](https://github.com/Dilanbkr7/Examen-Moviles-/commit/5156ba0) (`src/services/fotoService.ts` y `supabase/03_storage.sql`).
- **Repositorio de implementación:** https://github.com/Dilanbkr7/Examen-Moviles-

La configuración del bucket y sus políticas fue realizada individualmente por Dilan Artemio Obando Suárez en este repositorio.

## Consenso del equipo

**Integrantes:**

- Ariel Alexander Arias Toasa.
- Dilan Artemio Obando Suárez.

**Argumentos expuestos:** durante la reunión se analizaron las necesidades de almacenamiento de fotografías de las actas, la protección de los archivos, su relación con los registros electorales y las alternativas disponibles para administrar las evidencias.

**Objeciones:** no hubo objeciones, ya que ambos integrantes estuvieron de acuerdo con lo expuesto y con las alternativas presentadas.

**Acuerdo final:** ambos integrantes acordaron utilizar Supabase Storage como servicio de almacenamiento privado de las fotografías de las actas electorales.

**Minuto del video:** 06:25 – 09:10.

---

## A.5 Acta de consolidación

**Integrantes:** Ariel Alexander Arias Toasa y Dilan Artemio Obando Suárez.

**Fecha de reunión:** 23/11/2026.

**Enlace al video:** [Ver video en YouTube](https://youtu.be/acl_hGWJ8hk).

Ambos integrantes reconocen esta decisión como parte de la línea base arquitectónica del Sistema de Control Electoral CNE. Cualquier sustitución deberá documentarse mediante un nuevo ADR.