let libros = [];
const WHATSAPP_NUM = "5492612428328";

// --- ELEMENTOS ---
const modal = document.getElementById('filterModal');
const btnOpenFilters = document.getElementById('btnOpenFilters');
const btnCloseFilters = document.getElementById('btnCloseFilters');
const btnApplyFilters = document.getElementById('btnApplyFilters');
const btnResetFilters = document.getElementById('btnResetFilters');
const filterBadge = document.getElementById('filterBadge');
const resultCount = document.getElementById('resultCount');
const grid = document.getElementById('bookGrid');

// Banderas: la clave es el idioma sin tildes y en minúscula (ver sinTildes)
const banderas = {
    "espanol": "img/ES.png",
    "ingles": "img/EN.png",
    "frances": "img/FR.png",
    "portugues": "img/BR.png",
    "portuges": "img/BR.png",
    "italiano": "img/IT.png",
    "aleman": "img/AL.png",
    "hebreo": "img/HE.png"
};

// Imagen de respaldo (logo de la marca) cuando falta la tapa o falla la URL
const imgRespaldo = "img/logo.jpg";

fetch('libros.json')
    .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    })
    .then(data => {
        libros = data;
        actualizarOpciones();
        mostrarLibros(libros);
    })
    .catch(error => {
        console.error("Error al cargar los libros:", error);
        grid.innerHTML = '<div class="no-results">No pudimos cargar los libros 😕 Probá de nuevo en un rato o escribinos por Instagram.</div>';
    });

