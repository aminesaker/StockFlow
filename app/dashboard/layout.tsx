import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppSidebar } from '@/components/app/app-sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <AppSidebar userEmail={user.email ?? ''} />
      <main className="flex-1 overflow-auto">
        <div className="p-6 pt-16 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
