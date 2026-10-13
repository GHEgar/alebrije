import {
    AVATAR_VERSION, BUILD_RANGE, CLOTH_COLORS, HAIR_COLORS, HAIR_STYLES, HEAD_SHAPES, HEIGHT_RANGE,
    SKIN_TONES, type AvatarDefinition, type Range,
} from './definition.js';

export type RandomSource = () => number;

const pick = <T>(list: readonly T[], random: RandomSource): T => list[Math.floor(random() * list.length)] as T;

const between = ({ min, max, step }: Range, random: RandomSource): number => {
    const steps = Math.round((max - min) / step);
    return Number((min + Math.round(random() * steps) * step).toFixed(2));
};

const realisticHeight = (random: RandomSource): number => {
    const value = between({ ...HEIGHT_RANGE, min: 1.5, max: 1.9 }, random);
    return Math.min(Math.max(value, HEIGHT_RANGE.min), HEIGHT_RANGE.max);
};

export const randomAvatar = (random: RandomSource = Math.random): AvatarDefinition => {
    const shirt = pick(CLOTH_COLORS, random);
    const pants = pick(CLOTH_COLORS.filter((value) => value !== shirt), random);
    return {
        version: AVATAR_VERSION,
        body: {
            height: realisticHeight(random),
            build: between(BUILD_RANGE, random),
            skinTone: pick(SKIN_TONES, random),
        },
        head: { shape: pick(HEAD_SHAPES, random) },
        hair: { style: pick(HAIR_STYLES, random), color: pick(HAIR_COLORS, random) },
        clothes: { shirt, pants, shoes: pick(CLOTH_COLORS, random) },
        accessories: {
            glasses: random() < 0.35,
            cap: random() < 0.25,
            capColor: pick(CLOTH_COLORS, random),
        },
    };
};
