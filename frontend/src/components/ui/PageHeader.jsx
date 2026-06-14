const PageHeader = ({ title, description, className = '', children }) => {
  return (
    <div className={`mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 ${className}`}>
      <div>
        <h1 className="text-3xl font-bold text-[#111827] tracking-tight">{title}</h1>
        {description && <p className="text-gray-500 mt-2 text-lg">{description}</p>}
      </div>
      {children && (
        <div className="flex items-center gap-3">
          {children}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
