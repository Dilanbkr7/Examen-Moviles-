Anexo: uso de inteligencia artificial
Estudiante: Dilan Artemio Obando Suárez
Herramientas y propósito de uso
Se consultaron herramientas de inteligencia artificial para comparar alternativas tecnológicas, aclarar dudas y recibir sugerencias de revisión durante el desarrollo del proyecto.
Herramienta	Fase	Uso
ChatGPT	Propuestas y deliberación grupal (ADR-001 a ADR-006)	Comparar alternativas como Ionic React/Angular, Supabase/Firebase, Context/Zustand, PostgreSQL/MySQL/MongoDB y Capacitor/desarrollo nativo.
Claude (Anthropic)	Consultas durante la implementación individual	Solicitar observaciones sobre los requisitos, la estructura de la base de datos, las validaciones y posibles causas de errores, tomando como referencia la rúbrica y los ADR acordados.


Consultas realizadas
Las consultas se centraron en los siguientes aspectos:
- Revisar la correspondencia entre los requisitos del examen, la rúbrica y las decisiones registradas en los ADR.
- Comparar opciones para resolver funcionalidades sin incorporar tecnologías ajenas a la línea base del equipo.
- Identificar posibles causas de errores y aspectos que debían comprobarse mediante pruebas.
- Evaluar una alternativa para medir la nitidez de las fotografías sin instalar nuevas librerías. Se seleccionó la varianza del Laplaciano y se registró la decisión en el ADR-007.
Sugerencias consideradas y decisiones tomadas
Las sugerencias se evaluaron según los requisitos del proyecto y los acuerdos del equipo.
Sugerencia o aspecto revisado	Decisión	Motivo
Mantener las tecnologías de los ADR-001 a ADR-006	Aceptado	Respetar la línea base acordada por el equipo.
Incorporar una librería de gráficos para el dashboard	Descartado	Se resolvió con barras CSS y componentes Ionic.
Incorporar una librería de formularios y validación	Descartado	Se utilizaron funciones de validación en src/utils/validaciones.ts.
Utilizar un servicio externo para evaluar la nitidez	Descartado	Se eligió calcularla en el teléfono, conforme al ADR-007.
Recuperar la contraseña mediante un enlace profundo (deep link)	Descartado	Se optó por un código de un solo uso enviado por correo mediante Supabase Auth.
Consultar el correo por cédula mediante una función pública	Descartado	Podría exponer correos de otros usuarios; la consulta se realiza dentro de la Edge Function login.
Revisar la referencia a Zustand en el ADR-005	Corregido	La decisión acordada correspondía a React Context API.
Completar el ADR-001 en formato Markdown	Corregido	Se incorporó el contenido acordado en el documento grupal.
Revisar el error del trigger validar_totales_acta	Corregido	Las pruebas detectaron el error record "old" has no field "acta_id"; se sustituyó la estructura CASE por IF/ELSIF.
