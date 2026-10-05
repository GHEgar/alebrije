import { useEffect, useRef } from 'react';
import { AnimationMixer } from 'three';
import { IDLE_CLIP, WALK_CLIP } from '@/avatar/animations';
import { buildAvatar, disposeAvatar } from '@/avatar/buildAvatar';
import { createStage } from '@/utils/createStage';

const FADE_SECONDS = 0.3;

const enableShadows = (avatar) => {
    avatar.traverse((object) => {
        if (object.isMesh) object.castShadow = true;
    });
};

export const useAvatarViewer = (containerRef, avatar, walking) => {
    const stageRef = useRef(null);
    const currentRef = useRef(null);
    const walkingRef = useRef(walking);

    useEffect(() => {
        const stage = createStage(containerRef.current);
        stageRef.current = stage;
        stage.start((delta) => currentRef.current?.mixer.update(delta));
        return () => {
            if (currentRef.current) disposeAvatar(currentRef.current.model);
            currentRef.current = null;
            stage.dispose();
            stageRef.current = null;
        };
    }, [containerRef]);

    useEffect(() => {
        const stage = stageRef.current;
        if (!stage) return;
        const model = buildAvatar(avatar);
        enableShadows(model);
        const mixer = new AnimationMixer(model);
        const actions = {
            [WALK_CLIP]: mixer.clipAction(model.animations.find((clip) => clip.name === WALK_CLIP)),
            [IDLE_CLIP]: mixer.clipAction(model.animations.find((clip) => clip.name === IDLE_CLIP)),
        };
        const previous = currentRef.current;
        const active = walkingRef.current ? WALK_CLIP : IDLE_CLIP;
        actions[active].play();
        if (previous) {
            actions[active].time = previous.actions[active].time;
            stage.scene.remove(previous.model);
            previous.mixer.stopAllAction();
            disposeAvatar(previous.model);
        }
        stage.scene.add(model);
        currentRef.current = { model, mixer, actions };
    }, [avatar]);

    useEffect(() => {
        walkingRef.current = walking;
        const current = currentRef.current;
        if (!current) return;
        const next = current.actions[walking ? WALK_CLIP : IDLE_CLIP];
        const prev = current.actions[walking ? IDLE_CLIP : WALK_CLIP];
        next.reset().play();
        prev.crossFadeTo(next, FADE_SECONDS, false);
    }, [walking]);
};
