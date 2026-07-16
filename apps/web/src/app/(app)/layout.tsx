import * as React from 'react';

import { Header } from '@/components/header';
import { Protected } from '@/components/protected';
import { Sidebar } from '@/components/sidebar';
import { PosCartProvider } from '@/lib/pos-cart';
import { ReturnDraftProvider } from '@/lib/return-draft';
import { SidebarProvider } from '@/lib/sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Protected>
      <SidebarProvider>
        <PosCartProvider>
          <ReturnDraftProvider>
            {/* Viewport-locked shell: the app fills the visible viewport height
                (dvh handles the iPad/Safari dynamic toolbar) and never lets the
                document itself scroll. The header stays pinned for every route
                and `main` owns the only vertical scroll — so a page can either
                scroll normally or, like POS, claim the full height and manage
                its own internal scroll regions. */}
            <div className="flex h-dvh overflow-hidden">
              <Sidebar />
              <div className="flex min-w-0 flex-1 flex-col">
                <Header />
                <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
              </div>
            </div>
          </ReturnDraftProvider>
        </PosCartProvider>
      </SidebarProvider>
    </Protected>
  );
}
