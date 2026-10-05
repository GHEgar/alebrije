export const Chip = ({ label, active, onClick, className = '', ...rest }) => (
    <button
        type="button"
        aria-pressed={active}
        onClick={onClick}
        className={`h-[30px] px-4 rounded-[15px] font-garetbold text-[13px] cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C39AD3] ${active ? 'bg-[#FFE9CC] text-[#9E5200] ring-1 ring-[#FF8300]' : 'bg-[#F8F8F8] text-[#465055] hover:bg-[#F0E2F5]'} ${className}`}
        {...rest}
    >
        {label}
    </button>
);
