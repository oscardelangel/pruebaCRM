// src/main.js
import './login.js'
import './contactos.js'

console.log("App cargada")

// Espera a que el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Tu código de inicialización aquí
    if (typeof inicializar === 'function') {
        inicializar()
    }
})