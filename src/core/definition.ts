export const AVATAR_VERSION = 1;

export interface Range {
    readonly min: number;
    readonly max: number;
    readonly step: number;
}

export const HEIGHT_RANGE: Range = { min: 1.4, max: 2.0, step: 0.01 };
export const BUILD_RANGE: Range = { min: 0, max: 1, step: 0.05 };

export const HEAD_SHAPES = ['round', 'oval', 'square'] as const;
export const HAIR_STYLES = ['none', 'short', 'long', 'bun'] as const;

export type HeadShape = typeof HEAD_SHAPES[number];
export type HairStyle = typeof HAIR_STYLES[number];

export const SKIN_TONES = ['#F5D5BC', '#E8B892', '#D29A6E', '#B07548', '#8A5530', '#5E3A22'] as const;
export const HAIR_COLORS = ['#1E1A17', '#4A2F1E', '#8B5A2B', '#D8B26E', '#A33A1F', '#B9B6B0'] as const;
export const CLOTH_COLORS = ['#6B4FA0', '#1F4E79', '#2E7D4F', '#C0392B', '#F2B705', '#ECECEC', '#2B2B2B', '#7A8A99'] as const;

export interface AvatarDefinition {
    version: typeof AVATAR_VERSION;
    body: {
        height: number;
        build: number;
        skinTone: string;
    };
    head: {
        shape: HeadShape;
    };
    hair: {
        style: HairStyle;
        color: string;
    };
    clothes: {
        shirt: string;
        pants: string;
        shoes: string;
    };
    accessories: {
        glasses: boolean;
        cap: boolean;
        capColor: string;
    };
}

export const DEFAULT_AVATAR: AvatarDefinition = {
    version: AVATAR_VERSION,
    body: {
        height: 1.7,
        build: 0.5,
        skinTone: '#D29A6E',
    },
    head: {
        shape: 'round',
    },
    hair: {
        style: 'short',
        color: '#1E1A17',
    },
    clothes: {
        shirt: '#2E7D4F',
        pants: '#1F4E79',
        shoes: '#2B2B2B',
    },
    accessories: {
        glasses: false,
        cap: false,
        capColor: '#F2B705',
    },
};
