import { describe, it, expect } from 'vitest'
import { pickLocale, isLocale, defaultLocale } from '@/i18n/locales'

describe('isLocale', () => {
  it('reconnaît fr/en', () => {
    expect(isLocale('fr')).toBe(true)
    expect(isLocale('en')).toBe(true)
  })
  it('rejette le reste', () => {
    expect(isLocale('de')).toBe(false)
    expect(isLocale(null)).toBe(false)
    expect(isLocale(undefined)).toBe(false)
  })
})

describe('pickLocale', () => {
  it('défaut si en-tête absent', () => {
    expect(pickLocale(null)).toBe(defaultLocale)
    expect(pickLocale('')).toBe(defaultLocale)
  })
  it('choisit la langue demandée', () => {
    expect(pickLocale('en-US,en;q=0.9')).toBe('en')
    expect(pickLocale('fr-FR,fr;q=0.9')).toBe('fr')
  })
  it('première langue supportée dans la liste', () => {
    expect(pickLocale('de-DE,de;q=0.9,en;q=0.8')).toBe('en')
  })
  it('défaut si aucune langue supportée', () => {
    expect(pickLocale('de,es')).toBe('fr')
  })
})
