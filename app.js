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
        depurarLista();
        mostrarLibros(libros);
        actualizarCarrito();
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
    const btn = crear('button', 'btn-interes');
    btn.type = 'button';
    btn.dataset.id = libro.ID;
    pintarBotonInteres(btn, enLista(libro.ID), nombre);
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
// MIS CONSULTAS (carrito)
// ==========================================
const LISTA_KEY = 'babel_consultas';
let lista = cargarLista();   // IDs en el orden en que se agregaron

const btnCarrito = document.getElementById('btnCarrito');
const carritoCount = document.getElementById('carritoCount');
const cartModal = document.getElementById('cartModal');
const cartItems = document.getElementById('cartItems');
const cartResumen = document.getElementById('cartResumen');
const cartVacio = document.getElementById('cartVacio');
const btnWhatsApp = document.getElementById('btnEnviarWhatsApp');
const btnVaciar = document.getElementById('btnVaciarLista');
const toast = document.getElementById('toast');

// localStorage puede fallar (modo privado, storage bloqueado): la lista sigue en memoria
function cargarLista() {
    try {
        const data = JSON.parse(localStorage.getItem(LISTA_KEY));
        return Array.isArray(data) ? data.filter(x => typeof x === 'string') : [];
    } catch (e) {
        return [];
    }
}

function guardarLista() {
    try {
        localStorage.setItem(LISTA_KEY, JSON.stringify(lista));
    } catch (e) { /* sin storage: no pasa nada */ }
}

const enLista = (id) => lista.includes(id);
const libroPorId = (id) => libros.find(l => l.ID === id);

function pintarBotonInteres(btn, activo, nombre) {
    btn.classList.toggle('activo', activo);
    btn.setAttribute('aria-pressed', activo ? 'true' : 'false');
    btn.setAttribute('aria-label', (activo ? 'Quitar de mis consultas: ' : 'Me interesa: ') + nombre);
    btn.textContent = activo ? '♥ Me interesa ✓' : '♡ Me interesa';
}

function mostrarAviso(texto) {
    toast.textContent = texto;
    toast.classList.add('visible');
    clearTimeout(mostrarAviso.t);
    mostrarAviso.t = setTimeout(() => toast.classList.remove('visible'), 7000);
}

// Saca de la lista los libros que ya no están en libros.json (vendidos)
function depurarLista() {
    const vigentes = new Set(libros.map(l => l.ID));
    const quedan = lista.filter(id => vigentes.has(id));
    const sacados = lista.length - quedan.length;
    if (sacados > 0) {
        lista = quedan;
        guardarLista();
        mostrarAviso(sacados === 1
            ? 'Un libro de tu lista ya no está disponible y lo sacamos 📚'
            : `${sacados} libros de tu lista ya no están disponibles y los sacamos 📚`);
    }
}

function alternarInteres(id) {
    if (enLista(id)) lista = lista.filter(x => x !== id);
    else lista.push(id);
    guardarLista();
    // Actualiza solo el botón de esa tarjeta (sin redibujar la grilla)
    const btn = grid.querySelector(`.btn-interes[data-id="${CSS.escape(id)}"]`);
    const libro = libroPorId(id);
    if (btn && libro) pintarBotonInteres(btn, enLista(id), libro.Nombre);
    actualizarCarrito();
}

function totalesLista() {
    let total = 0, aConsultar = 0;
    lista.forEach(id => {
        const l = libroPorId(id);
        if (l && typeof l.Precio === 'number' && l.Precio > 0) total += l.Precio;
        else aConsultar++;
    });
    return { total, aConsultar };
}

function lineaTotal({ total, aConsultar }) {
    if (total > 0 && aConsultar > 0) return `${formatearPrecio(total)} (+${aConsultar} a consultar)`;
    if (total > 0) return formatearPrecio(total);
    return 'a consultar';
}

function armarMensaje() {
    const lineas = lista.map((id, i) => {
        const l = libroPorId(id);
        const precio = typeof l.Precio === 'number' && l.Precio > 0 ? formatearPrecio(l.Precio) : 'a consultar';
        return `${i + 1}. [${l.ID}] ${[l.Nombre, l.Autor, precio].filter(Boolean).join(' · ')}`;
    });
    return 'Hola Babel! 📚 Quiero consultar por estos libros:\n\n' +
        lineas.join('\n') +
        `\n\nTotal: ${lineaTotal(totalesLista())}` +
        '\n¿Siguen disponibles? ¿Cómo seguimos con el pago y el envío?';
}

function actualizarCarrito() {
    const n = lista.length;
    carritoCount.textContent = n;
    btnCarrito.hidden = n === 0;
    document.body.classList.toggle('tiene-consultas', n > 0);

    // Panel
    cartItems.innerHTML = '';
    cartVacio.hidden = n > 0;
    cartResumen.hidden = n === 0;
    btnVaciar.hidden = n === 0;
    btnWhatsApp.classList.toggle('deshabilitado', n === 0);

    if (n === 0) {
        btnWhatsApp.removeAttribute('href');
        if (cartModal.classList.contains('active')) cerrarPanel();
        return;
    }

    lista.forEach(id => {
        const l = libroPorId(id);
        const fila = crear('li', 'cart-item');
        const info = crear('div', 'cart-item-info');
        info.appendChild(crear('p', 'cart-item-titulo', l.Nombre));
        if (l.Autor) info.appendChild(crear('p', 'cart-item-autor', l.Autor));
        const tiene = typeof l.Precio === 'number' && l.Precio > 0;
        info.appendChild(crear('p', tiene ? 'cart-item-precio' : 'cart-item-precio consultar',
            tiene ? formatearPrecio(l.Precio) : 'A consultar'));
        const quitar = crear('button', 'btn-quitar', '×');
        quitar.type = 'button';
        quitar.dataset.id = id;
        quitar.setAttribute('aria-label', `Quitar ${l.Nombre}`);
        fila.appendChild(info);
        fila.appendChild(quitar);
        cartItems.appendChild(fila);
    });

    const t = totalesLista();
    cartResumen.textContent = `Total: ${lineaTotal(t)}`;
    btnWhatsApp.href = `https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(armarMensaje())}`;
}

function abrirPanel() {
    cartModal.classList.add('active');
}
function cerrarPanel() {
    cartModal.classList.remove('active');
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
    if (e.key === 'Escape') { cerrarModal(); cerrarPanel(); }
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

// --- Mis consultas ---
grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-interes');
    if (btn) alternarInteres(btn.dataset.id);
});
btnCarrito.addEventListener('click', abrirPanel);
document.getElementById('btnCerrarCarrito').addEventListener('click', cerrarPanel);
cartModal.addEventListener('click', (e) => {
    if (e.target === cartModal) cerrarPanel();
});
cartItems.addEventListener('click', (e) => {
    const q = e.target.closest('.btn-quitar');
    if (q) alternarInteres(q.dataset.id);
});
btnVaciar.addEventListener('click', () => {
    const ids = lista.slice();
    lista = [];
    guardarLista();
    ids.forEach(id => {
        const btn = grid.querySelector(`.btn-interes[data-id="${CSS.escape(id)}"]`);
        const libro = libroPorId(id);
        if (btn && libro) pintarBotonInteres(btn, false, libro.Nombre);
    });
    actualizarCarrito();
});
btnWhatsApp.addEventListener('click', (e) => {
    if (lista.length === 0) e.preventDefault();
});
