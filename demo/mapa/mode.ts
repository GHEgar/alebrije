import type { Map as MapLibreMap } from 'maplibre-gl';
import type { AvatarLayer } from 'alebrije/maplibre';

export interface ModeContext {
    map: MapLibreMap;
    layer: AvatarLayer;
    status: (text: string) => void;
}

export interface Mode {
    title: string;
    hint: string;
    start(context: ModeContext): () => void;
}
