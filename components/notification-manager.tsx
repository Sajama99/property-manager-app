"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface NotificationManagerProps {
  profile: {
    id: string
    full_name: string | null
  } | null
}

export function NotificationManager({ profile }: NotificationManagerProps) {
  const [hasPermission, setHasPermission] = useState(false)
  const { toast } = useToast()
  const supabase = createBrowserClient()

  useEffect(() => {
    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        setHasPermission(permission === "granted")
      })
    } else if ("Notification" in window && Notification.permission === "granted") {
      setHasPermission(true)
    }
  }, [])

  useEffect(() => {
    if (!profile?.id) return

    const checkSchedule = async () => {
      const today = new Date().toISOString().split("T")[0]
      const now = new Date()

      // Get today's appointments
      const { data: appointments } = await supabase
        .from("appointments")
        .select(`
          *,
          properties (
            name,
            address,
            city
          )
        `)
        .eq("manager_id", profile.id)
        .eq("appointment_date", today)
        .eq("is_time_specific", true)

      if (!appointments) return

      // Check each time-specific appointment
      for (const appointment of appointments) {
        if (!appointment.scheduled_time) continue

        const scheduledDateTime = new Date()
        const [hours, minutes] = appointment.scheduled_time.split(":")
        scheduledDateTime.setHours(Number.parseInt(hours), Number.parseInt(minutes), 0, 0)

        // Calculate when to leave (assuming 20 min drive time - in production, use actual route data)
        const leaveByTime = new Date(scheduledDateTime.getTime() - 20 * 60000)
        const minutesUntilLeave = (leaveByTime.getTime() - now.getTime()) / 60000

        // Send notification 15 minutes before need to leave
        if (minutesUntilLeave > 0 && minutesUntilLeave <= 15) {
          const notificationSent = localStorage.getItem(`notification_${appointment.id}_${today}`)

          if (!notificationSent) {
            // Send browser notification
            if (hasPermission) {
              new Notification("Time to Leave Soon!", {
                body: `You need to leave in ${Math.round(minutesUntilLeave)} minutes for ${appointment.properties.name}`,
                icon: "/icon.png",
              })
            }

            // Show toast notification
            toast({
              title: "Departure Reminder",
              description: `Leave in ${Math.round(minutesUntilLeave)} minutes for ${appointment.properties.name}`,
            })

            // Mark notification as sent
            localStorage.setItem(`notification_${appointment.id}_${today}`, "true")
          }
        }

        // Check if running late
        if (appointment.status === "pending" && now > scheduledDateTime) {
          const lateNotificationSent = localStorage.getItem(`late_${appointment.id}_${today}`)

          if (!lateNotificationSent) {
            // Send email alert to supervisors
            await fetch("/api/send-alert", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "Running Late",
                appointmentId: appointment.id,
                message: `${profile.full_name} is running late for appointment at ${appointment.properties.name}. Scheduled time was ${appointment.scheduled_time}.`,
                managerName: profile.full_name,
              }),
            })

            toast({
              title: "Running Late Alert",
              description: "Supervisors have been notified that you are running late.",
              variant: "destructive",
            })

            localStorage.setItem(`late_${appointment.id}_${today}`, "true")
          }
        }
      }
    }

    // Check schedule every minute
    checkSchedule()
    const interval = setInterval(checkSchedule, 60000)

    return () => clearInterval(interval)
  }, [profile, hasPermission, toast, supabase])

  return null // This is a background component
}
