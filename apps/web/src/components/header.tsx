'use client';

import { useRouter } from 'next/navigation';
import { Building2, LogOut, MonitorSmartphone, PanelLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SyncStatus } from '@/components/sync-status';
import { useAuth } from '@/lib/auth';
import { useSidebar } from '@/lib/sidebar';

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Header() {
  const { session, logout } = useAuth();
  const { toggleCollapsed, openMobile } = useSidebar();
  const router = useRouter();
  if (!session) return null;

  const onLogout = () => {
    logout();
    router.replace('/login');
  };

  // Below md the button opens the mobile drawer; at md and up it toggles the
  // desktop rail's collapsed state.
  const onToggleNav = () => {
    if (window.matchMedia('(min-width: 768px)').matches) toggleCollapsed();
    else openMobile();
  };

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-border bg-surface px-4 md:px-6">
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <Button variant="ghost" size="icon" onClick={onToggleNav} aria-label="Toggle navigation">
          <PanelLeft className="h-5 w-5" />
        </Button>
        <span className="flex items-center gap-1.5">
          <Building2 className="h-4 w-4" />
          {session.branchName}
        </span>
        <span className="hidden items-center gap-1.5 sm:flex">
          <MonitorSmartphone className="h-4 w-4" />
          {session.registerName}
        </span>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <SyncStatus />
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">
            {initials(session.user.name)}
          </span>
          <div className="hidden leading-tight sm:block">
            <div className="text-sm font-medium">{session.user.name}</div>
            <div className="text-xs capitalize text-muted-foreground">
              {session.user.role.toLowerCase()}
            </div>
          </div>
        </div>
        <Button variant="outline" size="icon" onClick={onLogout} aria-label="Log out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
