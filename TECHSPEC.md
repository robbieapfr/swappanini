# SWAP'WC26 — Tech Spec complet
> Version 1.0 — 8 juin 2026  
> Destination : Claude Code (coller ce fichier en contexte de départ)

---

## 1. Vision produit (résumé)

Webapp mobile-first permettant aux collectionneurs de vignettes Panini FIFA World Cup 2026 de lister leurs doublons, leurs souhaits, et de se matcher avec d'autres collectionneurs pour échanger — en main ou par courrier. Lancement avant le 11 juin 2026.

---

## 2. Stack technique

| Couche | Choix | Justification |
|--------|-------|---------------|
| Framework | Next.js 14 (App Router) | SSR + routing i18n natif, déployable Vercel en 1 clic |
| Base de données | Supabase (Postgres) | Auth, RLS, Storage, Realtime inclus |
| Auth | Supabase Auth | Email/password + OAuth Google |
| Hébergement | Vercel | Free tier suffisant pour le lancement |
| CSS | Tailwind CSS | Productivité, mobile-first natif |
| i18n | next-intl | Meilleure intégration App Router |
| Email | Resend | API simple, 3 000 emails/mois gratuits |
| Images stickers | Supabase Storage | Bucket public `sticker-images` |
| Typage | TypeScript strict | Obligatoire |

---

## 3. Variables d'environnement

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Resend
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=https://swap26.com
NEXT_PUBLIC_DEFAULT_LOCALE=en
```

---

## 4. Structure de fichiers

```
/
├── app/
│   └── [locale]/
│       ├── layout.tsx              # Provider i18n + Supabase
│       ├── page.tsx                # Landing page
│       ├── (auth)/
│       │   ├── login/page.tsx
│       │   └── register/page.tsx
│       └── (app)/                  # Routes protégées
│           ├── layout.tsx          # Bottom nav bar
│           ├── home/page.tsx
│           ├── collection/page.tsx
│           ├── wants/page.tsx
│           ├── playground/page.tsx
│           ├── inbox/page.tsx      # Messages
│           └── inbox/[swapId]/page.tsx
├── components/
│   ├── ui/                         # Composants génériques
│   ├── stickers/
│   │   ├── StickerCard.tsx
│   │   ├── StickerGrid.tsx
│   │   └── StickerModal.tsx
│   ├── matches/
│   │   ├── MatchCard.tsx
│   │   └── ProposeSwapModal.tsx
│   ├── inbox/
│   │   ├── ConversationList.tsx
│   │   └── SwapThread.tsx
│   └── layout/
│       ├── BottomNav.tsx
│       └── Header.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   ├── server.ts               # Server client (cookies)
│   │   └── middleware.ts
│   ├── matching.ts                 # Algo matching
│   └── email.ts                    # Templates Resend
├── hooks/
│   ├── useUserStickers.ts
│   ├── useMatches.ts
│   └── useSwaps.ts
├── messages/                       # i18n
│   ├── en.json
│   ├── fr.json
│   ├── es.json
│   └── de.json
├── app/api/
│   ├── matches/route.ts
│   ├── stickers/route.ts
│   ├── user-stickers/route.ts
│   ├── swaps/route.ts
│   ├── swaps/[id]/route.ts
│   └── swaps/[id]/messages/route.ts
├── middleware.ts                   # i18n routing + auth guard
├── i18n.ts
└── next.config.ts
```

---

## 5. Schéma Supabase

### 5.1 Tables

```sql
-- Catalogue vignettes (980 entrées, données fixes)
CREATE TABLE stickers (
  id          SERIAL PRIMARY KEY,
  code        TEXT NOT NULL,          -- ex: "FRA 7"
  country     TEXT NOT NULL,          -- ex: "France"
  number      INT NOT NULL,
  name        TEXT,                   -- NULL pour les vignettes photo d'équipe
  type        TEXT NOT NULL CHECK (type IN ('Joueur','Foil/Spécial','Photo d''équipe')),
  club        TEXT,                   -- NULL pour non-Joueur
  image_url   TEXT,
  UNIQUE(country, number)
);

-- Profils utilisateurs (extension de auth.users)
CREATE TABLE users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pseudo          TEXT NOT NULL UNIQUE,
  first_name      TEXT,
  last_name       TEXT,
  country         TEXT NOT NULL,
  city            TEXT,
  supported_club  TEXT,
  swap_preference TEXT NOT NULL DEFAULT 'both' CHECK (swap_preference IN ('mail','inperson','both')),
  avatar_url      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Collection utilisateur
