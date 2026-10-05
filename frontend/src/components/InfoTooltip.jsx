import { useId, useState } from 'react';
import icoTooltip from '@/assets/icons/ico_tooltip.svg';

export const InfoTooltip = ({ text }) => {
    const [open, setOpen] = useState(false);
    const id = useId();
    if (!text) return null;
    return (
        <span className="relative inline-flex">
            <button
                type="button"
                aria-label="Mostrar información"
                aria-describedby={open ? id : undefined}
                onMouseEnter={() => setOpen(true)}
                onMouseLeave={() => setOpen(false)}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
                className="w-5 h-5 p-0 bg-transparent border-0 cursor-pointer rounded-full focus:outline-none focus-visible:ring-1 focus-visible:ring-[#5C2472]"
            >
                <img src={icoTooltip} alt="" className="w-5 h-5" />
            </button>
            {open && (
                <span
                    id={id}
                    role="tooltip"
                    className="absolute left-1/2 bottom-full z-20 mb-2 w-max max-w-[240px] -translate-x-1/2 rounded px-2 py-1 font-garetbold text-[10px] text-white bg-[#5B6670]"
                >
                    {text}
                </span>
            )}
        </span>
    );
};
