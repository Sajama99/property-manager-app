"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface EndVisitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: {
    id: string
    title: string
    properties: {
      name: string
    }
  }
  visitLog: {
    id: string
    arrival_time: string
  }
}

export function EndVisitDialog({ open, onOpenChange, appointment, visitLog }: EndVisitDialogProps) {
  const [notes, setNotes] = useState("")
  const [nextLocation, setNextLocation] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createBrowserClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log("[v0] Form submitted")
    console.log("[v0] Notes:", notes)
    console.log("[v0] Next location:", nextLocation)

    if (!notes.trim()) {
      console.log("[v0] Validation failed: notes empty")
      toast({
        title: "Missing Information",
        description: "Please add notes about your visit.",
        variant: "destructive",
      })
      return
    }

    if (!nextLocation.trim()) {
      console.log("[v0] Validation failed: next location empty")
      toast({
        title: "Missing Information",
        description: "Please specify where you are heading next.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    console.log("[v0] Starting to complete visit for appointment:", appointment.id)
    console.log("[v0] Visit log ID:", visitLog.id)

    try {
      const now = new Date().toISOString()

      // Update visit log with departure time, notes, and next location
      console.log("[v0] Updating visit log...")
      const { error: visitError } = await supabase
        .from("visit_logs")
        .update({
          departure_time: now,
          notes: notes.trim(),
          next_location: nextLocation.trim(),
        })
        .eq("id", visitLog.id)

      if (visitError) {
        console.error("[v0] Error updating visit log:", visitError)
        throw visitError
      }

      console.log("[v0] Visit log updated successfully")

      // Update appointment status
      console.log("[v0] Updating appointment status...")
      const { error: appointmentError } = await supabase
        .from("appointments")
        .update({ status: "completed" })
        .eq("id", appointment.id)

      if (appointmentError) {
        console.error("[v0] Error updating appointment:", appointmentError)
        throw appointmentError
      }

      console.log("[v0] Appointment status updated to completed")

      // Calculate time spent
      const arrivalTime = new Date(visitLog.arrival_time)
      const departureTime = new Date(now)
      const minutesSpent = Math.round((departureTime.getTime() - arrivalTime.getTime()) / (1000 * 60))

      toast({
        title: "Visit Completed",
        description: `Visit at ${appointment.properties.name} completed. Time spent: ${minutesSpent} minutes`,
      })

      // Reset form and close dialog
      console.log("[v0] Resetting form and closing dialog")
      setNotes("")
      setNextLocation("")
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error("[v0] Failed to end visit:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to end visit. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCompleteClick = async () => {
    console.log("[v0] Complete button clicked")
    console.log("[v0] Notes:", notes)
    console.log("[v0] Next location:", nextLocation)

    if (!notes.trim()) {
      console.log("[v0] Validation failed: notes empty")
      toast({
        title: "Missing Information",
        description: "Please add notes about your visit.",
        variant: "destructive",
      })
      return
    }

    if (!nextLocation.trim()) {
      console.log("[v0] Validation failed: next location empty")
      toast({
        title: "Missing Information",
        description: "Please specify where you are heading next.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    console.log("[v0] Starting to complete visit for appointment:", appointment.id)
    console.log("[v0] Visit log ID:", visitLog.id)

    try {
      const now = new Date().toISOString()

      // Update visit log with departure time, notes, and next location
      console.log("[v0] Updating visit log...")
      const { error: visitError } = await supabase
        .from("visit_logs")
        .update({
          departure_time: now,
          notes: notes.trim(),
          next_location: nextLocation.trim(),
        })
        .eq("id", visitLog.id)

      if (visitError) {
        console.error("[v0] Error updating visit log:", visitError)
        throw visitError
      }

      console.log("[v0] Visit log updated successfully")

      // Update appointment status
      console.log("[v0] Updating appointment status...")
      const { error: appointmentError } = await supabase
        .from("appointments")
        .update({ status: "completed" })
        .eq("id", appointment.id)

      if (appointmentError) {
        console.error("[v0] Error updating appointment:", appointmentError)
        throw appointmentError
      }

      console.log("[v0] Appointment status updated to completed")

      // Calculate time spent
      const arrivalTime = new Date(visitLog.arrival_time)
      const departureTime = new Date(now)
      const minutesSpent = Math.round((departureTime.getTime() - arrivalTime.getTime()) / (1000 * 60))

      toast({
        title: "Visit Completed",
        description: `Visit at ${appointment.properties.name} completed. Time spent: ${minutesSpent} minutes`,
      })

      // Reset form and close dialog
      console.log("[v0] Resetting form and closing dialog")
      setNotes("")
      setNextLocation("")
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error("[v0] Failed to end visit:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to end visit. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>End Visit - {appointment.properties.name}</DialogTitle>
          <DialogDescription>Add notes about your visit before completing it.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Visit Notes *</Label>
            <Textarea
              id="notes"
              placeholder="What did you do during this visit? Any issues or observations?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
            />
            <p className="text-sm text-muted-foreground">Describe what you accomplished during this visit</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nextLocation">Where are you headed next? *</Label>
            <Input
              id="nextLocation"
              placeholder="Enter your next destination"
              value={nextLocation}
              onChange={(e) => setNextLocation(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">Required: Specify where you're going after this visit</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="button" onClick={handleCompleteClick} disabled={isSubmitting}>
              {isSubmitting ? "Completing..." : "Complete Visit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
