import { AnimationMixer, type AnimationAction, type Group } from 'three';
import { IDLE_CLIP, WALK_CLIP, type ClipName } from './animations.js';
import { buildAvatar, disposeAvatar } from './build.js';

export interface AvatarPlayerOptions {
    clip?: ClipName;
    time?: number;
}

export interface AvatarPlayer {
    readonly model: Group;
    readonly mixer: AnimationMixer;
    clip(): ClipName;
    time(): number;
    play(clip: ClipName, fade?: number): void;
    update(delta: number): void;
    dispose(): void;
}

const DEFAULT_FADE = 0.3;

export const createAvatarPlayer = (definition: unknown, { clip = IDLE_CLIP, time = 0 }: AvatarPlayerOptions = {}): AvatarPlayer => {
    const model = buildAvatar(definition);
    const mixer = new AnimationMixer(model);
    const actions = Object.fromEntries(model.animations.map((anim) => [anim.name, mixer.clipAction(anim)])) as Record<ClipName, AnimationAction>;
    let current = clip;
    actions[current].play();
    actions[current].time = time;

    return {
        model,
        mixer,
        clip: () => current,
        time: () => actions[current].time,
        play(next, fade = DEFAULT_FADE) {
            if (next === current) return;
            const previous = actions[current];
            actions[next].reset().play();
            previous.crossFadeTo(actions[next], fade, false);
            current = next;
        },
        update(delta) {
            mixer.update(delta);
        },
        dispose() {
            mixer.stopAllAction();
            mixer.uncacheRoot(model);
            model.removeFromParent();
            disposeAvatar(model);
        },
    };
};

export const CLIPS: readonly ClipName[] = [WALK_CLIP, IDLE_CLIP];
