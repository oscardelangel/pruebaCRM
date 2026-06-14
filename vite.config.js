import { defineConfig } from 'vite'

export default defineConfig({
  base: '/pruebaCRM/',
  server: {
    open: '/pruebaCRM/login.html'
  },
  build: {
    rollupOptions: {
      input: {
        index: 'index.html',
        login: 'login.html',
        contactos: 'contactos.html'
      }
    }
  }
})