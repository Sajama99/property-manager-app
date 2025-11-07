import { redirect } from "next/navigation"
import { createClient } from "@/supabaseServer"
import { ScheduleView } from "@/components/schedule-view"
import { DashboardHeader } from "@/components/dashboard-header"
import { NotificationManager } from "@/components/notification-manager"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle()

  // Get today's schedule
  const today = new Date().toISOString().split("T")[0]
  const { data: todaySchedule } = await supabase
    .from("daily_schedules")
    .select("*")
    .eq("manager_id", data.user.id)
    .eq("schedule_date", today)
    .maybeSingle()

  // Get today's appointments
  const { data: appointments } = await supabase
    .from("appointments")
    .select(`
      *,
      properties (*)
    `)
    .eq("manager_id", data.user.id)
    .eq("scheduled_date", today)
    .order("scheduled_time", { ascending: true })

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader profile={profile} />
      <NotificationManager profile={profile} />
      <main className="container mx-auto p-6">
        <ScheduleView schedule={todaySchedule} appointments={appointments || []} profile={profile} />
      </main>
    </div>
  )
}