-- Absence de ligne = vignette manquante (wanted implicite)
-- quantity = 1 : possédée, pas disponible à l'échange
-- quantity >= 2 : possédée avec doublon(s) disponibles
CREATE TABLE user_stickers (
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  sticker_id  INT REFERENCES stickers(id) ON DELETE CASCADE,
  quantity    INT NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  wanted      BOOLEAN DEFAULT FALSE,  -- priorité explicite (Wants screen)
  priority    INT CHECK (priority BETWEEN 1 AND 5),
  PRIMARY KEY (user_id, sticker_id)
);

-- Propositions d'échange
CREATE TABLE swaps (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiator_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','accepted','initiator_sent','receiver_sent','completed','refused','cancelled')),
  swap_mode     TEXT NOT NULL CHECK (swap_mode IN ('mail','inperson')),
  message       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Vignettes dans un échange (bidirectionnel)
CREATE TABLE swap_items (
  id          SERIAL PRIMARY KEY,
  swap_id     UUID NOT NULL REFERENCES swaps(id) ON DELETE CASCADE,
  sticker_id  INT NOT NULL REFERENCES stickers(id),
  from_user_id UUID NOT NULL REFERENCES users(id),
  quantity    INT NOT NULL DEFAULT 1
);

-- Messages dans le thread d'un échange
CREATE TABLE swap_messages (
  id          SERIAL PRIMARY KEY,
  swap_id     UUID NOT NULL REFERENCES swaps(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES users(id),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Gamification
CREATE TABLE badges (
  id               SERIAL PRIMARY KEY,
  name             TEXT NOT NULL,
  description      TEXT,
  condition_type   TEXT NOT NULL,  -- ex: 'swap_count', 'collection_pct'
  condition_value  JSONB NOT NULL, -- ex: {"count": 1}
  image_url        TEXT
);

CREATE TABLE user_badges (
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id   INT REFERENCES badges(id),
  earned_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);
```

### 5.2 Index

```sql
CREATE INDEX ON user_stickers(sticker_id) WHERE quantity > 1;
CREATE INDEX ON user_stickers(user_id, sticker_id);
CREATE INDEX ON swaps(initiator_id);
CREATE INDEX ON swaps(receiver_id);
CREATE INDEX ON swap_messages(swap_id, created_at);
```

### 5.3 RLS (Row Level Security)

```sql
ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE swaps         ENABLE ROW LEVEL SECURITY;
ALTER TABLE swap_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE swap_messages ENABLE ROW LEVEL SECURITY;

-- users : lecture publique des profils, écriture uniquement sur son propre profil
CREATE POLICY "public profiles"   ON users FOR SELECT USING (true);
CREATE POLICY "own profile write" ON users FOR ALL    USING (auth.uid() = id);

-- stickers : lecture publique totale
ALTER TABLE stickers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public stickers" ON stickers FOR SELECT USING (true);

-- user_stickers : lecture publique (nécessaire pour le matching), écriture sur sa collection
CREATE POLICY "public collection read"  ON user_stickers FOR SELECT USING (true);
CREATE POLICY "own collection write"    ON user_stickers FOR ALL    USING (auth.uid() = user_id);

-- swaps : lisibles uniquement par les deux parties
CREATE POLICY "swap participants read" ON swaps FOR SELECT
  USING (auth.uid() = initiator_id OR auth.uid() = receiver_id);
CREATE POLICY "swap initiator insert" ON swaps FOR INSERT
  WITH CHECK (auth.uid() = initiator_id);
CREATE POLICY "swap participants update" ON swaps FOR UPDATE
  USING (auth.uid() = initiator_id OR auth.uid() = receiver_id);

-- swap_items : lisibles par les participants du swap parent
CREATE POLICY "swap items read" ON swap_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM swaps s
    WHERE s.id = swap_id
    AND (s.initiator_id = auth.uid() OR s.receiver_id = auth.uid())
  ));
CREATE POLICY "swap items insert" ON swap_items FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

-- swap_messages : lisibles par les participants, écriture par participants
CREATE POLICY "messages read" ON swap_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM swaps s
    WHERE s.id = swap_id
    AND (s.initiator_id = auth.uid() OR s.receiver_id = auth.uid())
  ));
CREATE POLICY "messages insert" ON swap_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM swaps s
      WHERE s.id = swap_id
      AND (s.initiator_id = auth.uid() OR s.receiver_id = auth.uid())
      AND s.status NOT IN ('completed','refused','cancelled')
    )
  );
