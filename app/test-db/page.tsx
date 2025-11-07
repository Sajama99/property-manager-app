import { createClient } from "@/supabaseServer"
import { redirect } from "next/navigation"

export default async function TestDBPage() {
  const supabase = await createClient()

  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData?.user) {
    redirect("/auth/login")
  }

  // Test 1: Check if user profile exists
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authData.user.id)
    .single()

  // Test 2: Check if we can read properties
  const { data: properties, error: propertiesError } = await supabase.from("properties").select("*")

  // Test 3: Check if we can read appointments
  const { data: appointments, error: appointmentsError } = await supabase
    .from("appointments")
    .select("*")
    .eq("manager_id", authData.user.id)

  // Test 4: Try to insert a test appointment
  const testDate = new Date().toISOString().split("T")[0]
  const { data: insertTest, error: insertError } = await supabase
    .from("appointments")
    .insert({
      manager_id: authData.user.id,
      property_id: properties?.[0]?.id || "00000000-0000-0000-0000-000000000000",
      title: "Test Appointment",
      scheduled_date: testDate,
      is_time_specific: false,
      estimated_duration_minutes: 30,
      status: "pending",
    })
    .select()

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Database Connection Test</h1>

      <div className="space-y-4">
        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Auth User</h2>
          <pre className="text-xs overflow-auto">
            {JSON.stringify({ id: authData.user.id, email: authData.user.email }, null, 2)}
          </pre>
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Profile Test</h2>
          {profileError ? (
            <div className="text-red-600">Error: {profileError.message}</div>
          ) : (
            <pre className="text-xs overflow-auto">{JSON.stringify(profile, null, 2)}</pre>
          )}
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Properties Test</h2>
          {propertiesError ? (
            <div className="text-red-600">Error: {propertiesError.message}</div>
          ) : (
            <div className="text-green-600">Success! Found {properties?.length || 0} properties</div>
          )}
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Appointments Read Test</h2>
          {appointmentsError ? (
            <div className="text-red-600">Error: {appointmentsError.message}</div>
          ) : (
            <div className="text-green-600">Success! Found {appointments?.length || 0} appointments</div>
          )}
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Appointment Insert Test</h2>
          {insertError ? (
            <div className="text-red-600">
              <div className="font-semibold">Error: {insertError.message}</div>
              <pre className="text-xs mt-2 overflow-auto">{JSON.stringify(insertError, null, 2)}</pre>
            </div>
          ) : (
            <div>
              <div className="text-green-600 mb-2">Success! Appointment created</div>
              <pre className="text-xs overflow-auto">{JSON.stringify(insertTest, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
