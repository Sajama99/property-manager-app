"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { AddPropertyDialog } from "@/components/add-property-dialog"
import { useToast } from "@/hooks/use-toast"

interface AddAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  managerId: string
}

export function AddAppointmentDialog({ open, onOpenChange, managerId }: AddAppointmentDialogProps) {
  const [properties, setProperties] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showPropertyDialog, setShowPropertyDialog] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    propertyId: "",
    scheduledDate: new Date().toISOString().split("T")[0],
    scheduledTime: "",
    isTimeSpecific: false,
    estimatedDuration: 30,
  })
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      loadProperties()
    }
  }, [open])

  const loadProperties = async () => {
    const { data } = await supabase.from("properties").select("*").order("name")
    if (data) setProperties(data)
  }

  const handlePropertyAdded = () => {
    setShowPropertyDialog(false)
    loadProperties()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a title for the appointment",
        variant: "destructive",
      })
      return
    }

    if (!formData.propertyId) {
      toast({
        title: "Validation Error",
        description: "Please select a property",
        variant: "destructive",
      })
      return
    }

    if (formData.isTimeSpecific && !formData.scheduledTime) {
      toast({
        title: "Validation Error",
        description: "Please enter a time for this time-specific appointment",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      console.log("[v0] Creating appointment with data:", {
        manager_id: managerId,
        property_id: formData.propertyId,
        title: formData.title,
        description: formData.description || null,
        scheduled_date: formData.scheduledDate,
        scheduled_time: formData.isTimeSpecific ? formData.scheduledTime : null,
        is_time_specific: formData.isTimeSpecific,
        estimated_duration_minutes: formData.estimatedDuration,
        status: "pending",
      })

      const { data, error } = await supabase
        .from("appointments")
        .insert({
          manager_id: managerId,
          property_id: formData.propertyId,
          title: formData.title,
          description: formData.description || null,
          scheduled_date: formData.scheduledDate,
          scheduled_time: formData.isTimeSpecific ? formData.scheduledTime : null,
          is_time_specific: formData.isTimeSpecific,
          estimated_duration_minutes: formData.estimatedDuration,
          status: "pending",
        })
        .select()

      if (error) {
        console.error("[v0] Supabase error:", error)
        toast({
          title: "Error Creating Appointment",
          description: error.message || "Failed to create appointment. Please try again.",
          variant: "destructive",
        })
        throw error
      }

      console.log("[v0] Appointment created successfully:", data)

      toast({
        title: "Success",
        description: "Appointment created successfully",
      })

      onOpenChange(false)
      router.refresh()

      setFormData({
        title: "",
        description: "",
        propertyId: "",
        scheduledDate: new Date().toISOString().split("T")[0],
        scheduledTime: "",
        isTimeSpecific: false,
        estimatedDuration: 30,
      })
    } catch (error) {
      console.error("[v0] Error creating appointment:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Add Appointment</DialogTitle>
              <DialogDescription>Schedule a new property visit or task</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Monthly inspection"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="property">Property *</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPropertyDialog(true)}
                    className="h-auto p-1 text-xs"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add New
                  </Button>
                </div>
                <Select
                  value={formData.propertyId}
                  onValueChange={(value) => setFormData({ ...formData, propertyId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        No properties yet. Click "Add New" above.
                      </div>
                    ) : (
                      properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name} - {property.city}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional details about this visit"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="duration">Duration (min) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.estimatedDuration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estimatedDuration: Number.parseInt(e.target.value),
                      })
                    }
                    min="5"
                    step="5"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="timeSpecific"
                  checked={formData.isTimeSpecific}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      isTimeSpecific: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="timeSpecific" className="text-sm font-normal">
                  This appointment has a specific time
                </Label>
              </div>
              {formData.isTimeSpecific && (
                <div className="grid gap-2">
                  <Label htmlFor="time">Scheduled Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Appointment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AddPropertyDialog
        open={showPropertyDialog}
        onOpenChange={(open) => {
          setShowPropertyDialog(open)
          if (!open) loadProperties()
        }}
      />
    </>
  )
}
