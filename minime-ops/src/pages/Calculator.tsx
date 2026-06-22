import { useEffect } from 'react'
import { Settings } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useCalculatorStore } from '../store/calculatorStore'
import { useAppStore } from '../store/appStore'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import CalcModeTabs from '../components/calculator/CalcModeTabs'
import FullCalc from '../components/calculator/FullCalc'
import QuickQuote from '../components/calculator/QuickQuote'
import SavedRecords from '../components/calculator/SavedRecords'

export default function Calculator() {
  const { setActivePage } = useAppStore()
  const {
    mode,
    setFilaments, setPrinters, setPrintTypes,
    setQuickQuoteConfigs, setMacroSettings, setSavedRecords,
    setSelectedPrinterId, setSelectedFilamentId,
    setSelectedPrintTypeId, setMarkupMultiplier, setPackagingCost,
  } = useCalculatorStore()

  useEffect(() => {
    supabase.from('filaments').select('*').then(({ data, error }) => {
      if (error) { console.error('[filaments]', error); return }
      if (data?.length) { setFilaments(data); setSelectedFilamentId(data[0].id) }
    })
    supabase.from('printers').select('*').eq('active', true).then(({ data, error }) => {
      if (error) { console.error('[printers]', error); return }
      if (data?.length) { setPrinters(data); setSelectedPrinterId(data[0].id) }
    })
    supabase.from('print_types').select('*').then(({ data, error }) => {
      if (error) { console.error('[print_types]', error); return }
      if (data?.length) {
        setPrintTypes(data)
        setSelectedPrintTypeId(data[0].id)
        setMarkupMultiplier(data[0].markup_multiplier)
        setPackagingCost(data[0].packaging_cost_default)
      }
    })
    supabase.from('quick_quote_config').select('*').then(({ data, error }) => {
      if (error) { console.error('[quick_quote_config]', error); return }
      if (data) setQuickQuoteConfigs(data)
    })
    supabase.from('macro_settings').select('*').maybeSingle().then(({ data, error }) => {
      if (error) { console.error('[macro_settings]', error); return }
      if (data) setMacroSettings(data)
    })
    supabase.from('print_records').select('*').order('created_at', { ascending: false }).limit(10).then(({ data, error }) => {
      if (error) { console.error('[print_records]', error); return }
      if (data) setSavedRecords(data)
    })
  }, [])

  return (
    <div>
      <PageHeader
        title="Calculator"
        subtitle="Cost and price your prints"
        action={
          <Button variant="icon" onClick={() => setActivePage('settings')}>
            <Settings size={16} strokeWidth={1.5} />
          </Button>
        }
      />
      <div style={{ padding: '0 var(--sp-xl) var(--sp-xl)' }}>
        <CalcModeTabs />
        {mode === 'full' ? <FullCalc /> : <QuickQuote />}
        <SavedRecords />
      </div>
    </div>
  )
}
