# ADR-001: Ionic React con TypeScript es el framework de desarrollo móvil

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

- **R4, R5, R6:** pantallas diferenciadas para coordinador provincial, coordinador de recinto y veedor.
- **R7:** integración con Capacitor para cámara y geolocalización.
- **R9:** separación entre presentación, lógica de negocio y acceso a datos; navegación y estados de interfaz.

## Contexto

Se requiere desarrollar una aplicación móvil que permita gestionar y supervisar el proceso de escrutinio electoral, con diferentes roles de usuario, formularios, validaciones, captura de fotografías, geolocalización y visualización de resultados.

El enunciado solo admite Ionic Angular (standalone) o Ionic React. Es necesario seleccionar un framework que permita desarrollar una aplicación organizada, compatible con Capacitor y que se pueda compilar para Android.

## Alternativas consideradas

### Alternativa A: Ionic React (seleccionada)

Framework basado en React que permite construir aplicaciones móviles utilizando componentes de Ionic y TypeScript.

- **Beneficios:** interfaces reutilizables mediante componentes; facilita separar lógica y presentación; integración con Capacitor; amplia comunidad y documentación; conexión con Supabase mediante su SDK oficial.
- **Costos:** requiere conocimientos de React y TypeScript; algunas funcionalidades nativas necesitan plugins adicionales; es necesario gestionar adecuadamente el estado de la aplicación.
- **Riesgos:** una mala organización de componentes puede dificultar el mantenimiento; el uso incorrecto de plugins puede generar problemas de compatibilidad.

### Alternativa B: Ionic Angular

Framework que utiliza Angular para construir aplicaciones móviles mediante Ionic.

- **Beneficios:** arquitectura estructurada mediante componentes y servicios; inyección de dependencias integrada; herramientas para formularios y validaciones; compatibilidad con Capacitor.
- **Costos:** requiere conocimientos de Angular y TypeScript; su estructura puede resultar más extensa para determinadas funcionalidades.
- **Riesgos:** una configuración incorrecta de servicios y dependencias puede afectar el funcionamiento; puede incrementar la complejidad inicial del desarrollo.

## Decisión

Se selecciona **Ionic React con TypeScript**, debido a que permite desarrollar interfaces modulares, reutilizables y mantenibles, además de integrarse con Capacitor y Supabase.

## Consecuencias

- La interfaz se desarrolla con componentes React e Ionic.
- Se utilizan hooks (`useState`, `useEffect`, `useContext`) para gestionar el comportamiento de los componentes.
- El código se organiza por páginas, componentes, servicios y modelos (`src/pages`, `src/components`, `src/services`, `src/models`).
- La navegación se realiza con React Router mediante `@ionic/react-router`.
- **Riesgo:** si las páginas acceden directamente a la base de datos se rompe la separación de capas; por eso las páginas solo llaman a servicios.

## Verificación

- `package.json`: dependencias `@ionic/react`, `@ionic/react-router`, `react`, `typescript`.
- `src/App.tsx`: rutas por rol con `IonReactRouter`.
- Estructura de carpetas `src/pages`, `src/components`, `src/services`, `src/models`, `src/utils`.
- Comandos: `npm install`, `npm run build`, `npx cap sync android`.
- Comprobar la ejecución en navegador (`npm run dev`) y en Android (APK).

## Uso de IA

- **Herramienta:** ChatGPT (análisis de alternativas en la fase grupal).
- **Consulta realizada:** comparación entre Ionic React e Ionic Angular para una aplicación móvil de control electoral con roles, formularios, cámara y GPS.
- **Respuesta sugerida:** ambas opciones son viables; Ionic React ofrece componentes reutilizables e integración directa con el SDK de Supabase.
- **Aceptación:** ambos integrantes acordaron Ionic React durante la reunión.
- **Verificación humana:** en la implementación individual se comprobó la compilación (`npm run build`), la navegación entre pantallas y la generación del APK. El uso de IA durante la implementación se detalla en `docs/anexo-ia.md`.

## Trazabilidad

- **Commit de documentación ADR:** [eca5b01](https://github.com/Dilanbkr7/Examen-Moviles-/commit/eca5b01).
- **Commit de implementación:** [04176d2 - Inicialización de la estructura del proyecto](https://github.com/Dilanbkr7/Examen-Moviles-/commit/04176d2).
- **Repositorio de implementación:** https://github.com/Dilanbkr7/Examen-Moviles-

## Consenso del equipo

**Integrantes:**

- Ariel Alexander Arias Toasa.
- Dilan Artemio Obando Suárez.

**Argumentos expuestos:** durante la reunión de definición arquitectónica se analizaron las necesidades de la aplicación, la compatibilidad con Android, la organización del código y la posibilidad de integrar funcionalidades nativas.

**Objeciones:** no hubo objeciones, ya que ambos integrantes estuvieron de acuerdo con lo expuesto y con las alternativas presentadas.

**Acuerdo final:** ambos integrantes acordaron utilizar Ionic React con TypeScript como tecnología principal para desarrollar la aplicación móvil.

**Minuto del video:** 0:25 – 3:58.

---

## A.5 Acta de consolidación

**Integrantes:** Ariel Alexander Arias Toasa y Dilan Artemio Obando Suárez.

**Fecha de reunión:** 23/11/2026.

**Enlace al video:** [Ver video en YouTube](https://youtu.be/acl_hGWJ8hk).

Ambos integrantes reconocen esta decisión como parte de la línea base arquitectónica del Sistema de Control Electoral CNE. Cualquier sustitución deberá documentarse mediante un nuevo ADR.
