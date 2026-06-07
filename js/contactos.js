// ========== VERIFICAR SESIÓN ==========
const usuarioActual = (function() {
    const usuario = localStorage.getItem('usuario_actual');
    if (!usuario) {
        window.location.href = 'login.html';
        return null;
    }
    return JSON.parse(usuario);
})();

if (!usuarioActual) {
    throw new Error('Redirigiendo al login...');
}

// ========== DATOS GLOBALES ==========
let clientes = [];
let clienteEditandoId = null;
let filtroRolesActivos = [];
let filtroRecurrenteActivo = false;
let textoBusqueda = '';

// ========== CRUD PRINCIPAL ==========
function cargarDatos() {
    const guardado = localStorage.getItem('clientes_inmobiliaria');
    if (guardado) {
        clientes = JSON.parse(guardado);
    } else {
        // Datos de ejemplo con asesor_id correcto
        clientes = [
            {
                id: 1,
                nombre: "Juan Pérez",
                email: "juan@email.com",
                telefono: "555-1234",
                roles: ["arrendatario"],
                presupuestoMin: 500000,
                presupuestoMax: 800000,
                ciudadPreferida: "Ciudad de México",
                esRecurrente: false,
                clienteDesde: "2024-01-15",
                notasGenerales: "Busca departamento",
                asesor_id: "user-asesor-001",
                asesor_nombre: "María Gómez"
            },
            {
                id: 2,
                nombre: "María García",
                email: "maria@email.com",
                telefono: "555-5678",
                roles: ["dueno", "comprador"],
                presupuestoMin: 2000000,
                presupuestoMax: 3000000,
                ciudadPreferida: "Guadalajara",
                esRecurrente: true,
                clienteDesde: "2023-06-10",
                notasGenerales: "Dueña de propiedad",
                asesor_id: "user-asesor-002",
                asesor_nombre: "Pedro López"
            },
            {
                id: 3,
                nombre: "Carlos López",
                email: "carlos@email.com",
                telefono: "555-9012",
                roles: ["inversionista"],
                presupuestoMin: 5000000,
                presupuestoMax: 10000000,
                ciudadPreferida: "Monterrey",
                esRecurrente: false,
                clienteDesde: "2024-02-20",
                notasGenerales: "Busca terrenos",
                asesor_id: "user-asesor-001",
                asesor_nombre: "María Gómez"
            },
            {
                id: 4,
                nombre: "Ana Martínez",
                email: "ana@email.com",
                telefono: "555-3456",
                roles: ["arrendatario", "comprador"],
                presupuestoMin: 800000,
                presupuestoMax: 1200000,
                ciudadPreferida: "Querétaro",
                esRecurrente: true,
                clienteDesde: "2023-01-05",
                notasGenerales: "Cliente recurrente",
                asesor_id: "user-admin-001",
                asesor_nombre: "Carlos Patrón"
            }
        ];
        guardarDatos();
    }
}

function guardarDatos() {
    localStorage.setItem('clientes_inmobiliaria', JSON.stringify(clientes));
}

function crearCliente(datos) {
    const nuevoId = clientes.length > 0 ? Math.max(...clientes.map(c => c.id)) + 1 : 1;
    const nuevoCliente = { id: nuevoId, ...datos };
    clientes.push(nuevoCliente);
    guardarDatos();
    renderizarLista();
    actualizarEstadisticas();
    cerrarModalCliente();
    alert('✅ Cliente agregado');
}

function actualizarCliente(id, datos) {
    const index = clientes.findIndex(c => c.id === id);
    if (index !== -1) {
        clientes[index] = { id, ...datos };
        guardarDatos();
        renderizarLista();
        actualizarEstadisticas();
        cerrarModalCliente();
        alert('✏️ Cliente actualizado');
    }
}

