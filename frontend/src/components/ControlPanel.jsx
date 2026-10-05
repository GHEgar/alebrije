import {
    BUILD_RANGE, CLOTH_COLORS, HAIR_COLORS, HAIR_STYLES, HEAD_SHAPES, HEIGHT_RANGE, SKIN_TONES,
} from '@/avatar/definition';
import { Chip } from './Chip';
import { ChipGroup } from './ChipGroup';
import { ColorField } from './ColorField';
import { FieldLabel } from './FieldLabel';
import { RangeField } from './RangeField';
import { Section } from './Section';

const buildLabel = (value) => {
    if (value < 0.34) return 'Delgada';
    if (value < 0.67) return 'Media';
    return 'Robusta';
};

export const ControlPanel = ({ avatar, onChange }) => {
    const set = (group, key) => (value) => onChange({
        ...avatar,
        [group]: { ...avatar[group], [key]: value },
    });
    const { body, head, hair, clothes, accessories } = avatar;
    return (
        <div className="flex flex-col px-5">
            <Section title="Cuerpo">
                <RangeField
                    label="Estatura"
                    tooltip="En metros. El avatar se exporta a escala real."
                    range={HEIGHT_RANGE}
                    value={body.height}
                    format={(value) => `${value.toFixed(2)} m`}
                    onChange={set('body', 'height')}
                />
                <RangeField
                    label="Complexión"
                    range={BUILD_RANGE}
                    value={body.build}
                    format={buildLabel}
                    onChange={set('body', 'build')}
                />
                <ColorField
                    label="Tono de piel"
                    swatches={SKIN_TONES}
                    value={body.skinTone}
                    onChange={set('body', 'skinTone')}
                />
            </Section>
            <Section title="Cabeza">
                <ChipGroup label="Forma" options={HEAD_SHAPES} value={head.shape} onChange={set('head', 'shape')} />
                <ChipGroup label="Peinado" options={HAIR_STYLES} value={hair.style} onChange={set('hair', 'style')} />
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
                <div className="flex flex-col gap-2">
                    <FieldLabel label="Complementos" tooltip="Puedes usar ambos a la vez." />
                    <div role="group" aria-label="Complementos" className="flex flex-wrap gap-2">
                        <Chip label="Lentes" active={accessories.glasses} onClick={() => set('accessories', 'glasses')(!accessories.glasses)} />
                        <Chip label="Gorra" active={accessories.cap} onClick={() => set('accessories', 'cap')(!accessories.cap)} />
                    </div>
                </div>
                {accessories.cap && (
                    <ColorField label="Color de gorra" swatches={CLOTH_COLORS} value={accessories.capColor} onChange={set('accessories', 'capColor')} />
                )}
            </Section>
        </div>
    );
};
