# ADR-004: Capacitor permite integrar las funcionalidades nativas del dispositivo móvil

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

- **R7.** Permitir la captura de fotografías de las actas electorales, verificar su nitidez y obtener la ubicación GPS.
- **R8.** Integrar las funcionalidades del dispositivo móvil con los servicios backend y garantizar el almacenamiento de la información.
- **R9.** Mantener una arquitectura organizada que permita separar la presentación, la lógica de negocio y el acceso a los datos.

## Contexto

La aplicación requiere ejecutarse en dispositivos Android y utilizar funcionalidades propias del hardware del teléfono. Entre ellas se encuentran la cámara para fotografiar las actas electorales, el GPS para registrar la ubicación desde donde se realiza el proceso y la conexión de red para comprobar la disponibilidad de Internet.

También se necesita contar con mecanismos para almacenar información localmente y administrar archivos durante determinados procesos de la aplicación.

Por esta razón, se requiere una tecnología que permita integrar las funcionalidades nativas del dispositivo con la aplicación desarrollada utilizando tecnologías web, sin tener que construir toda la aplicación mediante herramientas de desarrollo nativo de Android.

## Alternativas consideradas

1. **Desarrollo nativo con Android:** permite acceder directamente a las funcionalidades del dispositivo, pero requiere desarrollar la aplicación utilizando tecnologías específicas del entorno Android.
2. **Capacitor:** permite integrar aplicaciones web desarrolladas con tecnologías como React, Ionic y TypeScript con funcionalidades nativas de Android mediante plugins.

## Decisión

Se decidió utilizar **Capacitor** como tecnología de integración entre la aplicación Ionic React y las funcionalidades nativas del dispositivo Android.

La aplicación utilizará Capacitor junto con los siguientes plugins:

- `@capacitor/camera`: acceso a la cámara para capturar fotografías de las actas electorales.
- `@capacitor/geolocation`: obtención de las coordenadas geográficas del dispositivo.
- `@capacitor/network`: consulta del estado de conexión de red.
- `@capacitor/preferences`: almacenamiento de preferencias y datos sencillos en el dispositivo.
- `@capacitor/filesystem`: gestión de archivos dentro del dispositivo.

La integración se realizará mediante la plataforma Android de Capacitor, permitiendo generar y sincronizar el proyecto nativo para posteriormente compilar el APK.

## Consecuencias

**Beneficios:**

- Permite reutilizar el desarrollo realizado con Ionic React, React y TypeScript.
- Facilita el acceso a funcionalidades nativas del dispositivo mediante plugins.
- Permite utilizar la cámara para obtener fotografías de las actas electorales.
- Facilita la obtención de coordenadas GPS para respaldar los registros.
- Permite consultar el estado de conexión y administrar información y archivos locales.
- Facilita la generación de una aplicación instalable en dispositivos Android.

**Obligaciones y limitaciones:**

- Es necesario instalar y mantener las dependencias de Capacitor y sus plugins.
- Se deben configurar los permisos de Android para acceder a la cámara, ubicación y almacenamiento cuando corresponda.
- Se deben probar las funcionalidades en dispositivos físicos, ya que el comportamiento puede variar entre versiones de Android y fabricantes.
- Es necesario sincronizar los cambios del proyecto web con el proyecto nativo mediante los comandos de Capacitor.

**Riesgos:**

- Los permisos denegados por el usuario pueden impedir el funcionamiento de determinadas funcionalidades.
- Las diferencias entre dispositivos y versiones de Android pueden ocasionar comportamientos inesperados en los plugins.
- Las actualizaciones de Capacitor o de sus plugins podrían requerir ajustes en la configuración del proyecto Android.

## Verificación

La decisión se puede verificar mediante los siguientes elementos y pruebas:

**Archivos y dependencias:**

- `package.json`: comprobar la instalación de Capacitor y sus plugins.
- `capacitor.config.ts`: verificar la configuración de Capacitor.
- `android/`: comprobar la existencia del proyecto nativo Android.

**Comandos de verificación:**

```bash
npm install
ionic build
ionic capacitor sync android
ionic capacitor open android
```

**Pruebas funcionales:**

- Comprobar que la aplicación solicita los permisos necesarios para utilizar la cámara.
- Verificar que se puede capturar una fotografía desde un dispositivo Android.
- Comprobar que se obtienen las coordenadas GPS cuando el usuario concede el permiso de ubicación.
- Verificar la detección del estado de conexión de red.
- Comprobar el almacenamiento y la lectura de preferencias y archivos locales.
- Generar y ejecutar el APK en un dispositivo Android físico.

## Uso de IA

**Herramienta utilizada:** ChatGPT.

**Consulta realizada:** análisis de alternativas tecnológicas para integrar funcionalidades nativas de Android en una aplicación desarrollada con Ionic React.

**Respuesta sugerida:** se analizaron alternativas como el desarrollo nativo con Android, React Native y Capacitor, considerando las necesidades de acceso a la cámara, geolocalización, conectividad y almacenamiento local.

**Aceptación:** ambos integrantes estuvieron de acuerdo con la utilización de Capacitor, considerando su compatibilidad con la arquitectura tecnológica seleccionada para el proyecto.

**Verificación humana:** Dilan Artemio Obando Suárez verificó en un teléfono Android la solicitud de permisos de cámara y ubicación, el comportamiento al negarlos, la captura de la foto y la lectura de coordenadas GPS, y generó el APK. El uso de IA durante la implementación individual se detalla en `docs/anexo-ia.md`.

## Trazabilidad

**Repositorio de implementación:**  
https://github.com/Dilanbkr7/Examen-Moviles-

**Commit de documentación ADR:** [c046e68](https://github.com/Dilanbkr7/Examen-Moviles-/commit/c046e68).

**Commit de implementación:** [e5b4979](https://github.com/Dilanbkr7/Examen-Moviles-/commit/e5b4979) (`src/services/camaraService.ts`, `src/services/ubicacionService.ts`, `capacitor.config.ts`).

**Responsabilidad:** la decisión arquitectónica fue grupal; la implementación documentada en este repositorio corresponde a Dilan Artemio Obando Suárez.

## Consenso del equipo

**Integrantes participantes:**

- Ariel Alexander Arias Toasa.
- Dilan Artemio Obando Suárez.

**Argumentos expuestos:** se consideró necesario contar con una tecnología que permita aprovechar las funcionalidades nativas de los dispositivos Android sin abandonar el desarrollo realizado con Ionic React. Capacitor permite integrar la cámara, la geolocalización, la conectividad y el almacenamiento local mediante plugins.

**Objeciones:** no hubo objeciones, ya que ambos integrantes estuvieron de acuerdo con lo expuesto y con las alternativas presentadas.

**Acuerdo final:** ambos integrantes acordaron utilizar Capacitor para integrar las funcionalidades nativas requeridas por la aplicación y facilitar su ejecución en dispositivos Android.

**Referencia del video:** 09:13 – 11:56.

---

## A.5 Acta de consolidación

**Integrantes:** Ariel Alexander Arias Toasa y Dilan Artemio Obando Suárez.

**Fecha de reunión:** 23/11/2026.

**Enlace al video:** [Ver video en YouTube](https://youtu.be/acl_hGWJ8hk).

Todos los integrantes reconocen esta línea base y documentarán cualquier sustitución mediante un nuevo ADR.