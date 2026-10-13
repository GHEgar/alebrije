import {
    Camera, DirectionalLight, HemisphereLight, Matrix4, Scene, Vector3, WebGLRenderer,
} from 'three';
import { createLocalFrame, type LocalFrame } from '../geo/frame.js';
import type { LonLat } from '../geo/lonlat.js';
import type { AvatarState } from '../geo/state.js';
import type { AvatarPlayer } from '../core/player.js';
import { createAvatarSet } from './avatar-set.js';

export interface MapLike {
    getCanvas(): HTMLCanvasElement;
    triggerRepaint(): void;
}

export type RenderArgs = ArrayLike<number> | { defaultProjectionData: { mainMatrix: ArrayLike<number> } };

export interface AvatarLayerOptions {
    id: string;
    origin?: LonLat;
    lights?: boolean;
    smoothing?: number;
    scale?: number;
    now?: () => number;
}

export interface AvatarLayer {
    readonly id: string;
    readonly type: 'custom';
    readonly renderingMode: '3d';
    readonly scene: Scene;
    onAdd(map: MapLike, gl: WebGLRenderingContext | WebGL2RenderingContext): void;
    render(gl: WebGLRenderingContext | WebGL2RenderingContext, args: RenderArgs): void;
    onRemove(): void;
    setAvatars(states: readonly AvatarState[]): void;
    avatar(id: string): AvatarPlayer | undefined;
    frame(): LocalFrame | null;
}

const MAX_DELTA = 0.1;

export const mainMatrixOf = (args: RenderArgs): ArrayLike<number> => (
    'defaultProjectionData' in args ? args.defaultProjectionData.mainMatrix : args
);

export const localToClip = (main: ArrayLike<number>, frame: LocalFrame): Matrix4 => {
    const { mercator, scale } = frame;
    return new Matrix4()
        .fromArray(Array.from(main))
        .multiply(new Matrix4().makeTranslation(mercator.x, mercator.y, mercator.z).scale(new Vector3(scale, -scale, scale)));
};

const addLights = (scene: Scene): void => {
    scene.add(new HemisphereLight('#ffffff', '#8a8270', 2));
    const sun = new DirectionalLight('#fff4e0', 1.5);
    sun.position.set(-0.5, 0.35, 1);
    scene.add(sun);
};

export const createAvatarLayer = (options: AvatarLayerOptions): AvatarLayer => {
    const scene = new Scene();
    if (options.lights !== false) addLights(scene);
    const avatars = createAvatarSet({ smoothing: options.smoothing ?? 0, scale: options.scale ?? 1 });
    scene.add(avatars.group);
    const camera = new Camera();
    const now = options.now ?? (() => performance.now());
    let frame: LocalFrame | null = options.origin ? createLocalFrame(options.origin) : null;
    let map: MapLike | null = null;
    let renderer: WebGLRenderer | null = null;
    let previous: number | null = null;

    return {
        id: options.id,
        type: 'custom',
        renderingMode: '3d',
        scene,
        onAdd(target, gl) {
            map = target;
            renderer = new WebGLRenderer({ canvas: target.getCanvas(), context: gl, antialias: true });
            renderer.autoClear = false;
        },
        render(_gl, args) {
            const time = now();
            const delta = previous === null ? 0 : Math.min((time - previous) / 1000, MAX_DELTA);
            previous = time;
            if (!renderer || !frame) return;
            avatars.update(delta);
            camera.projectionMatrix = localToClip(mainMatrixOf(args), frame);
            renderer.resetState();
            renderer.render(scene, camera);
            if (avatars.ids().length) map?.triggerRepaint();
        },
        onRemove() {
            avatars.dispose();
            renderer?.dispose();
            renderer = null;
            map = null;
            previous = null;
        },
        setAvatars(states) {
            const first = states[0];
            if (!frame && first) frame = createLocalFrame(first.position);
            if (frame) avatars.set(states, frame);
            map?.triggerRepaint();
        },
        avatar: (id) => avatars.get(id),
        frame: () => frame,
    };
};
