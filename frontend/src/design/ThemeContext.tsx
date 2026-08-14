import { createContext, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Theme } from './theme';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => undefined,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Light-only — no toggle, no localStorage persistence
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('bk-theme-ready');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: 'light', toggleTheme: () => undefined }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

// ThemeToggle kept as a no-op export so existing imports don't break
interface ThemeToggleProps {
  className?: string;
  style?: React.CSSProperties;
}

export function ThemeToggle(_props: ThemeToggleProps) {
  return null;
}