function eliminarCliente(id) {
    const cliente = clientes.find(c => c.id === id);
    if (confirm(`¿Eliminar a ${cliente.nombre}?`)) {
        clientes = clientes.filter(c => c.id !== id);
        guardarDatos();
        renderizarLista();
        actualizarEstadisticas();
        cerrarModalEliminar();
        alert('🗑️ Cliente eliminado');
    }
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
    let resultado = [...clientes];
    
    // FILTRO POR ASESOR (importante)
    if (usuarioActual.rol !== 'admin') {
        resultado = resultado.filter(c => c.asesor_id === usuarioActual.id);
    }
    
    // Filtro por búsqueda
    if (textoBusqueda) {
        resultado = resultado.filter(c => 
            c.nombre.toLowerCase().includes(textoBusqueda) ||
            c.email.toLowerCase().includes(textoBusqueda) ||
            (c.ciudadPreferida && c.ciudadPreferida.toLowerCase().includes(textoBusqueda))
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
        resultado = resultado.filter(c => c.esRecurrente === true);
    }
    
    return resultado;
}

function aplicarFiltros() {
    textoBusqueda = document.getElementById('buscador').value.toLowerCase();
    
    filtroRolesActivos = [];
    document.querySelectorAll('.filtro-rol:checked').forEach(checkbox => {
        filtroRolesActivos.push(checkbox.dataset.rol);
    });
    
    filtroRecurrenteActivo = document.getElementById('filtroRecurrente').checked;
    
    renderizarLista();
}

function renderizarLista() {
    const filtrados = clientesFiltrados();
    const listaDiv = document.getElementById('listaClientes');
    
    if (filtrados.length === 0) {
        listaDiv.innerHTML = '<div class="vacio"><p>📭 No hay clientes</p></div>';
        return;
    }
    
    listaDiv.innerHTML = filtrados.map(cliente => `
        <div class="cliente-item">
            <div class="cliente-info">
                <div class="cliente-nombre">
                    ${cliente.nombre}
                    ${cliente.esRecurrente ? '<span class="badge badge-recurrente">🔄 Recurrente</span>' : ''}
                </div>
                <div class="cliente-detalle">
                    <span>📧 ${cliente.email}</span>
                    <span>📞 ${cliente.telefono || 'Sin teléfono'}</span>
                    <span>📍 ${cliente.ciudadPreferida || 'Sin ciudad'}</span>
                    <span>💰 ${formatearPresupuesto(cliente.presupuestoMin, cliente.presupuestoMax)}</span>
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
    let clientesVisibles = [...clientes];
    if (usuarioActual.rol !== 'admin') {
        clientesVisibles = clientesVisibles.filter(c => c.asesor_id === usuarioActual.id);
    }
    
    document.getElementById('totalClientes').textContent = clientesVisibles.length;
    document.getElementById('totalArrendatarios').textContent = clientesVisibles.filter(c => c.roles && c.roles.includes('arrendatario')).length;
    document.getElementById('totalDuenos').textContent = clientesVisibles.filter(c => c.roles && c.roles.includes('dueno')).length;
    document.getElementById('totalInversionistas').textContent = clientesVisibles.filter(c => c.roles && c.roles.includes('inversionista')).length;
    document.getElementById('totalCompradores').textContent = clientesVisibles.filter(c => c.roles && c.roles.includes('comprador')).length;
    document.getElementById('totalRecurrentes').textContent = clientesVisibles.filter(c => c.esRecurrente === true).length;
}

// ========== MODALES ==========
function abrirModalCrear() {
    clienteEditandoId = null;
    document.getElementById('modalTitulo').textContent = 'Nuevo Cliente';
    document.getElementById('formCliente').reset();
    document.getElementById('clienteId').value = '';
    document.getElementById('clienteDesde').value = new Date().toISOString().split('T')[0];
    cargarRolesEnModal([]);
    document.getElementById('modalCliente').classList.add('active');
}

function abrirModalEditar(id) {
    const cliente = clientes.find(c => c.id === id);
    if (!cliente) return;
    
    clienteEditandoId = id;
    document.getElementById('modalTitulo').textContent = 'Editar Cliente';
    document.getElementById('clienteId').value = cliente.id;
    document.getElementById('nombre').value = cliente.nombre;
    document.getElementById('email').value = cliente.email;
    document.getElementById('telefono').value = cliente.telefono || '';
    document.getElementById('presupuestoMin').value = cliente.presupuestoMin || '';
    document.getElementById('presupuestoMax').value = cliente.presupuestoMax || '';
    document.getElementById('ciudadPreferida').value = cliente.ciudadPreferida || '';
    document.getElementById('clienteDesde').value = cliente.clienteDesde || '';
    document.getElementById('esRecurrente').checked = cliente.esRecurrente || false;
    document.getElementById('notasGenerales').value = cliente.notasGenerales || '';
    cargarRolesEnModal(cliente.roles || []);
    
    document.getElementById('modalCliente').classList.add('active');
}

function cerrarModalCliente() {
    document.getElementById('modalCliente').classList.remove('active');
}

function guardarClienteDesdeModal() {
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
    
    const datosCliente = {
        nombre: nombre,
        email: email,
        telefono: document.getElementById('telefono').value.trim(),
        roles: roles,
        presupuestoMin: parseInt(document.getElementById('presupuestoMin').value) || null,
        presupuestoMax: parseInt(document.getElementById('presupuestoMax').value) || null,
        ciudadPreferida: document.getElementById('ciudadPreferida').value.trim(),
        esRecurrente: document.getElementById('esRecurrente').checked,
        clienteDesde: document.getElementById('clienteDesde').value,
        notasGenerales: document.getElementById('notasGenerales').value.trim(),
        asesor_id: usuarioActual.id,
        asesor_nombre: usuarioActual.nombre
    };
    
    if (clienteEditandoId) {
        actualizarCliente(clienteEditandoId, datosCliente);
    } else {
        crearCliente(datosCliente);
    }
}

// ========== MODAL ELIMINAR ==========
let clienteAEliminarId = null;

function abrirModalEliminar(id) {
    const cliente = clientes.find(c => c.id === id);
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
function cerrarSesion() {
    localStorage.removeItem('usuario_actual');
    window.location.href = 'login.html';
}

// ========== MOSTRAR USUARIO EN HEADER ==========
function mostrarUsuarioEnHeader() {
    const userNameSpan = document.getElementById('userName');
    const userRoleSpan = document.getElementById('userRole');
    
    if (userNameSpan) {
        userNameSpan.textContent = usuarioActual.nombre || usuarioActual.email;
    }
    if (userRoleSpan) {
        userRoleSpan.textContent = usuarioActual.rol === 'admin' ? '👑 Administrador' : '🏠 Asesor';
    }
}

// ========== INICIALIZACIÓN ==========
function inicializar() {
    cargarDatos();
    renderizarLista();
    actualizarEstadisticas();
    mostrarUsuarioEnHeader();
    
    // Event listeners
    document.getElementById('buscador').addEventListener('input', aplicarFiltros);
    document.querySelectorAll('.filtro-rol').forEach(cb => cb.addEventListener('change', aplicarFiltros));
    document.getElementById('filtroRecurrente').addEventListener('change', aplicarFiltros);
    document.getElementById('limpiarFiltros').addEventListener('click', () => {
        document.getElementById('buscador').value = '';
        document.querySelectorAll('.filtro-rol').forEach(cb => cb.checked = false);
        document.getElementById('filtroRecurrente').checked = false;
        aplicarFiltros();
    });
    document.getElementById('btnNuevoCliente').addEventListener('click', abrirModalCrear);
    document.getElementById('closeModal').addEventListener('click', cerrarModalCliente);
    document.getElementById('cancelarModal').addEventListener('click', cerrarModalCliente);
    document.getElementById('guardarCliente').addEventListener('click', guardarClienteDesdeModal);
    document.getElementById('closeEliminarModal').addEventListener('click', cerrarModalEliminar);
    document.getElementById('cancelarEliminar').addEventListener('click', cerrarModalEliminar);
    document.getElementById('confirmarEliminar').addEventListener('click', confirmarEliminar);
    document.getElementById('logoutBtn')?.addEventListener('click', cerrarSesion);
    
    // Cerrar modal al hacer clic fuera
    document.getElementById('modalCliente').addEventListener('click', (e) => {
        if (e.target === document.getElementById('modalCliente')) cerrarModalCliente();
    });
    document.getElementById('modalEliminar').addEventListener('click', (e) => {
        if (e.target === document.getElementById('modalEliminar')) cerrarModalEliminar();
    });
}

// Iniciar
inicializar();