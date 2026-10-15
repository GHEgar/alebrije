import 'maplibre-gl/dist/maplibre-gl.css';
import 'rotulo';
import { Map as MapLibreMap, setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { createAvatarLayer, type AvatarLayer } from 'alebrije/maplibre';
import type { Mode } from './mode';
import { caminarWcs, caminarWms } from './caminar';
import { personas } from './personas';
import { rutas } from './rutas';

const MODES: Mode[] = [personas, caminarWcs, caminarWms, rutas];

setWorkerUrl(workerUrl);

const map = new MapLibreMap({
    container: 'map',
    center: [-103.3496, 20.6767],
    zoom: 18,
    pitch: 60,
    maxPitch: 85,
    canvasContextAttributes: { antialias: true },
    style: {
        version: 8,
        sources: {
            osm: {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
                maxzoom: 19,
                attribution: '© OpenStreetMap',
            },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
    },
});

const tabs = document.getElementById('tabs') as HTMLElement;
const hint = document.getElementById('hint') as HTMLElement;
const status = document.getElementById('status') as HTMLElement;
let stop: (() => void) | null = null;
let layers: AvatarLayer[] = [];

const clear = (): void => {
    stop?.();
    stop = null;
    layers.forEach((layer) => map.removeLayer(layer.id));
    layers = [];
};

const select = (mode: Mode): void => {
    clear();
    tabs.querySelectorAll('button').forEach((button) => button.setAttribute('aria-pressed', String(button.textContent === mode.title)));
    hint.textContent = mode.hint;
    status.textContent = '';
    stop = mode.start({
        map,
        status: (text) => { status.textContent = text; },
        createLayer: (options) => {
            const layer = createAvatarLayer({ id: `avatars-${layers.length}`, ...options });
            map.addLayer(layer);
            layers.push(layer);
            Object.assign(window, { layer });
            return layer;
        },
    });
};

MODES.forEach((mode) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip';
    button.textContent = mode.title;
    button.addEventListener('click', () => select(mode));
    tabs.append(button);
});

map.on('load', () => {
    const initial = MODES.find((mode) => location.hash === `#${MODES.indexOf(mode)}`) ?? MODES[0];
    if (initial) select(initial);
});

Object.assign(window, { map });
