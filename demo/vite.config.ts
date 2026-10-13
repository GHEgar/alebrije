import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { fakeGeoServer } from './server/geoserver';

const src = (path: string): string => fileURLToPath(new URL(`../src/${path}`, import.meta.url));

export default defineConfig({
    root: fileURLToPath(new URL('.', import.meta.url)),
    base: './',
    plugins: [react(), fakeGeoServer()],
    resolve: {
        alias: [
            { find: /^alebrije\/(react|geo|geoserver|maplibre)$/, replacement: src('$1/index.ts') },
            { find: /^alebrije$/, replacement: src('core/index.ts') },
        ],
    },
    build: {
        outDir: fileURLToPath(new URL('../demo-dist', import.meta.url)),
        emptyOutDir: true,
        chunkSizeWarningLimit: 1200,
        rolldownOptions: {
            input: {
                main: fileURLToPath(new URL('./index.html', import.meta.url)),
                mapa: fileURLToPath(new URL('./mapa.html', import.meta.url)),
            },
        },
    },
});
