# 📚 Babel Bookstore - Catálogo Web

Un catálogo web ligero, rápido y completamente *responsive* diseñado para gestionar y visualizar un stock de libros físicos. Permite a los usuarios explorar la colección, filtrar títulos dinámicamente y realizar consultas de disponibilidad o compra directamente a través de WhatsApp.

## ✨ Características Principales

* **Búsqueda en Tiempo Real:** Barra de búsqueda optimizada con función *debounce* para evitar saturación de procesos mientras el usuario escribe.
* **Filtros Dinámicos (Chips):** Selectores de "Autor" e "Idioma" que se autogeneran extrayendo los datos únicos directamente del archivo JSON.
* **Integración con WhatsApp:** Cada tarjeta de libro genera un enlace dinámico (`wa.me`) con un mensaje predefinido que incluye el título exacto del libro a consultar.
* **Diseño Responsive Moderno:** Interfaz pulida mediante CSS Grid y Flexbox. Las tarjetas se adaptan fluidamente desde pantallas ultra anchas hasta dispositivos móviles (mostrando 2 libros por fila en celulares).
* **Gestión de Errores Visuales:** Sistema de *fallbacks* (imágenes por defecto) mediante SVG inyectado en código para libros que no cuentan con URL de portada válida o cuyo enlace de imagen esté roto.

## 🛠️ Tecnologías Utilizadas

* **HTML5:** Estructura semántica.
* **CSS3:** Variables, Grid, Flexbox, Media Queries y diseño UI/UX moderno (sombras sutiles, bordes redondeados, eliminación de UI nativa en selectores).
* **Vanilla JavaScript (ES6+):** Lógica asíncrona (`fetch`), manipulación eficiente del DOM (`DocumentFragment`) y filtrado de arrays.
* **JSON:** Base de datos estática y local (`libros.json`) que almacena el inventario.

## 📂 Estructura del Proyecto

```text
/
├── img/                # Directorio de banderas (ES.png, EN.png, etc.)
├── index.html          # Estructura principal y maquetado
├── style.css           # Hoja de estilos principal y responsive
├── app.js              # Lógica de carga, filtrado y renderizado
├── libros.json         # Inventario (se genera solo desde el Google Sheet, no editar a mano)
├── tools/sync_sheet.py # Descarga el CSV del Sheet y genera libros.json
├── .github/workflows/  # Action que sincroniza libros.json cada 6 horas
└── README.md           # Documentación del proyecto

## 🔄 Sincronización con Google Sheet

`libros.json` se genera automáticamente desde la pestaña **Web** del Google Sheet (solo libros no vendidos, columnas públicas, publicada como CSV).

* **Automática:** una GitHub Action corre **cada 6 horas**.
* **Manual (para ver un cambio ya):** en GitHub → pestaña **Actions** → **Sincronizar libros desde el Sheet** → botón **Run workflow** → elegir la rama `main` → **Run workflow**.
* Solo se hace commit si `libros.json` cambió.
* **Protección:** si la descarga falla, el CSV viene vacío o trae menos del 70% de los libros actuales, el workflow falla (en rojo) y **no** se toca `libros.json`.
* Probar local con un CSV: `python3 tools/sync_sheet.py --csv archivo.csv --out /tmp/prueba.json`

Formato de cada libro: `ID`, `Nombre`, `Autor`, `Genero`, `Estado`, `Idioma` (normalizado: Inglés, Francés, Alemán, Portugués…), `Precio` (número o `null` si se consulta) y `URL_Foto`.
