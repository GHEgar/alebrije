export const AVATAR_VERSION = 1;

export const HEIGHT_RANGE = { min: 1.4, max: 2.0, step: 0.01 };
export const BUILD_RANGE = { min: 0, max: 1, step: 0.05 };

export const HEAD_SHAPES = [
    { value: 'round', label: 'Redonda' },
    { value: 'oval', label: 'Ovalada' },
    { value: 'square', label: 'Cuadrada' },
];

export const HAIR_STYLES = [
    { value: 'none', label: 'Sin cabello' },
    { value: 'short', label: 'Corto' },
    { value: 'long', label: 'Largo' },
    { value: 'bun', label: 'Chongo' },
];

export const SKIN_TONES = ['#F5D5BC', '#E8B892', '#D29A6E', '#B07548', '#8A5530', '#5E3A22'];
export const HAIR_COLORS = ['#1E1A17', '#4A2F1E', '#8B5A2B', '#D8B26E', '#A33A1F', '#B9B6B0'];
export const CLOTH_COLORS = ['#5C2472', '#1F4E79', '#2E7D4F', '#C0392B', '#F2B705', '#ECECEC', '#2B2B2B', '#7A8A99'];

export const DEFAULT_AVATAR = {
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
        shirt: '#5C2472',
        pants: '#1F4E79',
        shoes: '#2B2B2B',
    },
    accessories: {
        glasses: false,
        cap: false,
        capColor: '#F2B705',
    },
};
