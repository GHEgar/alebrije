const VARIANTS = {
    primary: 'bg-[#5C2472] text-white hover:shadow-[0px_8px_16px_#4615524D]',
    secondary: 'bg-[#E2E2E2] text-[#465055] hover:bg-[#CECDCD] hover:shadow-[0px_8px_16px_#6E6E6E29]',
    outline: 'bg-transparent text-[#5C2472] border border-[#5C2472] hover:bg-[#FAF5FC]',
};

const DISABLED = 'bg-[#CBCBCB] text-[#5B6670] cursor-not-allowed';

export const Button = ({ label, variant = 'primary', disabled = false, loading = false, onClick, className = '', ...rest }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        aria-busy={loading}
        className={`inline-flex items-center justify-center h-[40px] px-6 rounded-[20px] font-garetbold text-sm cursor-pointer transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C39AD3] ${disabled || loading ? DISABLED : VARIANTS[variant]} ${className}`}
        {...rest}
    >
        {loading ? 'Generando…' : label}
    </button>
);
