import { Sidebar } from './Sidebar'
import { RouteGuard } from '@/components/auth/RouteGuard'

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard>
      <div className="flex min-h-screen bg-bg-dark">
        <Sidebar />
        <main className="flex-1 ml-56 min-h-screen">
          {children}
        </main>
      </div>
    </RouteGuard>
  )
}
