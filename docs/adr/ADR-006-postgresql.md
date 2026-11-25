# ADR-006: PostgreSQL permite gestionar la información de la aplicación mediante una base de datos relacional

## Estado

Aceptado

## Fecha

2026-11-23

## Autor(es) y equipo

**Autores de la decisión:** Ariel Alexander Arias Toasa y Dilan Artemio Obando Suárez.

**Modalidad:** Decisión arquitectónica grupal, acordada durante la reunión de planificación del proyecto.

**Implementación en este repositorio:** [Repositorio](https://github.com/Dilanbkr7/Examen-Moviles-) — Dilan Artemio Obando Suárez.

Cada integrante realizará la implementación correspondiente en su propio repositorio de GitHub.

## Requisitos relacionados

- **R1.** Precargar y administrar la información de provincias, cantones, parroquias, recintos, JRV y organizaciones políticas.
- **R2.** Gestionar los usuarios y sus roles dentro del sistema.
- **R4.** Administrar recintos, asignaciones y consultar el avance del proceso electoral.
- **R5.** Gestionar las JRV y las asignaciones de veedores.
- **R6.** Registrar y administrar actas electorales, candidaturas y resultados de votación.
- **R8.** Garantizar la persistencia de la información y aplicar controles de acceso a los datos.
- **R9.** Mantener una arquitectura organizada que facilite la administración y consulta de la información.

## Contexto

La aplicación requiere almacenar y administrar información relacionada con el proceso de control electoral. Esta información incluye usuarios, perfiles, provincias, cantones, parroquias, recintos, juntas receptoras del voto, organizaciones políticas, candidaturas, asignaciones, actas electorales y detalles de los votos registrados.

Estos datos mantienen relaciones entre sí y requieren mecanismos que permitan preservar su integridad, evitar registros inconsistentes y realizar consultas relacionadas con diferentes entidades del sistema.

Además, es necesario contar con una base de datos que permita aplicar restricciones, relaciones y políticas de seguridad para controlar el acceso a la información de acuerdo con los roles y responsabilidades de cada usuario.

Por estas necesidades, se requiere seleccionar un sistema gestor de bases de datos que permita administrar información estructurada y mantener la consistencia de los registros electorales.

## Alternativas consideradas

1. **MySQL:** sistema gestor de bases de datos relacional que permite almacenar información estructurada, establecer relaciones y ejecutar consultas SQL. Es ampliamente utilizado en aplicaciones web.

2. **MongoDB:** sistema de base de datos orientado a documentos que permite almacenar información en estructuras flexibles. Puede ser útil cuando los datos no requieren un esquema relacional estricto.

3. **PostgreSQL:** sistema gestor de bases de datos relacional de código abierto que ofrece integridad referencial, restricciones, transacciones, funciones, procedimientos y mecanismos avanzados de seguridad.

## Decisión

Se decidió utilizar **PostgreSQL** como sistema gestor de base de datos para almacenar y administrar la información de la aplicación.

La base de datos será administrada mediante Supabase, que utiliza PostgreSQL como motor de almacenamiento y permite complementar su funcionamiento con servicios de autenticación, almacenamiento y seguridad.

Se utilizarán tablas relacionadas mediante claves primarias y foráneas para organizar la información del sistema. Entre las principales tablas se encuentran:

- `perfiles`: información de los usuarios y sus roles.
- `provincias`: información de las provincias.
- `cantones`: cantones asociados a cada provincia.
- `parroquias`: parroquias asociadas a los cantones.
- `recintos`: información de los recintos electorales.
- `jrv`: juntas receptoras del voto pertenecientes a los recintos.
- `organizaciones`: organizaciones políticas participantes.
- `candidaturas`: candidaturas correspondientes a los cargos electorales.
- `asignaciones`: relación entre usuarios y las responsabilidades asignadas.
- `actas`: información de las actas electorales registradas.
- `detalle_votos`: detalle de los votos registrados por organización y candidatura.

También se utilizarán restricciones, relaciones, funciones, triggers y políticas de Row Level Security (RLS) para mantener la integridad de los datos y controlar el acceso según los permisos establecidos.

## Consecuencias

**Beneficios:**

- Permite almacenar información estructurada mediante tablas relacionadas.
- Facilita la implementación de relaciones entre usuarios, recintos, JRV, actas y resultados electorales.
- Ofrece integridad referencial mediante claves primarias y foráneas.
- Permite utilizar restricciones para evitar inconsistencias en los registros.
- Facilita la ejecución de consultas SQL para obtener información y generar reportes.
- Proporciona soporte para transacciones, funciones y triggers.
- Se integra directamente con Supabase y sus mecanismos de seguridad RLS.

**Obligaciones y limitaciones:**

- Es necesario diseñar correctamente las tablas y sus relaciones.
- Se deben definir restricciones para garantizar la integridad de la información.
- Es necesario administrar las políticas RLS para controlar las operaciones de cada rol.
- Las consultas deben diseñarse considerando el rendimiento y la cantidad de registros.
- Se deben realizar respaldos y mantener procedimientos adecuados para la recuperación de información.

**Riesgos:**

- Una configuración incorrecta de las relaciones o restricciones puede provocar inconsistencias en los registros.
- Las políticas RLS mal definidas podrían permitir accesos no autorizados o bloquear operaciones legítimas.
- Las consultas complejas pueden afectar el rendimiento si no se utilizan índices y estructuras adecuadas.
- Una modificación incorrecta del esquema puede afectar las funcionalidades que dependen de las tablas existentes.

## Verificación

La decisión se puede verificar mediante los siguientes elementos y pruebas:

**Elementos de la base de datos:**

- Comprobar la existencia de las once tablas principales del sistema.
- Verificar las relaciones mediante claves primarias y foráneas.
- Comprobar las restricciones y validaciones definidas para los registros electorales.
- Verificar que las políticas RLS estén habilitadas en las tablas correspondientes.
- Comprobar la existencia y funcionamiento de las funciones y triggers utilizados para validar las operaciones.

**Pruebas funcionales:**

- Registrar y consultar información de provincias, cantones, parroquias y recintos.
- Comprobar la relación entre recintos y sus respectivas JRV.
- Verificar la creación y consulta de asignaciones.
- Registrar actas y detalles de votos.
- Comprobar que las restricciones impidan registrar información inconsistente.
- Verificar que los usuarios únicamente puedan consultar y modificar la información permitida según su rol y asignaciones.

**Verificación de seguridad:**

- Consultar las políticas RLS habilitadas en las tablas.
- Realizar pruebas con diferentes roles de usuario.
- Comprobar que un veedor no pueda acceder a JRV que no tiene asignadas.

## Uso de IA

**Herramienta utilizada:** ChatGPT.

**Consulta realizada:** análisis de alternativas de sistemas gestores de bases de datos para una aplicación de control electoral que requiere almacenar información estructurada, mantener relaciones entre entidades y garantizar la integridad de los registros.

**Respuesta sugerida:** se analizaron MySQL, MongoDB y PostgreSQL, considerando sus características, ventajas y limitaciones para administrar la información del sistema.

**Aceptación:** ambos integrantes estuvieron de acuerdo con la utilización de PostgreSQL por sus capacidades relacionales, integridad referencial, soporte de SQL y compatibilidad con Supabase.

**Verificación humana:** Dilan Artemio Obando Suárez ejecutó los scripts de `supabase/` en su proyecto y comprobó que el trigger rechaza actas cuyos votos válidos + nulos + blancos no coinciden con el total de sufragantes, y que las políticas RLS filtran las JRV por rol. El uso de IA durante la implementación individual se detalla en `docs/anexo-ia.md`.

## Trazabilidad

**Repositorio de implementación:**  
https://github.com/Dilanbkr7/Examen-Moviles-

**Commit de documentación ADR:** [d1ee8b6](https://github.com/Dilanbkr7/Examen-Moviles-/commit/d1ee8b6).

**Commit de implementación:** [19d745f](https://github.com/Dilanbkr7/Examen-Moviles-/commit/19d745f) (`supabase/01_schema.sql`, `02_seguridad.sql`).

**Responsabilidad:** la decisión arquitectónica fue grupal; la implementación documentada en este repositorio corresponde a Dilan Artemio Obando Suárez.

## Consenso del equipo

**Integrantes participantes:**

- Ariel Alexander Arias Toasa.
- Dilan Artemio Obando Suárez.

**Argumentos expuestos:** se consideró necesario utilizar una base de datos que permita administrar información estructurada y mantener relaciones entre las diferentes entidades del sistema electoral. PostgreSQL ofrece mecanismos para garantizar la integridad de los registros, realizar consultas SQL y establecer controles de seguridad mediante las políticas RLS de Supabase.

**Objeciones:** no hubo objeciones, ya que ambos integrantes estuvieron de acuerdo con lo expuesto y con las alternativas presentadas.

**Acuerdo final:** ambos integrantes acordaron utilizar PostgreSQL como sistema gestor de base de datos para almacenar y administrar la información de la aplicación.

**Referencia del video:** 14:47 – 17:26.

---

## A.5 Acta de consolidación

**Integrantes:** Ariel Alexander Arias Toasa y Dilan Artemio Obando Suárez.

**Fecha de reunión:** 23/11/2026.

**Enlace al video:** [Ver video en YouTube](https://youtu.be/acl_hGWJ8hk).

Todos los integrantes reconocen esta línea base y documentarán cualquier sustitución mediante un nuevo ADR.