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
            <div className="flex min-h-screen">
              <Sidebar />
              <div className="flex min-w-0 flex-1 flex-col">
                <Header />
                <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
              </div>
            </div>
          </ReturnDraftProvider>
        </PosCartProvider>
      </SidebarProvider>
    </Protected>
  );
}
