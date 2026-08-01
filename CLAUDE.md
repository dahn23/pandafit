# CLAUDE.md — PandaFit

Guide pour toute session Claude Code travaillant sur ce dépôt. **À lire en premier.**

## Le projet
PandaFit = application web pour **tablette**, autour d'un **capteur d'équilibre Bluetooth** (plateforme). Utilisée en entreprise, en **multi-clients**.
- **Front** : fichiers HTML statiques déployés sur Netlify.
- **Backend** : Supabase (Postgres + REST + RPC + Storage).

## Fichiers clés
- `index.html` — l'app tablette (capteur Bluetooth, jeux, PandaFit Index, accueil, Réglages). Gros fichier (images inline en base64).
- `pandafit-admin.html` — console superadmin (clients, tablettes, jeux, pubs, réglages).
- `rh/index.html`, `entreprises.html`, `mon-index.html` — pages marketing (pas l'app).
- `sw.js`, `manifest.webmanifest`, `icon-192.png`, `icon-512.png` — PWA.

## Déploiement
- Push sur `main` → **Netlify redéploie automatiquement** le site **pandafit2026** → https://pandafit2026.netlify.app (~10-20 s).
- **Supabase** : projet `kabjpqvbukhhqvdjnkzr`. Schéma SQL géré côté Supabase (migrations via l'outil MCP Supabase).
- **GitHub** : `dahn23/pandafit`.

## Conventions de travail
- Commits + communication en **français**, messages de commit descriptifs.
- On **pousse sur GitHub après validation** d'une modif (Dan teste sur tablette réelle quand c'est visuel/matériel).
- Terminer les messages de commit par `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Dan préfère des réponses **concises et décisives**. Éviter les longues boucles de débogage : proposer une **voie de secours AVANT** de s'enfoncer, pas après. Ne pas zigzaguer sur les recommandations.

## Architecture Supabase (important)
- Table `clients` : **lisible par tous** (anon), **modifiable seulement** par `authenticated`.
- La **tablette** utilise la clé anon et s'identifie par une `device_key` (pas de login) → elle ne peut PAS écrire dans `clients` directement.
- Pour laisser le RH écrire un réglage depuis la tablette → **fonction RPC `SECURITY DEFINER`** qui vérifie la `device_key` et ne modifie qu'un champ précis (ex. `set_home_display_mode`). Grant à `anon`.
- La console admin écrit via un compte `authenticated` (superadmin).

## Fonctionnalités construites (2026-08)

### Reconnexion Bluetooth automatique
- `PandaFitSensor` (dans `index.html`) : reconnexion sans sélecteur via `watchAdvertisements()` (méthode B), fallback `gatt.connect()` direct (méthode A). Récupère aussi après un débranchement du capteur.
- **Nécessite 2 flags Chrome expérimentaux PAR TABLETTE** : `chrome://flags/#enable-experimental-web-platform-features` + `chrome://flags/#enable-web-bluetooth-new-permissions-backend`.
- Préfixes de nom du capteur : `ASI_BLE` / `AdMOS_BLE` / `PandaFit`.

### Affichage de l'accueil : « disponible » vs « affiché »
- **Disponible** (admin seulement) : `clients.ads_enabled` + `clients.satisfaction_enabled`, **indépendants** (peut être les deux).
- **Affiché** (admin OU RH) : `clients.home_display_mode` ∈ `auto` / `satisfaction` / `ads` / `none`.
- Le RH change l'affichage depuis **Réglages** (protégé par code PIN) via la RPC `set_home_display_mode`. `resolveHomeMode()` gère le rendu, avec garde anti-incohérence (repli sur `auto` si le contenu choisi n'est plus dispo).

### Mise à jour à distance des tablettes
- **Refresh doux** : `clients.refresh_token` (bumpé par l'admin). La tablette poll toutes les ~20 s (`fetchTabletSignals`) → `softRefresh()` = re-fetch données + re-render **SANS reload** (garde le Bluetooth, n'interrompt pas une partie).
- **Rechargement complet** : `clients.reload_token` → `hardReloadApp()` (vide caches + `location.reload`). Puis reconnexion Bluetooth auto.
- **Nocturne** : par client, `clients.nightly_reload_enabled` + `clients.nightly_reload_hour` (0-23). `startNightlyReload()` relit la config en direct.
- Console admin → onglet **Tablettes** : carte « Mettre à jour les tablettes » (refresh doux / rechargement / nocturne).

### PWA
- App installable en plein écran. Manifest **externe** `manifest.webmanifest` (⚠️ un manifest data-URI ne permet PAS l'install WebAPK Android). `sw.js` en **network-first** (jamais de code périmé). Icônes 192 + 512.

## Verrouillage des tablettes (parc ≤ 10 pour l'instant)
- **Rester sur Chrome** : les navigateurs kiosque à WebView (Fully Kiosk…) cassent le Web Bluetooth.
- Verrouillage actuel : PWA plein écran + **épinglage d'écran** Android + notifications coupées + Ne pas déranger.
- À l'échelle : envisager un **MDM Android Enterprise** (Esper / Scalefusion / SureMDM).

## Note dépôt / Google Drive
- Le dépôt vit dans **Google Drive** → `git status` signale souvent des fichiers « modifiés » à tort (Drive touche les métadonnées). **Le contenu est identique** : se fier à `git diff` (contenu), pas au status. Config déjà en place (`core.autocrlf false`, `core.checkStat minimal`, `core.trustctime false`).
- Une copie propre hors Drive existe aussi dans `C:\Users\danha\dev\pandafit` (non utilisée par défaut ; Dan garde le dossier Drive + son raccourci).
