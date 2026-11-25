# ADR-005: React Context API gestiona el estado compartido de la aplicación

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

- **R2.** Gestionar los usuarios y sus respectivos roles dentro de la aplicación.
- **R3.** Permitir la autenticación de usuarios y administrar el estado de sus sesiones.
- **R4.** Facilitar el acceso a la información correspondiente al coordinador provincial.
- **R5.** Gestionar las operaciones correspondientes al coordinador de recinto.
- **R6.** Permitir que los veedores accedan a las JRV asignadas y realicen el registro de información electoral.
- **R9.** Separar la presentación, la lógica de negocio y el acceso a los datos, y justificar la estrategia de manejo de estado.

## Contexto

La aplicación requiere administrar información que debe estar disponible en diferentes pantallas y componentes: la sesión del usuario autenticado, su perfil, su rol y si debe cambiar la contraseña inicial.

Al desarrollar con React, es necesario compartir y actualizar esa información entre componentes sin transmitirla manualmente mediante propiedades a través de múltiples niveles.

Además, debido a los diferentes roles, se necesita una administración organizada del estado global que separe los datos compartidos de la lógica específica de cada página.

## Alternativas consideradas

- **React Context API:** funcionalidad integrada en React que permite compartir información entre componentes mediante proveedores de contexto.
  - Beneficios: integrada en React, sin dependencias adicionales; adecuada para estados compartidos de complejidad moderada como sesión, perfil y rol.
  - Costos: requiere crear y organizar los proveedores; las actualizaciones pueden provocar renderizados adicionales.
  - Riesgos: un contexto demasiado grande afecta el rendimiento; no trae herramientas avanzadas de depuración.
- **Zustand:** biblioteca externa de gestión de estado que crea almacenes centralizados (*stores*) sin proveedores.
  - Beneficios: API sencilla y ligera; facilita actualizar partes específicas del estado.
  - Costos: dependencia adicional que hay que instalar, aprender y justificar; requiere definir una estructura de almacenes.
  - Riesgos: una mala organización de almacenes genera dependencias innecesarias.

## Decisión

Se selecciona **React Context API** para gestionar el estado compartido. Zustand se descarta porque agrega una dependencia que no es necesaria para el volumen de estado global del proyecto (sesión, perfil y rol).

- `AuthContext` expone la sesión, el perfil, el rol, el indicador `debe_cambiar_password` y las acciones `iniciarSesion`, `cerrarSesion` y `recargarPerfil`.
- El estado propio de cada pantalla (formularios, listas, carga y error) se maneja localmente con `useState` en la página.
- La información sensible y las operaciones de autenticación se gestionan mediante Supabase Auth. Context API solo comparte el estado necesario para la interfaz; no reemplaza los controles de seguridad del backend ni las políticas RLS de Supabase.

## Consecuencias

**Beneficios:**

- Permite compartir información entre componentes sin recurrir a *prop drilling*.
- Facilita la administración del estado de autenticación y la información del usuario.
- Permite proteger rutas según el rol del usuario.
- No agrega dependencias externas.

**Obligaciones y limitaciones:**

- En el contexto solo se guarda sesión, perfil y rol; los datos de cada pantalla quedan en la página.
- Los cambios de estado deben gestionarse para evitar renderizados innecesarios.
- La sesión debe mantenerse sincronizada con Supabase Auth (`onAuthStateChange`).

**Riesgos:**

- Si no se controla el estado de autenticación, pueden presentarse inconsistencias en la navegación (por ejemplo, ver una pantalla de otro rol durante un instante). Se mitiga mostrando un indicador de carga hasta conocer el perfil.
- Ocultar pantallas en la interfaz no es seguridad: la autorización real está en RLS (ADR-002, ADR-006).

## Verificación

**Archivos de referencia:**

- `src/contexts/AuthContext.tsx`: proveedor y hook `useAuth`.
- `src/main.tsx`: el proveedor `AuthProvider` envuelve la aplicación.
- `src/components/RutaProtegida.tsx`: redirige según sesión, rol y cambio de contraseña obligatorio.

**Pruebas funcionales:**

- Iniciar sesión y comprobar que cada rol llega a su pantalla inicial.
- Comprobar que un usuario con contraseña inicial es enviado a "Cambiar contraseña".
- Cerrar sesión y verificar que la aplicación vuelve al inicio de sesión.
- Intentar abrir por URL una ruta de otro rol y comprobar la redirección.

**Comandos de verificación:**

```bash
npm install
npm run build
npm run dev
```

## Uso de IA

**Herramienta utilizada:** ChatGPT (fase grupal).

**Consulta realizada:** análisis de alternativas para administrar el estado global de una aplicación React, considerando React Context API y Zustand.

**Respuesta sugerida:** se analizaron características, ventajas y limitaciones de ambas alternativas para compartir autenticación, sesión, perfil y rol.

**Aceptación:** ambos integrantes acordaron utilizar React Context API.

**Verificación humana:** en la implementación individual se verificó el inicio y cierre de sesión, la redirección por rol y el cambio obligatorio de contraseña. El uso de IA en la implementación se detalla en `docs/anexo-ia.md`.

## Trazabilidad

**Repositorio de implementación:** https://github.com/Dilanbkr7/Examen-Moviles-

**Commit de documentación ADR:** [d1ee8b6](https://github.com/Dilanbkr7/Examen-Moviles-/commit/d1ee8b6).

**Commit de implementación:** [2326083](https://github.com/Dilanbkr7/Examen-Moviles-/commit/2326083) (AuthContext y rutas protegidas).

**Responsabilidad:** la decisión arquitectónica fue grupal; la implementación documentada en este repositorio corresponde a Dilan Artemio Obando Suárez.

## Consenso del equipo

**Integrantes participantes:**

- Ariel Alexander Arias Toasa.
- Dilan Artemio Obando Suárez.

**Argumentos expuestos:** se consideró necesario disponer de mecanismos que permitan compartir información y administrar el estado global de la aplicación. React Context API facilita proporcionar información y servicios compartidos entre componentes sin dependencias adicionales.

**Objeciones:** no hubo objeciones, ya que ambos integrantes estuvieron de acuerdo con lo expuesto y con las alternativas presentadas.

**Acuerdo final:** ambos integrantes acordaron utilizar React Context API para gestionar el estado de la aplicación.

**Referencia del video:** 12:00 – 14:42.

---

## A.5 Acta de consolidación

**Integrantes:** Ariel Alexander Arias Toasa y Dilan Artemio Obando Suárez.

**Fecha de reunión:** 23/11/2026.

**Enlace al video:** [Ver video en YouTube](https://youtu.be/acl_hGWJ8hk).

Todos los integrantes reconocen esta línea base y documentarán cualquier sustitución mediante un nuevo ADR.
