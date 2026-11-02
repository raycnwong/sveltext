import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import { sveltext } from 'sveltext/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte(), sveltext()],
})
