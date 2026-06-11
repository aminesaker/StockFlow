import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { AppSidebar } from '@/components/app/app-sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: stores } = await supabase
    .from('stores')
    .select('id, name')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
  const currentStore = (await cookies()).get('NEXT_STORE')?.value ?? 'all'

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <AppSidebar userEmail={user.email ?? ''} stores={stores ?? []} currentStore={currentStore} />
      <main className="flex-1 overflow-auto">
        <div className="p-6 pt-16 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
