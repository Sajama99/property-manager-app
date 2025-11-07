import { createServerClient } from "@/supabaseServer"
import { redirect } from "next/navigation"
import { AdminTrackingView } from "@/components/admin-tracking-view"
import { DashboardHeader } from "@/components/dashboard-header"

export default async function AdminPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

  // Get all managers (for admin view)
  const { data: managers } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "manager")
    .order("full_name", { ascending: true })

  // Get today's schedules for all managers
  const today = new Date().toISOString().split("T")[0]
  const { data: todaySchedules } = await supabase
    .from("daily_schedules")
    .select(`
      *,
      profiles (
        id,
        full_name,
        email
      )
    `)
    .eq("schedule_date", today)

  // Get today's appointments for all managers
  const { data: appointments } = await supabase
    .from("appointments")
    .select(`
      *,
      properties (
        name,
        address,
        city
      ),
      profiles (
        id,
        full_name
      )
    `)
    .eq("appointment_date", today)
    .order("scheduled_time", { ascending: true })

  // Get recent visit logs
  const { data: recentVisits } = await supabase
    .from("visit_logs")
    .select(`
      *,
      appointments (
        title
      ),
      properties (
        name,
        city
      ),
      profiles (
        full_name
      )
    `)
    .gte("arrival_time", `${today}T00:00:00`)
    .order("arrival_time", { ascending: false })
    .limit(20)

  // Get recent email alerts
  const { data: recentAlerts } = await supabase
    .from("email_alerts")
    .select(`
      *,
      profiles (
        full_name
      ),
      appointments (
        title
      )
    `)
    .gte("sent_at", `${today}T00:00:00`)
    .order("sent_at", { ascending: false })
    .limit(10)

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader profile={profile} />
      <main className="container mx-auto p-6">
        <AdminTrackingView
          profile={profile}
          managers={managers || []}
          schedules={todaySchedules || []}
          appointments={appointments || []}
          recentVisits={recentVisits || []}
          recentAlerts={recentAlerts || []}
        />
      </main>
    </div>
  )
}
