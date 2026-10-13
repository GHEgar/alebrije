import { Group, Mesh, MeshStandardMaterial, SkinnedMesh, type Material, type Object3D } from 'three';
import { buildClips } from './animations.js';
import { buildBodyParts } from './body.js';
import type { AvatarDefinition } from './definition.js';
import { buildHeadParts } from './head.js';
import { mergeParts } from './parts.js';
import { computeProportions } from './proportions.js';
import { parseAvatar } from './schema.js';
import { buildSkeleton } from './skeleton.js';

export const buildAvatar = (definition: unknown): Group => {
    const def: AvatarDefinition = parseAvatar(definition);
    const p = computeProportions(def);
    const group = new Group();
    group.name = 'alebrije';
    const { root, skeleton } = buildSkeleton(p);
    group.add(root);
    group.updateMatrixWorld(true);
    skeleton.calculateInverses();
    const geometry = mergeParts([...buildBodyParts(def, p), ...buildHeadParts(def, p)]);
    const material = new MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0 });
    material.name = 'avatar';
    const mesh = new SkinnedMesh(geometry, material);
    mesh.name = 'avatarMesh';
    group.add(mesh);
    group.updateMatrixWorld(true);
    mesh.bind(skeleton);
    group.animations = buildClips(p);
    group.userData['alebrije'] = def;
    return group;
};

const disposeMaterial = (material: Material | Material[]): void => {
    (Array.isArray(material) ? material : [material]).forEach((item) => item.dispose());
};

export const disposeAvatar = (avatar: Object3D): void => {
    avatar.traverse((object) => {
        if (object instanceof Mesh) {
            object.geometry.dispose();
            disposeMaterial(object.material);
        }
    });
};
