"use client"

import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Plus, Play, StopCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { AddAppointmentDialog } from "@/components/add-appointment-dialog"
import { EndVisitDialog } from "@/components/end-visit-dialog"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface Appointment {
  id: string
  title: string
  description: string | null
  scheduled_time: string | null
  is_time_specific: boolean
  estimated_duration_minutes: number
  status: string
  properties: {
    id: string
    name: string
    address: string
    city: string
  }
}

interface ScheduleViewProps {
  schedule: {
    id: string
    planned_start_time: string | null
    actual_start_time: string | null
    actual_end_time: string | null
    status: string
  } | null
  appointments: Appointment[]
  profile: {
    id: string
    full_name: string | null
  } | null
}

interface VisitLog {
  id: string
  appointment_id: string
  arrival_time: string
  departure_time: string | null
}

export function ScheduleView({ schedule, appointments, profile }: ScheduleViewProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEndVisitDialog, setShowEndVisitDialog] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<{
    appointment: Appointment
    visitLog: VisitLog
  } | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [isEnding, setIsEnding] = useState(false)
  const [visitLogs, setVisitLogs] = useState<VisitLog[]>([])
  const [startingVisit, setStartingVisit] = useState<string | null>(null)
  const [endingVisit, setEndingVisit] = useState<string | null>(null) // Declare the endingVisit variable
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createBrowserClient()

  useEffect(() => {
    const fetchVisitLogs = async () => {
      if (!profile?.id) return

      const today = new Date().toISOString().split("T")[0]
      const { data, error } = await supabase
        .from("visit_logs")
        .select("*")
        .eq("manager_id", profile.id)
        .gte("arrival_time", `${today}T00:00:00`)
        .lte("arrival_time", `${today}T23:59:59`)

      if (!error && data) {
        setVisitLogs(data)
      }
    }

    fetchVisitLogs()
  }, [profile?.id, supabase])

  const getVisitLog = (appointmentId: string) => {
    return visitLogs.find((log) => log.appointment_id === appointmentId)
  }

  const handleStartVisit = async (appointment: Appointment) => {
    if (!profile?.id) {
      toast({
        title: "Error",
        description: "User profile not found",
        variant: "destructive",
      })
      return
    }

    setStartingVisit(appointment.id)
    console.log("[v0] Starting visit for appointment:", appointment.id)

    try {
      const now = new Date().toISOString()

      // Create visit log
      const { data, error } = await supabase
        .from("visit_logs")
        .insert({
          appointment_id: appointment.id,
          property_id: appointment.properties.id,
          manager_id: profile.id,
          arrival_time: now,
        })
        .select()
        .single()

      if (error) {
        console.error("[v0] Error creating visit log:", error)
        throw error
      }

      // Update appointment status
      await supabase.from("appointments").update({ status: "in_progress" }).eq("id", appointment.id)

      console.log("[v0] Visit started successfully")
      toast({
        title: "Visit Started",
        description: `Started visit at ${appointment.properties.name}`,
      })

      // Update local state
      setVisitLogs([...visitLogs, data])
      router.refresh()
    } catch (error) {
      console.error("[v0] Failed to start visit:", error)
      toast({
        title: "Error",
        description: "Failed to start visit. Please try again.",
        variant: "destructive",
      })
    } finally {
      setStartingVisit(null)
    }
  }

  const handleEndVisit = async (appointment: Appointment, visitLog: VisitLog) => {
    console.log("[v0] Opening end visit dialog for appointment:", appointment.id)
    console.log("[v0] Visit log:", visitLog)
    setSelectedAppointment({ appointment, visitLog })
    setShowEndVisitDialog(true)
  }

  const handleStartDay = async () => {
    if (!profile?.id) {
      toast({
        title: "Error",
        description: "User profile not found",
        variant: "destructive",
      })
      return
    }

    setIsStarting(true)
    console.log("[v0] Starting day for manager:", profile.id)

    try {
      const today = new Date().toISOString().split("T")[0]
      const now = new Date().toISOString()

      if (schedule?.id) {
        // Update existing schedule
        console.log("[v0] Updating existing schedule:", schedule.id)
        const { error } = await supabase
          .from("daily_schedules")
          .update({
            actual_start_time: now,
            status: "in_progress",
            updated_at: now,
          })
          .eq("id", schedule.id)

        if (error) {
          console.error("[v0] Error updating schedule:", error)
          throw error
        }
      } else {
        // Create new schedule
        console.log("[v0] Creating new schedule for date:", today)
        const { error } = await supabase.from("daily_schedules").insert({
          manager_id: profile.id,
          schedule_date: today,
          actual_start_time: now,
          status: "in_progress",
        })

        if (error) {
          console.error("[v0] Error creating schedule:", error)
          throw error
        }
      }

      console.log("[v0] Day started successfully")
      toast({
        title: "Day Started",
        description: "Your workday has begun. Time tracking is now active.",
      })

      // Refresh the page to show updated status
      router.refresh()
    } catch (error) {
      console.error("[v0] Failed to start day:", error)
      toast({
        title: "Error",
        description: "Failed to start day. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsStarting(false)
    }
  }

  const handleEndDay = async () => {
    if (!profile?.id || !schedule?.id) {
      toast({
        title: "Error",
        description: "Cannot end day - no active schedule found",
        variant: "destructive",
      })
      return
    }

    setIsEnding(true)
    console.log("[v0] Ending day for schedule:", schedule.id)

    try {
      const now = new Date().toISOString()

      const { error } = await supabase
        .from("daily_schedules")
        .update({
          actual_end_time: now,
          status: "completed",
          updated_at: now,
        })
        .eq("id", schedule.id)

      if (error) {
        console.error("[v0] Error ending day:", error)
        throw error
      }

      console.log("[v0] Day ended successfully")

      // Calculate total time worked
      if (schedule.actual_start_time) {
        const startTime = new Date(schedule.actual_start_time)
        const endTime = new Date(now)
        const hoursWorked = ((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)).toFixed(1)

        toast({
          title: "Day Completed",
          description: `Your workday has ended. Total time: ${hoursWorked} hours`,
        })
      } else {
        toast({
          title: "Day Completed",
          description: "Your workday has ended.",
        })
      }

      router.refresh()
    } catch (error) {
      console.error("[v0] Failed to end day:", error)
      toast({
        title: "Error",
        description: "Failed to end day. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsEnding(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "in_progress":
        return "bg-blue-500"
      case "delayed":
        return "bg-orange-500"
      default:
        return "bg-gray-500"
    }
  }

  const handleDialogClose = async (open: boolean) => {
    setShowEndVisitDialog(open)
    if (!open) {
      // Dialog closed, refresh visit logs
      console.log("[v0] Dialog closed, refreshing visit logs")
      const today = new Date().toISOString().split("T")[0]
      const { data, error } = await supabase
        .from("visit_logs")
        .select("*")
        .eq("manager_id", profile?.id || "")
        .gte("arrival_time", `${today}T00:00:00`)
        .lte("arrival_time", `${today}T23:59:59`)

      if (!error && data) {
        setVisitLogs(data)
      }
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      {/* Day Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Today&apos;s Schedule</CardTitle>
              <CardDescription>
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Appointment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {schedule?.status === "in_progress" ? (
              <>
                <Badge className="bg-blue-500">Day In Progress</Badge>
                <Button onClick={handleEndDay} disabled={isEnding} variant="destructive">
                  <StopCircle className="mr-2 h-4 w-4" />
                  {isEnding ? "Ending..." : "End Day"}
                </Button>
              </>
            ) : schedule?.status === "completed" ? (
              <Badge className="bg-green-500">Day Completed</Badge>
            ) : (
              <Button onClick={handleStartDay} disabled={isStarting}>
                <Play className="mr-2 h-4 w-4" />
                {isStarting ? "Starting..." : "Start Day"}
              </Button>
            )}
            {schedule?.actual_start_time && (
              <span className="text-sm text-muted-foreground">
                Started at {new Date(schedule.actual_start_time).toLocaleTimeString()}
              </span>
            )}
            {schedule?.actual_end_time && (
              <span className="text-sm text-muted-foreground">
                Ended at {new Date(schedule.actual_end_time).toLocaleTimeString()}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Appointments ({appointments.length})</h2>
        {appointments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">No appointments scheduled for today</p>
              <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
                Add Your First Appointment
              </Button>
            </CardContent>
          </Card>
        ) : (
          appointments.map((appointment) => {
            const visitLog = getVisitLog(appointment.id)
            const isVisitInProgress = visitLog && !visitLog.departure_time

            return (
              <Card key={appointment.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{appointment.title}</h3>
                        <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                        {appointment.is_time_specific && <Badge variant="outline">Time-Specific</Badge>}
                      </div>
                      {appointment.description && (
                        <p className="text-sm text-muted-foreground mb-3">{appointment.description}</p>
                      )}
                      <div className="flex flex-col gap-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {appointment.properties.name} - {appointment.properties.address},{" "}
                            {appointment.properties.city}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>
                            {appointment.scheduled_time
                              ? new Date(`2000-01-01T${appointment.scheduled_time}`).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Flexible time"}{" "}
                            ({appointment.estimated_duration_minutes} min)
                          </span>
                        </div>
                        {visitLog && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>
                              Arrived at {new Date(visitLog.arrival_time).toLocaleTimeString()}
                              {visitLog.departure_time &&
                                ` - Left at ${new Date(visitLog.departure_time).toLocaleTimeString()}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {isVisitInProgress ? (
                        <Button
                          onClick={() => handleEndVisit(appointment, visitLog)}
                          disabled={endingVisit === appointment.id}
                          variant="destructive"
                        >
                          <StopCircle className="mr-2 h-4 w-4" />
                          {endingVisit === appointment.id ? "Ending..." : "End Visit"}
                        </Button>
                      ) : visitLog?.departure_time ? (
                        <Badge className="bg-green-500">Completed</Badge>
                      ) : (
                        <Button
                          onClick={() => handleStartVisit(appointment)}
                          disabled={startingVisit === appointment.id}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          {startingVisit === appointment.id ? "Starting..." : "Start Visit"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <AddAppointmentDialog open={showAddDialog} onOpenChange={setShowAddDialog} managerId={profile?.id || ""} />
      {selectedAppointment && (
        <EndVisitDialog
          open={showEndVisitDialog}
          onOpenChange={handleDialogClose}
          appointment={selectedAppointment.appointment}
          visitLog={selectedAppointment.visitLog}
        />
      )}
    </div>
  )
}
