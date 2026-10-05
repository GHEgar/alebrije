import { useRef } from 'react';
import { useAvatarViewer } from '@/hooks/useAvatarViewer';
import { Chip } from './Chip';
import { InfoTooltip } from './InfoTooltip';

export const AvatarViewport = ({ avatar, walking, onToggleWalk }) => {
    const containerRef = useRef(null);
    useAvatarViewer(containerRef, avatar, walking);
    return (
        <div className="relative w-full h-full min-h-[360px] overflow-hidden rounded-[10px] bg-[#F8F8F8] shadow-[0px_3px_12px_#4615521A]">
            <div ref={containerRef} className="absolute inset-0" />
            <div className="absolute top-4 left-4 flex items-center gap-2">
                <Chip label="Caminar" active={walking} onClick={onToggleWalk} className={walking ? '' : 'bg-white! shadow-[0px_2px_8px_#4615521A]'} />
                <InfoTooltip text="Vista previa de las animaciones caminar y reposo que incluye el .glb. Arrastra para girar y usa la rueda para acercar." />
            </div>
        </div>
    );
};
