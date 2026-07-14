'use client';

import * as React from 'react';

/**
 * Sidebar UI state. The desktop rail can be collapsed to an icon-only strip and
 * that preference persists to localStorage, so it survives reloads. The mobile
 * drawer (`mobileOpen`) is ephemeral navigation state and is deliberately never
 * persisted. Mirrors the hydration pattern in `return-draft.tsx`: read storage
 * in a mount effect and flip a `hydrated` flag so SSR and the first client
 * render agree (avoids a hydration mismatch on the rail width).
 */
const STORAGE_KEY = 'hpos.sidebar.collapsed';

interface SidebarValue {
  /** Desktop rail is collapsed to icons only. Persisted. */
  collapsed: boolean;
  toggleCollapsed: () => void;
  /** Mobile off-canvas drawer is open. Ephemeral. */
  mobileOpen: boolean;
  openMobile: () => void;
  closeMobile: () => void;
  /** True once localStorage has been read on the client. */
  hydrated: boolean;
}

const SidebarContext = React.createContext<SidebarValue | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw != null) setCollapsed(raw === 'true');
    } catch {
      /* ignore malformed / unavailable storage */
    }
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    // Only persist after hydration so the default state never clobbers a
    // stored preference before the mount effect has read it.
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      /* ignore */
    }
  }, [collapsed, hydrated]);

  const value = React.useMemo<SidebarValue>(
    () => ({
      collapsed,
      toggleCollapsed: () => setCollapsed((c) => !c),
      mobileOpen,
      openMobile: () => setMobileOpen(true),
      closeMobile: () => setMobileOpen(false),
      hydrated,
    }),
    [collapsed, mobileOpen, hydrated],
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar(): SidebarValue {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within a SidebarProvider');
  return ctx;
}
