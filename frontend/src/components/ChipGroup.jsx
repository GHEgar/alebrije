import { Chip } from './Chip';
import { FieldLabel } from './FieldLabel';

export const ChipGroup = ({ label, tooltip, options, value, onChange }) => (
    <div className="flex flex-col gap-2">
        <FieldLabel label={label} tooltip={tooltip} />
        <div role="group" aria-label={label} className="flex flex-wrap gap-2">
            {options.map((option) => (
                <Chip
                    key={option.value}
                    label={option.label}
                    active={option.value === value}
                    onClick={() => onChange(option.value)}
                />
            ))}
        </div>
    </div>
);
