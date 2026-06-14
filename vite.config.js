import { defineConfig } from 'vite'

export default defineConfig({
  base: '/pruebaCRM/',
  server: {
    open: '/pruebaCRM/index.html'
  },
  build: {
    rollupOptions: {
      input: {
        menu: 'menu.html',
        index: 'index.html',
        contactos: 'contactos.html'
      }
    }
  }
})