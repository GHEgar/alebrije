import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_AVATAR } from '../src/core/index.js';
import { createLocalFrame, destination } from '../src/geo/index.js';
import { createAvatarSet } from '../src/maplibre/index.js';
import { GDL, mount } from './fake-map.js';

vi.mock('three', async (original) => ({
    ...await original<typeof import('three')>(),
    WebGLRenderer: class {
        autoClear = true;
        resetState(): void {}
        render(): void {}
        dispose(): void {}
    },
}));

describe('actividad del conjunto', () => {
    it('reposa en idle y se activa al caminar, al cruzar clips y al moverse', () => {
        const set = createAvatarSet({ smoothing: 0.2 });
        const frame = createLocalFrame(GDL);
        set.set([{ id: 'a', definition: DEFAULT_AVATAR, position: GDL, heading: 0 }], frame);
        expect(set.update(0.016)).toBe(false);
        set.set([{ id: 'a', definition: DEFAULT_AVATAR, position: GDL, heading: 0, clip: 'walk' }], frame);
        expect(set.update(0.016)).toBe(true);
        set.set([{ id: 'a', definition: DEFAULT_AVATAR, position: GDL, heading: 0 }], frame);
        expect(set.get('a')?.fading()).toBe(true);
        expect(set.update(0.1)).toBe(true);
        set.update(0.3);
        expect(set.get('a')?.fading()).toBe(false);
        expect(set.update(0.016)).toBe(false);
        set.set([{ id: 'a', definition: DEFAULT_AVATAR, position: destination(GDL, 0, 5), heading: 0 }], frame);
        expect(set.update(0.016)).toBe(true);
        for (let i = 0; i < 40; i += 1) set.update(0.1);
        expect(set.update(0.016)).toBe(false);
        expect(set.group.getObjectByName('a')?.position.y).toBeCloseTo(5, 3);
        set.dispose();
    });
});

describe('repintado de la capa', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('pide repintado al cambiar el estado y cada cuadro mientras camina', () => {
        const { map, layer, frame } = mount({});
        layer.setAvatars([{ id: 'a', definition: DEFAULT_AVATAR, position: GDL, heading: 0, clip: 'walk' }]);
        expect(map.triggerRepaint).toHaveBeenCalledTimes(1);
        frame();
        frame();
        expect(map.triggerRepaint).toHaveBeenCalledTimes(3);
        layer.onRemove();
    });

    it('en reposo repinta a idleFrameRate y no en cada cuadro', () => {
        const { map, layer, frame } = mount({ idleFrameRate: 10 });
        layer.setAvatars([{ id: 'a', definition: DEFAULT_AVATAR, position: GDL, heading: 0 }]);
        map.triggerRepaint.mockClear();
        frame();
        frame();
        expect(map.triggerRepaint).not.toHaveBeenCalled();
        vi.advanceTimersByTime(99);
        expect(map.triggerRepaint).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1);
        expect(map.triggerRepaint).toHaveBeenCalledTimes(1);
        frame();
        vi.advanceTimersByTime(100);
        expect(map.triggerRepaint).toHaveBeenCalledTimes(2);
        layer.onRemove();
    });

    it('usa 15 cuadros por segundo en reposo por omisión', () => {
        const { map, layer, frame } = mount({});
        layer.setAvatars([{ id: 'a', definition: DEFAULT_AVATAR, position: GDL, heading: 0 }]);
        map.triggerRepaint.mockClear();
        frame();
        vi.advanceTimersByTime(60);
        expect(map.triggerRepaint).not.toHaveBeenCalled();
        vi.advanceTimersByTime(10);
        expect(map.triggerRepaint).toHaveBeenCalledTimes(1);
        layer.onRemove();
    });

    it('con idleFrameRate 0 deja de repintar y vuelve con setAvatars o repaint', () => {
        const { map, layer, frame } = mount({ idleFrameRate: 0 });
        layer.setAvatars([{ id: 'a', definition: DEFAULT_AVATAR, position: GDL, heading: 0 }]);
        map.triggerRepaint.mockClear();
        frame();
        vi.advanceTimersByTime(10_000);
        expect(map.triggerRepaint).not.toHaveBeenCalled();
        layer.repaint();
        expect(map.triggerRepaint).toHaveBeenCalledTimes(1);
        layer.setAvatars([{ id: 'a', definition: DEFAULT_AVATAR, position: GDL, heading: 90 }]);
        expect(map.triggerRepaint).toHaveBeenCalledTimes(2);
        layer.onRemove();
    });

    it('con idleFrameRate Infinity repinta cada cuadro como antes', () => {
        const { map, layer, frame } = mount({ idleFrameRate: Infinity });
        layer.setAvatars([{ id: 'a', definition: DEFAULT_AVATAR, position: GDL, heading: 0 }]);
        map.triggerRepaint.mockClear();
        frame();
        frame();
        expect(map.triggerRepaint).toHaveBeenCalledTimes(2);
        layer.onRemove();
    });

    it('sigue repintando mientras el suavizado no llega y al quitar la capa cancela la espera', () => {
        const { map, layer, frame } = mount({ smoothing: 0.2 });
        layer.setAvatars([{ id: 'a', definition: DEFAULT_AVATAR, position: GDL, heading: 0 }]);
        layer.setAvatars([{ id: 'a', definition: DEFAULT_AVATAR, position: destination(GDL, 90, 20), heading: 90 }]);
        map.triggerRepaint.mockClear();
        frame();
        expect(map.triggerRepaint).toHaveBeenCalledTimes(1);
        for (let i = 0; i < 80; i += 1) frame(100);
        map.triggerRepaint.mockClear();
        frame();
        expect(map.triggerRepaint).not.toHaveBeenCalled();
        layer.onRemove();
        vi.advanceTimersByTime(1000);
        expect(map.triggerRepaint).not.toHaveBeenCalled();
    });

    it('sin avatars no repinta', () => {
        const { map, layer, frame } = mount({ origin: GDL });
        frame();
        vi.advanceTimersByTime(1000);
        expect(map.triggerRepaint).not.toHaveBeenCalled();
        layer.onRemove();
    });
});
