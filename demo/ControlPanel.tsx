import {
    BUILD_RANGE, CLOTH_COLORS, HAIR_COLORS, HAIR_STYLES, HEAD_SHAPES, HEIGHT_RANGE, SKIN_TONES,
    type AvatarDefinition, type HairStyle, type HeadShape,
} from 'alebrije';
import { ChipGroup, ColorField, RangeField, Section } from './fields';

const SHAPE_LABELS: Record<HeadShape, string> = { round: 'Redonda', oval: 'Ovalada', square: 'Cuadrada' };
const HAIR_LABELS: Record<HairStyle, string> = { none: 'Sin cabello', short: 'Corto', long: 'Largo', bun: 'Chongo' };

const buildLabel = (value: number): string => {
    if (value < 0.34) return 'Delgada';
    if (value < 0.67) return 'Media';
    return 'Robusta';
};

type Groups = Omit<AvatarDefinition, 'version'>;

interface ControlPanelProps {
    avatar: AvatarDefinition;
    onChange: (avatar: AvatarDefinition) => void;
}

export function ControlPanel({ avatar, onChange }: ControlPanelProps) {
    const set = <G extends keyof Groups, K extends keyof Groups[G]>(group: G, key: K) => (value: Groups[G][K]) => onChange({
        ...avatar,
        [group]: { ...avatar[group], [key]: value },
    });
    const { body, head, hair, clothes, accessories } = avatar;
    return (
        <div className="controls">
            <Section title="Cuerpo">
                <RangeField
                    label="Estatura"
                    hint="En metros: el avatar se exporta a escala real."
                    range={HEIGHT_RANGE}
                    value={body.height}
                    format={(value) => `${value.toFixed(2)} m`}
                    onChange={set('body', 'height')}
                />
                <RangeField label="Complexión" range={BUILD_RANGE} value={body.build} format={buildLabel} onChange={set('body', 'build')} />
                <ColorField label="Tono de piel" swatches={SKIN_TONES} value={body.skinTone} onChange={set('body', 'skinTone')} />
            </Section>
            <Section title="Cabeza">
                <ChipGroup label="Forma" options={HEAD_SHAPES} labels={SHAPE_LABELS} value={head.shape} onChange={set('head', 'shape')} />
                <ChipGroup label="Peinado" options={HAIR_STYLES} labels={HAIR_LABELS} value={hair.style} onChange={set('hair', 'style')} />
                {hair.style !== 'none' && (
                    <ColorField label="Color de cabello" swatches={HAIR_COLORS} value={hair.color} onChange={set('hair', 'color')} />
                )}
            </Section>
            <Section title="Ropa">
                <ColorField label="Playera" swatches={CLOTH_COLORS} value={clothes.shirt} onChange={set('clothes', 'shirt')} />
                <ColorField label="Pantalón" swatches={CLOTH_COLORS} value={clothes.pants} onChange={set('clothes', 'pants')} />
                <ColorField label="Zapatos" swatches={CLOTH_COLORS} value={clothes.shoes} onChange={set('clothes', 'shoes')} />
            </Section>
            <Section title="Accesorios">
                <div role="group" aria-label="Complementos" className="chips">
                    <button type="button" className="chip" aria-pressed={accessories.glasses} onClick={() => set('accessories', 'glasses')(!accessories.glasses)}>Lentes</button>
                    <button type="button" className="chip" aria-pressed={accessories.cap} onClick={() => set('accessories', 'cap')(!accessories.cap)}>Gorra</button>
                </div>
                {accessories.cap && (
                    <ColorField label="Color de gorra" swatches={CLOTH_COLORS} value={accessories.capColor} onChange={set('accessories', 'capColor')} />
                )}
            </Section>
        </div>
    );
}
