import { randomAvatar } from '../../src/core/random.js';
import { destination, type LonLat } from '../../src/geo/lonlat.js';
import { seeded } from './personas.js';

export const RUTAS_CENTER: LonLat = [-103.3445, 20.6745];

const random = seeded(51);

const polygon = (center: LonLat, radius: number, sides: number, rotation: number): number[][] => {
    const ring = Array.from({ length: sides }, (_, i) => [...destination(center, rotation + (360 / sides) * i, radius)]);
    return [...ring, ring[0] as number[]];
};

const ROUTES = [
    { coordinates: polygon(destination(RUTAS_CENTER, 300, 40), 35, 4, 45), speed: 1.3 },
    { coordinates: polygon(destination(RUTAS_CENTER, 60, 45), 28, 6, 0), speed: 1.7 },
    { coordinates: polygon(destination(RUTAS_CENTER, 180, 30), 45, 3, 10), speed: 2.6 },
    {
        coordinates: [
            [...destination(RUTAS_CENTER, 250, 70)],
            [...destination(RUTAS_CENTER, 200, 20)],
            [...destination(RUTAS_CENTER, 200, 20)],
            [...destination(RUTAS_CENTER, 120, 60)],
        ],
        times: [0, 40, 52, 95],
    },
];

const AVATARS = ROUTES.map(() => JSON.stringify(randomAvatar(random)));

export const rutasCollection = (): unknown => ({
    type: 'FeatureCollection',
    features: ROUTES.map((route, id) => ({
        type: 'Feature',
        id: `routes.${id}`,
        geometry: { type: 'LineString', coordinates: route.coordinates },
        properties: {
            name: `Route ${id + 1}`,
            avatar: AVATARS[id],
            ...('speed' in route ? { speed: route.speed } : {}),
            ...('times' in route ? { times: JSON.stringify(route.times) } : {}),
        },
    })),
});
