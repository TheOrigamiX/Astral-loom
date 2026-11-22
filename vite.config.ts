import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// VITE_BASE ใช้ตอน deploy GitHub Pages (เช่น /astral-loom/)
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? '/',
});
