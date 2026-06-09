# Synchro WooCommerce → StockFlow

Quand tu ajoutes / modifies / supprimes un produit dans WooCommerce, il est
automatiquement répercuté dans la table `products` de StockFlow.

## Comment ça marche

```
WooCommerce  ──(webhook signé HMAC)──►  Edge Function Supabase  ──►  table products
```

L'Edge Function `woocommerce-sync` est déjà déployée et testée. Il te reste juste
à créer 3 webhooks dans WooCommerce.

## Infos à coller dans WooCommerce

| Champ            | Valeur                                                                       |
|------------------|------------------------------------------------------------------------------|
| **Delivery URL** | `https://bkdwerkmeekfutmlrmso.supabase.co/functions/v1/woocommerce-sync`     |
| **Secret**       | `ec9565ffa9ea3672ed0e8ec7686ac23a0917fa5a6b14e956`                           |
| **API version**  | `WP REST API Integration v3`                                                 |
| **Status**       | `Active`                                                                      |

## Étapes

1. Dans WordPress : **WooCommerce → Réglages → Avancé → Webhooks**.
2. Clique **Ajouter un webhook**. Crée-en **3**, un par topic :
   - `Product created`
   - `Product updated`
   - `Product deleted`
3. Pour chacun : colle la **Delivery URL** et le **Secret** ci-dessus, mets le
   statut sur **Active**, puis **Enregistrer**.
4. WooCommerce envoie un ping de validation à l'enregistrement → la fonction
   répond 200, le webhook passe en vert.

C'est tout. Ajoute un produit test dans WooCommerce → il apparaît dans StockFlow.

## Notes

- **ngrok n'est pas nécessaire** pour cette synchro : c'est WooCommerce qui appelle
  Supabase (sortant). Tant que ta machine a accès à Internet, ça marche, même sans
  exposer WordPress. (ngrok ne sert que si tu veux que l'extérieur accède à ton WP.)
- **Mapping des champs** : `name`, `sku` (fallback `woo-<id>` si vide), `price`,
  `stock_quantity`, `category` (1ʳᵉ catégorie), `image_url` (1ʳᵉ image),
  `description` (HTML nettoyé). Le champ `cost` reste à 0 (WooCommerce n'a pas de
  coût d'achat natif).
- **Idempotent** : chaque produit est lié par `woo_id`. Réenvoyer le même produit
  met à jour la ligne au lieu de la dupliquer. Les produits créés manuellement dans
  StockFlow (sans `woo_id`) ne sont jamais touchés.
- **Sécurité** : toute requête sans signature HMAC valide est rejetée (401).
- **Pour la prod** : le secret est intégré en fallback dans le code. Tu peux le
  surcharger en définissant le secret Supabase `WC_WEBHOOK_SECRET`
  (Dashboard → Edge Functions → Secrets).

## Débogage

Logs de la fonction : Supabase Dashboard → Edge Functions → `woocommerce-sync` → Logs.
Dans WooCommerce, chaque webhook garde un historique de livraison (code de réponse).
