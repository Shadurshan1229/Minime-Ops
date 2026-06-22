import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useCalculatorStore } from '../store/calculatorStore'
import PageHeader from '../components/ui/PageHeader'
import SettingsSection from '../components/settings/SettingsSection'
import SettingsRow from '../components/settings/SettingsRow'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function Settings() {
  const {
    printers, setPrinters,
    filaments, setFilaments,
    macroSettings, setMacroSettings,
    printTypes, setPrintTypes,
  } = useCalculatorStore()

  const [newPrinter, setNewPrinter] = useState({ name: '', wattage: '', hourly_rate: '' })
  const [addingPrinter, setAddingPrinter] = useState(false)
  const [newFilament, setNewFilament] = useState({ name: '', brand: '', material: '', cost_per_kg: '' })
  const [addingFilament, setAddingFilament] = useState(false)

  // ── Printers ──

  async function savePrinter(id: string, values: Record<string, string | number>) {
    const update = {
      name: String(values.name),
      wattage: Number(values.wattage),
      hourly_rate: Number(values.hourly_rate),
    }
    await supabase.from('printers').update(update).eq('id', id)
    setPrinters(printers.map(p => p.id === id ? { ...p, ...update } : p))
  }

  async function togglePrinter(id: string, active: boolean) {
    await supabase.from('printers').update({ active: !active }).eq('id', id)
    setPrinters(printers.map(p => p.id === id ? { ...p, active: !active } : p))
  }

  async function addPrinter() {
    if (!newPrinter.name || !newPrinter.wattage || !newPrinter.hourly_rate) return
    setAddingPrinter(true)
    const { data } = await supabase.from('printers').insert({
      name: newPrinter.name,
      wattage: Number(newPrinter.wattage),
      hourly_rate: Number(newPrinter.hourly_rate),
      active: true,
    }).select().single()
    if (data) setPrinters([...printers, data])
    setNewPrinter({ name: '', wattage: '', hourly_rate: '' })
    setAddingPrinter(false)
  }

  // ── Filaments ──

  async function saveFilament(id: string, values: Record<string, string | number>) {
    const update = {
      name: String(values.name),
      brand: String(values.brand),
      material: String(values.material),
      cost_per_kg: Number(values.cost_per_kg),
    }
    await supabase.from('filaments').update(update).eq('id', id)
    setFilaments(filaments.map(f => f.id === id ? { ...f, ...update } : f))
  }

  async function deleteFilament(id: string) {
    if (!confirm('Delete this filament?')) return
    await supabase.from('filaments').delete().eq('id', id)
    setFilaments(filaments.filter(f => f.id !== id))
  }

  async function addFilament() {
    if (!newFilament.name || !newFilament.cost_per_kg) return
    setAddingFilament(true)
    const { data } = await supabase.from('filaments').insert({
      name: newFilament.name,
      brand: newFilament.brand,
      material: newFilament.material,
      cost_per_kg: Number(newFilament.cost_per_kg),
    }).select().single()
    if (data) setFilaments([...filaments, data])
    setNewFilament({ name: '', brand: '', material: '', cost_per_kg: '' })
    setAddingFilament(false)
  }

  // ── Macro settings ──

  async function saveMacro(values: Record<string, string | number>) {
    if (!macroSettings) return
    const update = {
      electricity_rate_kwh: Number(values.electricity_rate_kwh),
      maintenance_rate_per_hour: Number(values.maintenance_rate_per_hour),
      labour_rate_per_hour: Number(values.labour_rate_per_hour),
    }
    await supabase.from('macro_settings').update(update).eq('id', macroSettings.id)
    setMacroSettings({ ...macroSettings, ...update })
  }

  // ── Print types ──

  async function savePrintType(id: string, values: Record<string, string | number>) {
    const update = {
      markup_multiplier: Number(values.markup_multiplier),
      packaging_cost_default: Number(values.packaging_cost_default),
    }
    await supabase.from('print_types').update(update).eq('id', id)
    setPrintTypes(printTypes.map(t => t.id === id ? { ...t, ...update } : t))
  }

  const addFormStyle: React.CSSProperties = {
    background: 'var(--s1)', border: '1px dashed var(--hairline)',
    borderRadius: 'var(--r-lg)', padding: 'var(--sp-lg)',
    display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)',
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage printers, filaments and costs" />

      <div style={{
        padding: '0 var(--sp-xl) var(--sp-xl)',
        display: 'flex', flexDirection: 'column', gap: 'var(--sp-xxl)',
      }}>

        {/* ── Cost rates ── */}
        <SettingsSection title="Cost rates">
          {macroSettings ? (
            <SettingsRow
              fields={[
                { key: 'electricity_rate_kwh', label: 'Electricity', suffix: 'LKR/kWh', type: 'number', value: macroSettings.electricity_rate_kwh },
                { key: 'maintenance_rate_per_hour', label: 'Maintenance', suffix: 'LKR/hr', type: 'number', value: macroSettings.maintenance_rate_per_hour },
                { key: 'labour_rate_per_hour', label: 'Labour', suffix: 'LKR/hr', type: 'number', value: macroSettings.labour_rate_per_hour },
              ]}
              onSave={saveMacro}
            />
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--ink-m)' }}>Loading…</div>
          )}
        </SettingsSection>

        {/* ── Print types ── */}
        <SettingsSection title="Print types">
          {printTypes.map(pt => (
            <div key={pt.id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }}>
                <img src={pt.logo_path} alt={pt.name} style={{ height: '20px', filter: 'brightness(0.7)' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', fontFamily: 'Geist, sans-serif' }}>
                  {pt.name}
                </span>
              </div>
              <SettingsRow
                fields={[
                  { key: 'markup_multiplier', label: 'Markup multiplier', type: 'number', value: pt.markup_multiplier },
                  { key: 'packaging_cost_default', label: 'Default packaging', suffix: 'LKR', type: 'number', value: pt.packaging_cost_default },
                ]}
                onSave={(values) => savePrintType(pt.id, values)}
              />
            </div>
          ))}
        </SettingsSection>

        {/* ── Printers ── */}
        <SettingsSection title="Printers">
          {printers.map(p => (
            <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xs)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: p.active ? 'var(--ink)' : 'var(--ink-m)', fontFamily: 'Geist, sans-serif' }}>
                  {p.name}
                </span>
                <button
                  onClick={() => togglePrinter(p.id, p.active)}
                  style={{
                    fontSize: '11px', fontWeight: 500, padding: '3px 10px',
                    borderRadius: 'var(--r-pill)', border: 'none', cursor: 'pointer',
                    background: p.active ? 'var(--status-printing-bg)' : 'var(--s2)',
                    color: p.active ? 'var(--status-printing-text)' : 'var(--ink-m)',
                  }}
                >
                  {p.active ? 'Active' : 'Disabled'}
                </button>
              </div>
              <SettingsRow
                fields={[
                  { key: 'name', label: 'Name', type: 'text', value: p.name },
                  { key: 'wattage', label: 'Wattage', suffix: 'W', type: 'number', value: p.wattage },
                  { key: 'hourly_rate', label: 'Machine rate', suffix: 'LKR/hr', type: 'number', value: p.hourly_rate },
                ]}
                onSave={(values) => savePrinter(p.id, values)}
              />
            </div>
          ))}

          <div style={addFormStyle}>
            <div style={{ fontSize: '12px', color: 'var(--ink-m)', fontWeight: 500 }}>Add new printer</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--sp-sm)' }}>
              <Input label="Name" value={newPrinter.name} placeholder="Bambu A1"
                onChange={e => setNewPrinter(v => ({ ...v, name: e.target.value }))} />
              <Input label="Wattage (W)" type="number" value={newPrinter.wattage} placeholder="350"
                onChange={e => setNewPrinter(v => ({ ...v, wattage: e.target.value }))} />
              <Input label="Rate (LKR/hr)" type="number" value={newPrinter.hourly_rate} placeholder="150"
                onChange={e => setNewPrinter(v => ({ ...v, hourly_rate: e.target.value }))} />
            </div>
            <Button variant="white" onClick={addPrinter} disabled={addingPrinter}
              style={{ alignSelf: 'flex-end', fontSize: '12px', padding: '6px 14px', minHeight: '36px' }}>
              {addingPrinter ? 'Adding…' : 'Add printer'}
            </Button>
          </div>
        </SettingsSection>

        {/* ── Filaments ── */}
        <SettingsSection title="Filaments">
          {filaments.map(f => (
            <div key={f.id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xs)' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', fontFamily: 'Geist, sans-serif' }}>
                {f.name}
              </div>
              <SettingsRow
                fields={[
                  { key: 'name', label: 'Name', type: 'text', value: f.name },
                  { key: 'brand', label: 'Brand', type: 'text', value: f.brand },
                  { key: 'material', label: 'Material', type: 'text', value: f.material },
                  { key: 'cost_per_kg', label: 'Cost/kg', suffix: 'LKR', type: 'number', value: f.cost_per_kg },
                ]}
                onSave={(values) => saveFilament(f.id, values)}
                onDelete={() => deleteFilament(f.id)}
              />
            </div>
          ))}

          <div style={addFormStyle}>
            <div style={{ fontSize: '12px', color: 'var(--ink-m)', fontWeight: 500 }}>Add new filament</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-sm)' }}>
              <Input label="Name" value={newFilament.name} placeholder="eSun PLA+"
                onChange={e => setNewFilament(v => ({ ...v, name: e.target.value }))} />
              <Input label="Brand" value={newFilament.brand} placeholder="eSun"
                onChange={e => setNewFilament(v => ({ ...v, brand: e.target.value }))} />
              <Input label="Material" value={newFilament.material} placeholder="PLA+"
                onChange={e => setNewFilament(v => ({ ...v, material: e.target.value }))} />
              <Input label="Cost/kg (LKR)" type="number" value={newFilament.cost_per_kg} placeholder="4700"
                onChange={e => setNewFilament(v => ({ ...v, cost_per_kg: e.target.value }))} />
            </div>
            <Button variant="white" onClick={addFilament} disabled={addingFilament}
              style={{ alignSelf: 'flex-end', fontSize: '12px', padding: '6px 14px', minHeight: '36px' }}>
              {addingFilament ? 'Adding…' : 'Add filament'}
            </Button>
          </div>
        </SettingsSection>

      </div>
    </div>
  )
}
