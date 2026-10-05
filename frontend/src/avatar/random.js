import {
    AVATAR_VERSION, BUILD_RANGE, CLOTH_COLORS, HAIR_COLORS, HAIR_STYLES, HEAD_SHAPES, HEIGHT_RANGE,
    SKIN_TONES,
} from './definition.js';

const pick = (list) => list[Math.floor(Math.random() * list.length)];

const between = ({ min, max, step }) => {
    const steps = Math.round((max - min) / step);
    return Number((min + Math.round(Math.random() * steps) * step).toFixed(2));
};

const realisticHeight = () => {
    const value = between({ ...HEIGHT_RANGE, min: 1.5, max: 1.9 });
    return Math.min(Math.max(value, HEIGHT_RANGE.min), HEIGHT_RANGE.max);
};

export const randomAvatar = () => {
    const shirt = pick(CLOTH_COLORS);
    const pants = pick(CLOTH_COLORS.filter((value) => value !== shirt));
    return {
        version: AVATAR_VERSION,
        body: {
            height: realisticHeight(),
            build: between(BUILD_RANGE),
            skinTone: pick(SKIN_TONES),
        },
        head: { shape: pick(HEAD_SHAPES).value },
        hair: { style: pick(HAIR_STYLES).value, color: pick(HAIR_COLORS) },
        clothes: { shirt, pants, shoes: pick(CLOTH_COLORS) },
        accessories: {
            glasses: Math.random() < 0.35,
            cap: Math.random() < 0.25,
            capColor: pick(CLOTH_COLORS),
        },
    };
};
