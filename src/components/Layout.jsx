export default function Layout({ children }) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-header-title">MHI 289A</span>
        <span className="app-header-sub">Week 5 Lab — Working With AI</span>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
