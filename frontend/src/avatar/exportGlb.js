import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { buildAvatar, disposeAvatar } from './buildAvatar.js';

export const exportAvatarGlb = async (definition) => {
    const avatar = buildAvatar(definition);
    try {
        const exporter = new GLTFExporter();
        return await exporter.parseAsync(avatar, {
            binary: true,
            animations: avatar.animations,
        });
    } finally {
        disposeAvatar(avatar);
    }
};
