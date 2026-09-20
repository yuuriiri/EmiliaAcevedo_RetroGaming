// ==========================================================
// VARIABLES GLOBALES
// ==========================================================

// Guarda todos los productos cargados desde el JSON, para poder
// filtrarlos después con el buscador sin volver a pedirlos al servidor.
let listaProductos = [];

// Guarda los productos que el usuario ha agregado al carrito.
let carrito = [];


// ==========================================================
// NAVBAR: scroll suave al hacer click en un enlace interno
// ==========================================================

/**
 * Activa el scroll suave para todos los enlaces del navbar que
 * apunten a una sección de la misma página (href="#algo").
 * No recibe parámetros ni retorna nada: solo agrega los listeners.
 */
function activarScrollSuave() {
    const enlaces = document.querySelectorAll('.nav-link');

    enlaces.forEach(function (enlace) {
        enlace.addEventListener('click', function (event) {
            event.preventDefault();

            const destino = this.getAttribute('href');
            if (destino.length > 1) {
                const seccionDestino = document.querySelector(destino);
                if (seccionDestino) {
                    seccionDestino.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
}


// ==========================================================
// EFECTO HOVER: intercambio de imágenes (crossfade) en las cards
// ==========================================================

/**
 * Busca todos los contenedores .card-img-wrapper actualmente en la
 * página y les agrega el efecto de fundido cruzado al pasar el mouse.
 * Se debe llamar CADA VEZ que se generan cards nuevas dinámicamente,
 * porque las cards que no existían al cargar la página no tienen
 * el evento todavía.
 */
function activarCrossfadeImagenes() {
    const wrappers = document.querySelectorAll('.card-img-wrapper');

    wrappers.forEach(function (wrapper) {
        const original = wrapper.querySelector('.img-original');
        const hover = wrapper.querySelector('.img-hover');

        // Si un producto no tiene segunda imagen, no hacemos nada con él.
        if (!original || !hover) return;

        wrapper.addEventListener('mouseover', function () {
            original.style.opacity = '0';
            hover.style.opacity = '1';
        });

        wrapper.addEventListener('mouseout', function () {
            original.style.opacity = '1';
            hover.style.opacity = '0';
        });
    });
}


// ==========================================================
// RENDERIZADO DE PRODUCTOS
// ==========================================================

/**
 * Construye el HTML de una sola card de producto.
 * @param {Object} producto - objeto con nombre, descripcion, precio, imagen, imagenHover.
 * @returns {string} el HTML de la columna completa, listo para insertar.
 * Esta función es "pura": solo toma datos y devuelve texto, no modifica
 * nada de la página directamente.
 */
function crearCardProducto(producto) {
    return `
        <div class="col-12 col-md-6 col-lg-3">
            <div class="card h-100">
                <div class="card-img-wrapper">
                    <img src="${producto.imagen}" class="card-img-top img-original" alt="${producto.nombre}">
                    <img src="${producto.imagenHover || producto.imagen}" class="card-img-top img-hover" alt="${producto.nombre} screenshot">
                </div>
                <div class="card-body">
                    <h5 class="card-title">${producto.nombre}</h5>
                    <p class="card-text">${producto.descripcion}</p>
                    <p class="card-price">$${producto.precio.toLocaleString('es-CL')}</p>
                    <button class="btn btn-outline-light w-100 btn-agregar-carrito" data-nombre="${producto.nombre}" data-precio="${producto.precio}">
                        Agregar al carrito
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Dibuja en pantalla una lista de productos dentro del contenedor
 * #productos-container, reemplazando lo que hubiera antes.
 * @param {Array} productos - lista de objetos producto a mostrar.
 * Efecto: reescribe el HTML del contenedor y vuelve a activar
 * los eventos (hover y carrito) porque son elementos nuevos.
 */
function mostrarProductos(productos) {
    const contenedor = document.getElementById('productos-container');

    if (productos.length === 0) {
        contenedor.innerHTML = '<p class="text-center">No se encontraron juegos con ese nombre.</p>';
        return;
    }

    contenedor.innerHTML = productos.map(crearCardProducto).join('');

    // Las cards son nuevas, así que hay que volver a "engancharles" los eventos.
    activarCrossfadeImagenes();
    activarBotonesCarrito();
}


// ==========================================================
// FETCH: carga de productos con manejo de errores
// ==========================================================

/**
 * Pide el archivo productos.json al servidor, valida que la respuesta
 * sea exitosa, y si todo sale bien, guarda los datos y los muestra.
 * Si algo falla (red caída, archivo no encontrado, JSON mal formado),
 * muestra el bloque de error visual en vez de romper la página.
 * No recibe parámetros; no retorna nada directamente (trabaja con
 * las variables/funciones de arriba).
 */
function cargarProductos() {
    const errorBox = document.getElementById('error-fetch');
    errorBox.classList.add('d-none'); // ocultamos el error por si venía de un intento anterior

    fetch('assets/js/productos.json')
        .then(function (response) {
            // MEJORA DEL PROFESOR: revisar response.ok antes de intentar leer el JSON.
            if (!response.ok) {
                throw new Error('Respuesta no exitosa del servidor: ' + response.status);
            }
            return response.json();
        })
        .then(function (data) {
            listaProductos = data;
            mostrarProductos(listaProductos);
        })
        .catch(function (error) {
            console.error('Error al cargar productos:', error);
            errorBox.classList.remove('d-none');
        });
}


// ==========================================================
// CARRITO DE COMPRAS
// ==========================================================

/**
 * Agrega un producto al array del carrito y actualiza la interfaz.
 * @param {string} nombre - nombre del producto agregado.
 * @param {number} precio - precio del producto agregado.
 * Efecto: modifica el array global "carrito" y vuelve a dibujar
 * el resumen del carrito y el contador del navbar.
 */
function agregarAlCarrito(nombre, precio) {
    carrito.push({ nombre: nombre, precio: precio });
    actualizarResumenCarrito();
}

/**
 * Vuelve a dibujar la lista visual del carrito, el total y el
 * contador del navbar, en base al estado actual del array "carrito".
 * No recibe parámetros; usa la variable global "carrito".
 */
function actualizarResumenCarrito() {
    const lista = document.getElementById('carrito-lista');
    const totalSpan = document.getElementById('carrito-total');
    const contador = document.getElementById('carrito-contador');

    lista.innerHTML = carrito.map(function (item) {
        return `<li>${item.nombre} <span>$${item.precio.toLocaleString('es-CL')}</span></li>`;
    }).join('');

    const total = carrito.reduce(function (suma, item) {
        return suma + item.precio;
    }, 0);

    totalSpan.textContent = total.toLocaleString('es-CL');
    contador.textContent = carrito.length;
}

/**
 * Busca todos los botones "Agregar al carrito" actualmente en la
 * página y les agrega el evento click correspondiente.
 * Se debe llamar cada vez que se generan cards nuevas, igual que
 * activarCrossfadeImagenes().
 */
function activarBotonesCarrito() {
    const botones = document.querySelectorAll('.btn-agregar-carrito');

    botones.forEach(function (boton) {
        boton.addEventListener('click', function () {
            const nombre = this.getAttribute('data-nombre');
            const precio = parseInt(this.getAttribute('data-precio'), 10);
            agregarAlCarrito(nombre, precio);
        });
    });
}


// ==========================================================
// BUSCADOR: evento submit que filtra los productos ya cargados
// ==========================================================

/**
 * Activa el formulario de búsqueda: al enviarlo, filtra la lista
 * de productos ya cargada (listaProductos) según el texto escrito,
 * sin necesidad de volver a pedir el JSON al servidor.
 */
function activarBuscador() {
    const formulario = document.getElementById('buscador-form');

    formulario.addEventListener('submit', function (event) {
        event.preventDefault();

        const texto = document.getElementById('buscador-input').value.toLowerCase();

        const resultados = listaProductos.filter(function (producto) {
            return producto.nombre.toLowerCase().includes(texto);
        });

        mostrarProductos(resultados);
    });
}


// ==========================================================
// FORMULARIO DE CONTACTO: evento submit con mensaje de confirmación
// ==========================================================

/**
 * Activa el formulario de contacto: al enviarlo, evita la recarga
 * de la página, muestra un mensaje de confirmación y limpia los campos.
 */
function activarFormularioContacto() {
    const formulario = document.getElementById('formularioContacto');
    const confirmacionMensaje = document.getElementById('confirmacionMensaje');

    formulario.addEventListener('submit', function (event) {
        event.preventDefault();
        confirmacionMensaje.textContent = 'Mensaje enviado con éxito.';
        confirmacionMensaje.classList.remove('d-none');
        formulario.reset();
    });
}


// ==========================================================
// BOTÓN "REINTENTAR" DEL MENSAJE DE ERROR
// ==========================================================

/**
 * Activa el botón que aparece junto al mensaje de error del fetch,
 * para volver a intentar cargar los productos sin recargar la página.
 */
function activarReintentar() {
    const boton = document.getElementById('reintentar-btn');
    boton.addEventListener('click', cargarProductos);
}


// ==========================================================
// PUNTO DE ENTRADA: se ejecuta todo al cargar el script
// ==========================================================

activarScrollSuave();
activarBuscador();
activarFormularioContacto();
activarReintentar();
cargarProductos();