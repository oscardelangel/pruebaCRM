import { createClient } from '@supabase/supabase-js'

let usuarioActual = null;
let supabaseClient = null; 


// Inicializar Supabase
function initSupabase() {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
    // Crea el cliente con el nombre que usas: supabaseClient
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Verificar sesión y cargar usuario
async function verificarSesion() {
    
    // 1. Verificar sesión en Supabase Auth
   const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session) return false;
    
    const { data: { user } } = await supabaseClient.auth.getUser();
    const { data: profile } = await supabaseClient
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single();
    
    usuarioActual = profile;  // ✅ Guardas en memoria
    return true;
}


// ========== DATOS GLOBALES ==========
let clientesGlobales = [];
let clienteEditandoId = null;
let filtroRolesActivos = [];
let filtroRecurrenteActivo = false;
let textoBusqueda = '';


async function cargarDatos() {
    if (!supabaseClient) initSupabase();
    
    try {
        const { data, error } = await supabaseClient
            .from('clientes')
            .select(`
                *,
                asesor:usuarios!clientes_asesor_id_fkey (
                    id,
                    nombre
                )
            `);
        
        if (error) {
            console.error('Error al cargar clientes:', error);
            return;
        }
        
        // Transformar los datos para tener asesor_nombre directamente
        clientesGlobales = data.map(cliente => ({
            ...cliente,
            asesor_nombre: cliente.asesor?.nombre || null
        }));
        
        renderizarLista();
        actualizarEstadisticas();
        
    } catch (error) {
        console.error('Error inesperado:', error);
    }
}

async function crearCliente(datos) {
    const { data, error } = await supabaseClient
        .from('clientes')
        .insert([datos])
        .select();
    
    if (error) {
        console.error('Error al crear:', error);
        alert('❌ Error al guardar: ' + error.message);
        return false;
    }
    
    await cargarDatos();
    cerrarModalCliente();
    alert('✅ Cliente agregado exitosamente');
    return true;
}

async function actualizarCliente(id, datos) {
    const { error } = await supabaseClient
        .from('clientes')
        .update(datos)
        .eq('id', id);
    
    if (error) {
        console.error('Error al actualizar:', error);
        alert('❌ Error al actualizar: ' + error.message);
        return false;
    }
    
    await cargarDatos();
    cerrarModalCliente();
    alert('✏️ Cliente actualizado');
    return true;
}

async function eliminarCliente(id) {
    const cliente = clientesGlobales.find(c => c.id === id);
    if (!confirm(`¿Eliminar a ${cliente.nombre}?`)) return;
    
    const { error } = await supabaseClient
        .from('clientes')
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('Error al eliminar:', error);
        alert('❌ Error al eliminar: ' + error.message);
        return;
    }
    
    await cargarDatos();
    cerrarModalEliminar();
    alert('🗑️ Cliente eliminado');
}


// ========== FUNCIONES DE ROLES (TAGS) ==========
function toggleRol(boton) {
    boton.classList.toggle('active');
    actualizarRolesHidden();
}

function actualizarRolesHidden() {
    const rolesActivos = [];
    document.querySelectorAll('.rol-btn.active').forEach(btn => {
        rolesActivos.push(btn.dataset.rol);
    });
    document.getElementById('roles').value = JSON.stringify(rolesActivos);
}

function cargarRolesEnModal(roles) {
    // 1. Limpiar todos los botones de roles (quitar clase 'active')
    document.querySelectorAll('.rol-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (roles && Array.isArray(roles)) {
        roles.forEach(rol => {
            const boton = document.querySelector(`.rol-btn[data-rol="${rol}"]`);
            if (boton) boton.classList.add('active');
        });
    }
    actualizarRolesHidden();
}

function obtenerRolesDelModal() {
    const rolesJson = document.getElementById('roles').value;
    return JSON.parse(rolesJson);
}

// ========== FILTRADO Y BÚSQUEDA ==========
function clientesFiltrados() {
    let resultado = [...clientesGlobales];
    
    // Filtro por búsqueda
    if (textoBusqueda) {
        resultado = resultado.filter(c => 
            c.nombre?.toLowerCase().includes(textoBusqueda) ||
            c.email?.toLowerCase().includes(textoBusqueda) ||
            (c.ciudad_preferida && c.ciudad_preferida.toLowerCase().includes(textoBusqueda))
        );
    }
    
    // Filtro por roles
    if (filtroRolesActivos.length > 0) {
        resultado = resultado.filter(c => 
            filtroRolesActivos.some(rol => c.roles && c.roles.includes(rol))
        );
    }
    
    // Filtro por recurrente
    if (filtroRecurrenteActivo) {
        resultado = resultado.filter(c => c.es_recurrente === true);
    }
    
    return resultado;
}

