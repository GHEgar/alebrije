import { act, renderHook } from '@testing-library/react';
import { Group } from 'three';
import { describe, expect, it } from 'vitest';
import { DEFAULT_AVATAR, IDLE_CLIP, WALK_CLIP, type ClipName } from '../src/core/index.js';
import { useAvatarPlayer } from '../src/react/index.js';

describe('useAvatarPlayer', () => {
    it('agrega el avatar a la escena, lo reemplaza al cambiar la definición y lo quita al desmontar', () => {
        const scene = new Group();
        const { result, rerender, unmount } = renderHook(
            ({ avatar, clip }: { avatar: unknown; clip: ClipName }) => useAvatarPlayer(scene, avatar, clip),
            { initialProps: { avatar: DEFAULT_AVATAR as unknown, clip: IDLE_CLIP as ClipName } },
        );
        const first = result.current.current;
        expect(scene.children).toEqual([first?.model]);

        act(() => rerender({ avatar: DEFAULT_AVATAR, clip: WALK_CLIP }));
        expect(result.current.current).toBe(first);
        expect(first?.clip()).toBe(WALK_CLIP);

        act(() => rerender({ avatar: { ...DEFAULT_AVATAR, body: { ...DEFAULT_AVATAR.body, height: 1.9 } }, clip: WALK_CLIP }));
        const second = result.current.current;
        expect(second).not.toBe(first);
        expect(second?.clip()).toBe(WALK_CLIP);
        expect(scene.children).toEqual([second?.model]);

        unmount();
        expect(scene.children).toHaveLength(0);
    });

    it('no hace nada sin escena', () => {
        const { result } = renderHook(() => useAvatarPlayer(null, DEFAULT_AVATAR, IDLE_CLIP));
        expect(result.current.current).toBeNull();
    });
});
