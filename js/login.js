// ========== LOGIN CON SUPABASE ==========
// ========== URL Y API KEY==========
const supabaseClient = window.supabase.createClient(
    'https://lxdcuvfpfuoeyzzgxhqx.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4ZGN1dmZwZnVvZXl6emd4aHF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MDAyNDMsImV4cCI6MjA5NjM3NjI0M30.dWjQaPjDMK6HLvXzkgMcvhxnhc8kOQZ9TOZmrvVjU14'
);

// MANEJO DEL ENVIO DEL FORMULARIO
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('errorMessage');
    
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
            window.location.href = 'contactos.html';
        }, 1000);
    }
});