// --- UTILIDADES ---
function sinTildes(texto) {
    return String(texto || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// 5000 -> "$5.000"
function formatearPrecio(n) {
    return "$" + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function crear(tag, clase, texto) {
    const el = document.createElement(tag);
    if (clase) el.className = clase;
    if (texto !== undefined) el.textContent = texto;
    return el;
}

// "Inglés, Español" -> ["img/EN.png", "img/ES.png"]
function banderasDe(idioma) {
    return String(idioma || "").split(",")
        .map(p => banderas[sinTildes(p.trim())])
        .filter(Boolean);
}

// Filtros que se acomodan entre sí: cada selector solo ofrece opciones que
// tienen al menos un libro con lo que ya está elegido (así nunca da cero).
const selAutor = document.getElementById('autorFilter');
const selIdioma = document.getElementById('idiomaFilter');

function textoBusqueda() {
    return sinTildes(document.getElementById('searchInput').value.trim());
}

function coincideTexto(l, txt) {
    return txt === "" || sinTildes(l.Nombre).includes(txt) || sinTildes(l.Autor).includes(txt);
}

function llenarOpciones(select, campo, textoVacio, lista) {
    const actual = select.value;
    const cuentas = new Map();
    lista.forEach(l => {
        if (l[campo]) cuentas.set(l[campo], (cuentas.get(l[campo]) || 0) + 1);
    });
    const valores = [...cuentas.keys()].sort((a, b) => a.localeCompare(b, 'es'));

    select.innerHTML = '';
    const vacia = document.createElement('option');
    vacia.value = '';
    vacia.textContent = textoVacio;
    select.appendChild(vacia);
    valores.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v;
        opt.textContent = `${v} (${cuentas.get(v)})`;
        select.appendChild(opt);
    });
    select.value = cuentas.has(actual) ? actual : '';
}

function actualizarOpciones() {
    const txt = textoBusqueda();
    const aut = selAutor.value;
    const idi = selIdioma.value;
    // Autores: según texto e idioma elegido. Idiomas: según texto y autor elegido.
    llenarOpciones(selAutor, 'Autor', 'Cualquier autor',
        libros.filter(l => coincideTexto(l, txt) && (idi === "" || l.Idioma === idi)));
    llenarOpciones(selIdioma, 'Idioma', 'Cualquier idioma',
        libros.filter(l => coincideTexto(l, txt) && (aut === "" || l.Autor === aut)));
}

function crearTarjeta(libro) {
    const nombre = libro.Nombre || "";
    const tieneFoto = !!(libro.URL_Foto && libro.URL_Foto.trim());

    const card = crear('article', 'card');

    // Tapa (tamaño fijo por CSS) con respaldo de marca
    const cover = crear('div', tieneFoto ? 'cover' : 'cover no-photo');
    const img = document.createElement('img');
    img.width = 200;
    img.height = 300;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = tieneFoto ? `Tapa de ${nombre}` : "";
    img.src = tieneFoto ? libro.URL_Foto : imgRespaldo;
    img.addEventListener('error', () => {
        img.onerror = null;
        img.src = imgRespaldo;
        img.alt = "";
        cover.classList.add('no-photo');
    }, { once: true });
    cover.appendChild(img);
    card.appendChild(cover);

    const body = crear('div', 'card-body');
    body.appendChild(crear('h3', '', nombre));
    body.appendChild(crear('p', 'autor', libro.Autor || 'Autor desconocido'));

    // Idioma (con bandera) y estado
    const meta = crear('div', 'meta');
    if (libro.Idioma) {
        const idioma = crear('span', 'idioma');
        banderasDe(libro.Idioma).forEach(src => {
            const flag = document.createElement('img');
            flag.src = src;
            flag.alt = "";
            flag.className = 'flag';
            flag.width = 16;
            flag.height = 16;
            idioma.appendChild(flag);
        });
        idioma.appendChild(document.createTextNode(libro.Idioma));
        meta.appendChild(idioma);
    }
    if (libro.Estado) {
        const estado = crear('span', 'estado estado-' + sinTildes(libro.Estado).replace(/\s+/g, '-'));
        estado.appendChild(crear('i', 'dot'));
        estado.appendChild(document.createTextNode(libro.Estado));
        meta.appendChild(estado);
    }
    if (meta.children.length) body.appendChild(meta);

    // Precio (vacío -> "Consultar")
    const tienePrecio = typeof libro.Precio === 'number' && libro.Precio > 0;
    body.appendChild(tienePrecio
        ? crear('p', 'precio', formatearPrecio(libro.Precio))
        : crear('p', 'precio consultar', 'Consultar'));
    card.appendChild(body);

    const acciones = crear('div', 'card-actions');
    const mensaje = encodeURIComponent(`Hola! Me interesa consultar por el libro: ${nombre}`);
    const btn = crear('a', 'btn-consultar', 'Consultar');
    btn.href = `https://wa.me/${WHATSAPP_NUM}?text=${mensaje}`;
    btn.target = '_blank';
    btn.rel = 'noopener';
    acciones.appendChild(btn);
    card.appendChild(acciones);

    return card;
}

function mostrarLibros(lista) {
    grid.innerHTML = '';
    resultCount.textContent = lista.length === 1 ? '1 libro' : `${lista.length} libros`;

    if (lista.length === 0) {
        grid.innerHTML = '<div class="no-results">No encontramos libros con esa búsqueda 📚<br>Probá con otra palabra o limpiá los filtros.</div>';
        return;
    }

    const fragment = document.createDocumentFragment();
    lista.forEach(libro => fragment.appendChild(crearTarjeta(libro)));
    grid.appendChild(fragment);
}

function filtrar() {
    const txt = textoBusqueda();
    const aut = selAutor.value;
    const idi = selIdioma.value;

    filterBadge.hidden = !(aut || idi);

    const filtrados = libros.filter(l => {
        const textoMatch = coincideTexto(l, txt);
        const autorMatch = aut === "" || l.Autor === aut;
        const idiomaMatch = idi === "" || l.Idioma === idi;
        return textoMatch && autorMatch && idiomaMatch;
    });
    mostrarLibros(filtrados);
}

// Debounce para no filtrar en cada pulsación de tecla
function debounce(func, timeout = 250) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => func(...args), timeout);
    };
}

// ==========================================
// EVENTOS
// ==========================================
document.getElementById('searchInput').addEventListener('input', debounce(filtrar));

const cerrarModal = () => modal.classList.remove('active');

btnOpenFilters.addEventListener('click', () => {
    actualizarOpciones();
    modal.classList.add('active');
});
selAutor.addEventListener('change', actualizarOpciones);
selIdioma.addEventListener('change', actualizarOpciones);
btnCloseFilters.addEventListener('click', cerrarModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal) cerrarModal();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cerrarModal();
});

btnApplyFilters.addEventListener('click', () => {
    filtrar();
    cerrarModal();
});

btnResetFilters.addEventListener('click', () => {
    selAutor.value = '';
    selIdioma.value = '';
    actualizarOpciones();
    filtrar();
    cerrarModal();
});
