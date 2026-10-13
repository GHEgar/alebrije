import { Vector3, Vector4 } from 'three';
import { describe, expect, it } from 'vitest';
import { DEFAULT_AVATAR } from '../src/core/index.js';
import { createLocalFrame, destination, toMercator } from '../src/geo/index.js';
import { createAvatarLayer, createAvatarSet, localToClip, mainMatrixOf } from '../src/maplibre/index.js';

const GDL = [-103.35, 20.67] as const;
const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

describe('createAvatarSet', () => {
    it('crea, mueve, reconstruye y quita avatars', () => {
        const set = createAvatarSet();
        const frame = createLocalFrame(GDL);
        set.set([
            { id: 'a', definition: DEFAULT_AVATAR, position: destination(GDL, 90, 10), heading: 90, clip: 'walk' },
            { id: 'b', definition: DEFAULT_AVATAR, position: GDL, heading: 0 },
        ], frame);
        expect(set.ids()).toEqual(['a', 'b']);
        const a = set.get('a');
        const holder = set.group.getObjectByName('a');
        expect(holder?.position.x).toBeCloseTo(10, 1);
        expect(holder?.rotation.z).toBeCloseTo(-Math.PI / 2);
        expect(a?.clip()).toBe('walk');

        set.set([{ id: 'a', definition: { ...DEFAULT_AVATAR }, position: GDL, heading: 0, altitude: 5 }], frame);
        expect(set.get('a')).toBe(a);
        expect(set.ids()).toEqual(['a']);
        expect(set.group.getObjectByName('a')?.position.z).toBe(5);
        expect(a?.clip()).toBe('idle');

        set.set([{ id: 'a', definition: { ...DEFAULT_AVATAR, hair: { style: 'bun', color: '#000000' } }, position: GDL, heading: 0 }], frame);
        expect(set.get('a')).not.toBe(a);
        set.dispose();
        expect(set.group.children).toHaveLength(0);
    });

    it('el avatar queda de pie en z y mira al rumbo', () => {
        const set = createAvatarSet();
        set.set([{ id: 'a', definition: DEFAULT_AVATAR, position: GDL, heading: 90 }], createLocalFrame(GDL));
        set.group.updateMatrixWorld(true);
        const model = set.get('a')?.model;
        const forward = new Vector3(0, 0, 1).transformDirection(model?.matrixWorld ?? set.group.matrixWorld);
        const up = new Vector3(0, 1, 0).transformDirection(model?.matrixWorld ?? set.group.matrixWorld);
        expect(forward.x).toBeCloseTo(1);
        expect(forward.y).toBeCloseTo(0);
        expect(up.z).toBeCloseTo(1);
        set.dispose();
    });
});

describe('capa de MapLibre', () => {
    it('lee la matriz de v4 y de v5+', () => {
        expect(mainMatrixOf(IDENTITY)).toBe(IDENTITY);
        expect(mainMatrixOf({ defaultProjectionData: { mainMatrix: IDENTITY } })).toBe(IDENTITY);
    });

    it('lleva un punto local a su coordenada Mercator', () => {
        const frame = createLocalFrame(GDL);
        const target = destination(GDL, 45, 100);
        const local = frame.toLocal(target, 20);
        const clip = new Vector4(...local, 1).applyMatrix4(localToClip(IDENTITY, frame));
        const mercator = toMercator(target, 20);
        expect(clip.x).toBeCloseTo(mercator.x, 12);
        expect(clip.y).toBeCloseTo(mercator.y, 12);
        expect(clip.z).toBeCloseTo(mercator.z, 10);
    });

    it('fija el origen con el primer avatar y no dibuja sin mapa', () => {
        const layer = createAvatarLayer({ id: 'avatars' });
        expect(layer.frame()).toBeNull();
        layer.setAvatars([{ id: 'a', definition: DEFAULT_AVATAR, position: GDL, heading: 0 }]);
        expect(layer.frame()?.origin).toEqual(GDL);
        expect(layer.avatar('a')).toBeDefined();
        expect(() => layer.render({} as WebGL2RenderingContext, IDENTITY)).not.toThrow();
        layer.onRemove();
        expect(layer.avatar('a')).toBeUndefined();
    });
});

describe('suavizado', () => {
    it('acerca la posición y el rumbo al objetivo sin brincar', () => {
        const set = createAvatarSet({ smoothing: 0.5 });
        const frame = createLocalFrame(GDL);
        set.set([{ id: 'a', definition: DEFAULT_AVATAR, position: GDL, heading: 350 }], frame);
        set.set([{ id: 'a', definition: DEFAULT_AVATAR, position: destination(GDL, 0, 10), heading: 10 }], frame);
        const holder = set.group.getObjectByName('a');
        expect(holder?.position.y).toBeCloseTo(0);
        set.update(0.5);
        expect(holder?.position.y).toBeGreaterThan(5);
        expect(holder?.position.y).toBeLessThan(7);
        expect(holder?.rotation.z).toBeLessThan((10 * Math.PI) / 180);
        for (let i = 0; i < 20; i += 1) set.update(0.5);
        expect(holder?.position.y).toBeCloseTo(10, 1);
        expect(Math.cos((holder?.rotation.z ?? 0) + (10 * Math.PI) / 180)).toBeCloseTo(1, 4);
        set.dispose();
    });
});

describe('escala', () => {
    it('exagera el tamaño del avatar', () => {
        const set = createAvatarSet({ scale: 3 });
        set.set([{ id: 'a', definition: DEFAULT_AVATAR, position: GDL, heading: 0 }], createLocalFrame(GDL));
        expect(set.group.getObjectByName('a')?.scale.x).toBe(3);
        set.dispose();
    });
});
