import { createRoute, type Coordinate, type Route } from '../geo/route.js';
import { readDefinition } from './avatars.js';
import type { GeoJsonCollection, GeoJsonFeature } from './wfs.js';

type Properties = Record<string, unknown>;
type Field<T> = string | ((properties: Properties, feature: GeoJsonFeature) => T);

export interface RouteFeatureOptions {
    id?: Field<string | number | null | undefined>;
    definition?: Field<unknown>;
    fallbackDefinition?: unknown;
    speed?: Field<unknown>;
    times?: Field<unknown>;
}

export interface FeatureRoute {
    id: string;
    definition: unknown;
    route: Route;
    speed?: number;
    properties: Properties;
}

const read = <T>(field: Field<T> | undefined, properties: Properties, feature: GeoJsonFeature): unknown => {
    if (field === undefined) return undefined;
    return typeof field === 'function' ? field(properties, feature) : properties[field];
};

const isCoordinate = (value: unknown): value is Coordinate => (
    Array.isArray(value) && value.length >= 2 && value.every((n) => typeof n === 'number' && Number.isFinite(n))
);

const lineOf = (feature: GeoJsonFeature): Coordinate[] | null => {
    const geometry = feature.geometry;
    if (!geometry || !Array.isArray(geometry.coordinates)) return null;
    const parts = geometry.type === 'LineString'
        ? [geometry.coordinates]
        : geometry.type === 'MultiLineString' ? geometry.coordinates : [];
    const line = (parts as unknown[]).flatMap((part) => (Array.isArray(part) ? part.filter(isCoordinate) : []));
    return line.length >= 2 ? line : null;
};

export const parseTimes = (value: unknown): number[] | null => {
    const list = typeof value === 'string' ? readDefinition(value) ?? value.split(',') : value;
    if (!Array.isArray(list)) return null;
    const seconds = list.map((item) => {
        if (typeof item === 'number') return item;
        if (typeof item !== 'string') return Number.NaN;
        const trimmed = item.trim();
        return /^-?\d+(\.\d+)?$/.test(trimmed) ? Number(trimmed) : Date.parse(trimmed) / 1000;
    });
    return seconds.every(Number.isFinite) ? seconds : null;
};

const toNumber = (value: unknown): number | null => {
    const number = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
    return typeof number === 'number' && Number.isFinite(number) && number > 0 ? number : null;
};

export const routesFromFeatures = (collection: GeoJsonCollection, options: RouteFeatureOptions = {}): FeatureRoute[] => (
    collection.features.flatMap((feature, index) => {
        const line = lineOf(feature);
        if (!line) return [];
        const properties = feature.properties ?? {};
        const result: FeatureRoute = {
            id: String(read(options.id, properties, feature) ?? feature.id ?? index),
            definition: readDefinition(read(options.definition, properties, feature)) ?? options.fallbackDefinition,
            route: createRoute(line, { times: parseTimes(read(options.times, properties, feature)) }),
            properties,
        };
        const speed = toNumber(read(options.speed, properties, feature));
        if (speed !== null) result.speed = speed;
        return [result];
    })
);
