export type CalcInputs = {
  filamentGrams: number
  costPerKg: number
  printTimeMinutes: number
  wattage: number
  electricityRateKwh: number
  maintenanceRatePerHour: number
  labourRatePerHour: number
  deliveryCost: number
  painterCost: number
  packagingCost: number
  markupMultiplier: number
}

export type CalcResult = {
  costFilament: number
  costElectricity: number
  costMaintenance: number
  costLabour: number
  costDelivery: number
  costPainter: number
  costPackaging: number
  costTotal: number
  priceSuggested: number
}

export function calculate(inputs: CalcInputs): CalcResult {
  const printTimeH = inputs.printTimeMinutes / 60

  const costFilament    = inputs.filamentGrams * (inputs.costPerKg / 1000)
  const costElectricity = (printTimeH * inputs.wattage / 1000) * inputs.electricityRateKwh
  const costMaintenance = printTimeH * inputs.maintenanceRatePerHour
  const costLabour      = printTimeH * inputs.labourRatePerHour
  const costDelivery    = inputs.deliveryCost
  const costPainter     = inputs.painterCost
  const costPackaging   = inputs.packagingCost

  const costTotal = costFilament + costElectricity + costMaintenance
    + costLabour + costDelivery + costPainter + costPackaging

  const priceSuggested = costTotal * inputs.markupMultiplier

  return {
    costFilament,
    costElectricity,
    costMaintenance,
    costLabour,
    costDelivery,
    costPainter,
    costPackaging,
    costTotal,
    priceSuggested,
  }
}

export type QuickQuoteInputs = {
  filamentGramsMin: number
  filamentGramsMax: number
  printTimeMinutesMin: number
  printTimeMinutesMax: number
  costPerKg: number
  wattage: number
  electricityRateKwh: number
  maintenanceRatePerHour: number
  labourRatePerHour: number
  packagingCost: number
  markupMultiplier: number
}

export type QuickQuoteResult = {
  priceMin: number
  priceMax: number
}

export function calculateQuickQuote(inputs: QuickQuoteInputs): QuickQuoteResult {
  const base = {
    electricityRateKwh: inputs.electricityRateKwh,
    maintenanceRatePerHour: inputs.maintenanceRatePerHour,
    labourRatePerHour: inputs.labourRatePerHour,
    wattage: inputs.wattage,
    costPerKg: inputs.costPerKg,
    packagingCost: inputs.packagingCost,
    deliveryCost: 0,
    painterCost: 0,
    markupMultiplier: inputs.markupMultiplier,
  }

  const low = calculate({
    ...base,
    filamentGrams: inputs.filamentGramsMin,
    printTimeMinutes: inputs.printTimeMinutesMin,
  })

  const high = calculate({
    ...base,
    filamentGrams: inputs.filamentGramsMax,
    printTimeMinutes: inputs.printTimeMinutesMax,
  })

  return { priceMin: low.priceSuggested, priceMax: high.priceSuggested }
}

export function formatLKR(amount: number): string {
  return `Rs ${Math.round(amount).toLocaleString('en-LK')}`
}
