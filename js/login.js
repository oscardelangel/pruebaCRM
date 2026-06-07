// ========== SIMULACIÓN DE LOGIN (temporal) ==========
// TODO: Reemplazar con Supabase Auth después

const USUARIOS_SIMULADOS = {
    'asesor@inmobiliaria.com': {
        id: 'user-asesor-001',
        nombre: 'María Gómez',
        email: 'asesor@inmobiliaria.com',
        rol: 'asesor'
    },
    'admin@inmobiliaria.com': {
        id: 'user-admin-001',
        nombre: 'Carlos Patrón',
        email: 'admin@inmobiliaria.com',
        rol: 'admin'
    },
    'pedro@inmobiliaria.com': {
        id: 'user-asesor-002',
        nombre: 'Pedro López',
        email: 'pedro@inmobiliaria.com',
        rol: 'asesor'
    }
};

// Manejar el envío del formulario
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('errorMessage');
    
    // Ocultar error anterior
    errorDiv.style.display = 'none';
    
    // Validar que haya email
    if (!email) {
        errorDiv.textContent = '❌ Por favor ingresa tu correo electrónico';
        errorDiv.style.display = 'block';
        return;
    }
    
    // Buscar usuario (simulación)
    const usuario = USUARIOS_SIMULADOS[email];
    
    if (usuario) {
        // Login exitoso
        console.log('✅ Login exitoso:', usuario);
        
        // Guardar usuario en localStorage
        localStorage.setItem('usuario_actual', JSON.stringify(usuario));
        
        // Mostrar mensaje de éxito
        const submitBtn = document.querySelector('.btn-login');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '✅ Ingresando...';
        submitBtn.disabled = true;
        
        // Redirigir al CRM
        setTimeout(() => {
            window.location.href = 'contactos.html';
        }, 1000);
    } else {
        // Usuario no encontrado
        errorDiv.textContent = '❌ Correo o contraseña incorrectos. Si no tienes cuenta, solicita acceso al administrador.';
        errorDiv.style.display = 'block';
    }
});

// Enlace de registro (temporal)
document.getElementById('registroLink').addEventListener('click', function(e) {
    e.preventDefault();
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = '📝 Para solicitar acceso, contacta al administrador del sistema.';
    errorDiv.style.display = 'block';
});

