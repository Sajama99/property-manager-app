"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Manager {
  id: string
  full_name: string | null
  email: string
}

interface AddTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  managerId: string | null
  managers: Manager[]
}

export function AddTaskDialog({ open, onOpenChange, managerId, managers }: AddTaskDialogProps) {
  const [selectedManager, setSelectedManager] = useState(managerId || "")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createBrowserClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedManager) {
      toast({
        title: "Error",
        description: "Please select a manager",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const today = new Date().toISOString().split("T")[0]

      // Create a new appointment for the manager
      const { error } = await supabase.from("appointments").insert({
        manager_id: selectedManager,
        title: title,
        description: description,
        appointment_date: today,
        is_time_specific: false,
        estimated_duration_minutes: 30,
        status: "pending",
      })

      if (error) {
        console.error("[v0] Error adding task:", error)
        throw error
      }

      toast({
        title: "Task Added",
        description: "The task has been added to the manager's schedule",
      })

      // Reset form
      setTitle("")
      setDescription("")
      setSelectedManager("")
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error("[v0] Failed to add task:", error)
      toast({
        title: "Error",
        description: "Failed to add task. Please try again.",
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
          <DialogTitle>Add Task to Manager</DialogTitle>
          <DialogDescription>Add a new task or appointment to a property manager's schedule</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="manager">Select Manager *</Label>
            <Select value={selectedManager} onValueChange={setSelectedManager} required>
              <SelectTrigger>
                <SelectValue placeholder="Choose a manager" />
              </SelectTrigger>
              <SelectContent>
                {managers.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.full_name || manager.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Check HVAC system"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Additional details about the task..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
