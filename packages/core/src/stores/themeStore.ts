import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
  initTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDarkMode: false,
      toggleTheme: () => {
        const newTheme = !get().isDarkMode;
        set({ isDarkMode: newTheme });
        applyTheme(newTheme);
      },
      initTheme: () => {
        applyTheme(get().isDarkMode);
      }
    }),
    {
      name: 'klinflow-theme-state-v3',
      onRehydrateStorage: () => (state) => {
        if (state) state.initTheme();
      }
    }
  )
);

function applyTheme(isDark: boolean) {
  if (typeof document === 'undefined') return;
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
