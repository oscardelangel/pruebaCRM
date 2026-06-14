import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Crea el cliente con el nombre que usas: supabaseClient
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// MANEJO DEL ENVIO DEL FORMULARIO
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('errorMessage');
    
  // VALIDACIONES FRONTEND 
    if (!email || !password) {
        errorDiv.textContent = '❌ Email y contraseña son obligatorios';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (!email.includes('@')) {
        errorDiv.textContent = '❌ Ingresa un email válido';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (password.length < 6) {
        errorDiv.textContent = '❌ La contraseña debe tener al menos 6 caracteres';
        errorDiv.style.display = 'block';
        return;
    }

    // OCULTAR ERROR ANTERIOR
    errorDiv.style.display = 'none';
    
    // BUSCAR USUARIO Y VALIDAR CONTRASENA
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });
    
    if (error) {
        errorDiv.textContent = '❌ ' + error.message;
        errorDiv.style.display = 'block';
        return;
    }
    
    // LOGIN EXITOSO
    if (data.user) {
        const { data: usuarioData } = await supabaseClient
            .from('usuarios')
            .select('*')
            .eq('email', email)
            .single();
        
      const usuario = {
            id: data.user.id,
            email: email,
            nombre: usuarioData?.nombre || email.split('@')[0],
            rol: usuarioData?.rol || 'asesor'
        };
        
        
        // MOSTRAR MENSAJE DE EXITO
        const btn = document.querySelector('.btn-login');
        btn.textContent = '✅ Ingresando...';
        btn.disabled = true;
        
        // REDIRIGIR AL CRM
        setTimeout(() => {
            window.location.href = 'menu.html';
        }, 1000);
    }
});