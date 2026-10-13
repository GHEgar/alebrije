import type { ClipName } from '../core/animations.js';
import type { LonLat } from './lonlat.js';

export interface AvatarState {
    id: string;
    definition: unknown;
    position: LonLat;
    altitude?: number;
    heading: number;
    clip?: ClipName;
    timeScale?: number;
}
