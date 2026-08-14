import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function AppLayout() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Header />
      <Sidebar />
      <main
        id="main-content"
        style={{
          marginLeft: 'var(--sidebar-width)',
          marginTop: 'var(--header-height)',
          padding: 'var(--space-8)',
          maxWidth: 'var(--content-max-width)',
          minHeight: 'calc(100vh - var(--header-height))',
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
