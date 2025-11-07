import { createServerClient } from "@/supabaseServer"
import { redirect } from "next/navigation"
import { ReportsView } from "@/components/reports-view"
import { DashboardHeader } from "@/components/dashboard-header"

export default async function ReportsPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

  // Get current week's date range
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)

  // Get daily schedules for the week
  const { data: dailySchedules } = await supabase
    .from("daily_schedules")
    .select("*")
    .eq("manager_id", user.id)
    .gte("schedule_date", startOfWeek.toISOString().split("T")[0])
    .lte("schedule_date", endOfWeek.toISOString().split("T")[0])
    .order("schedule_date", { ascending: false })

  // Get visit logs for the week
  const { data: visitLogs } = await supabase
    .from("visit_logs")
    .select(`
      *,
      appointments (
        title,
        scheduled_time,
        estimated_duration_minutes
      ),
      properties (
        name,
        address,
        city
      )
    `)
    .eq("manager_id", user.id)
    .gte("arrival_time", startOfWeek.toISOString())
    .lte("arrival_time", endOfWeek.toISOString())
    .order("arrival_time", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader profile={profile} />
      <main className="container mx-auto p-6">
        <ReportsView
          profile={profile}
          dailySchedules={dailySchedules || []}
          visitLogs={visitLogs || []}
          startOfWeek={startOfWeek}
          endOfWeek={endOfWeek}
        />
      </main>
    </div>
  )
}
