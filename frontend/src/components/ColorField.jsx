import { useId } from 'react';
import { FieldLabel } from './FieldLabel';

const sameColor = (a, b) => a.toLowerCase() === b.toLowerCase();

export const ColorField = ({ label, tooltip, swatches, value, onChange, allowCustom = true }) => {
    const id = useId();
    return (
        <div className="flex flex-col gap-2">
            <FieldLabel label={label} tooltip={tooltip} />
            <div role="group" aria-label={label} className="flex flex-wrap items-center gap-2">
                {swatches.map((swatch) => (
                    <button
                        key={swatch}
                        type="button"
                        aria-label={`Color ${swatch}`}
                        aria-pressed={sameColor(swatch, value)}
                        onClick={() => onChange(swatch)}
                        style={{ backgroundColor: swatch }}
                        className={`w-7 h-7 rounded-full border border-[#E2E2E2] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C39AD3] ${sameColor(swatch, value) ? 'ring-2 ring-offset-2 ring-[#5C2472]' : ''}`}
                    />
                ))}
                {allowCustom && (
                    <label htmlFor={id} title="Elegir otro color" className="relative w-7 h-7 rounded-full cursor-pointer bg-[conic-gradient(#EA4336,#FF8300,#F2B705,#34A853,#1F4E79,#5C2472,#EA4336)]">
                        <span className="sr-only">Elegir otro color para {label.toLowerCase()}</span>
                        <input
                            id={id}
                            type="color"
                            value={value}
                            onChange={(event) => onChange(event.target.value.toUpperCase())}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </label>
                )}
            </div>
        </div>
    );
};
