"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Users, MapPin, Clock, AlertTriangle, CheckCircle2, Navigation, Plus, Bell } from "lucide-react"
import { useState } from "react"
import { AddTaskDialog } from "@/components/add-task-dialog"

interface Manager {
  id: string
  full_name: string | null
  email: string
}

interface Schedule {
  id: string
  schedule_date: string
  actual_start_time: string | null
  actual_end_time: string | null
  status: string
  profiles: {
    id: string
    full_name: string | null
    email: string
  }
}

interface Appointment {
  id: string
  title: string
  scheduled_time: string | null
  status: string
  manager_id: string
  properties: {
    name: string
    address: string
    city: string
  }
  profiles: {
    id: string
    full_name: string | null
  }
}

interface VisitLog {
  id: string
  arrival_time: string
  departure_time: string | null
  notes: string | null
  appointments: {
    title: string
  }
  properties: {
    name: string
    city: string
  }
  profiles: {
    full_name: string | null
  }
}

interface EmailAlert {
  id: string
  alert_type: string
  sent_at: string
  message: string
  profiles: {
    full_name: string | null
  }
  appointments: {
    title: string
  } | null
}

interface AdminTrackingViewProps {
  profile: {
    id: string
    full_name: string | null
  } | null
  managers: Manager[]
  schedules: Schedule[]
  appointments: Appointment[]
  recentVisits: VisitLog[]
  recentAlerts: EmailAlert[]
}

export function AdminTrackingView({
  profile,
  managers,
  schedules,
  appointments,
  recentVisits,
  recentAlerts,
}: AdminTrackingViewProps) {
  const [selectedManager, setSelectedManager] = useState<string | null>(null)
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false)

  const getManagerStatus = (managerId: string) => {
    const schedule = schedules.find((s) => s.profiles.id === managerId)
    if (!schedule) return { status: "Not Started", color: "bg-gray-500" }
    if (schedule.status === "in_progress") return { status: "Active", color: "bg-green-500" }
    if (schedule.status === "completed") return { status: "Completed", color: "bg-blue-500" }
    return { status: "Pending", color: "bg-yellow-500" }
  }

  const getManagerAppointments = (managerId: string) => {
    return appointments.filter((a) => a.manager_id === managerId)
  }

  const getCurrentLocation = (managerId: string) => {
    const activeVisit = recentVisits.find((v) => v.profiles && v.profiles.full_name && !v.departure_time)
    if (activeVisit) {
      return `${activeVisit.properties.name}, ${activeVisit.properties.city}`
    }
    return "Unknown"
  }

  const activeManagers = schedules.filter((s) => s.status === "in_progress")
  const pendingAlerts = recentAlerts.filter((a) => a.alert_type === "Running Late")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Tracking Dashboard</h1>
          <p className="text-muted-foreground">Monitor property managers in real-time</p>
        </div>
        <Button onClick={() => setShowAddTaskDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Task to Manager
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Managers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{activeManagers.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{appointments.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed Visits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{recentVisits.filter((v) => v.departure_time).length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{pendingAlerts.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      {pendingAlerts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Active Alerts</AlertTitle>
          <AlertDescription>
            {pendingAlerts.length} manager(s) are running late or have schedule issues
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="managers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="managers">Managers</TabsTrigger>
          <TabsTrigger value="visits">Recent Visits</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="managers" className="space-y-4">
          {managers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No managers found</p>
              </CardContent>
            </Card>
          ) : (
            managers.map((manager) => {
              const status = getManagerStatus(manager.id)
              const managerAppointments = getManagerAppointments(manager.id)
              const completedCount = managerAppointments.filter((a) => a.status === "completed").length
              const currentLocation = getCurrentLocation(manager.id)

              return (
                <Card key={manager.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{manager.full_name || "Unknown Manager"}</CardTitle>
                        <CardDescription>{manager.email}</CardDescription>
                      </div>
                      <Badge className={status.color}>{status.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Current Location</p>
                          <p className="text-sm text-muted-foreground">{currentLocation}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Navigation className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Appointments</p>
                          <p className="text-sm text-muted-foreground">
                            {completedCount} of {managerAppointments.length} completed
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Status</p>
                          <p className="text-sm text-muted-foreground">
                            {status.status === "Active" ? "Working" : "Not active"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {managerAppointments.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 text-sm">Today's Appointments</h4>
                        <div className="space-y-2">
                          {managerAppointments.map((apt) => (
                            <div key={apt.id} className="flex items-center justify-between text-sm border rounded p-2">
                              <div className="flex items-center gap-2">
                                {apt.status === "completed" ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : apt.status === "in_progress" ? (
                                  <Clock className="h-4 w-4 text-blue-500" />
                                ) : (
                                  <Clock className="h-4 w-4 text-gray-400" />
                                )}
                                <span>{apt.title}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">{apt.properties.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {apt.scheduled_time || "Flexible"}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedManager(manager.id)
                        setShowAddTaskDialog(true)
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Task
                    </Button>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        <TabsContent value="visits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Visits</CardTitle>
              <CardDescription>Latest property visits by all managers</CardDescription>
            </CardHeader>
            <CardContent>
              {recentVisits.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No visits recorded today</p>
              ) : (
                <div className="space-y-3">
                  {recentVisits.map((visit) => (
                    <div key={visit.id} className="flex items-start justify-between border rounded p-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {visit.departure_time ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-blue-500" />
                          )}
                          <span className="font-medium">{visit.appointments.title}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span>{visit.profiles?.full_name || "Unknown"}</span> at <span>{visit.properties.name}</span>
                        </div>
                        {visit.notes && <div className="text-sm bg-muted p-2 rounded mt-2">{visit.notes}</div>}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(visit.arrival_time).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>Email alerts sent to supervisors</CardDescription>
            </CardHeader>
            <CardContent>
              {recentAlerts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No alerts today</p>
              ) : (
                <div className="space-y-3">
                  {recentAlerts.map((alert) => (
                    <div key={alert.id} className="border rounded p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4 text-orange-500" />
                          <span className="font-medium">{alert.alert_type}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(alert.sent_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Manager: {alert.profiles?.full_name || "Unknown"}
                      </p>
                      {alert.appointments && (
                        <p className="text-sm text-muted-foreground mb-2">Appointment: {alert.appointments.title}</p>
                      )}
                      <p className="text-sm bg-muted p-2 rounded">{alert.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddTaskDialog
        open={showAddTaskDialog}
        onOpenChange={setShowAddTaskDialog}
        managerId={selectedManager}
        managers={managers}
      />
    </div>
  )
}