```

---

## 6. Algorithme de matching

### 6.1 Requête SQL principale

```sql
-- Retourne les utilisateurs compatibles pour l'échange avec :me
-- Paramètre : :me = auth.uid()

WITH my_dupes AS (
  SELECT sticker_id
  FROM user_stickers
  WHERE user_id = :me AND quantity > 1
),
my_wants AS (
  SELECT s.id AS sticker_id
  FROM stickers s
  LEFT JOIN user_stickers us ON us.sticker_id = s.id AND us.user_id = :me
  WHERE us.sticker_id IS NULL  -- pas de ligne = manquante = souhaitée
),
my_priority_wants AS (
  SELECT sticker_id
  FROM user_stickers
  WHERE user_id = :me AND priority IS NOT NULL
)

SELECT
  u.id,
  u.pseudo,
  u.city,
  u.country,
  u.swap_preference,
  COUNT(DISTINCT gives.sticker_id)    AS i_give_count,
  COUNT(DISTINCT gets.sticker_id)     AS i_get_count,
  COUNT(DISTINCT prio.sticker_id)     AS priority_match_count,
  COUNT(DISTINCT gives.sticker_id)
    + COUNT(DISTINCT gets.sticker_id)
    + COUNT(DISTINCT prio.sticker_id) * 2 AS match_score  -- boost priorités

FROM users u

-- Ce que je peux lui donner : mes doublons ∩ ses manques
JOIN my_dupes gives ON NOT EXISTS (
  SELECT 1 FROM user_stickers x
  WHERE x.user_id = u.id AND x.sticker_id = gives.sticker_id
)

-- Ce qu'il peut me donner : ses doublons ∩ mes manques
JOIN my_wants gets ON EXISTS (
  SELECT 1 FROM user_stickers y
  WHERE y.user_id = u.id AND y.sticker_id = gets.sticker_id AND y.quantity > 1
)

-- Boost si les vignettes qu'il me donne sont dans mes priorités
LEFT JOIN my_priority_wants prio ON prio.sticker_id = gets.sticker_id

WHERE u.id != :me

GROUP BY u.id, u.pseudo, u.city, u.country, u.swap_preference
HAVING COUNT(DISTINCT gives.sticker_id) > 0
   AND COUNT(DISTINCT gets.sticker_id) > 0

ORDER BY match_score DESC, priority_match_count DESC
LIMIT 20;
```

### 6.2 Détail des vignettes pour un match

```sql
-- Pour afficher les sticker cards dans une MatchCard
-- Paramètres : :me, :other

-- Ce que je lui donne (mes doublons qu'il n'a pas)
SELECT s.* FROM stickers s
JOIN user_stickers us ON us.sticker_id = s.id AND us.user_id = :me AND us.quantity > 1
WHERE NOT EXISTS (
  SELECT 1 FROM user_stickers x WHERE x.user_id = :other AND x.sticker_id = s.id
)
LIMIT 5;

-- Ce qu'il me donne (ses doublons que je n'ai pas)
SELECT s.*, (us2.priority IS NOT NULL) AS is_my_priority
FROM stickers s
JOIN user_stickers us ON us.sticker_id = s.id AND us.user_id = :other AND us.quantity > 1
LEFT JOIN user_stickers us2 ON us2.sticker_id = s.id AND us2.user_id = :me AND us2.priority IS NOT NULL
WHERE NOT EXISTS (
  SELECT 1 FROM user_stickers x WHERE x.user_id = :me AND x.sticker_id = s.id
)
ORDER BY is_my_priority DESC
LIMIT 5;
```

---

## 7. Routes API Next.js

### GET `/api/matches`
Retourne les 20 meilleurs matchs pour l'utilisateur connecté.  
Auth requise. Appelle la requête SQL §6.1 via Supabase RPC.

```typescript
// lib/matching.ts
export async function getMatches(userId: string, supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc('get_matches', { me: userId })
  return data
}
```

Créer la fonction Supabase RPC correspondante :
```sql
CREATE OR REPLACE FUNCTION get_matches(me uuid)
RETURNS TABLE(...) AS $$ [requête §6.1] $$ LANGUAGE sql SECURITY DEFINER;
```

### GET/POST `/api/user-stickers`
- GET : retourne la collection de l'utilisateur connecté
- POST body : `{ sticker_id, quantity }` — upsert dans user_stickers

### POST `/api/swaps`
Crée une proposition d'échange.  
Body : `{ receiver_id, swap_mode, message, items: [{sticker_id, from_user_id, quantity}] }`  
Déclenche email de notification au receiver.

### PATCH `/api/swaps/[id]`
Met à jour le statut du swap.  
Body : `{ status: 'accepted' | 'refused' | 'initiator_sent' | 'receiver_sent' | 'completed' }`  
Déclenche email de notification à l'autre partie.

### GET/POST `/api/swaps/[id]/messages`
- GET : retourne les messages du thread
- POST body : `{ content }` — insère un message, déclenche email si l'autre n'est pas en ligne

---

## 8. i18n — next-intl

### 8.0 Règle absolue — zéro string hardcodé

**Aucun texte UI ne doit apparaître directement dans le JSX.** Tout passe par `useTranslations()` dès le premier composant. Si Claude Code écrit `<p>Propose swap</p>` sans passer par `t()`, c'est un bug à corriger immédiatement.

Instruction à donner à Claude Code à chaque session :
> "Aucun string UI ne doit être hardcodé — tout passe par useTranslations(). Fournis toujours la clé dans en.json ET fr.json en même temps que tu crées le composant."

ES et DE peuvent être ajoutés post-lancement en copiant en.json et en traduisant les valeurs.

### 8.1 Configuration

```typescript
// i18n.ts
import { getRequestConfig } from 'next-intl/server'

