import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type ThemeName = 'neumorph-dark' | 'neumorph-lavender' | 'retro';

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const VALID_THEMES: ThemeName[] = ['neumorph-dark', 'neumorph-lavender', 'retro'];

const ThemeContext = createContext<ThemeContextType>({
  theme: 'neumorph-dark',
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>(() => {
    const saved = localStorage.getItem('taskly-theme') as ThemeName;
    return VALID_THEMES.includes(saved) ? saved : 'neumorph-dark';
  });

  useEffect(() => {
    localStorage.setItem('taskly-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
