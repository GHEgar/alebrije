import { Bone, Skeleton, Vector3 } from 'three';
import type { Proportions } from './proportions.js';

export const BONE_NAMES = [
    'hips', 'spine', 'head',
    'upperArmL', 'lowerArmL', 'upperArmR', 'lowerArmR',
    'upperLegL', 'lowerLegL', 'upperLegR', 'lowerLegR',
] as const;

export type BoneName = typeof BONE_NAMES[number];

type Vec3 = [number, number, number];

interface Joint {
    parent: BoneName | null;
    at: Vec3;
}

const layout = (p: Proportions): Record<BoneName, Joint> => ({
    hips: { parent: null, at: [0, p.hipY, 0] },
    spine: { parent: 'hips', at: [0, p.spineY, 0] },
    head: { parent: 'spine', at: [0, p.neckY, 0] },
    upperArmL: { parent: 'spine', at: [p.shoulderX, p.shoulderY, 0] },
    lowerArmL: { parent: 'upperArmL', at: [p.shoulderX, p.shoulderY - p.upperArm, 0] },
    upperArmR: { parent: 'spine', at: [-p.shoulderX, p.shoulderY, 0] },
    lowerArmR: { parent: 'upperArmR', at: [-p.shoulderX, p.shoulderY - p.upperArm, 0] },
    upperLegL: { parent: 'hips', at: [p.hipX, p.hipY, 0] },
    lowerLegL: { parent: 'upperLegL', at: [p.hipX, p.hipY - p.upperLeg, 0] },
    upperLegR: { parent: 'hips', at: [-p.hipX, p.hipY, 0] },
    lowerLegR: { parent: 'upperLegR', at: [-p.hipX, p.hipY - p.upperLeg, 0] },
});

export const boneIndex = (name: BoneName): number => BONE_NAMES.indexOf(name);

export interface BuiltSkeleton {
    root: Bone;
    bones: Record<BoneName, Bone>;
    skeleton: Skeleton;
}

export const buildSkeleton = (p: Proportions): BuiltSkeleton => {
    const spec = layout(p);
    const bones = {} as Record<BoneName, Bone>;
    BONE_NAMES.forEach((name) => {
        const { parent, at } = spec[name];
        const bone = new Bone();
        bone.name = name;
        const world = new Vector3(...at);
        if (parent) {
            bone.position.copy(world.sub(new Vector3(...spec[parent].at)));
            bones[parent].add(bone);
        } else {
            bone.position.copy(world);
        }
        bones[name] = bone;
    });
    return { root: bones.hips, bones, skeleton: new Skeleton(BONE_NAMES.map((name) => bones[name])) };
};
