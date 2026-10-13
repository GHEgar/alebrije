import { useEffect, useRef, type RefObject } from 'react';
import type { Object3D } from 'three';
import type { ClipName } from '../core/animations.js';
import { createAvatarPlayer, type AvatarPlayer } from '../core/player.js';

export const useAvatarPlayer = (parent: Object3D | null, definition: unknown, clip: ClipName): RefObject<AvatarPlayer | null> => {
    const playerRef = useRef<AvatarPlayer | null>(null);
    const clipRef = useRef(clip);

    useEffect(() => {
        if (!parent) return undefined;
        const previous = playerRef.current;
        const player = createAvatarPlayer(definition, {
            clip: clipRef.current,
            time: previous?.clip() === clipRef.current ? previous.time() : 0,
        });
        previous?.dispose();
        parent.add(player.model);
        playerRef.current = player;
        return undefined;
    }, [parent, definition]);

    useEffect(() => () => {
        playerRef.current?.dispose();
        playerRef.current = null;
    }, [parent]);

    useEffect(() => {
        clipRef.current = clip;
        playerRef.current?.play(clip);
    }, [clip]);

    return playerRef;
};
