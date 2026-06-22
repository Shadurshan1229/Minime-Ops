import { create } from 'zustand'
import type { Filament, Printer, PrintRecord, QuickQuoteConfig, PrintType, MacroSettings } from '../types'
import type { CalcResult } from '../lib/calculations'

type CalcMode = 'full' | 'quick'

type CalculatorStore = {
  filaments: Filament[]
  printers: Printer[]
  printTypes: PrintType[]
  quickQuoteConfigs: QuickQuoteConfig[]
  macroSettings: MacroSettings | null
  setFilaments: (f: Filament[]) => void
  setPrinters: (p: Printer[]) => void
  setPrintTypes: (t: PrintType[]) => void
  setQuickQuoteConfigs: (c: QuickQuoteConfig[]) => void
  setMacroSettings: (s: MacroSettings) => void

  mode: CalcMode
  setMode: (m: CalcMode) => void

  selectedPrintTypeId: string
  setSelectedPrintTypeId: (id: string) => void

  selectedPrinterId: string
  selectedFilamentId: string
  printTimeHours: number
  printTimeMinutes: number
  filamentGrams: number
  markupMultiplier: number
  deliveryCost: number
  painterCost: number
  packagingCost: number
  setSelectedPrinterId: (id: string) => void
  setSelectedFilamentId: (id: string) => void
  setPrintTimeHours: (h: number) => void
  setPrintTimeMinutes: (m: number) => void
  setFilamentGrams: (g: number) => void
  setMarkupMultiplier: (m: number) => void
  setDeliveryCost: (c: number) => void
  setPainterCost: (c: number) => void
  setPackagingCost: (c: number) => void

  result: CalcResult | null
  setResult: (r: CalcResult | null) => void

  qqSize: 'small' | 'medium' | 'large' | 'xl' | null
  qqDetail: 'simple' | 'moderate' | 'high' | null
  setQqSize: (s: 'small' | 'medium' | 'large' | 'xl') => void
  setQqDetail: (d: 'simple' | 'moderate' | 'high') => void

  savedRecords: PrintRecord[]
  setSavedRecords: (r: PrintRecord[]) => void
}

export const useCalculatorStore = create<CalculatorStore>((set) => ({
  filaments: [],
  printers: [],
  printTypes: [],
  quickQuoteConfigs: [],
  macroSettings: null,
  setFilaments: (filaments) => set({ filaments }),
  setPrinters: (printers) => set({ printers }),
  setPrintTypes: (printTypes) => set({ printTypes }),
  setQuickQuoteConfigs: (quickQuoteConfigs) => set({ quickQuoteConfigs }),
  setMacroSettings: (macroSettings) => set({ macroSettings }),

  mode: 'full',
  setMode: (mode) => set({ mode }),

  selectedPrintTypeId: '',
  setSelectedPrintTypeId: (id) => set({ selectedPrintTypeId: id }),

  selectedPrinterId: '',
  selectedFilamentId: '',
  printTimeHours: 0,
  printTimeMinutes: 0,
  filamentGrams: 0,
  markupMultiplier: 1.6,
  deliveryCost: 0,
  painterCost: 0,
  packagingCost: 200,
  setSelectedPrinterId: (selectedPrinterId) => set({ selectedPrinterId }),
  setSelectedFilamentId: (selectedFilamentId) => set({ selectedFilamentId }),
  setPrintTimeHours: (printTimeHours) => set({ printTimeHours }),
  setPrintTimeMinutes: (printTimeMinutes) => set({ printTimeMinutes }),
  setFilamentGrams: (filamentGrams) => set({ filamentGrams }),
  setMarkupMultiplier: (markupMultiplier) => set({ markupMultiplier }),
  setDeliveryCost: (deliveryCost) => set({ deliveryCost }),
  setPainterCost: (painterCost) => set({ painterCost }),
  setPackagingCost: (packagingCost) => set({ packagingCost }),

  result: null,
  setResult: (result) => set({ result }),

  qqSize: null,
  qqDetail: null,
  setQqSize: (qqSize) => set({ qqSize }),
  setQqDetail: (qqDetail) => set({ qqDetail }),

  savedRecords: [],
  setSavedRecords: (savedRecords) => set({ savedRecords }),
}))
