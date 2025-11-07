"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, MapPin, Calendar, TrendingUp, CheckCircle2 } from "lucide-react"
import { useState } from "react"

interface DailySchedule {
  id: string
  schedule_date: string
  actual_start_time: string | null
  actual_end_time: string | null
  status: string
}

interface VisitLog {
  id: string
  arrival_time: string
  departure_time: string | null
  notes: string | null
  next_location: string | null
  appointments: {
    title: string
    scheduled_time: string | null
    estimated_duration_minutes: number
  }
  properties: {
    name: string
    address: string
    city: string
  }
}

interface ReportsViewProps {
  profile: {
    id: string
    full_name: string | null
  } | null
  dailySchedules: DailySchedule[]
  visitLogs: VisitLog[]
  startOfWeek: Date
  endOfWeek: Date
}

export function ReportsView({ profile, dailySchedules, visitLogs, startOfWeek, endOfWeek }: ReportsViewProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const calculateDayHours = (schedule: DailySchedule) => {
    if (!schedule.actual_start_time || !schedule.actual_end_time) return 0
    const start = new Date(schedule.actual_start_time)
    const end = new Date(schedule.actual_end_time)
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60)
  }

  const calculateVisitDuration = (visitLog: VisitLog) => {
    if (!visitLog.departure_time) return 0
    const arrival = new Date(visitLog.arrival_time)
    const departure = new Date(visitLog.departure_time)
    return (departure.getTime() - arrival.getTime()) / (1000 * 60)
  }

  const getVisitsForDate = (date: string) => {
    return visitLogs.filter((log) => log.arrival_time.startsWith(date))
  }

  const calculateEfficiency = (schedule: DailySchedule, visits: VisitLog[]) => {
    const totalHours = calculateDayHours(schedule)
    if (totalHours === 0) return 0

    const totalVisitMinutes = visits.reduce((sum, visit) => sum + calculateVisitDuration(visit), 0)
    const visitHours = totalVisitMinutes / 60

    // Efficiency = (time spent on visits / total work hours) * 100
    return Math.round((visitHours / totalHours) * 100)
  }

  const weeklyStats = {
    totalDays: dailySchedules.filter((s) => s.status === "completed").length,
    totalHours: dailySchedules.reduce((sum, s) => sum + calculateDayHours(s), 0),
    totalVisits: visitLogs.filter((v) => v.departure_time).length,
    avgEfficiency:
      dailySchedules.length > 0
        ? Math.round(
            dailySchedules.reduce((sum, s) => {
              const visits = getVisitsForDate(s.schedule_date)
              return sum + calculateEfficiency(s, visits)
            }, 0) / dailySchedules.length,
          )
        : 0,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground">
          Week of {startOfWeek.toLocaleDateString()} - {endOfWeek.toLocaleDateString()}
        </p>
      </div>

      {/* Weekly Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Days Worked</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{weeklyStats.totalDays}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{weeklyStats.totalHours.toFixed(1)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Properties Visited</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{weeklyStats.totalVisits}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Efficiency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{weeklyStats.avgEfficiency}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Reports */}
      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">Daily Reports</TabsTrigger>
          <TabsTrigger value="visits">All Visits</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          {dailySchedules.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No work days recorded this week</p>
              </CardContent>
            </Card>
          ) : (
            dailySchedules.map((schedule) => {
              const visits = getVisitsForDate(schedule.schedule_date)
              const efficiency = calculateEfficiency(schedule, visits)
              const totalHours = calculateDayHours(schedule)

              return (
                <Card key={schedule.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>
                          {new Date(schedule.schedule_date).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                          })}
                        </CardTitle>
                        <CardDescription>
                          {schedule.actual_start_time && schedule.actual_end_time
                            ? `${new Date(schedule.actual_start_time).toLocaleTimeString()} - ${new Date(schedule.actual_end_time).toLocaleTimeString()}`
                            : "Incomplete day"}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={efficiency >= 70 ? "default" : efficiency >= 50 ? "secondary" : "destructive"}>
                          {efficiency}% Efficient
                        </Badge>
                        <Badge variant="outline">{totalHours.toFixed(1)} hours</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Visits ({visits.length})</h4>
                        {visits.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No visits recorded</p>
                        ) : (
                          <div className="space-y-3">
                            {visits.map((visit) => (
                              <div key={visit.id} className="border rounded-lg p-3 space-y-2">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                                      <span className="font-medium">{visit.appointments.title}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <MapPin className="h-3 w-3" />
                                      <span>
                                        {visit.properties.name} - {visit.properties.address}, {visit.properties.city}
                                      </span>
                                    </div>
                                  </div>
                                  <Badge variant="outline">{calculateVisitDuration(visit).toFixed(0)} min</Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span>Arrived: {new Date(visit.arrival_time).toLocaleTimeString()}</span>
                                  {visit.departure_time && (
                                    <span>Left: {new Date(visit.departure_time).toLocaleTimeString()}</span>
                                  )}
                                </div>
                                {visit.notes && (
                                  <div className="text-sm bg-muted p-2 rounded">
                                    <span className="font-medium">Notes: </span>
                                    {visit.notes}
                                  </div>
                                )}
                                {visit.next_location && (
                                  <div className="text-sm text-muted-foreground">
                                    <span className="font-medium">Next: </span>
                                    {visit.next_location}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        <TabsContent value="visits" className="space-y-4">
          {visitLogs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MapPin className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No visits recorded this week</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>All Visits This Week</CardTitle>
                <CardDescription>{visitLogs.length} total visits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {visitLogs.map((visit) => (
                    <div key={visit.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{visit.appointments.title}</span>
                            <Badge variant="outline">
                              {new Date(visit.arrival_time).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>
                              {visit.properties.name} - {visit.properties.city}
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline">{calculateVisitDuration(visit).toFixed(0)} min</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{new Date(visit.arrival_time).toLocaleTimeString()}</span>
                        {visit.departure_time && <span>- {new Date(visit.departure_time).toLocaleTimeString()}</span>}
                      </div>
                      {visit.notes && (
                        <div className="text-sm bg-muted p-2 rounded">
                          <span className="font-medium">Notes: </span>
                          {visit.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