function aplicarFiltros() {
    textoBusqueda = document.getElementById('buscador')?.value.toLowerCase() || '';
    
    filtroRolesActivos = [];
    document.querySelectorAll('.filtro-rol:checked').forEach(checkbox => {
        filtroRolesActivos.push(checkbox.dataset.rol);
    });
    
    filtroRecurrenteActivo = document.getElementById('filtroRecurrente')?.checked || false;
    
    renderizarLista();
}

function renderizarLista() {
    const filtrados = clientesFiltrados();
    const listaDiv = document.getElementById('listaClientes');
    
    if (!listaDiv) return;

    if (filtrados.length === 0) {
        listaDiv.innerHTML = '<div class="vacio"><p>📭 No hay clientes</p></div>';
        return;
    }
    
    listaDiv.innerHTML = filtrados.map(cliente => `
        <div class="cliente-item">
            <div class="cliente-info">
                <div class="cliente-nombre">
                    ${escapeHtml(cliente.nombre)}
                    ${cliente.es_recurrente ? '<span class="badge badge-recurrente">🔄 Recurrente</span>' : ''}
                </div>
                <div class="cliente-detalle">
                    <span>📧 ${escapeHtml(cliente.email)}</span>
                    <span>📞 ${escapeHtml(cliente.telefono || 'Sin teléfono')}</span>
                    <span>📍 ${escapeHtml(cliente.ciudad_preferida || 'Sin ciudad')}</span>
                    <span>💰 ${formatearPresupuesto(cliente.presupuesto_min, cliente.presupuesto_max)}</span>
                    ${usuarioActual.rol === 'admin' && cliente.asesor_id ? 
                        `<span>👤 Asesor: ${escapeHtml(cliente.asesor_nombre|| cliente.asesor_id)}</span>` : ''}
                </div>
                <div class="cliente-roles">
                    ${generarTagsRoles(cliente.roles)}
                </div>
            </div>
            <div class="cliente-acciones">
                <button class="btn btn-primary btn-sm" onclick="abrirModalEditar(${cliente.id})">✏️ Editar</button>
                <button class="btn btn-danger btn-sm" onclick="abrirModalEliminar(${cliente.id})">🗑️ Eliminar</button>
            </div>
        </div>
    `).join('');
}


function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function generarTagsRoles(roles) {
    if (!roles || roles.length === 0) return '<span style="color: gray;">Sin roles</span>';
    const nombreRoles = {
        'arrendatario': '🏠 Arrendatario',
        'dueno': '👑 Dueño',
        'inversionista': '💰 Inversionista',
        'comprador': '🏷️ Comprador'
    };
    return roles.map(rol => `<span class="role-tag role-tag-${rol}">${nombreRoles[rol] || rol}</span>`).join('');
}

function formatearPresupuesto(min, max) {
    if (!min && !max) return 'No especificado';
    if (min && !max) return `$${min.toLocaleString()}+`;
    if (!min && max) return `$${max.toLocaleString()}`;
    return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
}

// ========== ESTADÍSTICAS ==========
function actualizarEstadisticas() {
    document.getElementById('totalClientes').textContent = clientesGlobales.length;
    document.getElementById('totalArrendatarios').textContent = clientesGlobales.filter(c => c.roles && c.roles.includes('arrendatario')).length;
    document.getElementById('totalDuenos').textContent = clientesGlobales.filter(c => c.roles && c.roles.includes('dueno')).length;
    document.getElementById('totalInversionistas').textContent = clientesGlobales.filter(c => c.roles && c.roles.includes('inversionista')).length;
    document.getElementById('totalCompradores').textContent = clientesGlobales.filter(c => c.roles && c.roles.includes('comprador')).length;
    document.getElementById('totalRecurrentes').textContent = clientesGlobales.filter(c => c.es_recurrente === true).length;
}

// ========== CARGAR ASESORES (para admin) ==========
async function cargarListaAsesores() {
    const { data, error } = await supabaseClient
        .from('usuarios')
        .select('id, nombre')
        .eq('rol', 'asesor')
        .order('nombre');
    
    if (error) return [];    
    const select = document.getElementById('asesorSelect');
    if (!select) return [];
    
    if (!data || data.length === 0) {
        select.innerHTML = '<option value="">No hay asesores disponibles</option>';
        return [];
    }
    
    select.innerHTML = '<option value="">Seleccionar asesor...</option>';
    data.forEach(asesor => {
        select.innerHTML += `<option value="${asesor.id}">${asesor.nombre}</option>`;
   });
    
    return data;
}

