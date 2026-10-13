import { BoxGeometry, type BufferGeometry } from 'three';
import type { AvatarDefinition } from './definition.js';
import { ball, limb, makePart, tube } from './parts.js';
import type { Proportions } from './proportions.js';

const sides = [['L', 1], ['R', -1]] as const;

const torsoParts = (def: AvatarDefinition, p: Proportions): BufferGeometry[] => {
    const { shirt, pants } = def.clothes;
    const pelvisHeight = 0.1 * p.H;
    const torsoBottom = p.hipY + 0.03 * p.H;
    const torsoTop = p.shoulderY + 0.025 * p.H;
    return [
        tube(p.torsoBottom * 1.02, p.hipX + p.legRadius, pelvisHeight, {
            color: pants,
            bone: 'hips',
            at: [0, p.hipY + 0.01 * p.H, 0],
            scale: [1, 1, p.torsoDepth + 0.08],
        }),
        tube(p.torsoTop, p.torsoBottom, torsoTop - torsoBottom, {
            color: shirt,
            bone: 'spine',
            at: [0, (torsoTop + torsoBottom) / 2, 0],
            scale: [1, 1, p.torsoDepth],
        }),
        tube(0.024 * p.H, 0.028 * p.H, p.neckY - p.shoulderY + 0.04 * p.H, {
            color: def.body.skinTone,
            bone: 'head',
            at: [0, (p.neckY + p.shoulderY) / 2 + 0.02 * p.H, 0],
        }, 6),
    ];
};

const armParts = (def: AvatarDefinition, p: Proportions): BufferGeometry[] => sides.flatMap(([side, sign]) => {
    const x = sign * p.shoulderX;
    const elbowY = p.shoulderY - p.upperArm;
    const wristY = elbowY - p.lowerArm;
    const skin = def.body.skinTone;
    return [
        ball(p.armRadius * 1.25, { color: def.clothes.shirt, bone: `upperArm${side}`, at: [x, p.shoulderY - 0.01 * p.H, 0] }, 8, 6),
        limb(p.armRadius, p.shoulderY, p.upperArm, x, { color: def.clothes.shirt, bone: `upperArm${side}` }),
        limb(p.forearmRadius, elbowY + p.forearmRadius, p.lowerArm + p.forearmRadius, x, { color: skin, bone: `lowerArm${side}` }),
        ball(p.handRadius, {
            color: skin,
            bone: `lowerArm${side}`,
            at: [x, wristY - p.handRadius * 0.6, 0],
            scale: [0.75, 1.15, 0.9],
        }, 8, 6),
    ];
});

const legParts = (def: AvatarDefinition, p: Proportions): BufferGeometry[] => sides.flatMap(([side, sign]) => {
    const x = sign * p.hipX;
    const kneeY = p.hipY - p.upperLeg;
    const shoeLength = 0.15 * p.H;
    const shoeHeight = p.footHeight * 1.3;
    return [
        limb(p.legRadius, p.hipY, p.upperLeg + p.legRadius * 0.5, x, { color: def.clothes.pants, bone: `upperLeg${side}` }),
        limb(p.shinRadius, kneeY + p.shinRadius, p.lowerLeg + p.shinRadius, x, { color: def.clothes.pants, bone: `lowerLeg${side}` }),
        makePart(new BoxGeometry(p.shinRadius * 2.3, shoeHeight, shoeLength), {
            color: def.clothes.shoes,
            bone: `lowerLeg${side}`,
            at: [x, shoeHeight / 2, shoeLength * 0.22],
        }),
    ];
});

export const buildBodyParts = (def: AvatarDefinition, p: Proportions): BufferGeometry[] => [
    ...torsoParts(def, p),
    ...armParts(def, p),
    ...legParts(def, p),
];
