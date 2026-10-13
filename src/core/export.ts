import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { buildAvatar, disposeAvatar } from './build.js';

export const exportAvatarGlb = async (definition: unknown): Promise<ArrayBuffer> => {
    const avatar = buildAvatar(definition);
    try {
        const result = await new GLTFExporter().parseAsync(avatar, {
            binary: true,
            animations: avatar.animations,
        });
        if (!(result instanceof ArrayBuffer)) throw new Error('alebrije: the exporter did not return a binary glTF');
        return result;
    } finally {
        disposeAvatar(avatar);
    }
};
