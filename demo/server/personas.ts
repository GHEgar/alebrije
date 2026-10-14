import { randomAvatar } from '../../src/core/random.js';
import { bearing, destination, type LonLat } from '../../src/geo/lonlat.js';

export const CENTER: LonLat = [-103.3496, 20.6767];

export const seeded = (seed: number): (() => number) => {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

interface Persona {
    id: number;
    center: LonLat;
    radius: number;
    speed: number;
    phase: number;
    avatar: string;
}

const random = seeded(19);

const PERSONAS: Persona[] = Array.from({ length: 8 }, (_, id) => ({
    id,
    center: destination(CENTER, random() * 360, 15 + random() * 45),
    radius: 6 + random() * 18,
    speed: id === 0 ? 0 : 1 + random() * 0.6,
    phase: random() * Math.PI * 2,
    avatar: JSON.stringify(randomAvatar(random)),
}));

const positionAt = (persona: Persona, seconds: number): LonLat => {
    const angle = persona.phase + (persona.speed / persona.radius) * seconds;
    return destination(persona.center, (angle * 180) / Math.PI, persona.radius);
};

export const personasCollection = (now: number): unknown => {
    const seconds = now / 1000;
    return {
        type: 'FeatureCollection',
        features: PERSONAS.map((persona) => {
            const here = positionAt(persona, seconds);
            const ahead = positionAt(persona, seconds + 0.5);
            return {
                type: 'Feature',
                id: `people.${persona.id}`,
                geometry: { type: 'Point', coordinates: [...here] },
                properties: {
                    name: `Person ${persona.id + 1}`,
                    avatar: persona.avatar,
                    heading: persona.speed ? bearing(here, ahead) : 200,
                    state: persona.speed ? 'walk' : 'idle',
                },
            };
        }),
    };
};
