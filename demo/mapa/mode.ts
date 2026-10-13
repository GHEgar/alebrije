import type { Map as MapLibreMap } from 'maplibre-gl';
import type { AvatarLayer, AvatarLayerOptions } from 'alebrije/maplibre';

export interface ModeContext {
    map: MapLibreMap;
    createLayer: (options: Omit<AvatarLayerOptions, 'id'>) => AvatarLayer;
    status: (text: string) => void;
}

export interface Mode {
    title: string;
    hint: string;
    start(context: ModeContext): () => void;
}