//No necesito cambios solo es para mostrarCampoAsesor solo a admin
function mostrarCampoAsesor() {
    const campo = document.getElementById('campoAsesor');
    if (campo) {
        campo.style.display = usuarioActual.rol === 'admin' ? 'block' : 'none';
    }
}

// ========== MODALES ==========
function abrirModalCrear() {
    // 1. Limpiar ID de edición (indica que es un cliente NUEVO, no edición)
    clienteEditandoId = null;
    // 2. Cambiar título del modal
    document.getElementById('modalTitulo').textContent = 'Nuevo Cliente';
    // 3. Limpiar TODO el formulario (resetear todos los campos)
    document.getElementById('formCliente').reset();
    // 4. Limpiar campo oculto del ID (por si quedaba de una edición anterior)
    document.getElementById('clienteId').value = '';
     // 5. Poner fecha actual en el campo "cliente desde"
    document.getElementById('clienteDesde').value = new Date().toISOString().split('T')[0];
    // 6. Cargar roles vacíos (ningún rol seleccionado)
    cargarRolesEnModal([]);
    // 7. Mostrar el campo de selección de asesor (dependiendo del rol)
    mostrarCampoAsesor();

    // 8. Si el usuario logueado es ADMIN
    // Cargar la lista de asesores para asignar el cliente a uno
    if (usuarioActual.rol === 'admin') {
        cargarListaAsesores();
    // Limpiar el select de asesores (ninguno seleccionado)
        document.getElementById('asesorSelect').value = '';
    }
    
    // 9. Mostrar el modal (agregar clase 'active' para que se vea)
    document.getElementById('modalCliente').classList.add('active');
}

async function abrirModalEditar(id) {
    const cliente = clientesGlobales.find(c => Number(c.id) === Number(id));
    
    if (!cliente) return;
    
    clienteEditandoId = id;
    document.getElementById('modalTitulo').textContent = 'Editar Cliente';
    document.getElementById('clienteId').value = cliente.id;
    document.getElementById('nombre').value = cliente.nombre || '';
    document.getElementById('email').value = cliente.email || '';
    document.getElementById('telefono').value = cliente.telefono || '';
    document.getElementById('presupuestoMin').value = cliente.presupuesto_min || '';
    document.getElementById('presupuestoMax').value = cliente.presupuesto_max || '';
    document.getElementById('ciudadPreferida').value = cliente.ciudad_preferida || '';
    document.getElementById('clienteDesde').value = cliente.cliente_desde || '';
    document.getElementById('esRecurrente').checked = cliente.es_recurrente || false;
    document.getElementById('notasGenerales').value = cliente.notas_generales || '';
    cargarRolesEnModal(cliente.roles || []);
    
    mostrarCampoAsesor();
    if (usuarioActual.rol === 'admin') {
        await cargarListaAsesores();
        document.getElementById('asesorSelect').value = cliente.asesor_id || '';
    }
    
    document.getElementById('modalCliente').classList.add('active');
}

function cerrarModalCliente() {
    document.getElementById('modalCliente').classList.remove('active');
}

async function guardarClienteDesdeModal() {
    const nombre = document.getElementById('nombre').value.trim();
    const email = document.getElementById('email').value.trim();
    
    if (!nombre || !email) {
        alert('⚠️ Nombre y email son obligatorios');
        return;
    }
    
    const roles = obtenerRolesDelModal();
    if (roles.length === 0) {
        alert('⚠️ Debes seleccionar al menos un rol');
        return;
    }
    
    let asesorId;
    let asesorNombre;
    
    if (usuarioActual.rol === 'admin') {
        const selectAsesor = document.getElementById('asesorSelect');
        asesorId = selectAsesor.value;
        const selectedOption = selectAsesor.options[selectAsesor.selectedIndex];
        asesorNombre = selectedOption ? selectedOption.text : '';
        
        if (!asesorId) {
            alert('⚠️ Debes asignar un asesor al cliente');
            return;
        }
    } else {
        asesorId = usuarioActual.id;
        asesorNombre = usuarioActual.nombre;
    }
    
    const datosCliente = {
        nombre: nombre,
        email: email,
        telefono: document.getElementById('telefono').value.trim(),
        roles: roles,
        presupuesto_min: parseInt(document.getElementById('presupuestoMin').value) || null,
        presupuesto_max: parseInt(document.getElementById('presupuestoMax').value) || null,
        ciudad_preferida: document.getElementById('ciudadPreferida').value.trim(),
        es_recurrente: document.getElementById('esRecurrente').checked,
        cliente_desde: document.getElementById('clienteDesde').value,
        notas_generales: document.getElementById('notasGenerales').value.trim(),
        asesor_id: asesorId 
    };
    
    if (clienteEditandoId) {
        await actualizarCliente(clienteEditandoId, datosCliente);
    } else {
        await crearCliente(datosCliente);
    }
}

