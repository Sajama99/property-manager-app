'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

type UnitRow = { id: string; unit_label: string }
type TenantRow = { id: string; unit_id: string; full_name: string; phone: string | null }
type Property = { id: string; name: string | null; address: string | null }

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>()
  const propertyId = params?.id

  const supabase = useMemo(
    () => createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ),
    []
  )

  const [prop, setProp] = useState<Property | null>(null)
  const [units, setUnits] = useState<UnitRow[]>([])
  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  // Add-tenant form
  const [newTenantUnitId, setNewTenantUnitId] = useState('')
  const [tenantName, setTenantName] = useState('')
  const [tenantPhone, setTenantPhone] = useState('')
  const nameRef = useRef<HTMLInputElement | null>(null)

  // Edit-tenant state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const editNameRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!propertyId) return
      ; (async () => {
        setErr(''); setMsg('Loading…')

        const { data: userData } = await supabase.auth.getUser()
        if (!userData?.user) { setErr('You must be signed in.'); setMsg(''); return }

        const { data: propData, error: propErr } = await supabase
          .from('locations').select('id, name, address').eq('id', propertyId).single()
        if (propErr) { setErr(`Error loading property: ${propErr.message}`); setMsg(''); return }
        setProp(propData as Property)

        const { data: unitData, error: unitErr } = await supabase
          .from('units').select('id, unit_label').eq('property_id', propertyId).order('unit_label', { ascending: true })
        if (unitErr) { setErr(`Error loading units: ${unitErr.message}`); setMsg(''); return }
        const unitRows = (unitData || []) as UnitRow[]
        setUnits(unitRows)

        if (unitRows.length) {
          const unitIds = unitRows.map(u => u.id)
          const { data: tenData, error: tenErr } = await supabase
            .from('tenants').select('id, unit_id, full_name, phone').in('unit_id', unitIds)
          if (tenErr) { setErr(`Error loading tenants: ${tenErr.message}`); setMsg(''); return }
          setTenants((tenData || []) as TenantRow[])
        } else {
          setTenants([])
        }

        setMsg('')
      })()
  }, [propertyId, supabase])

  const tenantsByUnit = new Map<string, TenantRow[]>()
  for (const t of tenants) {
    if (!tenantsByUnit.has(t.unit_id)) tenantsByUnit.set(t.unit_id, [])
    tenantsByUnit.get(t.unit_id)!.push(t)
  }

  async function addTenant() {
    setErr(''); setMsg('')
    if (!newTenantUnitId || !tenantName.trim()) { setErr('Pick a unit and enter tenant name.'); return }

    const unitRow = units.find(u => u.id === newTenantUnitId)
    if (!unitRow) { setErr('Selected unit not found.'); return }

    const payload = {
      unit_id: newTenantUnitId,
      location_id: propertyId,       // required by your schema
      unit: unitRow.unit_label,      // required by your schema
      full_name: tenantName.trim(),
      phone: tenantPhone.trim() || null,
    }

    const { data, error } = await supabase
      .from('tenants')
      .insert(payload)
      .select('id, unit_id, full_name, phone')
      .single()

    if (error) { setErr(`Add tenant failed: ${error.message}`); return }

    setTenants(prev => [...prev, data as TenantRow])
    setTenantName(''); setTenantPhone('')
    setMsg('Tenant added. Add another or change unit.')
    setTimeout(() => nameRef.current?.focus(), 50)
  }

  // ==== EDIT TENANT ====
  function startEdit(t: TenantRow) {
    setEditingId(t.id)
    setEditName(t.full_name)
    setEditPhone(t.phone || '')
    setTimeout(() => editNameRef.current?.focus(), 50)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
    setEditPhone('')
  }

  async function saveEdit() {
    if (!editingId) return
    if (!editName.trim()) { setErr('Name is required.'); return }
    setErr(''); setMsg('')

    const { data, error } = await supabase
      .from('tenants')
      .update({ full_name: editName.trim(), phone: editPhone.trim() || null })
      .eq('id', editingId)
      .select('id, unit_id, full_name, phone')
      .single()

    if (error) { setErr(`Update failed: ${error.message}`); return }

    setTenants(prev => prev.map(t => t.id === editingId ? (data as TenantRow) : t))
    setMsg('Occupant updated.')
    cancelEdit()
  }

  async function deleteTenant(id: string) {
    setErr(''); setMsg('')
    const { error } = await supabase.from('tenants').delete().eq('id', id)
    if (error) { setErr(`Delete failed: ${error.message}`); return }
    setTenants(prev => prev.filter(t => t.id !== id))
    setMsg('Deleted.')
  }

  return (
    <div className="p-6 space-y-6">
      {err && <div className="p-3 rounded bg-red-100 text-red-800">{err}</div>}
      {msg && !err && <div className="p-3 rounded bg-green-100 text-green-800">{msg}</div>}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Property</h1>
          {prop ? (
            <div className="text-gray-700">
              <div><b>Name:</b> {prop.name || '—'}</div>
              <div><b>Address:</b> {prop.address || '—'}</div>
            </div>
          ) : <div>Loading…</div>}
        </div>
        <div className="flex gap-3">
          <Link href="/routes" className="underline">← Back to Routes</Link>
          <Link href="/live" className="underline">Live Map</Link>
        </div>
      </div>

      {/* Units & occupants */}
      <div className="border rounded p-4 space-y-4">
        <div className="text-lg font-medium">Units & Occupants</div>

        {units.length === 0 && <div className="text-gray-600">No units yet. Add units first for this property.</div>}

        {units.length > 0 && (
          <div className="space-y-3">
            {units.slice().sort((a, b) => a.unit_label.localeCompare(b.unit_label)).map(u => {
              const list = tenantsByUnit.get(u.id) || []
              return (
                <div key={u.id} className="border rounded p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">Unit {u.unit_label}</div>
                    <button
                      className="text-sm underline"
                      onClick={() => {
                        setNewTenantUnitId(u.id)
                        setTimeout(() => nameRef.current?.focus(), 50)
                      }}
                    >
                      Add occupant to Unit {u.unit_label}
                    </button>
                  </div>

                  {list.length === 0 ? (
                    <div className="text-gray-600">No occupants yet.</div>
                  ) : (
                    <ul className="space-y-1 ml-1">
                      {list.map(t => (
                        <li key={t.id} className="flex items-center gap-3">
                          {/* Inline view OR inline edit */}
                          {editingId === t.id ? (
                            <>
                              <input
                                ref={editNameRef}
                                className="border p-1 rounded"
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                placeholder="Full name"
                              />
                              <input
                                className="border p-1 rounded"
                                value={editPhone}
                                onChange={e => setEditPhone(e.target.value)}
                                placeholder="Phone"
                              />
                              <button className="bg-black text-white px-2 py-1 rounded" onClick={saveEdit}>
                                Save
                              </button>
                              <button className="underline" onClick={cancelEdit}>
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <span>{t.full_name}{t.phone ? ` — ${t.phone}` : ''}</span>
                              <button className="underline" onClick={() => startEdit(t)}>
                                Edit
                              </button>
                              <button className="text-red-600 underline" onClick={() => deleteTenant(t.id)}>
                                Delete
                              </button>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Add a tenant */}
        {units.length > 0 && (
          <div className="mt-4 border-t pt-4">
            <div className="font-medium mb-2">Add Occupant</div>
            <div className="flex flex-wrap items-center gap-3">
              <select
                className="border p-2 rounded"
                value={newTenantUnitId}
                onChange={(e) => setNewTenantUnitId(e.target.value)}
              >
                <option value="">Select unit…</option>
                {units.slice().sort((a, b) => a.unit_label.localeCompare(b.unit_label)).map(u => (
                  <option key={u.id} value={u.id}>Unit {u.unit_label}</option>
                ))}
              </select>
              <input
                ref={nameRef}
                className="border p-2 rounded"
                placeholder="Full name"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
              />
              <input
                className="border p-2 rounded"
                placeholder="Phone"
                value={tenantPhone}
                onChange={(e) => setTenantPhone(e.target.value)}
              />
              <button onClick={addTenant} className="bg-black text-white px-4 py-2 rounded">
                Save Occupant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
