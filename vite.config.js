import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    css: false,
    env: {
      VITE_API_URL: 'http://api.test',
      VITE_KEYCLOAK_URL: 'http://keycloak.test',
      VITE_KEYCLOAK_REALM: 'test-realm',
      VITE_KEYCLOAK_CLIENT_ID: 'test-client',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/test/**',
        'src/**/*.test.{js,jsx}',
        'src/main.jsx',
      ],
    },
  },
})
