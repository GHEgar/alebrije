import { IDLE_CLIP, WALK_CLIP, type ClipName } from '../core/animations.js';
import type { Ground } from './ground.js';
import { bearing, distance, interpolate, type LonLat } from './lonlat.js';
import type { AvatarState } from './state.js';
import { WALK_STRIDE } from './walker.js';

export type Coordinate = readonly number[];

export interface RoutePoint {
    position: LonLat;
    altitude: number | null;
    heading: number;
    distance: number;
    progress: number;
}

export interface Route {
    readonly length: number;
    readonly duration: number | null;
    at(distance: number): RoutePoint;
    atTime(seconds: number): RoutePoint;
}

export interface RouteOptions {
    times?: readonly number[] | null;
}

const searchSegment = (values: readonly number[], value: number): number => {
    let low = 0;
    let high = values.length - 2;
    while (low < high) {
        const mid = Math.ceil((low + high) / 2);
        if ((values[mid] ?? 0) <= value) low = mid;
        else high = mid - 1;
    }
    return Math.max(0, low);
};

const validTimes = (times: readonly number[] | null | undefined, count: number): number[] | null => {
    if (!times || times.length !== count || count < 2) return null;
    const start = times[0] ?? 0;
    const relative = times.map((time) => time - start);
    const ordered = relative.every((time, i) => Number.isFinite(time) && (i === 0 || time >= (relative[i - 1] ?? 0)));
    return ordered && (relative[relative.length - 1] ?? 0) > 0 ? relative : null;
};

export const createRoute = (coordinates: readonly Coordinate[], options: RouteOptions = {}): Route => {
    const points: LonLat[] = coordinates.map(([lon = 0, lat = 0]) => [lon, lat]);
    if (points.length === 0) throw new Error('alebrije: a route needs at least one coordinate');
    const altitudes = coordinates.map((coordinate) => (typeof coordinate[2] === 'number' ? coordinate[2] : null));
    const cumulative = [0];
    const headings: number[] = [];
    let lastHeading = 0;
    for (let i = 1; i < points.length; i += 1) {
        const a = points[i - 1] as LonLat;
        const b = points[i] as LonLat;
        const step = distance(a, b);
        cumulative.push((cumulative[i - 1] ?? 0) + step);
        if (step > 1e-6) lastHeading = bearing(a, b);
        headings.push(lastHeading);
    }
    const firstHeading = headings.find((_, i) => (cumulative[i + 1] ?? 0) > (cumulative[i] ?? 0));
    const length = cumulative[cumulative.length - 1] ?? 0;
    const times = validTimes(options.times, points.length);

    const single = (): RoutePoint => ({ position: points[0] as LonLat, altitude: altitudes[0] ?? null, heading: 0, distance: 0, progress: 1 });

    const pointOn = (i: number, t: number): RoutePoint => {
        const start = cumulative[i] ?? 0;
        const span = (cumulative[i + 1] ?? start) - start;
        const za = altitudes[i] ?? null;
        const zb = altitudes[i + 1] ?? null;
        const moved = (cumulative[i + 1] ?? 0) > 0;
        const d = start + span * t;
        return {
            position: interpolate(points[i] as LonLat, points[i + 1] as LonLat, t),
            altitude: za !== null && zb !== null ? za + (zb - za) * t : za ?? zb,
            heading: moved ? (headings[i] ?? 0) : (firstHeading ?? 0),
            distance: d,
            progress: length > 0 ? d / length : 1,
        };
    };

    const at = (target: number): RoutePoint => {
        if (points.length === 1) return single();
        const d = Math.min(Math.max(target, 0), length);
        const i = searchSegment(cumulative, d);
        const start = cumulative[i] ?? 0;
        const span = (cumulative[i + 1] ?? start) - start;
        return pointOn(i, span > 0 ? (d - start) / span : 0);
    };

    return {
        length,
        duration: times ? (times[times.length - 1] ?? 0) : null,
        at,
        atTime(seconds) {
            if (!times || points.length === 1) return at(seconds * WALK_STRIDE);
            const s = Math.min(Math.max(seconds, 0), times[times.length - 1] ?? 0);
            const i = searchSegment(times, s);
            const t0 = times[i] ?? 0;
            const t1 = times[i + 1] ?? t0;
            const local = t1 > t0 ? (s - t0) / (t1 - t0) : 0;
            return pointOn(i, local);
        },
    };
};

export interface RoutePlayerOptions {
    speed?: number;
    loop?: boolean;
    start?: number;
    useTimes?: boolean;
    ground?: Ground;
}

export interface RouteState extends RoutePoint {
    clip: ClipName;
    speed: number;
    done: boolean;
}

export interface RoutePlayer {
    advance(delta: number): RouteState;
    state(): RouteState;
    avatar(id: string, definition: unknown): AvatarState;
    seek(seconds: number): void;
}

export const createRoutePlayer = (route: Route, options: RoutePlayerOptions = {}): RoutePlayer => {
    const speed = options.speed ?? WALK_STRIDE;
    const timed = options.useTimes !== false && route.duration !== null;
    const total = timed ? (route.duration ?? 0) : route.length / speed;
    let elapsed = options.start ?? 0;
    let current: RouteState | null = null;

    const compute = (delta: number): RouteState => {
        if (options.loop && total > 0) elapsed %= total;
        const before = current?.distance ?? 0;
        const point = timed ? route.atTime(elapsed) : route.at(elapsed * speed);
        const done = !options.loop && elapsed >= total;
        const wrapped = point.distance < before;
        const velocity = delta > 0 && !wrapped ? (point.distance - before) / delta : current?.speed ?? 0;
        const moving = !done && (timed ? velocity > 0.05 : route.length > 0);
        const altitude = point.altitude ?? options.ground?.height(point.position) ?? current?.altitude ?? null;
        void options.ground?.update(point.position).catch(() => undefined);
        return { ...point, altitude, clip: moving ? WALK_CLIP : IDLE_CLIP, speed: moving ? (timed ? velocity : speed) : 0, done };
    };

    let state = compute(0);
    current = state;

    return {
        advance(delta) {
            elapsed += delta;
            state = compute(delta);
            current = state;
            return state;
        },
        state: () => state,
        avatar(id, definition) {
            const avatar: AvatarState = {
                id,
                definition,
                position: state.position,
                heading: state.heading,
                clip: state.clip,
                timeScale: state.speed > 0 ? state.speed / WALK_STRIDE : 1,
            };
            if (state.altitude !== null) avatar.altitude = state.altitude;
            return avatar;
        },
        seek(seconds) {
            elapsed = seconds;
            current = null;
            state = compute(0);
            current = state;
        },
    };
};
