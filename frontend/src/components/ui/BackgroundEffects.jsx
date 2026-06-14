const BackgroundEffects = () => {
  return (
    <>
      <div className="fixed inset-0 -z-10 bg-[#050816]" />

      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-pink-500/20 blur-[140px] rounded-full -z-10" />

      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/20 blur-[140px] rounded-full -z-10" />

      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent_60%)] -z-10" />
    </>
  );
};

export default BackgroundEffects;
