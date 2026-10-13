import { Bone, SkinnedMesh } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { describe, expect, it } from 'vitest';
import {
    BONE_NAMES, DEFAULT_AVATAR, IDLE_CLIP, WALK_CLIP, buildAvatar, createAvatarPlayer, disposeAvatar,
    exportAvatarGlb, parseAvatar, randomAvatar,
} from '../src/core/index.js';

describe('parseAvatar', () => {
    it('devuelve el avatar por defecto con entrada vacía o inválida', () => {
        expect(parseAvatar(undefined)).toEqual(DEFAULT_AVATAR);
        expect(parseAvatar('nada')).toEqual(DEFAULT_AVATAR);
    });

    it('cae al default campo por campo', () => {
        const avatar = parseAvatar({
            body: { height: 3, build: 0.2, skinTone: 'rojo' },
            head: { shape: 'triangle' },
            hair: { style: 'long', color: '#123456' },
        });
        expect(avatar.body).toEqual({ height: DEFAULT_AVATAR.body.height, build: 0.2, skinTone: DEFAULT_AVATAR.body.skinTone });
        expect(avatar.head.shape).toBe(DEFAULT_AVATAR.head.shape);
        expect(avatar.hair).toEqual({ style: 'long', color: '#123456' });
        expect(avatar.clothes).toEqual(DEFAULT_AVATAR.clothes);
    });

    it('acepta lo que genera randomAvatar', () => {
        const avatar = randomAvatar(() => 0.5);
        expect(parseAvatar(avatar)).toEqual(avatar);
    });
});

describe('buildAvatar', () => {
    it('arma la malla con el esqueleto completo y los dos clips', () => {
        const avatar = buildAvatar({ ...DEFAULT_AVATAR, accessories: { glasses: true, cap: true, capColor: '#000000' } });
        const mesh = avatar.getObjectByName('avatarMesh');
        expect(mesh).toBeInstanceOf(SkinnedMesh);
        expect((mesh as SkinnedMesh).skeleton.bones.map((bone: Bone) => bone.name)).toEqual([...BONE_NAMES]);
        expect(avatar.animations.map((clip) => clip.name)).toEqual([WALK_CLIP, IDLE_CLIP]);
        expect(avatar.animations[0]?.tracks).toHaveLength(BONE_NAMES.length + 1);
        expect(avatar.userData['alebrije']).toEqual(parseAvatar(avatar.userData['alebrije']));
        disposeAvatar(avatar);
    });

    it('pone los pies en y = 0 y la cabeza a la estatura', () => {
        const avatar = buildAvatar({ ...DEFAULT_AVATAR, hair: { style: 'none', color: '#000000' } });
        const mesh = avatar.getObjectByName('avatarMesh') as SkinnedMesh;
        mesh.geometry.computeBoundingBox();
        const box = mesh.geometry.boundingBox;
        expect(box?.min.y).toBeCloseTo(0, 2);
        expect(box?.max.y).toBeCloseTo(DEFAULT_AVATAR.body.height, 1);
        disposeAvatar(avatar);
    });
});

describe('createAvatarPlayer', () => {
    it('reproduce, cambia de clip y conserva el tiempo inicial', () => {
        const player = createAvatarPlayer(DEFAULT_AVATAR, { clip: WALK_CLIP, time: 0.25 });
        expect(player.clip()).toBe(WALK_CLIP);
        expect(player.time()).toBeCloseTo(0.25);
        player.update(0.1);
        expect(player.time()).toBeCloseTo(0.35);
        player.play(IDLE_CLIP);
        expect(player.clip()).toBe(IDLE_CLIP);
        player.dispose();
    });
});

describe('exportAvatarGlb', () => {
    it('genera un glb que vuelve a cargar con esqueleto, clips y definición', async () => {
        const glb = await exportAvatarGlb(DEFAULT_AVATAR);
        expect(new TextDecoder().decode(glb.slice(0, 4))).toBe('glTF');
        const gltf = await new GLTFLoader().parseAsync(glb, '');
        expect(gltf.animations.map((clip) => clip.name).sort()).toEqual([IDLE_CLIP, WALK_CLIP]);
        let skinned: SkinnedMesh | undefined;
        gltf.scene.traverse((object) => {
            if (object instanceof SkinnedMesh) skinned = object;
        });
        expect(skinned?.skeleton.bones).toHaveLength(BONE_NAMES.length);
        expect(gltf.scene.getObjectByName('alebrije')?.userData['alebrije']).toEqual(DEFAULT_AVATAR);
    });
});
