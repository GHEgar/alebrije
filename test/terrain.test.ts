import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_AVATAR } from '../src/core/index.js';
import { createLocalFrame } from '../src/geo/index.js';
import { createAvatarLayer, createAvatarSet } from '../src/maplibre/index.js';
import { GDL, GL, fakeMap, mount } from './fake-map.js';

vi.mock('three', async (original) => ({
    ...await original<typeof import('three')>(),
    WebGLRenderer: class {
        autoClear = true;
        resetState(): void {}
        render(): void {}
        dispose(): void {}
    },
}));

const zOf = (layer: ReturnType<typeof createAvatarLayer>, id: string): number | undefined => (
    layer.scene.getObjectByName(id)?.position.z
);

describe('altitud del terreno', () => {
    it('está apagada por omisión y no consulta el mapa', () => {
        const { map, layer, frame } = mount({}, () => 1500);
        layer.setAvatars([{ id: 'a', definition: DEFAULT_AVATAR, position: GDL, heading: 0 }]);
        frame();
        expect(map.queryTerrainElevation).not.toHaveBeenCalled();
        expect(zOf(layer, 'a')).toBe(0);
        layer.onRemove();
    });

    it('pone en el suelo a los avatars sin altitude y respeta baseAltitude', () => {
        const { map, layer } = mount({ terrain: true, origin: GDL, baseAltitude: 1000 }, () => 1500);
        layer.setAvatars([
            { id: 'a', definition: DEFAULT_AVATAR, position: GDL, heading: 0 },
            { id: 'b', definition: DEFAULT_AVATAR, position: GDL, heading: 0, altitude: 1200 },
        ]);
        expect(map.queryTerrainElevation).toHaveBeenCalledWith([GDL[0], GDL[1]]);
        expect(zOf(layer, 'a')).toBe(500);
        expect(zOf(layer, 'b')).toBe(200);
        layer.onRemove();
    });

    it('sigue al terreno cuando cambia su exageración o se cargan las teselas', () => {
        let exaggeration = 1;
        const { map, layer, frame } = mount({ terrain: true, idleFrameRate: 0 }, () => 1500 * exaggeration);
        layer.setAvatars([{ id: 'a', definition: DEFAULT_AVATAR, position: GDL, heading: 0 }]);
        frame();
        expect(zOf(layer, 'a')).toBe(1500);
        map.triggerRepaint.mockClear();
        exaggeration = 2;
        frame();
        expect(zOf(layer, 'a')).toBe(3000);
        expect(map.triggerRepaint).toHaveBeenCalledTimes(1);
        frame();
        expect(map.triggerRepaint).toHaveBeenCalledTimes(1);
        layer.onRemove();
    });

    it('baja a cero sin terreno y sin queryTerrainElevation', () => {
        let terrain = true;
        const { layer, frame } = mount({ terrain: true }, () => (terrain ? 800 : null));
        layer.setAvatars([{ id: 'a', definition: DEFAULT_AVATAR, position: GDL, heading: 0 }]);
        expect(zOf(layer, 'a')).toBe(800);
        terrain = false;
        frame();
        expect(zOf(layer, 'a')).toBe(0);
        layer.onRemove();

        const plain = createAvatarLayer({ id: 'plain', terrain: true });
        plain.onAdd(fakeMap(), GL);
        plain.setAvatars([{ id: 'a', definition: DEFAULT_AVATAR, position: GDL, heading: 0 }]);
        expect(() => plain.render(GL, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])).not.toThrow();
        expect(zOf(plain, 'a')).toBe(0);
        plain.onRemove();
    });

    it('acerca la altura con suavizado', () => {
        const set = createAvatarSet({ smoothing: 0.5 });
        const frame = createLocalFrame(GDL);
        set.set([{ id: 'a', definition: DEFAULT_AVATAR, position: GDL, heading: 0 }], frame, () => 100);
        expect(set.reground(frame, () => 100)).toBe(false);
        expect(set.reground(frame, () => 200)).toBe(true);
        expect(set.group.getObjectByName('a')?.position.z).toBe(100);
        set.update(0.5);
        expect(set.group.getObjectByName('a')?.position.z).toBeGreaterThan(150);
        set.dispose();
    });
});
