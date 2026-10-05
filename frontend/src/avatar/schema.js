import { z } from 'zod';
import {
    AVATAR_VERSION, BUILD_RANGE, DEFAULT_AVATAR, HAIR_STYLES, HEAD_SHAPES, HEIGHT_RANGE,
} from './definition.js';

const color = (fallback) => z.string().regex(/^#[0-9a-fA-F]{6}$/).catch(fallback);
const range = ({ min, max }, fallback) => z.number().min(min).max(max).catch(fallback);
const oneOf = (options, fallback) => z.enum(options.map((option) => option.value)).catch(fallback);
const flag = (fallback) => z.boolean().catch(fallback);

const D = DEFAULT_AVATAR;

const avatarSchema = z.object({
    version: z.literal(AVATAR_VERSION).catch(AVATAR_VERSION),
    body: z.object({
        height: range(HEIGHT_RANGE, D.body.height),
        build: range(BUILD_RANGE, D.body.build),
        skinTone: color(D.body.skinTone),
    }).catch(D.body),
    head: z.object({
        shape: oneOf(HEAD_SHAPES, D.head.shape),
    }).catch(D.head),
    hair: z.object({
        style: oneOf(HAIR_STYLES, D.hair.style),
        color: color(D.hair.color),
    }).catch(D.hair),
    clothes: z.object({
        shirt: color(D.clothes.shirt),
        pants: color(D.clothes.pants),
        shoes: color(D.clothes.shoes),
    }).catch(D.clothes),
    accessories: z.object({
        glasses: flag(D.accessories.glasses),
        cap: flag(D.accessories.cap),
        capColor: color(D.accessories.capColor),
    }).catch(D.accessories),
});

export const normalizeAvatar = (input) => {
    const result = avatarSchema.safeParse(input ?? {});
    return result.success ? result.data : structuredClone(DEFAULT_AVATAR);
};
