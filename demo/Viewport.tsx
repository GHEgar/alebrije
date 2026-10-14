import { useEffect, useRef, useState } from 'react';
import type { Scene } from 'three';
import { Mesh } from 'three';
import type { AvatarDefinition } from 'alebrije';
import { useAvatarPlayer } from 'alebrije/react';
import { createStage, type Stage } from './stage';

interface ViewportProps {
    avatar: AvatarDefinition;
    walking: boolean;
    onToggleWalk: () => void;
}

export function Viewport({ avatar, walking, onToggleWalk }: ViewportProps) {
    const container = useRef<HTMLDivElement>(null);
    const stage = useRef<Stage | null>(null);
    const [scene, setScene] = useState<Scene | null>(null);
    const player = useAvatarPlayer(scene, avatar, walking ? 'walk' : 'idle');

    useEffect(() => {
        if (!container.current) return undefined;
        const created = createStage(container.current);
        stage.current = created;
        created.start((delta) => player.current?.update(delta));
        setScene(created.scene);
        return () => {
            created.dispose();
            stage.current = null;
            setScene(null);
        };
    }, [player]);

    useEffect(() => {
        player.current?.model.traverse((object) => {
            if (object instanceof Mesh) object.castShadow = true;
        });
    }, [player, avatar, scene]);

    return (
        <div className="viewport">
            <div ref={container} className="canvas" />
            <div className="overlay">
                <button type="button" className="chip" aria-pressed={walking} onClick={onToggleWalk}>Walk</button>
                <small>Drag to orbit, scroll to zoom.</small>
            </div>
        </div>
    );
}