export const locales = ['en', 'fr', 'es', 'de'] as const
export const defaultLocale = 'en' as const

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./messages/${locale}.json`)).default
}))
```

```typescript
// middleware.ts
import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n'

export default createMiddleware({
  locales,
  defaultLocale,
  localeDetection: true  // auto-detect depuis Accept-Language header
})

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
}
```

### 8.2 Structure des messages

```json
// messages/fr.json (exemple — répliquer pour en/es/de)
{
  "nav": {
    "home": "Accueil",
    "collection": "Collection",
    "wants": "Souhaits",
    "playground": "Playground",
    "profile": "Profil"
  },
  "home": {
    "stats_complete": "{pct}% complété",
    "stats_doubles": "{count} doublons",
    "top_matches": "Meilleurs matchs du jour",
    "propose_swap": "Proposer l'échange"
  },
  "collection": {
    "owned": "possédées",
    "doubles": "doublons",
    "missing": "manquantes"
  },
  "wants": {
    "priorities": "Priorités ★",
    "priority_slots": "{used}/5 priorités",
    "add_priority": "Ajouter une priorité",
    "other_wanted": "Autres souhaitées ({count})"
  },
  "playground": {
    "matches_count": "{count} matchs compatibles",
    "gives": "tu lui donnes",
    "gets": "il te donne",
    "priority_badge": "PRIORITÉ"
  },
  "swap": {
    "propose_title": "Proposer un échange",
    "confirm": "Envoyer la proposition",
    "accept": "Accepter",
    "refuse": "Refuser",
    "mark_sent": "J'ai envoyé mes vignettes",
    "status_pending": "En attente",
    "status_accepted": "Accepté",
    "status_completed": "Terminé"
  },
  "onboarding": {
    "step1_title": "Crée ton profil",
    "step2_title": "Ton mode d'échange",
    "step3_title": "Commence ta collection",
    "cta_start": "C'est parti !"
  },
  "errors": {
    "generic": "Une erreur est survenue. Réessaie."
  }
}
```

---

## 9. Notifications email (Resend)

### 9.1 Templates

```typescript
// lib/email.ts
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendSwapProposal(to: string, props: {
  receiverPseudo: string
  initiatorPseudo: string
  swapId: string
  locale: string
}) {
  await resend.emails.send({
    from: 'SWAP\'26 <noreply@swap26.com>',
    to,
    subject: `${props.initiatorPseudo} te propose un échange !`,
    html: swapProposalTemplate(props)
  })
}

export async function sendSwapAccepted(to: string, props: {...}) { ... }
export async function sendSwapMessage(to: string, props: {...}) { ... }
export async function sendNewMatch(to: string, props: {...}) { ... }
```

### 9.2 Événements déclencheurs

| Événement | Destinataire | Email |
|-----------|-------------|-------|
| Swap proposé | receiver | "X te propose un échange" |
| Swap accepté | initiator | "X a accepté ton échange" |
| Swap refusé | initiator | "X a refusé ton échange" |
| Nouveau message | autre partie | "Nouveau message de X" |
| Vignettes envoyées | autre partie | "X a envoyé ses vignettes" |

---

## 10. Landing page + Onboarding

### 10.1 Structure landing (/)

