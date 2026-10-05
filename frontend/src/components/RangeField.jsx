import { useId } from 'react';
import { FieldLabel } from './FieldLabel';

export const RangeField = ({ label, tooltip, range, value, format, onChange }) => {
    const id = useId();
    return (
        <div className="flex flex-col gap-2">
            <FieldLabel label={label} htmlFor={id} tooltip={tooltip} aside={format(value)} />
            <input
                id={id}
                type="range"
                min={range.min}
                max={range.max}
                step={range.step}
                value={value}
                onChange={(event) => onChange(Number(event.target.value))}
                className="w-full h-2 rounded-full bg-[#F0E2F5] accent-[#5C2472] cursor-pointer"
            />
        </div>
    );
};
