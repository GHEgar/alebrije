import {
    BUILD_RANGE, CLOTH_COLORS, HAIR_COLORS, HAIR_STYLES, HEAD_SHAPES, HEIGHT_RANGE, SKIN_TONES,
    type AvatarDefinition, type HairStyle, type HeadShape,
} from 'alebrije';
import { ChipGroup, ColorField, RangeField, Section } from './fields';

const SHAPE_LABELS: Record<HeadShape, string> = { round: 'Round', oval: 'Oval', square: 'Square' };
const HAIR_LABELS: Record<HairStyle, string> = { none: 'No hair', short: 'Short', long: 'Long', bun: 'Bun' };

const buildLabel = (value: number): string => {
    if (value < 0.34) return 'Slim';
    if (value < 0.67) return 'Medium';
    return 'Sturdy';
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
            <Section title="Body">
                <RangeField
                    label="Height"
                    hint="In meters: the avatar is exported at real scale."
                    range={HEIGHT_RANGE}
                    value={body.height}
                    format={(value) => `${value.toFixed(2)} m`}
                    onChange={set('body', 'height')}
                />
                <RangeField label="Build" range={BUILD_RANGE} value={body.build} format={buildLabel} onChange={set('body', 'build')} />
                <ColorField label="Skin tone" swatches={SKIN_TONES} value={body.skinTone} onChange={set('body', 'skinTone')} />
            </Section>
            <Section title="Head">
                <ChipGroup label="Shape" options={HEAD_SHAPES} labels={SHAPE_LABELS} value={head.shape} onChange={set('head', 'shape')} />
                <ChipGroup label="Hairstyle" options={HAIR_STYLES} labels={HAIR_LABELS} value={hair.style} onChange={set('hair', 'style')} />
                {hair.style !== 'none' && (
                    <ColorField label="Hair color" swatches={HAIR_COLORS} value={hair.color} onChange={set('hair', 'color')} />
                )}
            </Section>
            <Section title="Clothes">
                <ColorField label="Shirt" swatches={CLOTH_COLORS} value={clothes.shirt} onChange={set('clothes', 'shirt')} />
                <ColorField label="Pants" swatches={CLOTH_COLORS} value={clothes.pants} onChange={set('clothes', 'pants')} />
                <ColorField label="Shoes" swatches={CLOTH_COLORS} value={clothes.shoes} onChange={set('clothes', 'shoes')} />
            </Section>
            <Section title="Accessories">
                <div role="group" aria-label="Extras" className="chips">
                    <button type="button" className="chip" aria-pressed={accessories.glasses} onClick={() => set('accessories', 'glasses')(!accessories.glasses)}>Glasses</button>
                    <button type="button" className="chip" aria-pressed={accessories.cap} onClick={() => set('accessories', 'cap')(!accessories.cap)}>Cap</button>
                </div>
                {accessories.cap && (
                    <ColorField label="Cap color" swatches={CLOTH_COLORS} value={accessories.capColor} onChange={set('accessories', 'capColor')} />
                )}
            </Section>
        </div>
    );
}
