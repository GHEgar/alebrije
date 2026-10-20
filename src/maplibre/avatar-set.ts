import { Group, Vector3 } from 'three';
import { IDLE_CLIP } from '../core/animations.js';
import { createAvatarPlayer, type AvatarPlayer } from '../core/player.js';
import { parseAvatar } from '../core/schema.js';
import type { LocalFrame } from '../geo/frame.js';
import type { LonLat } from '../geo/lonlat.js';
import type { AvatarState } from '../geo/state.js';

const RAD = Math.PI / 180;
const REST_DISTANCE = 1e-3;
const REST_TURN = 1e-4;

export type Ground = (position: LonLat) => number | null | undefined;

interface Entry {
    key: string;
    holder: Group;
    player: AvatarPlayer;
    target: Vector3;
    heading: number;
    position: LonLat;
    altitude: number | undefined;
}

export interface AvatarSetOptions {
    smoothing?: number;
    scale?: number;
}

export interface AvatarSet {
    readonly group: Group;
    set(states: readonly AvatarState[], frame: LocalFrame, ground?: Ground): void;
    reground(frame: LocalFrame, ground: Ground): boolean;
    get(id: string): AvatarPlayer | undefined;
    ids(): string[];
    update(delta: number): boolean;
    dispose(): void;
}

const zUp = (player: AvatarPlayer): Group => {
    player.model.rotation.x = Math.PI / 2;
    const turn = new Group();
    turn.rotation.z = Math.PI;
    turn.add(player.model);
    const holder = new Group();
    holder.add(turn);
    return holder;
};

export const createAvatarSet = ({ smoothing = 0, scale = 1 }: AvatarSetOptions = {}): AvatarSet => {
    const group = new Group();
    group.name = 'alebrije-avatars';
    const entries = new Map<string, Entry>();

    const remove = (id: string): void => {
        const entry = entries.get(id);
        if (!entry) return;
        entry.player.dispose();
        entry.holder.removeFromParent();
        entries.delete(id);
    };

    const aim = (entry: Entry, frame: LocalFrame, ground: Ground | undefined): void => {
        entry.target.set(...frame.toLocal(entry.position, entry.altitude ?? ground?.(entry.position) ?? 0));
    };

    const snap = (entry: Entry): void => {
        entry.holder.position.copy(entry.target);
        entry.holder.rotation.z = entry.heading;
    };

    const place = (entry: Entry, state: AvatarState, frame: LocalFrame, fresh: boolean, ground: Ground | undefined): void => {
        entry.position = state.position;
        entry.altitude = state.altitude;
        aim(entry, frame, ground);
        entry.heading = -state.heading * RAD;
        if (fresh || smoothing <= 0) snap(entry);
        entry.player.play(state.clip ?? IDLE_CLIP);
        entry.player.setTimeScale(state.timeScale ?? 1);
    };

    return {
        group,
        set(states, frame, ground) {
            const seen = new Set<string>();
            states.forEach((state) => {
                seen.add(state.id);
                const key = JSON.stringify(parseAvatar(state.definition));
                let entry = entries.get(state.id);
                if (entry && entry.key !== key) {
                    remove(state.id);
                    entry = undefined;
                }
                const fresh = !entry;
                if (!entry) {
                    const player = createAvatarPlayer(state.definition, { clip: state.clip ?? IDLE_CLIP });
                    entry = { key, holder: zUp(player), player, target: new Vector3(), heading: 0, position: state.position, altitude: undefined };
                    entry.holder.name = state.id;
                    entry.holder.scale.setScalar(scale);
                    group.add(entry.holder);
                    entries.set(state.id, entry);
                }
                place(entry, state, frame, fresh, ground);
            });
            [...entries.keys()].filter((id) => !seen.has(id)).forEach(remove);
        },
        reground(frame, ground) {
            let moved = false;
            entries.forEach((entry) => {
                if (entry.altitude !== undefined) return;
                const before = entry.target.z;
                aim(entry, frame, ground);
                if (Math.abs(entry.target.z - before) < REST_DISTANCE) return;
                moved = true;
                if (smoothing <= 0) snap(entry);
            });
            return moved;
        },
        get: (id) => entries.get(id)?.player,
        ids: () => [...entries.keys()],
        update(delta) {
            const t = smoothing > 0 ? 1 - Math.exp(-delta / smoothing) : 1;
            let active = false;
            entries.forEach((entry) => {
                entry.holder.position.lerp(entry.target, t);
                const turn = Math.atan2(Math.sin(entry.heading - entry.holder.rotation.z), Math.cos(entry.heading - entry.holder.rotation.z));
                entry.holder.rotation.z += turn * t;
                const resting = entry.holder.position.distanceTo(entry.target) < REST_DISTANCE && Math.abs(turn * (1 - t)) < REST_TURN;
                if (resting) snap(entry);
                entry.player.update(delta);
                if (!resting || entry.player.clip() !== IDLE_CLIP || entry.player.fading()) active = true;
            });
            return active;
        },
        dispose() {
            [...entries.keys()].forEach(remove);
        },
    };
};
