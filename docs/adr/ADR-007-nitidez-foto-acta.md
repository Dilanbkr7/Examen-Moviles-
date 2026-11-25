# ADR-007: La nitidez de la foto del acta se comprueba en el dispositivo con la varianza del Laplaciano

## Estado

Aceptado (decisión individual; complementa la línea base sin reemplazar ningún ADR grupal).

## Fecha

2026-11-25

## Autor(es) y equipo

**Autor:** Dilan Artemio Obando Suárez.

**Modalidad:** decisión individual de implementación. R7 exige "comprobar nitidez antes de aceptarla" y ninguno de los ADR-001 a ADR-006 define cómo hacerlo, por lo que se registra aquí antes de implementarlo (Anexo A.2).

## Requisitos relacionados

- **R7:** capturar la fotografía de cada acta desde la app y comprobar su nitidez antes de aceptarla.
- **R9:** la regla de aceptación vive en la capa de lógica (`src/utils`), separada de la página.

## Contexto

Una foto movida o desenfocada no sirve como evidencia del acta. La comprobación debe ocurrir en el teléfono, antes de subir la imagen, para no gastar datos ni almacenamiento en fotos inútiles. Restricciones: no agregar dependencias fuera de la línea base (ADR-001 a ADR-006) y funcionar dentro del WebView de Capacitor (ADR-004).

## Alternativas consideradas

1. **Revisión visual del veedor:** mostrar la foto ampliada y pedir confirmación. Sin código adicional, pero subjetivo y no verificable; un veedor apurado puede aceptar una foto borrosa.
2. **Varianza del Laplaciano con Canvas (seleccionada):** se dibuja la foto reducida en un `<canvas>` del navegador, se pasa a escala de grises, se aplica el filtro Laplaciano (detecta bordes) y se calcula la varianza. Una foto nítida tiene bordes marcados (varianza alta); una borrosa, varianza baja. Usa solo APIs estándar del navegador, sin dependencias.
3. **Servicio externo de análisis de imágenes:** más preciso, pero requiere conectividad, costo y una tecnología nueva fuera de la línea base. Descartado.

## Decisión

Se implementa la alternativa 2 en `src/utils/nitidez.ts` (`calcularNitidez`). La foto se reduce a un máximo de 800 px de ancho, se calcula la varianza del Laplaciano y se acepta solo si supera `UMBRAL_NITIDEZ`. El puntaje se muestra al usuario y se guarda en `actas.nitidez`. La revisión visual (alternativa 1) se mantiene como complemento: el veedor ve la foto antes de guardar.

## Consecuencias

- **Beneficios:** criterio objetivo y repetible; no agrega dependencias; funciona sin conexión.
- **Obligaciones:** calibrar el umbral con fotos reales de actas.
- **Riesgo:** un umbral mal calibrado puede rechazar fotos válidas (con poca luz) o aceptar fotos de baja calidad. Se mitiga mostrando el puntaje y permitiendo repetir la captura.

## Verificación

- `src/utils/nitidez.ts`: función `calcularNitidez` y constante `UMBRAL_NITIDEZ`.
- Prueba manual: fotografiar un acta en buen enfoque (debe aceptarse) y moviendo el teléfono (debe rechazarse con el mensaje "Foto borrosa").

## Uso de IA

- **Herramienta:** Claude (Anthropic).
- **Consulta:** cómo comprobar la nitidez de una foto en el navegador sin librerías externas.
- **Respuesta sugerida:** varianza del Laplaciano sobre un canvas en escala de grises.
- **Aceptación:** aceptada por no requerir dependencias nuevas.
- **Verificación humana:** prueba con fotos nítidas y movidas en el teléfono y ajuste del umbral.

## Trazabilidad

- **Commit de documentación ADR:** [eca5b01](https://github.com/Dilanbkr7/Examen-Moviles-/commit/eca5b01).
- **Commit de implementación:** [5156ba0](https://github.com/Dilanbkr7/Examen-Moviles-/commit/5156ba0).
- **Repositorio de implementación:** https://github.com/Dilanbkr7/Examen-Moviles-
