const API_URL = 'https://rickandmortyapi.com/api/character';
const CLAVE_STORAGE = 'ultimaBusquedaPersonajes';
const TEXTO_DESCONOCIDO = 'Desconocido';

const formulario = document.querySelector('#formulario-busqueda');
const campoNombre = document.querySelector('#campo-nombre');
const campoEstado = document.querySelector('#campo-estado');
const botonBuscar = document.querySelector('#boton-buscar');
const mensaje = document.querySelector('#mensaje');
const grillaTarjetas = document.querySelector('#grilla-tarjetas');

const ESTADOS = {
  alive: { texto: 'Vivo', clase: 'tarjeta__estado--vivo' },
  dead: { texto: 'Muerto', clase: 'tarjeta__estado--muerto' },
};

const normalizarValor = (valor) => {
  const texto = String(valor ?? '').trim();
  return texto === '' || texto.toLowerCase() === 'unknown' ? TEXTO_DESCONOCIDO : texto;
};

const obtenerEstado = (estado) =>
  ESTADOS[String(estado).toLowerCase()] ?? { texto: TEXTO_DESCONOCIDO, clase: '' };

const construirUrl = ({ nombre, estado }) => {
  const url = new URL(API_URL);
  if (nombre) url.searchParams.set('name', nombre);
  if (estado) url.searchParams.set('status', estado);
  return url;
};

const pedirPersonajes = async (criterios) => {
  const respuesta = await fetch(construirUrl(criterios));

  if (respuesta.status === 404) return [];
  if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);

  const datos = await respuesta.json();
  return datos.results;
};

const crearElemento = (etiqueta, clase, texto) => {
  const elemento = document.createElement(etiqueta);
  if (clase) elemento.className = clase;
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
};

const crearDato = (etiqueta, valor) => {
  const parrafo = crearElemento('p', 'tarjeta__dato');
  const titulo = crearElemento('strong', '', `${etiqueta}: `);
  parrafo.append(titulo, normalizarValor(valor));
  return parrafo;
};

const crearTarjeta = (personaje) => {
  const tarjeta = crearElemento('article', 'tarjeta');
  const nombre = normalizarValor(personaje.name);

  const imagen = crearElemento('img', 'tarjeta__imagen');
  imagen.src = personaje.image;
  imagen.alt = `Imagen de ${nombre}`;
  imagen.loading = 'lazy';

  const cuerpo = crearElemento('div', 'tarjeta__cuerpo');
  const titulo = crearElemento('h3', 'tarjeta__nombre', nombre);

  const estado = obtenerEstado(personaje.status);
  const estadoTexto = crearElemento('p', `tarjeta__estado ${estado.clase}`.trim(), estado.texto);

  cuerpo.append(
    titulo,
    estadoTexto,
    crearDato('Especie', personaje.species),
    crearDato('Origen', personaje.origin?.name),
  );

  tarjeta.append(imagen, cuerpo);
  return tarjeta;
};

const mostrarTarjetas = (personajes) => {
  const tarjetas = personajes.map(crearTarjeta);
  grillaTarjetas.replaceChildren(...tarjetas);
};

const limpiarTarjetas = () => {
  grillaTarjetas.replaceChildren();
};

const mostrarMensaje = (texto, tipo = '') => {
  mensaje.textContent = texto;
  mensaje.className = tipo ? `mensaje mensaje--${tipo}` : 'mensaje';
};

const cambiarEstadoCarga = (estaCargando) => {
  botonBuscar.disabled = estaCargando;
  botonBuscar.textContent = estaCargando ? 'Buscando…' : 'Buscar';
};

const guardarBusqueda = (criterios) => {
  localStorage.setItem(CLAVE_STORAGE, JSON.stringify(criterios));
};

const leerBusquedaGuardada = () => {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_STORAGE));
  } catch {
    return null;
  }
};

const leerCriterios = () => ({
  nombre: campoNombre.value.trim(),
  estado: campoEstado.value,
});

const buscarPersonajes = async (criterios) => {
  cambiarEstadoCarga(true);
  limpiarTarjetas();
  mostrarMensaje('Buscando…');

  try {
    const personajes = await pedirPersonajes(criterios);

    if (personajes.length === 0) {
      mostrarMensaje('Sin resultados: no se encontraron personajes con esos criterios.', 'aviso');
      return;
    }

    mostrarMensaje(`Se encontraron ${personajes.length} personajes en esta página.`);
    mostrarTarjetas(personajes);
  } catch (error) {
    console.warn('No se pudo completar la búsqueda:', error.message);
    mostrarMensaje('Ocurrió un error al conectar con la API. Revisa tu conexión e intenta de nuevo.', 'error');
  } finally {
    cambiarEstadoCarga(false);
  }
};

const manejarEnvio = (evento) => {
  evento.preventDefault();
  const criterios = leerCriterios();

  if (!criterios.nombre && !criterios.estado) {
    limpiarTarjetas();
    mostrarMensaje('Escribe un nombre o elige un estado para buscar.', 'aviso');
    return;
  }

  guardarBusqueda(criterios);
  buscarPersonajes(criterios);
};

const restaurarUltimaBusqueda = () => {
  const busqueda = leerBusquedaGuardada();
  if (!busqueda) return;

  campoNombre.value = busqueda.nombre ?? '';
  campoEstado.value = busqueda.estado ?? '';
  buscarPersonajes(leerCriterios());
};

formulario.addEventListener('submit', manejarEnvio);
restaurarUltimaBusqueda();
