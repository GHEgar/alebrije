import { IDLE_CLIP, WALK_CLIP, type ClipName } from '../core/animations.js';
import type { Ground } from './ground.js';
import { destination, distance, type LonLat } from './lonlat.js';
import type { AvatarState } from './state.js';

export const WALK_STRIDE = 1.4;

export interface WalkerOptions {
    position: LonLat;
    heading?: number;
    altitude?: number;
    speed?: number;
    runFactor?: number;
    turnRate?: number;
    maxSlope?: number;
    ground?: Ground;
}

export interface WalkInput {
    forward?: number;
    turn?: number;
    run?: boolean;
}

export interface WalkerState {
    position: LonLat;
    altitude: number;
    heading: number;
    speed: number;
    clip: ClipName;
}

export interface Walker {
    step(delta: number, input: WalkInput): WalkerState;
    state(): WalkerState;
    avatar(id: string, definition: unknown): AvatarState;
    teleport(position: LonLat, heading?: number): void;
}

const clamp = (value: number): number => Math.max(-1, Math.min(1, value));

export const createWalker = (options: WalkerOptions): Walker => {
    const speed = options.speed ?? WALK_STRIDE;
    const runFactor = options.runFactor ?? 2.2;
    const turnRate = options.turnRate ?? 110;
    const maxSlope = Math.tan(((options.maxSlope ?? 40) * Math.PI) / 180);
    let state: WalkerState = {
        position: options.position,
        altitude: options.altitude ?? options.ground?.height(options.position) ?? 0,
        heading: options.heading ?? 0,
        speed: 0,
        clip: IDLE_CLIP,
    };
    void options.ground?.update(options.position).catch(() => undefined);

    const groundAt = (position: LonLat): number => options.ground?.height(position) ?? state.altitude;

    return {
        step(delta, { forward = 0, turn = 0, run = false }) {
            const heading = (state.heading + clamp(turn) * turnRate * delta + 360) % 360;
            const velocity = clamp(forward) * speed * (run ? runFactor : 1);
            let position = state.position;
            let altitude = groundAt(position);
            if (velocity !== 0 && delta > 0) {
                const next = destination(position, velocity > 0 ? heading : (heading + 180) % 360, Math.abs(velocity) * delta);
                const rise = groundAt(next) - altitude;
                const along = distance(position, next);
                if (along > 0 && rise / along <= maxSlope) {
                    position = next;
                    altitude = groundAt(next);
                }
            }
            const moved = position !== state.position;
            state = { position, altitude, heading, speed: moved ? velocity : 0, clip: moved ? WALK_CLIP : IDLE_CLIP };
            void options.ground?.update(position).catch(() => undefined);
            return state;
        },
        state: () => state,
        avatar(id, definition) {
            return {
                id,
                definition,
                position: state.position,
                altitude: state.altitude,
                heading: state.heading,
                clip: state.clip,
                timeScale: state.speed !== 0 ? state.speed / WALK_STRIDE : 1,
            };
        },
        teleport(position, heading = state.heading) {
            state = { ...state, position, heading, altitude: groundAt(position) };
            void options.ground?.update(position).catch(() => undefined);
        },
    };
};
