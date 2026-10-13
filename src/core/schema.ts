import * as z from 'zod/mini';
import {
    AVATAR_VERSION, BUILD_RANGE, DEFAULT_AVATAR, HAIR_STYLES, HEAD_SHAPES, HEIGHT_RANGE,
    type AvatarDefinition, type Range,
} from './definition.js';

const color = (fallback: string) => z.catch(z.string().check(z.regex(/^#[0-9a-fA-F]{6}$/)), fallback);
const range = ({ min, max }: Range, fallback: number) => z.catch(z.number().check(z.gte(min), z.lte(max)), fallback);
const flag = (fallback: boolean) => z.catch(z.boolean(), fallback);

const D = DEFAULT_AVATAR;

const avatarSchema = z.object({
    version: z.catch(z.literal(AVATAR_VERSION), AVATAR_VERSION),
    body: z.catch(z.object({
        height: range(HEIGHT_RANGE, D.body.height),
        build: range(BUILD_RANGE, D.body.build),
        skinTone: color(D.body.skinTone),
    }), D.body),
    head: z.catch(z.object({
        shape: z.catch(z.enum(HEAD_SHAPES), D.head.shape),
    }), D.head),
    hair: z.catch(z.object({
        style: z.catch(z.enum(HAIR_STYLES), D.hair.style),
        color: color(D.hair.color),
    }), D.hair),
    clothes: z.catch(z.object({
        shirt: color(D.clothes.shirt),
        pants: color(D.clothes.pants),
        shoes: color(D.clothes.shoes),
    }), D.clothes),
    accessories: z.catch(z.object({
        glasses: flag(D.accessories.glasses),
        cap: flag(D.accessories.cap),
        capColor: color(D.accessories.capColor),
    }), D.accessories),
});

export const parseAvatar = (input: unknown): AvatarDefinition => {
    const result = avatarSchema.safeParse(input ?? {});
    return result.success ? result.data : structuredClone(DEFAULT_AVATAR);
};
