import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'));

export default defineConfig({
    define: {
        __APP_VERSION__: JSON.stringify(pkg.version),
    },
    plugins: [react(), tailwindcss()],
    build: {
        chunkSizeWarningLimit: 700,
        rolldownOptions: {
            output: {
                codeSplitting: {
                    groups: [
                        {
                            name: 'vendor-react',
                            test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
                            priority: 30,
                        },
                        {
                            name: 'vendor-three',
                            test: /node_modules[\\/]three[\\/]/,
                            priority: 20,
                        },
                    ],
                },
            },
        },
    },
    server: {
        host: '0.0.0.0',
        port: 5180,
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
