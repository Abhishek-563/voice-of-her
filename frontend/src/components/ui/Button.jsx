const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyles = 'px-4 py-2 rounded-md font-medium transition-colors duration-200 inline-flex items-center justify-center';
  const variants = {
    primary: 'bg-[#E91E63] text-white hover:opacity-90',
    secondary: 'bg-[#7C3AED] text-white hover:opacity-90',
    danger: 'bg-[#EF4444] text-white hover:opacity-90',
    success: 'bg-[#22C55E] text-white hover:opacity-90',
    outline: 'border-2 border-[#E91E63] text-[#E91E63] hover:bg-pink-50',
    ghost: 'text-[#111827] hover:bg-gray-100'
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant] || variants.primary} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
