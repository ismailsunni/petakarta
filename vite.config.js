import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/petakarta/',
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.js', 'src/**/*.spec.js'],
  },
})
