// ============================================================
// Authentification Google Sheets via COMPTE DE SERVICE.
// Aucune dépendance externe : on signe nous-mêmes un JWT RS256 avec la clé
// privée du compte de service, qu'on échange contre un access token OAuth.
// Envs requis (réglés dans Vercel par l'admin) :
//   GOOGLE_SERVICE_ACCOUNT_EMAIL        xxx@projet.iam.gserviceaccount.com
//   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY  -----BEGIN PRIVATE KEY----- ... (avec \n)
// ============================================================
import { createSign } from 'crypto'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets'

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

let cached: { token: string; exp: number } | null = null

export class SheetsAuthError extends Error {}

export async function getGoogleAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  if (cached && cached.exp - 60 > now) return cached.token

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  let key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  if (!email || !key) {
    throw new SheetsAuthError('Google Sheets non configuré : ajoutez GOOGLE_SERVICE_ACCOUNT_EMAIL et GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY dans Vercel.')
  }
  key = key.replace(/\\n/g, '\n')

  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = b64url(JSON.stringify({
    iss: email,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  }))
  const signingInput = `${header}.${claim}`
  let signature: string
  try {
    const signer = createSign('RSA-SHA256')
    signer.update(signingInput)
    signature = b64url(signer.sign(key))
  } catch {
    throw new SheetsAuthError('Clé privée du compte de service invalide.')
  }
  const assertion = `${signingInput}.${signature}`

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new SheetsAuthError(`Échec d'authentification Google : ${res.status} ${txt.slice(0, 160)}`)
  }
  const json = (await res.json()) as { access_token?: string; expires_in?: number }
  if (!json.access_token) throw new SheetsAuthError('Réponse Google sans access_token.')
  cached = { token: json.access_token, exp: now + (json.expires_in ?? 3600) }
  return json.access_token
}

/** Extrait l'ID d'un Google Sheet depuis une URL complète ou renvoie l'entrée si c'est déjà un ID. */
export function extractSpreadsheetId(input: string): string | null {
  const s = input.trim()
  const m = s.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  if (m) return m[1]
  if (/^[a-zA-Z0-9-_]{20,}$/.test(s)) return s
  return null
}