```
Hero
  ├── Headline : "Échange tes vignettes dans le monde entier"
  ├── Sous-titre : "Rejoins des milliers de collectionneurs avant la Coupe du Monde"
  ├── CTA principal : "Commencer gratuitement" → ouvre la modal d'inscription
  └── CTA secondaire : "Se connecter"

Section Fonctionnement (3 étapes illustrées)
  ├── 1. Ajoute tes vignettes
  ├── 2. Trouve tes matchs
  └── 3. Échange !

Social proof : compteur users + swaps (depuis Supabase, SSR)

Footer : liens légaux, sélecteur de langue
```

### 10.2 Flow onboarding (3 étapes post-inscription)

```
Étape 1 — Profil
  Champs : pseudo (unique), prénom, pays, ville, club de cœur
  Validation : pseudo unique vérifiée en temps réel

Étape 2 — Mode d'échange
  Toggle multi : Courrier / En main / Les deux
  Info contextuelle sur les frais de port

Étape 3 — Collection de départ
  Option A : "Je commence de zéro" → redirige vers /collection
  Option B : "J'ai déjà des vignettes" → sélecteur rapide par pays
             (5-10 vignettes pour bootstrapper les matchs)
  → Redirect vers /home
```

---

## 11. Gestion de la collection (UX sticker)

### 11.1 Tap simple sur une vignette (Collection screen)

- Si `quantity = 0` (absent) → passe à `quantity = 1` (possédée)
- Si `quantity >= 1` → incrémente `quantity + 1` (doublon)
- Upsert en DB avec debounce 800ms (évite les appels multiples)

### 11.2 Long press (> 500ms)

Ouvre un `StickerModal` avec :
- Nom du joueur, pays, club
- Sélecteur de quantité (– / nombre / +)
- Toggle "Priorité ★" (max 5 par user)
- Bouton "Retirer de ma collection"

---

## 12. États d'un swap

```
pending       → Proposition envoyée, attente réponse du receiver
accepted      → Receiver a accepté, échange à organiser
initiator_sent → Initiator a cliqué "J'ai envoyé mes vignettes"
receiver_sent  → Receiver a cliqué "J'ai envoyé mes vignettes"
completed     → Les deux ont confirmé l'envoi
refused       → Receiver a refusé
cancelled     → Initiator a annulé avant acceptation
```

---

## 13. Premier prompt Claude Code

Coller ce fichier en contexte, puis utiliser le prompt suivant :

```
Tu es un senior fullstack developer. Je construis une webapp Next.js 14 (App Router) 
+ Supabase + Vercel. Le tech spec complet est dans TECHSPEC.md.

Commence par :
1. Initialiser le projet Next.js avec TypeScript + Tailwind + next-intl
2. Configurer Supabase client (browser + server)
3. Créer le middleware i18n + auth guard
4. Créer le schéma SQL complet (§5 du spec) sous /supabase/migrations/001_init.sql
5. Créer les fichiers de messages i18n (§8.2) pour en/fr/es/de

Ne génère pas encore les pages — uniquement l'infrastructure.
Palette de couleurs : vert foncé #1B3B1A + lime #AAFF00.
Mobile-first, Tailwind uniquement, pas de librairie de composants.
```

---

## 14. Données de départ (seed)

Le fichier `panini_stickers_enriched.xlsx` contient les 980 vignettes avec :
- Colonnes : Code, Pays, N°, Prénom Nom, Type, Possédé?, Club

**La colonne "Possédé?" ne fait pas partie du catalogue** — elle représente la collection personnelle du fondateur. Elle ne doit pas être importée dans la table `stickers`.

### 14.1 Script `/supabase/seed_stickers.ts`

Importe uniquement les colonnes du catalogue dans `stickers` :
1. Lit le fichier xlsx
2. Ignore la colonne "Possédé?"
3. Insère les 980 lignes dans la table `stickers` (Code, Pays, N°, Prénom Nom, Type, Club)
4. Insère les badges de départ (Premier échange, 5 étoiles, Échange international, Collection complète)

### 14.2 Script `/supabase/seed_user_collection.ts`

Script one-shot pour importer la collection personnelle du fondateur :
1. Lit la colonne "Possédé?" du xlsx (valeur = 1 → quantity = 1 dans user_stickers)
2. Récupère l'UUID du compte fondateur par email
3. Upsert dans `user_stickers` pour chaque vignette marquée possédée
4. À exécuter une seule fois après la création du compte fondateur

---

*Tech spec produit le 8 juin 2026 — Cowork + Claude*
