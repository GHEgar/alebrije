import { BoxGeometry, TorusGeometry, type BufferGeometry } from 'three';
import type { AvatarDefinition, HeadShape } from './definition.js';
import { ball, dome, makePart, type PartOptions, type Vec3 } from './parts.js';
import type { Proportions } from './proportions.js';

const EYE_COLOR = '#1E1A17';
const FRAME_COLOR = '#2B2B2B';

interface Shape {
    scale: Vec3;
    front: number;
}

const SHAPES: Record<HeadShape, Shape> = {
    round: { scale: [1, 1.1, 1], front: 0.95 },
    oval: { scale: [0.9, 1.22, 0.95], front: 0.9 },
    square: { scale: [0.98, 1.1, 0.98], front: 0.97 },
};

const skull = (def: AvatarDefinition, p: Proportions, shape: Shape): BufferGeometry => {
    const r = p.headRadius;
    const options: PartOptions = { color: def.body.skinTone, bone: 'head', at: [0, p.headY, 0] };
    if (def.head.shape === 'square') {
        return makePart(new BoxGeometry(r * 1.9, r * 2.2, r * 1.95, 1, 2, 1), options);
    }
    return ball(r, { ...options, scale: shape.scale }, 12, 10);
};

const eyes = (p: Proportions, frontZ: number): BufferGeometry[] => [1, -1].map((sign) => ball(p.headRadius * 0.11, {
    color: EYE_COLOR,
    bone: 'head',
    at: [sign * p.headRadius * 0.36, p.headY + p.headRadius * 0.08, frontZ],
}, 6, 4));

const hairParts = (def: AvatarDefinition, p: Proportions, shape: Shape): BufferGeometry[] => {
    const { style, color } = def.hair;
    if (style === 'none') return [];
    const r = p.headRadius;
    const base = dome(r * 1.08, 0.55, {
        color,
        bone: 'head',
        at: [0, p.headY + r * 0.05, -r * 0.04],
        scale: shape.scale,
        rotation: [-0.45, 0, 0],
    });
    if (style === 'long') {
        const back = makePart(new BoxGeometry(r * 1.85 * shape.scale[0], r * 1.5, r * 0.4), {
            color,
            bone: 'head',
            at: [0, p.headY - r * 0.4, -r * 0.78],
        });
        return [base, back];
    }
    if (style === 'bun') {
        return [base, ball(r * 0.42, { color, bone: 'head', at: [0, p.headY + r * 0.85, -r * 0.7] }, 8, 6)];
    }
    return [base];
};

const glasses = (p: Proportions, frontZ: number): BufferGeometry[] => {
    const r = p.headRadius;
    const y = p.headY + r * 0.08;
    const z = frontZ + r * 0.06;
    const lenses = [1, -1].map((sign) => makePart(new TorusGeometry(r * 0.22, r * 0.04, 4, 12), {
        color: FRAME_COLOR,
        bone: 'head',
        at: [sign * r * 0.38, y, z],
    }));
    const bridge = makePart(new BoxGeometry(r * 0.32, r * 0.05, r * 0.05), {
        color: FRAME_COLOR,
        bone: 'head',
        at: [0, y + r * 0.04, z],
    });
    return [...lenses, bridge];
};

const cap = (def: AvatarDefinition, p: Proportions, shape: Shape, frontZ: number): BufferGeometry[] => {
    const r = p.headRadius;
    const color = def.accessories.capColor;
    return [
        dome(r * 1.14, 0.5, { color, bone: 'head', at: [0, p.headY + r * 0.12, 0], scale: shape.scale }),
        makePart(new BoxGeometry(r * 1.5, r * 0.07, r * 0.95), {
            color,
            bone: 'head',
            at: [0, p.headY + r * 0.2, frontZ + r * 0.3],
            rotation: [-0.12, 0, 0],
        }),
    ];
};

export const buildHeadParts = (def: AvatarDefinition, p: Proportions): BufferGeometry[] => {
    const shape = SHAPES[def.head.shape];
    const frontZ = p.headRadius * shape.front * shape.scale[2];
    return [
        skull(def, p, shape),
        ...eyes(p, frontZ),
        ...hairParts(def, p, shape),
        ...(def.accessories.glasses ? glasses(p, frontZ) : []),
        ...(def.accessories.cap ? cap(def, p, shape, frontZ) : []),
    ];
};
