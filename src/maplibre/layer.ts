import {
    Camera, DirectionalLight, HemisphereLight, Matrix4, Scene, Vector3, WebGLRenderer,
} from 'three';
import { createLocalFrame, type LocalFrame } from '../geo/frame.js';
import type { LonLat } from '../geo/lonlat.js';
import type { AvatarState } from '../geo/state.js';
import type { AvatarPlayer } from '../core/player.js';
import { createAvatarSet, type Ground } from './avatar-set.js';

export interface MapLike {
    getCanvas(): HTMLCanvasElement;
    triggerRepaint(): void;
    queryTerrainElevation?(lngLat: [number, number]): number | null;
}

export type RenderArgs = ArrayLike<number> | { defaultProjectionData: { mainMatrix: ArrayLike<number> } };

export interface AvatarLayerOptions {
    id: string;
    origin?: LonLat;
    baseAltitude?: number;
    lights?: boolean;
    smoothing?: number;
    scale?: number;
    idleFrameRate?: number;
    terrain?: boolean;
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
    repaint(): void;
    avatar(id: string): AvatarPlayer | undefined;
    frame(): LocalFrame | null;
}

const MAX_DELTA = 0.1;
const IDLE_FRAME_RATE = 15;

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
    let frame: LocalFrame | null = options.origin ? createLocalFrame(options.origin, options.baseAltitude) : null;
    let map: MapLike | null = null;
    let renderer: WebGLRenderer | null = null;
    let previous: number | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const idleFrameRate = options.idleFrameRate ?? IDLE_FRAME_RATE;
    const ground: Ground | undefined = options.terrain
        ? (position) => map?.queryTerrainElevation?.([position[0], position[1]])
        : undefined;

    const wait = (): void => {
        if (timer === null) return;
        clearTimeout(timer);
        timer = null;
    };

    const repaint = (): void => {
        wait();
        map?.triggerRepaint();
    };

    const schedule = (active: boolean): void => {
        if (!map || !avatars.ids().length) return;
        if (active || idleFrameRate === Infinity) {
            repaint();
            return;
        }
        if (idleFrameRate <= 0 || timer !== null) return;
        timer = setTimeout(() => {
            timer = null;
            map?.triggerRepaint();
        }, 1000 / idleFrameRate);
    };

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
            const lifted = ground ? avatars.reground(frame, ground) : false;
            const active = avatars.update(delta) || lifted;
            camera.projectionMatrix = localToClip(mainMatrixOf(args), frame);
            renderer.resetState();
            renderer.render(scene, camera);
            schedule(active);
        },
        onRemove() {
            wait();
            avatars.dispose();
            renderer?.dispose();
            renderer = null;
            map = null;
            previous = null;
        },
        setAvatars(states) {
            const first = states[0];
            if (!frame && first) frame = createLocalFrame(first.position, options.baseAltitude);
            if (frame) avatars.set(states, frame, ground);
            repaint();
        },
        repaint,
        avatar: (id) => avatars.get(id),
        frame: () => frame,
    };
};
