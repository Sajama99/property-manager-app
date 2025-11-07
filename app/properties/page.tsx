'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase/supabaseClient';

type Location = {
  id: string;
  name: string | null;
  address?: string | null;
  active?: boolean | null;
};

type Unit = {
  id: string;
  location_id: string;
  unit_label: string;
  bedrooms: number | null;
  bathrooms: number | null;
  stove_type: string | null;
  heat_type: string | null;
  active: boolean | null;
};

type Tenant = {
  id: string;
  unit_id: string;
  tenant_name: string;
  phone: string | null;
  email: string | null;
  active: boolean | null;
};

export default function PropertiesPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  // add property
  const [newPropName, setNewPropName] = useState('');
  const [newPropAddress, setNewPropAddress] = useState('');

  // add unit
  const [addingUnitForProperty, setAddingUnitForProperty] = useState<string | null>(null);
  const [newUnitLabel, setNewUnitLabel] = useState('');
  const [newUnitBedrooms, setNewUnitBedrooms] = useState('');
  const [newUnitBathrooms, setNewUnitBathrooms] = useState('');
  const [newUnitStoveType, setNewUnitStoveType] = useState<'electric' | 'gas' | ''>('');
  const [newUnitHeatType, setNewUnitHeatType] = useState<'electric' | 'gas' | ''>('');
  // new: initial tenant for the unit
  const [newUnitTenantName, setNewUnitTenantName] = useState('');
  const [newUnitTenantPhone, setNewUnitTenantPhone] = useState('');

  // edit unit
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [editUnitLabel, setEditUnitLabel] = useState('');
  const [editUnitBedrooms, setEditUnitBedrooms] = useState('');
  const [editUnitBathrooms, setEditUnitBathrooms] = useState('');
  const [editUnitStoveType, setEditUnitStoveType] = useState<'electric' | 'gas' | ''>('');
  const [editUnitHeatType, setEditUnitHeatType] = useState<'electric' | 'gas' | ''>('');

  // add tenant after unit exists
  const [addingTenantForUnit, setAddingTenantForUnit] = useState<string | null>(null);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantPhone, setNewTenantPhone] = useState('');
  const [newTenantEmail, setNewTenantEmail] = useState('');

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      const [{ data: locData, error: locErr }, { data: unitData }, { data: tenantData }] =
        await Promise.all([
          supabase.from('locations').select('id, name, address, active').order('name'),
          supabase.from('property_units').select('*'),
          supabase.from('unit_tenants').select('*'),
        ]);

      if (locErr) {
        setErrorText(locErr.message);
        setLocations([]);
        setUnits([]);
        setTenants([]);
      } else {
        setLocations((locData || []) as Location[]);
        setUnits((unitData || []) as Unit[]);
        setTenants((tenantData || []) as Tenant[]);
      }
      setLoading(false);
    };

    loadAll();
  }, []);

  const refreshLocations = async () => {
    const { data } = await supabase
      .from('locations')
      .select('id, name, address, active')
      .order('name');
    setLocations((data || []) as Location[]);
  };

  const refreshUnits = async () => {
    const { data } = await supabase.from('property_units').select('*');
    setUnits((data || []) as Unit[]);
  };

  const refreshTenants = async () => {
    const { data } = await supabase.from('unit_tenants').select('*');
    setTenants((data || []) as Tenant[]);
  };

  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('locations').insert({
      name: newPropName,
      address: newPropAddress || null,
      active: true,
    });
    if (error) {
      alert(error.message);
      return;
    }
    setNewPropName('');
    setNewPropAddress('');
    refreshLocations();
  };

  const handleStartAddUnit = (locationId: string) => {
    setEditingUnitId(null);
    setAddingUnitForProperty(locationId);
    setNewUnitLabel('');
    setNewUnitBedrooms('');
    setNewUnitBathrooms('');
    setNewUnitStoveType('');
    setNewUnitHeatType('');
    setNewUnitTenantName('');
    setNewUnitTenantPhone('');
  };

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingUnitForProperty) return;

    // 1) insert the unit
    const { data, error } = await supabase
      .from('property_units')
      .insert({
        location_id: addingUnitForProperty,
        unit_label: newUnitLabel,
        bedrooms: newUnitBedrooms ? Number(newUnitBedrooms) : null,
        bathrooms: newUnitBathrooms ? Number(newUnitBathrooms) : null,
        stove_type: newUnitStoveType || null,
        heat_type: newUnitHeatType || null,
        active: true,
      })
      .select('id')
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    const newUnitId = data?.id as string | undefined;

    // 2) if tenant name filled in, insert tenant
    if (newUnitId && newUnitTenantName.trim().length > 0) {
      await supabase.from('unit_tenants').insert({
        unit_id: newUnitId,
        tenant_name: newUnitTenantName,
        phone: newUnitTenantPhone || null,
        email: null,
        active: true,
      });
    }

    setAddingUnitForProperty(null);
    await refreshUnits();
    await refreshTenants();
  };

  const handleStartEditUnit = (unit: Unit) => {
    setAddingUnitForProperty(null);
    setEditingUnitId(unit.id);
    setEditUnitLabel(unit.unit_label);
    setEditUnitBedrooms(unit.bedrooms ? String(unit.bedrooms) : '');
    setEditUnitBathrooms(unit.bathrooms ? String(unit.bathrooms) : '');
    setEditUnitStoveType((unit.stove_type as 'electric' | 'gas' | '') || '');
    setEditUnitHeatType((unit.heat_type as 'electric' | 'gas' | '') || '');
  };

  const handleSaveEditUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnitId) return;
    const { error } = await supabase
      .from('property_units')
      .update({
        unit_label: editUnitLabel,
        bedrooms: editUnitBedrooms ? Number(editUnitBedrooms) : null,
        bathrooms: editUnitBathrooms ? Number(editUnitBathrooms) : null,
        stove_type: editUnitStoveType || null,
        heat_type: editUnitHeatType || null,
      })
      .eq('id', editingUnitId);

    if (error) {
      alert(error.message);
      return;
    }
    setEditingUnitId(null);
    refreshUnits();
  };

  const handleStartAddTenant = (unitId: string) => {
    setAddingTenantForUnit(unitId);
    setNewTenantName('');
    setNewTenantPhone('');
    setNewTenantEmail('');
  };

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingTenantForUnit) return;
    const { error } = await supabase.from('unit_tenants').insert({
      unit_id: addingTenantForUnit,
      tenant_name: newTenantName,
      phone: newTenantPhone || null,
      email: newTenantEmail || null,
      active: true,
    });
    if (error) {
      alert(error.message);
      return;
    }
    setAddingTenantForUnit(null);
    refreshTenants();
  };

  const getUnitsForProperty = (locationId: string) =>
    units.filter((u) => u.location_id === locationId);

  const getTenantsForUnit = (unitId: string) => tenants.filter((t) => t.unit_id === unitId);

  if (loading) {
    return <div style={{ padding: 20 }}>Loading properties…</div>;
  }

  return (
    <div style={{ padding: 20, display: 'grid', gap: 20 }}>
      <h1 style={{ fontSize: 24 }}>Properties</h1>

      {errorText ? (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', padding: 10, borderRadius: 6 }}>
          {errorText}
        </div>
      ) : null}

      {/* Add property */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          padding: 16,
          maxWidth: 650,
        }}
      >
        <h2 style={{ fontSize: 18, marginBottom: 10 }}>Add property</h2>
        <form onSubmit={handleAddProperty} style={{ display: 'grid', gap: 10 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Name</label>
            <input
              required
              value={newPropName}
              onChange={(e) => setNewPropName(e.target.value)}
              style={{
                width: '100%',
                border: '1px solid #d1d5db',
                borderRadius: 4,
                padding: 6,
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Address</label>
            <input
              value={newPropAddress}
              onChange={(e) => setNewPropAddress(e.target.value)}
              style={{
                width: '100%',
                border: '1px solid #d1d5db',
                borderRadius: 4,
                padding: 6,
              }}
            />
          </div>
          <div>
            <button
              type="submit"
              style={{
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                padding: '6px 14px',
                cursor: 'pointer',
              }}
            >
              Save property
            </button>
          </div>
        </form>
      </div>

      {/* list properties */}
      <div style={{ display: 'grid', gap: 16 }}>
        {locations.length === 0 ? (
          <p>No properties yet.</p>
        ) : (
          locations.map((loc) => (
            <div
              key={loc.id}
              style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{loc.name || 'Property'}</div>
                  {loc.address ? (
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{loc.address}</div>
                  ) : null}
                </div>
                <div>
                  <button
                    onClick={() => handleStartAddUnit(loc.id)}
                    style={{
                      background: '#fff',
                      border: '1px solid #2563eb',
                      color: '#2563eb',
                      borderRadius: 4,
                      padding: '4px 10px',
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    + Add unit
                  </button>
                </div>
              </div>

              {/* units */}
              <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                {getUnitsForProperty(loc.id).length === 0 ? (
                  <p style={{ fontSize: 12, color: '#94a3b8' }}>No units yet.</p>
                ) : (
                  getUnitsForProperty(loc.id).map((unit) => (
                    <div
                      key={unit.id}
                      style={{
                        border: '1px solid #f1f5f9',
                        borderRadius: 6,
                        padding: 10,
                        background: '#f8fafc',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <div>
                          <div style={{ fontWeight: 500 }}>{unit.unit_label}</div>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>
                            {unit.bedrooms ? `${unit.bedrooms} bd` : ''}{' '}
                            {unit.bathrooms ? `${unit.bathrooms} ba` : ''}
                          </div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                            {unit.stove_type ? `Stove: ${unit.stove_type}` : ''}
                            {unit.stove_type && unit.heat_type ? ' • ' : ''}
                            {unit.heat_type ? `Heat: ${unit.heat_type}` : ''}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => handleStartAddTenant(unit.id)}
                            style={{
                              background: '#fff',
                              border: '1px solid #2563eb',
                              color: '#2563eb',
                              borderRadius: 4,
                              padding: '2px 8px',
                              cursor: 'pointer',
                              fontSize: 12,
                            }}
                          >
                            + Add tenant
                          </button>
                          <button
                            onClick={() => handleStartEditUnit(unit)}
                            style={{
                              background: '#fff',
                              border: '1px solid #0ea5e9',
                              color: '#0ea5e9',
                              borderRadius: 4,
                              padding: '2px 8px',
                              cursor: 'pointer',
                              fontSize: 12,
                            }}
                          >
                            Edit unit
                          </button>
                        </div>
                      </div>

                      {/* tenants list */}
                      <div style={{ marginTop: 6 }}>
                        {getTenantsForUnit(unit.id).length === 0 ? (
                          <p style={{ fontSize: 11, color: '#94a3b8' }}>No tenants.</p>
                        ) : (
                          <ul
                            style={{
                              listStyle: 'none',
                              padding: 0,
                              margin: 0,
                              display: 'grid',
                              gap: 4,
                            }}
                          >
                            {getTenantsForUnit(unit.id).map((t) => (
                              <li key={t.id} style={{ fontSize: 12 }}>
                                <strong>{t.tenant_name}</strong>{' '}
                                {t.phone ? `• ${t.phone}` : ''}{' '}
                                {t.email ? `• ${t.email}` : ''}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* add tenant form */}
                      {addingTenantForUnit === unit.id ? (
                        <form
                          onSubmit={handleAddTenant}
                          style={{
                            marginTop: 8,
                            background: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: 6,
                            padding: 8,
                            display: 'grid',
                            gap: 6,
                          }}
                        >
                          <div>
                            <label style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>
                              Tenant name
                            </label>
                            <input
                              required
                              value={newTenantName}
                              onChange={(e) => setNewTenantName(e.target.value)}
                              style={{
                                width: '100%',
                                border: '1px solid #d1d5db',
                                borderRadius: 4,
                                padding: 4,
                              }}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>
                                Phone
                              </label>
                              <input
                                value={newTenantPhone}
                                onChange={(e) => setNewTenantPhone(e.target.value)}
                                style={{
                                  width: '100%',
                                  border: '1px solid #d1d5db',
                                  borderRadius: 4,
                                  padding: 4,
                                }}
                              />
                            </div>
                            <div style={{ flex: 1 }}>
                              <label style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>
                                Email
                              </label>
                              <input
                                value={newTenantEmail}
                                onChange={(e) => setNewTenantEmail(e.target.value)}
                                style={{
                                  width: '100%',
                                  border: '1px solid #d1d5db',
                                  borderRadius: 4,
                                  padding: 4,
                                }}
                              />
                            </div>
                          </div>
                          <div>
                            <button
                              type="submit"
                              style={{
                                background: '#2563eb',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 4,
                                padding: '4px 10px',
                                cursor: 'pointer',
                                fontSize: 12,
                              }}
                            >
                              Save tenant
                            </button>
                            <button
                              type="button"
                              onClick={() => setAddingTenantForUnit(null)}
                              style={{
                                marginLeft: 8,
                                background: 'transparent',
                                border: 'none',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                fontSize: 12,
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : null}

                      {/* edit unit form */}
                      {editingUnitId === unit.id ? (
                        <form
                          onSubmit={handleSaveEditUnit}
                          style={{
                            marginTop: 8,
                            background: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: 6,
                            padding: 8,
                            display: 'grid',
                            gap: 6,
                          }}
                        >
                          <div>
                            <label style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>
                              Unit label
                            </label>
                            <input
                              required
                              value={editUnitLabel}
                              onChange={(e) => setEditUnitLabel(e.target.value)}
                              style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 4, padding: 4 }}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <div>
                              <label style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>
                                Bedrooms
                              </label>
                              <input
                                type="number"
                                value={editUnitBedrooms}
                                onChange={(e) => setEditUnitBedrooms(e.target.value)}
                                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 4, padding: 4 }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>
                                Bathrooms
                              </label>
                              <input
                                type="number"
                                value={editUnitBathrooms}
                                onChange={(e) => setEditUnitBathrooms(e.target.value)}
                                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 4, padding: 4 }}
                              />
                            </div>
                          </div>

                          <div>
                            <label style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>
                              Stove type
                            </label>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                type="button"
                                onClick={() => setEditUnitStoveType('electric')}
                                style={editUnitStoveType === 'electric' ? selectedBtn : unselectedBtn}
                              >
                                Electric
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditUnitHeatType('gas')}
                                style={editUnitStoveType === 'gas' ? selectedBtn : unselectedBtn}
                              >
                                Gas
                              </button>
                            </div>
                          </div>

                          <div>
                            <label style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>
                              Heat type
                            </label>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                type="button"
                                onClick={() => setEditUnitHeatType('electric')}
                                style={editUnitHeatType === 'electric' ? selectedBtn : unselectedBtn}
                              >
                                Electric
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditUnitHeatType('gas')}
                                style={editUnitHeatType === 'gas' ? selectedBtn : unselectedBtn}
                              >
                                Gas
                              </button>
                            </div>
                          </div>

                          <div>
                            <button
                              type="submit"
                              style={{
                                background: '#22c55e',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 4,
                                padding: '4px 10px',
                                cursor: 'pointer',
                                fontSize: 12,
                              }}
                            >
                              Save changes
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingUnitId(null)}
                              style={{
                                marginLeft: 8,
                                background: 'transparent',
                                border: 'none',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                fontSize: 12,
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : null}
                    </div>
                  ))
                )}
              </div>

              {/* add unit form */}
              {addingUnitForProperty === loc.id ? (
                <form
                  onSubmit={handleAddUnit}
                  style={{
                    marginTop: 10,
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 6,
                    padding: 10,
                    display: 'grid',
                    gap: 8,
                  }}
                >
                  <div>
                    <label style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>
                      Unit label
                    </label>
                    <input
                      required
                      value={newUnitLabel}
                      onChange={(e) => setNewUnitLabel(e.target.value)}
                      placeholder="Unit 1A"
                      style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 4, padding: 4 }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <div>
                      <label style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>
                        Bedrooms
                      </label>
                      <input
                        type="number"
                        value={newUnitBedrooms}
                        onChange={(e) => setNewUnitBedrooms(e.target.value)}
                        style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 4, padding: 4 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>
                        Bathrooms
                      </label>
                      <input
                        type="number"
                        value={newUnitBathrooms}
                        onChange={(e) => setNewUnitBathrooms(e.target.value)}
                        style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 4, padding: 4 }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>
                      Stove type
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => setNewUnitStoveType('electric')}
                        style={newUnitStoveType === 'electric' ? selectedBtn : unselectedBtn}
                      >
                        Electric
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewUnitStoveType('gas')}
                        style={newUnitStoveType === 'gas' ? selectedBtn : unselectedBtn}
                      >
                        Gas
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>
                      Heat type
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => setNewUnitHeatType('electric')}
                        style={newUnitHeatType === 'electric' ? selectedBtn : unselectedBtn}
                      >
                        Electric
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewUnitHeatType('gas')}
                        style={newUnitHeatType === 'gas' ? selectedBtn : unselectedBtn}
                      >
                        Gas
                      </button>
                    </div>
                  </div>

                  {/* initial tenant for this unit */}
                  <div>
                    <label style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>
                      Tenant name (optional)
                    </label>
                    <input
                      value={newUnitTenantName}
                      onChange={(e) => setNewUnitTenantName(e.target.value)}
                      style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 4, padding: 4 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>
                      Tenant phone
                    </label>
                    <input
                      value={newUnitTenantPhone}
                      onChange={(e) => setNewUnitTenantPhone(e.target.value)}
                      style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 4, padding: 4 }}
                    />
                  </div>

                  <div>
                    <button
                      type="submit"
                      style={{
                        background: '#2563eb',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        padding: '4px 10px',
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      Save unit
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddingUnitForProperty(null)}
                      style={{
                        marginLeft: 8,
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const selectedBtn: React.CSSProperties = {
  background: '#2563eb',
  color: '#fff',
  border: '1px solid #2563eb',
  borderRadius: 6,
  padding: '4px 10px',
  cursor: 'pointer',
  fontSize: 12,
};

const unselectedBtn: React.CSSProperties = {
  background: '#fff',
  color: '#2563eb',
  border: '1px solid #2563eb',
  borderRadius: 6,
  padding: '4px 10px',
  cursor: 'pointer',
  fontSize: 12,
};
