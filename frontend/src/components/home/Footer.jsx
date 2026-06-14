export default function Footer() {
  return (
    <footer className="py-10 bg-slate-900 text-slate-400 text-center">
      <div className="max-w-7xl mx-auto px-6">
        <p>&copy; {new Date().getFullYear()} Suraksha. All rights reserved.</p>
      </div>
    </footer>
  );
}
