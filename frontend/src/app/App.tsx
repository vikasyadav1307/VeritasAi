import { Providers } from './Providers';
import { Router } from './Router';

export function App() {
  return (
    <Providers>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Router />
    </Providers>
  );
}
