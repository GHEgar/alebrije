import { CLIPS } from '../core/player.js';
import type { ClipName } from '../core/animations.js';
import type { AvatarState } from '../geo/state.js';
import type { GeoJsonCollection, GeoJsonFeature } from './wfs.js';

type Properties = Record<string, unknown>;
type Field<T> = string | ((properties: Properties, feature: GeoJsonFeature) => T);

export interface AvatarFeatureOptions {
    id?: Field<string | number | null | undefined>;
    definition?: Field<unknown>;
    fallbackDefinition?: unknown;
    heading?: Field<unknown>;
    clip?: Field<unknown>;
    altitude?: Field<unknown>;
}

const read = <T>(field: Field<T> | undefined, properties: Properties, feature: GeoJsonFeature): unknown => {
    if (field === undefined) return undefined;
    return typeof field === 'function' ? field(properties, feature) : properties[field];
};

export const readDefinition = (value: unknown): unknown => {
    if (typeof value !== 'string') return value;
    try {
        return JSON.parse(value);
    } catch {
        return undefined;
    }
};

const toNumber = (value: unknown): number | null => {
    const number = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
    return typeof number === 'number' && Number.isFinite(number) ? number : null;
};

const toClip = (value: unknown): ClipName | undefined => (CLIPS.includes(value as ClipName) ? value as ClipName : undefined);

const pointOf = (feature: GeoJsonFeature): number[] | null => {
    const geometry = feature.geometry;
    if (geometry?.type !== 'Point' && geometry?.type !== 'MultiPoint') return null;
    const coordinates = geometry.type === 'MultiPoint' && Array.isArray(geometry.coordinates)
        ? geometry.coordinates[0]
        : geometry.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) return null;
    return coordinates.every((value) => typeof value === 'number' && Number.isFinite(value)) ? coordinates as number[] : null;
};

export const avatarsFromFeatures = (collection: GeoJsonCollection, options: AvatarFeatureOptions = {}): AvatarState[] => (
    collection.features.flatMap((feature, index) => {
        const point = pointOf(feature);
        if (!point) return [];
        const properties = feature.properties ?? {};
        const id = read(options.id, properties, feature) ?? feature.id ?? index;
        const definition = readDefinition(read(options.definition, properties, feature)) ?? options.fallbackDefinition;
        const altitude = toNumber(read(options.altitude, properties, feature)) ?? point[2];
        const clip = toClip(read(options.clip, properties, feature));
        const state: AvatarState = {
            id: String(id),
            definition,
            position: [point[0] as number, point[1] as number],
            heading: toNumber(read(options.heading, properties, feature)) ?? 0,
        };
        if (altitude !== undefined) state.altitude = altitude;
        if (clip) state.clip = clip;
        return [state];
    })
);
