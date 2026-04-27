let libros = [];
const WHATSAPP_NUM = "5492612428328"; 

const banderas = {
    "Español": "img/ES.png",
    "Ingles": "img/EN.png",
    "Frances": "img/FR.png",
    "Portuges": "img/BR.png",
    "Italiano": "img/IT.png", 
    "Aleman": "img/AL.png",
    "Hebreo": "img/HE.png"    
};

fetch('libros.json')
    .then(res => res.json())
    .then(data => {
        libros = data;
        poblarFiltros();
        mostrarLibros(libros);
    })
    .catch(error => console.error("Error al cargar los libros:", error));

function poblarFiltros() {
    const autores = [...new Set(libros.map(l => l.Autor))].filter(Boolean).sort();
    const idiomas = [...new Set(libros.map(l => l.Idioma))].filter(Boolean).sort();

    const fAutor = document.getElementById('autorFilter');
    const fIdioma = document.getElementById('idiomaFilter');

    autores.forEach(a => fAutor.innerHTML += `<option value="${a}">${a}</option>`);
    idiomas.forEach(i => fIdioma.innerHTML += `<option value="${i}">${i}</option>`);
}

function mostrarLibros(lista) {
    const grid = document.getElementById('bookGrid');
    grid.innerHTML = '';

    if(lista.length === 0) {
        grid.innerHTML = '<div class="no-results">No se encontraron libros.</div>';
        return;
    }

    // Nuevo SVG: Un icono de documento cuadrado, mucho más minimalista y pequeño
    const imgPorDefecto = "data:image/svg+xml;charset=UTF-8,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23f9f9f9' rx='10'/%3E%3Cpath d='M30 20 h40 v60 h-40 z' fill='none' stroke='%23e0e0e0' stroke-width='2'/%3E%3Cpath d='M38 35 h24 M38 50 h24 M38 65 h12' stroke='%23e0e0e0' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E";

    lista.forEach(libro => {
        const rutaImagen = banderas[libro.Idioma] || ""; 
        
        const htmlBandera = rutaImagen 
            ? `<img src="${rutaImagen}" style="width: 25px; height: 25px; vertical-align: middle; margin-right: 8px; border-radius: 50%;">`
            : "";

        const mensaje = encodeURIComponent(`Hola! Me interesa consultar por el libro: ${libro.Nombre}`);
        const urlWa = `https://wa.me/${WHATSAPP_NUM}?text=${mensaje}`;

        // Evaluamos si el libro tiene una URL válida
        const tieneFoto = libro.URL_Foto && libro.URL_Foto.trim() !== "";
        const urlFotoInicial = tieneFoto ? libro.URL_Foto : imgPorDefecto;
        
        // Asignamos la clase compacta si no tiene foto
        const claseTarjeta = tieneFoto ? 'card' : 'card no-photo';

        const card = document.createElement('div');
        card.className = claseTarjeta;
        card.innerHTML = `
            <img src="${urlFotoInicial}" alt="${libro.Nombre}" loading="lazy" onerror="this.onerror=null; this.src='${imgPorDefecto}'; this.parentElement.classList.add('no-photo');">
            
            <h3>${libro.Nombre}</h3>
            
            <p class="autor">${libro.Autor ? libro.Autor : 'Autor desconocido'}</p>
            
            <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                ${htmlBandera}
                <span style="font-size: 14px; color: #555; font-weight: 500;">${libro.Idioma}</span>
            </div>

            <a href="${urlWa}" target="_blank" class="btn-consultar">CONSULTAR</a>
        `;
        grid.appendChild(card);
    });
}

function filtrar() {
    const txt = document.getElementById('searchInput').value.toLowerCase();
    const aut = document.getElementById('autorFilter').value;
    const idi = document.getElementById('idiomaFilter').value;

    const filtrados = libros.filter(l => {
        return (l.Nombre.toLowerCase().includes(txt)) &&
               (aut === "" || l.Autor === aut) &&
               (idi === "" || l.Idioma === idi);
    });
    mostrarLibros(filtrados);
}

document.getElementById('searchInput').addEventListener('input', filtrar);
document.getElementById('autorFilter').addEventListener('change', filtrar);
document.getElementById('idiomaFilter').addEventListener('change', filtrar);