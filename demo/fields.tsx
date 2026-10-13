import { useId, type ReactNode } from 'react';
import type { Range } from 'alebrije';

export function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="section">
            <h2>{title}</h2>
            {children}
        </section>
    );
}

interface RangeFieldProps {
    label: string;
    hint?: string;
    range: Range;
    value: number;
    format: (value: number) => string;
    onChange: (value: number) => void;
}

export function RangeField({ label, hint, range, value, format, onChange }: RangeFieldProps) {
    const id = useId();
    return (
        <div className="field">
            <div className="label">
                <label htmlFor={id}>{label}</label>
                <output htmlFor={id}>{format(value)}</output>
            </div>
            <input
                id={id}
                type="range"
                min={range.min}
                max={range.max}
                step={range.step}
                value={value}
                onChange={(event) => onChange(Number(event.target.value))}
            />
            {hint && <small>{hint}</small>}
        </div>
    );
}

interface ChipGroupProps<T extends string> {
    label: string;
    options: readonly T[];
    labels: Record<T, string>;
    value: T;
    onChange: (value: T) => void;
}

export function ChipGroup<T extends string>({ label, options, labels, value, onChange }: ChipGroupProps<T>) {
    return (
        <div className="field">
            <span className="label">{label}</span>
            <div role="group" aria-label={label} className="chips">
                {options.map((option) => (
                    <button key={option} type="button" className="chip" aria-pressed={option === value} onClick={() => onChange(option)}>
                        {labels[option]}
                    </button>
                ))}
            </div>
        </div>
    );
}

interface ColorFieldProps {
    label: string;
    swatches: readonly string[];
    value: string;
    onChange: (value: string) => void;
}

const sameColor = (a: string, b: string): boolean => a.toLowerCase() === b.toLowerCase();

export function ColorField({ label, swatches, value, onChange }: ColorFieldProps) {
    const id = useId();
    return (
        <div className="field">
            <span className="label">{label}</span>
            <div role="group" aria-label={label} className="swatches">
                {swatches.map((swatch) => (
                    <button
                        key={swatch}
                        type="button"
                        className="swatch"
                        aria-label={`Color ${swatch}`}
                        aria-pressed={sameColor(swatch, value)}
                        style={{ backgroundColor: swatch }}
                        onClick={() => onChange(swatch)}
                    />
                ))}
                <label htmlFor={id} className="swatch custom" title="Otro color">
                    <span className="sr-only">Otro color para {label.toLowerCase()}</span>
                    <input id={id} type="color" value={value} onChange={(event) => onChange(event.target.value.toUpperCase())} />
                </label>
            </div>
        </div>
    );
}
