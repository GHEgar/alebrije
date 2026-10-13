import { DEFAULT_AVATAR } from 'alebrije';
import { avatarsFromFeatures, fetchFeatures } from 'alebrije/geoserver';
import type { Mode } from './mode';

const REFRESH = 1000;

export const personas: Mode = {
    title: 'Personas (WFS)',
    hint: 'Cada punto de la capa demo:personas es un avatar con su definición, rumbo y estado.',
    start({ layer, map, status }) {
        let alive = true;
        const controller = new AbortController();
        const load = async (): Promise<void> => {
            try {
                const collection = await fetchFeatures({ url: '/geoserver/ows', typeName: 'demo:personas', signal: controller.signal });
                if (!alive) return;
                layer.setAvatars(avatarsFromFeatures(collection, {
                    definition: 'avatar', heading: 'rumbo', clip: 'estado', fallbackDefinition: DEFAULT_AVATAR,
                }));
                status(`${collection.features.length} personas · GetFeature cada ${REFRESH / 1000} s`);
            } catch (error) {
                if (alive) status(`Error: ${(error as Error).message}`);
            }
        };
        void load();
        const timer = setInterval(() => void load(), REFRESH);
        map.easeTo({ center: [-103.3493, 20.6769], zoom: 20.6, pitch: 62, bearing: -20, duration: 0 });
        return () => {
            alive = false;
            controller.abort();
            clearInterval(timer);
            layer.setAvatars([]);
        };
    },
};
