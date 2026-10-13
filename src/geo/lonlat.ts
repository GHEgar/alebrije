export type LonLat = readonly [number, number];

export const EARTH_RADIUS = 6_371_008.8;
const EARTH_CIRCUMFERENCE = 2 * Math.PI * EARTH_RADIUS;
const RAD = Math.PI / 180;
const MAX_LAT = 85.051129;

export const distance = ([lon1, lat1]: LonLat, [lon2, lat2]: LonLat): number => {
    const dLat = (lat2 - lat1) * RAD;
    const dLon = (lon2 - lon1) * RAD;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLon / 2) ** 2;
    return 2 * EARTH_RADIUS * Math.asin(Math.min(1, Math.sqrt(a)));
};

export const bearing = ([lon1, lat1]: LonLat, [lon2, lat2]: LonLat): number => {
    const phi1 = lat1 * RAD;
    const phi2 = lat2 * RAD;
    const dLon = (lon2 - lon1) * RAD;
    const y = Math.sin(dLon) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLon);
    return (Math.atan2(y, x) / RAD + 360) % 360;
};

export const destination = ([lon, lat]: LonLat, heading: number, meters: number): LonLat => {
    const delta = meters / EARTH_RADIUS;
    const theta = heading * RAD;
    const phi1 = lat * RAD;
    const phi2 = Math.asin(Math.sin(phi1) * Math.cos(delta) + Math.cos(phi1) * Math.sin(delta) * Math.cos(theta));
    const lambda = lon * RAD + Math.atan2(
        Math.sin(theta) * Math.sin(delta) * Math.cos(phi1),
        Math.cos(delta) - Math.sin(phi1) * Math.sin(phi2),
    );
    return [((lambda / RAD + 540) % 360) - 180, phi2 / RAD];
};

export const interpolate = ([lon1, lat1]: LonLat, [lon2, lat2]: LonLat, t: number): LonLat => [
    lon1 + (lon2 - lon1) * t,
    lat1 + (lat2 - lat1) * t,
];

export interface Mercator {
    x: number;
    y: number;
    z: number;
}

export const toMercator = ([lon, lat]: LonLat, altitude = 0): Mercator => {
    const clamped = Math.max(-MAX_LAT, Math.min(MAX_LAT, lat));
    return {
        x: (180 + lon) / 360,
        y: (180 - (180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + (clamped * Math.PI) / 360))) / 360,
        z: altitude / (EARTH_CIRCUMFERENCE * Math.cos(clamped * RAD)),
    };
};

export const meterScale = ([, lat]: LonLat): number => 1 / EARTH_CIRCUMFERENCE / Math.cos(lat * RAD);

export const fromMercator = ({ x, y }: Pick<Mercator, 'x' | 'y'>): LonLat => {
    const y2 = 180 - y * 360;
    return [x * 360 - 180, (360 / Math.PI) * Math.atan(Math.exp((y2 * Math.PI) / 180)) - 90];
};
