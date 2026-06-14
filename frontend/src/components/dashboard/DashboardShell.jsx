const DashboardShell = ({ children }) => {
  return (
    <div className="ml-[280px] min-h-screen">
      <main className="p-8 lg:p-10">
        {children}
      </main>
    </div>
  );
};

export default DashboardShell;