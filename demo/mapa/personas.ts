import { DEFAULT_AVATAR } from 'alebrije';
import { avatarsFromFeatures, fetchFeatures } from 'alebrije/geoserver';
import type { Mode } from './mode';

const REFRESH = 1000;

export const personas: Mode = {
    title: 'People (WFS)',
    hint: 'Each point of the demo:people layer is an avatar with its definition, heading and state.',
    start({ createLayer, map, status }) {
        const layer = createLayer({ origin: [-103.3496, 20.6767], smoothing: 0.35 });
        let alive = true;
        const controller = new AbortController();
        const load = async (): Promise<void> => {
            try {
                const collection = await fetchFeatures({ url: '/geoserver/ows', typeName: 'demo:people', signal: controller.signal });
                if (!alive) return;
                layer.setAvatars(avatarsFromFeatures(collection, {
                    definition: 'avatar', heading: 'heading', clip: 'state', fallbackDefinition: DEFAULT_AVATAR,
                }));
                status(`${collection.features.length} people · GetFeature every ${REFRESH / 1000} s`);
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
        };
    },
};
