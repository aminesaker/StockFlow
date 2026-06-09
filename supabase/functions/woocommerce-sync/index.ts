// ============================================================
// StockFlow — Edge Function : woocommerce-sync
// Reçoit les webhooks WooCommerce (product.created / updated / deleted)
// et synchronise la table public.products.
// Auth : signature HMAC-SHA256 (header x-wc-webhook-signature).
// ============================================================
import { createClient } from "jsr:@supabase/supabase-js@2";

// Secret partagé avec le webhook WooCommerce.
// Défini dans WooCommerce (champ "Secret") ET ici via le secret Supabase
// WC_WEBHOOK_SECRET. Fallback intégré pour le dev local.
const WC_SECRET =
  Deno.env.get("WC_WEBHOOK_SECRET") ??
  "ec9565ffa9ea3672ed0e8ec7686ac23a0917fa5a6b14e956";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// HMAC-SHA256(body, secret) encodé en base64, comme WooCommerce.
async function sign(body: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body),
  );
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

// Comparaison à temps constant.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const stripHtml = (s: unknown): string | null =>
  typeof s === "string" && s.trim()
    ? s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
    : null;

const toNumber = (v: unknown): number => {
  const n = parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
};

// Mappe un objet produit WooCommerce vers une ligne products.
function mapProduct(p: any) {
  return {
    woo_id: p.id,
    name: p.name ?? `Produit ${p.id}`,
    sku: p.sku && String(p.sku).trim() ? String(p.sku).trim() : `woo-${p.id}`,
    description: stripHtml(p.short_description) ?? stripHtml(p.description),
    price: toNumber(p.price ?? p.regular_price),
    stock_quantity:
      p.stock_quantity === null || p.stock_quantity === undefined
        ? 0
        : Math.trunc(toNumber(p.stock_quantity)),
    category: Array.isArray(p.categories) && p.categories[0]?.name
      ? p.categories[0].name
      : null,
    image_url: Array.isArray(p.images) && p.images[0]?.src
      ? p.images[0].src
      : null,
    updated_at: new Date().toISOString(),
  };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const raw = await req.text();

  // 1) Vérification de la signature WooCommerce.
  const provided = req.headers.get("x-wc-webhook-signature") ?? "";
  const expected = await sign(raw, WC_SECRET);
  if (!provided || !safeEqual(provided, expected)) {
    return new Response(JSON.stringify({ error: "invalid signature" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2) Ping de validation WooCommerce (à la création du webhook).
  const topic = req.headers.get("x-wc-webhook-topic") ?? "";
  let payload: any;
  try {
    payload = JSON.parse(raw || "{}");
  } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (payload.webhook_id && !payload.id) {
    return new Response(JSON.stringify({ ok: true, ping: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // 3) Suppression.
    if (topic === "product.deleted" || payload.deleted) {
      const wooId = payload.id;
      if (wooId) {
        await supabase.from("products").delete().eq("woo_id", wooId);
      }
      return new Response(JSON.stringify({ ok: true, action: "deleted", woo_id: wooId }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4) Création / mise à jour → upsert par woo_id.
    const row = mapProduct(payload);
    const { error } = await supabase
      .from("products")
      .upsert(row, { onConflict: "woo_id" });

    if (error) {
      console.error("upsert error", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ ok: true, action: "upserted", woo_id: row.woo_id }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
