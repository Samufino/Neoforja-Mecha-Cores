import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import fs from 'fs';

export default defineConfig(() => {
  const rootDir = path.resolve(__dirname, '.');
  
  // Detect if 'public' or 'Public' is used in the filesystem to ensure compatibility
  // with case-sensitive OS environments like Netlify's Linux builder
  let publicDirName = 'public';
  if (!fs.existsSync(path.join(rootDir, 'public')) && fs.existsSync(path.join(rootDir, 'Public'))) {
    publicDirName = 'Public';
  }

  return {
    publicDir: publicDirName,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': rootDir,
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
