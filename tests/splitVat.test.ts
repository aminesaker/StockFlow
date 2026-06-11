import { describe, it, expect } from 'vitest'
import { splitVat } from '@/lib/billing/profile'

describe('splitVat', () => {
  it('franchise de TVA : pas de TVA', () => {
    expect(splitVat(120, { vat_exempt: true, default_vat_rate: 20 }))
      .toEqual({ subtotal: 120, vat_rate: 0, vat_amount: 0, amount: 120 })
  })

  it('TVA 20 % : ventile HT/TVA/TTC', () => {
    expect(splitVat(120, { vat_exempt: false, default_vat_rate: 20 }))
      .toEqual({ subtotal: 100, vat_rate: 20, vat_amount: 20, amount: 120 })
  })

  it('taux 0 = pas de TVA', () => {
    expect(splitVat(50, { vat_exempt: false, default_vat_rate: 0 }))
      .toEqual({ subtotal: 50, vat_rate: 0, vat_amount: 0, amount: 50 })
  })

  it('arrondit à 2 décimales', () => {
    const r = splitVat(4166.67, { vat_exempt: false, default_vat_rate: 20 })
    expect(r.subtotal).toBe(3472.23)
    expect(r.vat_amount).toBe(694.44)
    expect(r.amount).toBe(4166.67)
  })

  it('TTC = HT + TVA (invariant)', () => {
    for (const amt of [9.9, 39.9, 100, 249.99, 1000.01]) {
      const r = splitVat(amt, { vat_exempt: false, default_vat_rate: 20 })
      expect(Math.round((r.subtotal + r.vat_amount) * 100) / 100).toBe(r.amount)
    }
  })
})
