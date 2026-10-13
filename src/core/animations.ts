import {
    AnimationClip, Euler, Quaternion, QuaternionKeyframeTrack, VectorKeyframeTrack,
} from 'three';
import type { Proportions } from './proportions.js';
import { BONE_NAMES, type BoneName } from './skeleton.js';

export const WALK_CLIP = 'walk';
export const IDLE_CLIP = 'idle';

export type ClipName = typeof WALK_CLIP | typeof IDLE_CLIP;

const WALK_DURATION = 1.0;
const IDLE_DURATION = 3.0;
const FRAMES = 16;
const LEG_SWING = 0.42;

type Rotation = [number, number, number];

interface Pose {
    hipsY: number;
    rotations: Partial<Record<BoneName, Rotation>>;
}

const walkPose = (phase: number, p: Proportions): Pose => {
    const s = Math.sin(phase);
    const c = Math.cos(phase);
    const swing = LEG_SWING * s;
    return {
        hipsY: p.hipY - 0.5 * (p.upperLeg + p.lowerLeg) * (1 - Math.cos(swing)),
        rotations: {
            hips: [0, 0.08 * s, 0],
            spine: [0.04, -0.14 * s, 0],
            head: [-0.02, 0.06 * s, 0],
            upperLegL: [-swing, 0, 0],
            upperLegR: [swing, 0, 0],
            lowerLegL: [0.7 * Math.max(0, c), 0, 0],
            lowerLegR: [0.7 * Math.max(0, -c), 0, 0],
            upperArmL: [0.45 * s, 0, 0.06],
            upperArmR: [-0.45 * s, 0, -0.06],
            lowerArmL: [-0.3 + 0.15 * s, 0, 0],
            lowerArmR: [-0.3 - 0.15 * s, 0, 0],
        },
    };
};

const idlePose = (phase: number, p: Proportions): Pose => {
    const s = Math.sin(phase);
    return {
        hipsY: p.hipY + 0.002 * p.H * s,
        rotations: {
            spine: [0.02 * s, 0, 0],
            head: [-0.02 * s, 0.05 * Math.sin(phase * 0.5 + 1), 0],
            upperArmL: [0, 0, 0.07 + 0.02 * s],
            upperArmR: [0, 0, -0.07 - 0.02 * s],
            lowerArmL: [-0.08, 0, 0],
            lowerArmR: [-0.08, 0, 0],
        },
    };
};

const sampleClip = (name: ClipName, duration: number, poseAt: (phase: number, p: Proportions) => Pose, p: Proportions): AnimationClip => {
    const times: number[] = [];
    const hips: number[] = [];
    const quaternions = Object.fromEntries(BONE_NAMES.map((bone) => [bone, [] as number[]])) as Record<BoneName, number[]>;
    const q = new Quaternion();
    const e = new Euler();
    for (let i = 0; i <= FRAMES; i += 1) {
        const pose = poseAt((i / FRAMES) * Math.PI * 2, p);
        times.push((i / FRAMES) * duration);
        hips.push(0, pose.hipsY, 0);
        BONE_NAMES.forEach((bone) => {
            q.setFromEuler(e.set(...(pose.rotations[bone] ?? [0, 0, 0])));
            quaternions[bone].push(q.x, q.y, q.z, q.w);
        });
    }
    const tracks = [
        new VectorKeyframeTrack('hips.position', times, hips),
        ...BONE_NAMES.map((bone) => new QuaternionKeyframeTrack(`${bone}.quaternion`, times, quaternions[bone])),
    ];
    return new AnimationClip(name, duration, tracks);
};

export const buildClips = (p: Proportions): AnimationClip[] => [
    sampleClip(WALK_CLIP, WALK_DURATION, walkPose, p),
    sampleClip(IDLE_CLIP, IDLE_DURATION, idlePose, p),
];
