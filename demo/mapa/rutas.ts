import type { GeoJSONSourceSpecification } from 'maplibre-gl';
import { DEFAULT_AVATAR } from 'alebrije';
import { createRoutePlayer, type RoutePlayer } from 'alebrije/geo';
import { fetchFeatures, routesFromFeatures } from 'alebrije/geoserver';
import type { Mode } from './mode';

const SOURCE = 'routes';

export const rutas: Mode = {
    title: 'Routes (WFS)',
    hint: 'Each LineString of demo:routes is walked in a loop: at the speed attribute or following the per-vertex times.',
    start({ createLayer, map, status }) {
        const layer = createLayer({ origin: [-103.3445, 20.6745] });
        const controller = new AbortController();
        let players: { id: string; definition: unknown; player: RoutePlayer }[] = [];
        let frameId = 0;
        let previous = performance.now();

        const tick = (now: number): void => {
            const delta = Math.min((now - previous) / 1000, 0.1);
            previous = now;
            layer.setAvatars(players.map(({ id, definition, player }) => {
                player.advance(delta);
                return player.avatar(id, definition);
            }));
            frameId = requestAnimationFrame(tick);
        };

        void fetchFeatures({ url: '/geoserver/ows', typeName: 'demo:routes', signal: controller.signal }).then((collection) => {
            const routes = routesFromFeatures(collection, { definition: 'avatar', speed: 'speed', times: 'times', fallbackDefinition: DEFAULT_AVATAR });
            players = routes.map(({ id, definition, route, speed }) => ({
                id,
                definition,
                player: createRoutePlayer(route, { loop: true, ...(speed ? { speed } : {}) }),
            }));
            map.addSource(SOURCE, { type: 'geojson', data: collection as GeoJSONSourceSpecification['data'] });
            map.addLayer({
                id: SOURCE,
                type: 'line',
                source: SOURCE,
                paint: { 'line-color': '#b45309', 'line-width': 3, 'line-opacity': 0.7, 'line-dasharray': [2, 1.5] },
            }, layer.id);
            status(routes.map(({ id, route, speed }) => `${id}: ${route.length.toFixed(0)} m${route.duration ? ` in ${route.duration} s` : ` at ${speed ?? 1.4} m/s`}`).join(' · '));
            frameId = requestAnimationFrame(tick);
        }).catch((error: Error) => status(`Error: ${error.message}`));

        map.easeTo({ center: [-103.3445, 20.6745], zoom: 19.6, pitch: 58, bearing: 15, duration: 0 });
        return () => {
            controller.abort();
            cancelAnimationFrame(frameId);
            if (map.getLayer(SOURCE)) map.removeLayer(SOURCE);
            if (map.getSource(SOURCE)) map.removeSource(SOURCE);
        };
    },
};
