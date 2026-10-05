# Estructura del proyecto

Mira es una aplicación web autocontenida: la interfaz, los estilos y la lógica de entrenamiento viven actualmente en index.html. Esta organización conserva ese formato para que el proyecto siga pudiéndose desplegar como una página estática sin pasos de compilación.

## Componentes

- index.html: aplicación completa.
  - Interfaz de entrenamiento y canvas de puntería.
  - Modos Clásico, Ráfaga y Ranked.
  - Selección de tamaño de objetivo y sesiones de 30/60 segundos.
  - Sistema de puntuación, precisión, tiempo de reacción, XP, nivel y rango.
  - Partidas Ranked contra un bot y cálculo de Elo.
  - Historial de sesiones y calendario.
  - Gráficas de evolución.
  - Personalización de tema y cursor.
  - Persistencia local de datos y backup mediante JSON.
  - Soporte para teclado, ratón/táctil, accesibilidad y reducción de movimiento.
- README.md: descripción, funcionamiento y guía rápida del proyecto.
- reset-file.json: datos JSON mínimos de referencia para reiniciar/restaurar el estado de la aplicación.
- LICENSE: licencia del proyecto.

## Decisiones de organización

El proyecto no necesita un sistema de build para funcionar. Por eso index.html se mantiene en la raíz: es directamente utilizable por hosting estático y evita introducir una cadena de herramientas que el código actual no necesita.

Si la aplicación crece, una siguiente etapa razonable sería separar la lógica en src/js y los estilos en src/css, acompañándolo de pruebas para no alterar el comportamiento del entrenador.

## Datos

Las sesiones se guardan en el almacenamiento local del navegador. La aplicación también permite exportarlas a JSON e importarlas posteriormente, por lo que el historial puede conservarse sin depender de un servidor.

No hay backend ni base de datos necesarios para el funcionamiento principal.