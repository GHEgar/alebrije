export const Section = ({ title, children }) => (
    <section className="flex flex-col gap-4 py-5 border-b border-[#E2E2E2] last:border-b-0">
        <h2 className="font-garetbold text-base text-[#5C2472]">{title}</h2>
        {children}
    </section>
);
