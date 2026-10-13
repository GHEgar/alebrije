import 'maplibre-gl/dist/maplibre-gl.css';
import { Map as MapLibreMap } from 'maplibre-gl';
import { createAvatarLayer } from 'alebrije/maplibre';
import type { Mode } from './mode';
import { personas } from './personas';

const MODES: Mode[] = [personas];

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

const layer = createAvatarLayer({ id: 'avatars', origin: [-103.3496, 20.6767], smoothing: 0.35 });
const tabs = document.getElementById('tabs') as HTMLElement;
const hint = document.getElementById('hint') as HTMLElement;
const status = document.getElementById('status') as HTMLElement;
let stop: (() => void) | null = null;

const select = (mode: Mode): void => {
    stop?.();
    tabs.querySelectorAll('button').forEach((button) => button.setAttribute('aria-pressed', String(button.textContent === mode.title)));
    hint.textContent = mode.hint;
    status.textContent = '';
    stop = mode.start({ map, layer, status: (text) => { status.textContent = text; } });
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
    map.addLayer(layer);
    const initial = MODES.find((mode) => location.hash === `#${MODES.indexOf(mode)}`) ?? MODES[0];
    if (initial) select(initial);
});

Object.assign(window, { map, layer });
