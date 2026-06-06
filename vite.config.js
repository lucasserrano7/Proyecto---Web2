import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  build:{
    outDir: 'public',
    assetsDir: '', 
    rollupOptions: {
      input: resolve(__dirname, 'src/styles.css'),
      output: {
        assetFileNames: 'css/style.css'
      }
    },
  emptyOutDir: false
  }
})