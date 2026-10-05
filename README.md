# Mira — Aim Trainer

Mira es un entrenador de puntería que funciona directamente en el navegador. Está diseñado para practicar velocidad, precisión y tiempo de reacción sin necesidad de instalar una aplicación ni utilizar un servidor.

## ¿Qué hace?

La aplicación ofrece un campo de entrenamiento interactivo donde aparecen objetivos y registra el rendimiento de cada sesión.

### Modos de entrenamiento

- **Clásico:** un objetivo cada vez.
- **Ráfaga:** tres objetivos simultáneos.
- **Ranked:** partidas contra un bot adaptado al nivel del jugador, con resultado competitivo y rating Elo.

Cada sesión permite elegir el tamaño de los objetivos y una duración de **30 o 60 segundos**.

## Seguimiento del progreso

Mira conserva el historial de entrenamiento en el navegador y calcula métricas como:

- puntuación;
- objetivos acertados y fallados;
- precisión;
- tiempo de reacción;
- XP y nivel;
- rango competitivo;
- victorias, derrotas y empates en Ranked;
- evolución del rating.

Incluye un **calendario** para consultar la actividad y **gráficas** para analizar la evolución del rendimiento.

## Personalización

La interfaz permite cambiar:

- tema visual;
- tipo de cursor;
- modo de entrenamiento;
- tamaño de objetivo;
- duración de la sesión.

La aplicación también contempla interacción con teclado, ratón y dispositivos táctiles, además de preferencias de accesibilidad como la reducción de movimiento.

## Datos y privacidad

El funcionamiento principal es local: no requiere backend ni base de datos. Las sesiones se guardan en el almacenamiento local del navegador.

También puedes **exportar e importar el historial en formato JSON** para crear copias de seguridad o trasladar tus datos.

## Estructura

Actualmente es una aplicación web autocontenida:

```text
.
├── index.html
├── README.md
├── reset-file.json
├── docs/
│   └── STRUCTURE.md
└── LICENSE
```

`index.html` contiene la interfaz, los estilos y la lógica de la aplicación, por lo que puede desplegarse directamente como sitio estático.

Consulta [docs/STRUCTURE.md](docs/STRUCTURE.md) para una explicación más detallada de la organización actual y de una posible evolución del proyecto.

## Ejecución

No se necesita un proceso de compilación. Abre `index.html` en un navegador o publícalo mediante cualquier servicio de hosting estático.

## Licencia

Consulta el archivo [LICENSE](LICENSE) para conocer los términos de uso del proyecto.
