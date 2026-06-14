const SectionTitle = ({ children, className = '' }) => {
  return (
    <h2 className={`text-xl font-semibold text-[#111827] mb-4 border-b border-gray-100 pb-2 ${className}`}>
      {children}
    </h2>
  );
};

export default SectionTitle;
