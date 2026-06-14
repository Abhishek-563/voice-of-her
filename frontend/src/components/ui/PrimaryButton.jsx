const PrimaryButton = ({ children, className = "", ...props }) => {
  return (
    <button
      {...props}
      className={`
        px-6 py-4 rounded-2xl
        font-semibold
        transition-all duration-300
        bg-gradient-to-r
        from-pink-500
        via-fuchsia-500
        to-purple-600
        hover:scale-[1.02]
        active:scale-[0.98]
        shadow-[0_0_30px_rgba(255,46,154,0.35)]
        ${className}
      `}
    >
      {children}
    </button>
  );
};

export default PrimaryButton;
