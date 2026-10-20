# Wiki de Mira

Bienvenido a la documentación de **Mira**, un entrenador de puntería que funciona directamente en el navegador.

## Índice

- [Introducción](#introducción)
- [Modos de entrenamiento](#modos-de-entrenamiento)
- [Sesiones y métricas](#sesiones-y-métricas)
- [Progreso y estadísticas](#progreso-y-estadísticas)
- [Personalización y accesibilidad](#personalización-y-accesibilidad)
- [Guardado y copias de seguridad](#guardado-y-copias-de-seguridad)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Privacidad y solución de problemas](#privacidad-y-solución-de-problemas)
- [Estructura del proyecto](#estructura-del-proyecto)

## Introducción

Mira permite practicar velocidad, precisión y tiempo de reacción sin instalar programas ni conectarse a un servidor. Abre la aplicación en un navegador compatible y comienza una sesión.

## Modos de entrenamiento

### Clásico

Aparece un objetivo cada vez. Es una opción sencilla para practicar puntería y precisión.

### Ráfaga

Aparecen tres objetivos simultáneamente, lo que permite practicar la selección rápida de objetivos.

### Ranked

Compite contra un bot que adapta su comportamiento al nivel del jugador. Las partidas registran el resultado competitivo y actualizan el rating Elo.

## Sesiones y métricas

Puedes configurar la duración de la sesión en **30 o 60 segundos** y ajustar el tamaño de los objetivos.

Al finalizar, la aplicación registra estadísticas como:

- puntuación;
- objetivos acertados y fallados;
- precisión;
- tiempo de reacción;
- experiencia (XP) y nivel.

Los resultados concretos dependen de tu rendimiento durante la sesión.

## Progreso y estadísticas

El historial local permite revisar sesiones anteriores. También incluye:

- calendario de actividad;
- gráficas de evolución;
- nivel y rango;
- resultados de Ranked (victorias, derrotas y empates);
- evolución del rating competitivo.

Estas estadísticas sirven para observar tendencias entre sesiones y seguir tu progreso.

## Personalización y accesibilidad

Desde las opciones disponibles en la interfaz puedes cambiar el tema visual, el cursor, el modo de entrenamiento, el tamaño de los objetivos y la duración de la sesión.

La aplicación admite interacción con ratón, teclado y pantallas táctiles. También contempla la preferencia de reducción de movimiento. Las opciones concretas visibles pueden depender de la versión de la aplicación.

## Guardado y copias de seguridad

Mira guarda el historial en el almacenamiento local del navegador. No necesita una cuenta ni un backend para su funcionamiento principal.

Puedes exportar los datos a un archivo JSON para guardar una copia de seguridad, y volver a importarlos cuando necesites restaurar o trasladar el historial.

**Recomendación:** exporta una copia periódicamente y antes de borrar los datos del navegador o cambiar de dispositivo. El almacenamiento local no se sincroniza automáticamente entre navegadores o dispositivos.

## Instalación y ejecución

No se requiere instalación ni compilación:

1. Descarga o clona el repositorio.
2. Abre el archivo `index.html` en un navegador moderno.
3. Elige un modo y ajusta la sesión.
4. Entrena y consulta las estadísticas al terminar.

También puedes publicar el proyecto como sitio estático. La aplicación está diseñada para funcionar sin un servidor de aplicación.

## Privacidad y solución de problemas

### ¿Necesito crear una cuenta?

No. El funcionamiento principal es local y no requiere una cuenta.

### ¿Dónde se guarda mi historial?

En el almacenamiento local del navegador utilizado. Si cambias de navegador o dispositivo, el historial no se transfiere automáticamente.

### ¿Cómo puedo conservar mis datos?

Utiliza la exportación JSON y guarda el archivo en un lugar seguro. Para recuperar los datos, utiliza la función de importación de la aplicación.

### ¿He perdido mis estadísticas?

Comprueba que estás usando el mismo navegador y perfil. Si anteriormente exportaste un archivo JSON, puedes intentar recuperar los datos importándolo.

### ¿La aplicación necesita compilarse?

No. Puedes abrir `index.html` directamente o servir los archivos mediante hosting estático.

## Estructura del proyecto

- `index.html`: interfaz, estilos y lógica principal de la aplicación.
- `README.md`: presentación y guía rápida del proyecto.
- `docs/STRUCTURE.md`: descripción de la estructura actual y posibles mejoras.
- `docs/WIKI.md`: esta guía ampliada.
- `reset-file.json`: archivo JSON incluido en el repositorio.
- `LICENSE`: términos de licencia.

Para detalles técnicos adicionales, consulta [STRUCTURE.md](STRUCTURE.md).
