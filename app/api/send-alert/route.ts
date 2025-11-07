import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/supabaseServer"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { type, appointmentId, message, managerName } = body

    // Get appointment details
    const { data: appointment } = await supabase
      .from("appointments")
      .select(`
        *,
        properties (
          name,
          address,
          city
        )
      `)
      .eq("id", appointmentId)
      .single()

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    // Create email alert record
    const { error: alertError } = await supabase.from("email_alerts").insert({
      manager_id: user.id,
      appointment_id: appointmentId,
      alert_type: type,
      recipient_emails: ["marc@balticsteelmgmt.com", "sara@balticsteelmgmt.com"],
      subject: `Alert: ${type} - ${managerName}`,
      message: message,
      sent_at: new Date().toISOString(),
    })

    if (alertError) {
      console.error("[v0] Error creating email alert:", alertError)
      throw alertError
    }

    // In production, integrate with email service (Resend, SendGrid, etc.)
    // For now, we'll just log the email that would be sent
    console.log("[v0] Email Alert:", {
      to: ["marc@balticsteelmgmt.com", "sara@balticsteelmgmt.com"],
      subject: `Alert: ${type} - ${managerName}`,
      body: `
        Manager: ${managerName}
        Alert Type: ${type}
        Appointment: ${appointment.title}
        Property: ${appointment.properties.name}
        Address: ${appointment.properties.address}, ${appointment.properties.city}
        Time: ${appointment.scheduled_time || "Flexible"}
        
        Message: ${message}
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error sending alert:", error)
    return NextResponse.json({ error: "Failed to send alert" }, { status: 500 })
  }
}
