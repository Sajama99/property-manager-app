'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseBrowser'

export default function NewPropertyPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [address1, setAddress1] = useState('')
  const [address2, setAddress2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [postal, setPostal] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!title || !address1 || !city || !state || !postal) {
      setError('Please fill all required fields')
      return
    }
    setSaving(true)
    const { data: userRes } = await supabase.auth.getUser()
    const userId = userRes.user?.id
    if (!userId) {
      setSaving(false)
      setError('You must be signed in')
      return
    }
    const { data, error } = await supabase
      .from('properties')
      .insert({
        user_id: userId,
        title,
        address_line1: address1,
        address_line2: address2 || null,
        city,
        state,
        postal_code: postal
      })
      .select('id')
      .single()
    setSaving(false)
    if (error) setError(error.message)
    else if (data?.id) router.replace(`/properties/${data.id}`)
  }

  return (
    <div className="max-w-xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Add Property</h1>
      {error && <div className="text-red-600">{error}</div>}
      <form className="space-y-3" onSubmit={onSave}>
        <div>
          <label className="block text-sm font-medium">Title *</label>
          <input className="w-full border rounded px-3 py-2" value={title} onChange={e=>setTitle(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium">Address line 1 *</label>
          <input className="w-full border rounded px-3 py-2" value={address1} onChange={e=>setAddress1(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium">Address line 2</label>
          <input className="w-full border rounded px-3 py-2" value={address2} onChange={e=>setAddress2(e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium">City *</label>
            <input className="w-full border rounded px-3 py-2" value={city} onChange={e=>setCity(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">State *</label>
            <input className="w-full border rounded px-3 py-2" value={state} onChange={e=>setState(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Postal code *</label>
            <input className="w-full border rounded px-3 py-2" value={postal} onChange={e=>setPostal(e.target.value)} />
          </div>
        </div>
        <button disabled={saving} className="rounded bg-black text-white px-4 py-2">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  )
}