// ========== MODAL ELIMINAR ==========
let clienteAEliminarId = null;

function abrirModalEliminar(id) {
    const cliente = clientesGlobales.find(c => c.id === id);
    if (cliente) {
        clienteAEliminarId = id;
        document.getElementById('mensajeEliminar').textContent = `¿Eliminar a "${cliente.nombre}"?`;
        document.getElementById('modalEliminar').classList.add('active');
    }
}

function cerrarModalEliminar() {
    document.getElementById('modalEliminar').classList.remove('active');
    clienteAEliminarId = null;
}

function confirmarEliminar() {
    if (clienteAEliminarId) {
        eliminarCliente(clienteAEliminarId);
    }
}

// ========== CERRAR SESIÓN ==========
async function cerrarSesion() {
    
    usuarioActual = null;
    const { error } = await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
}
// ========== REGRESAR MENU ==========
async function regresarMenu() {

    window.location.href = 'index.html';
}

// ========== MOSTRAR USUARIO EN HEADER ==========
function mostrarUsuarioEnHeader() {
    
    const userNameSpan = document.getElementById('userName');
    const userRoleSpan = document.getElementById('userRole');
    
    if (!usuarioActual) {
        console.error("❌ usuarioActual es null");
        return;  // Salir para evitar error
    }
    
    if (userNameSpan) {
        userNameSpan.textContent = usuarioActual.nombre || usuarioActual.email;
    }
    if (userRoleSpan) {
        userRoleSpan.textContent = usuarioActual.rol === 'admin' ? '👑 Administrador' : '🏠 Asesor';
    }
}
// ========== 👇 EXPONER FUNCIONES GLOBALES (AL FINAL) 👇 ==========
window.abrirModalEditar = abrirModalEditar;
window.abrirModalEliminar = abrirModalEliminar;
window.toggleRol = toggleRol;
window.cerrarModalCliente = cerrarModalCliente;
window.cerrarModalEliminar = cerrarModalEliminar;
window.confirmarEliminar = confirmarEliminar;
window.guardarClienteDesdeModal = guardarClienteDesdeModal;
 
// ========== INICIALIZACIÓN ==========
async function inicializar() {
    
    initSupabase();
    
    const sesionValida = await verificarSesion();
    if (!sesionValida) return;
    
    await cargarDatos();
    mostrarUsuarioEnHeader();
    
    // Event listeners
    document.getElementById('buscador')?.addEventListener('input', aplicarFiltros);
    document.querySelectorAll('.filtro-rol').forEach(cb => cb.addEventListener('change', aplicarFiltros));
    document.getElementById('filtroRecurrente')?.addEventListener('change', aplicarFiltros);
    document.getElementById('limpiarFiltros')?.addEventListener('click', () => {
        if (document.getElementById('buscador')) document.getElementById('buscador').value = '';
        document.querySelectorAll('.filtro-rol').forEach(cb => cb.checked = false);
        if (document.getElementById('filtroRecurrente')) document.getElementById('filtroRecurrente').checked = false;
        aplicarFiltros();
    });
    document.getElementById('btnNuevoCliente')?.addEventListener('click', abrirModalCrear);
    document.getElementById('closeModal')?.addEventListener('click', cerrarModalCliente);
    document.getElementById('cancelarModal')?.addEventListener('click', cerrarModalCliente);
    document.getElementById('guardarCliente')?.addEventListener('click', guardarClienteDesdeModal);
    document.getElementById('closeEliminarModal')?.addEventListener('click', cerrarModalEliminar);
    document.getElementById('cancelarEliminar')?.addEventListener('click', cerrarModalEliminar);
    document.getElementById('confirmarEliminar')?.addEventListener('click', confirmarEliminar);
    document.getElementById('backBtn')?.addEventListener('click', regresarMenu);
     document.getElementById('logoutBtn')?.addEventListener('click', cerrarSesion);
    
    document.getElementById('modalCliente')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('modalCliente')) cerrarModalCliente();
    });
    document.getElementById('modalEliminar')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('modalEliminar')) cerrarModalEliminar();
    });
}

// Iniciar
inicializar();