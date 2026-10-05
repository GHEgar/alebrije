import { InfoTooltip } from './InfoTooltip';

export const FieldLabel = ({ label, htmlFor, tooltip, aside }) => (
    <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
            {htmlFor
                ? <label htmlFor={htmlFor} className="block font-garetmedium text-sm text-[#191919]">{label}</label>
                : <span className="block font-garetmedium text-sm text-[#191919]">{label}</span>}
            <InfoTooltip text={tooltip} />
        </div>
        {aside && <span className="font-garetmedium text-[13px] text-[#5C2472]">{aside}</span>}
    </div>
);
