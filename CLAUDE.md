# CLAUDE.md — PandaFit

Guide pour toute session Claude Code travaillant sur ce dépôt. **À lire en premier.**

## Le projet
PandaFit = application web pour **tablette**, autour d'un **capteur d'équilibre Bluetooth** (plateforme). Utilisée en entreprise, en **multi-clients**.
- **Front** : fichiers HTML statiques déployés sur Netlify.
- **Backend** : Supabase (Postgres + REST + RPC + Storage).

## Fichiers clés
- `index.html` — l'app tablette (capteur Bluetooth, jeux, PandaFit Index, accueil, Réglages). Gros fichier (images inline en base64).
- `pandafit-admin.html` — console superadmin (clients, tablettes, jeux, pubs, réglages).
- `rh/index.html`, `mon-index.html` — pages marketing (pas l'app). La vitrine publique est dans `site/` (pandafit.ch).
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
- Tables `clients` / `projects` : lecture et écriture réservées aux comptes `authenticated` autorisés (RLS `pf_can_client` / `pf_can_project`). La tablette passe uniquement par des RPC `tablet_*`.
- La **tablette** utilise la clé anon et s'identifie par une `device_key` (pas de login) → elle ne peut PAS écrire dans `clients` directement.
- Pour laisser le RH écrire un réglage depuis la tablette → **fonction RPC `SECURITY DEFINER`** qui vérifie la `device_key` et ne modifie qu'un champ précis (ex. `set_home_display_mode`). Grant à `anon`.
- La console admin écrit via un compte `authenticated` (superadmin).

## Modèle PROJETS (depuis le 05.11.2026) — à lire avant de toucher tablette / console / coach
**Client → Projets → Séances (événements).** Le client n'est plus qu'une fiche (détail, historique, stats, questionnaires, espace RH). **Tout se règle par projet.**
- Table `projects` : un projet = ce qui est vendu (`offer` : decouverte, team_building, mois_equilibre, campagne_annuelle, abonnement, demo_vip), avec **UN code** `PANDA-XXXX` (que les tablettes rejoignent) et un **`pin`** (Réglages de la tablette). Il porte aussi tous les réglages tablette d'avant (jeux via `project_games`, accueil, pubs `client_ads.project_id`, satisfaction, défis `defis.project_id`, annonces `events.project_id`, refresh/reload/nocturne).
- `event_sessions.project_id` : les séances du projet. **Dates indicatives : c'est le coach qui démarre (`coach_start`, statut `en_cours`) et termine (`coach_end` / `coach_close`) chaque séance**, depuis son espace ou les Réglages de la tablette (`tablet_project_action`, PIN revérifié côté serveur). Une seule séance en cours à la fois par projet.
- Projet terminé tout seul (trigger) quand sa dernière séance est terminée — sauf `abonnement` / `campagne_annuelle` : fin à `ends_on`. Libre-service (`pf_offer_libre`) = mois, campagne, abonnement.
- **Tablettes** : appartiennent à PandaFit. `devices.project_id` + `poste` (`index` / `jeux` / id d'un jeu = station Triathlon) + `last_seen_at`. Hors projet = **au parc** (client technique `PandaFit (parc)`, id `…0000aa`, `pf_parc_client()`), écran « Entre le code du projet ». `devices.client_id` suit le projet (parc sinon). Retour au parc automatique quand le projet se termine (`pf_tablet_device`).
- Tablette (`index.html`) : `tabletMode()` = parc / seance / libre / attente ; `tablet_bootstrap` renvoie projet + séance en cours (`live`) + poste ; `refreshEventState()` relit `tablet_state` toutes les 8 s. Code renvoyé à la tablette = **code du projet** (`pf_active_event(code)` accepte code projet ou ancien code de séance).
- Console : onglet **Projets** (liste, fiche projet à onglets, « Parc de tablettes » pour le superadmin). Les anciens onglets client (jeux, pubs, défis…) sont réutilisés dans la fiche projet (`currentProject`, `selectedProjectId`, `loadProjectDetail()`).
- Coach : fiche mission = code projet + PIN + carte « Séance et tablettes » (`coach_project`, `coach_set_poste`, `coach_remove_device`), avec bloc **En direct** pendant la séance (`live_stats` = `pf_event_live_stats` : Index passés / inscrits, groupe en cours et suivant avec prénoms, étape suivante, terminer même s'il reste des inscrits). Console : onglet **Résultats** de la fiche projet.
- Espace RH : réglages de l'écran de la borne = ceux du projet libre-service en cours (`pf_hr_project()`), sinon masqués.
- Projets de test : PANDA-3MA8 (Mois, Ipad Dan jusqu'au 19.11), PANDA-MIGR (Découverte), PANDA-TEAM (Team building), PANDA-PAST (terminé), SUVA « Abonnement (démo) » (tablette Yann). Tablette Test = au parc. **PANDA-PMVG** = client interne « PandaFit Démo », projet Démo VIP « Tablette de démo » : séance « Démo en continu » démarrée en permanence (démos : poste Index ou Jeux libres, classement cumulé) — ne pas la terminer (sinon le projet se ferme).

## Fonctionnalités construites (2026-08)

### Reconnexion Bluetooth automatique
- `PandaFitSensor` (dans `index.html`) : reconnexion sans sélecteur via `watchAdvertisements()` (méthode B), fallback `gatt.connect()` direct (méthode A). Récupère aussi après un débranchement du capteur.
- **Nécessite 2 flags Chrome expérimentaux PAR TABLETTE** : `chrome://flags/#enable-experimental-web-platform-features` + `chrome://flags/#enable-web-bluetooth-new-permissions-backend`.
- Préfixes de nom du capteur : `ASI_BLE` / `AdMOS_BLE` / `PandaFit`.

### Affichage de l'accueil : « disponible » vs « affiché »
- **Disponible** (admin seulement) : `projects.ads_enabled` + `projects.satisfaction_enabled` (avant : sur le client), **indépendants** (peut être les deux).
- **Affiché** (admin OU RH) : `projects.home_display_mode` ∈ `auto` / `satisfaction` / `ads` / `none`.
- Le RH change l'affichage depuis **Réglages** (protégé par code PIN) via la RPC `set_home_display_mode`. `resolveHomeMode()` gère le rendu, avec garde anti-incohérence (repli sur `auto` si le contenu choisi n'est plus dispo).

### Mise à jour à distance des tablettes
- **Refresh doux** : `projects.refresh_token` (parc : `clients.refresh_token` du client parc) (bumpé par l'admin). La tablette poll toutes les ~20 s (`fetchTabletSignals`) → `softRefresh()` = re-fetch données + re-render **SANS reload** (garde le Bluetooth, n'interrompt pas une partie).
- **Rechargement complet** : `projects.reload_token` → `hardReloadApp()` (vide caches + `location.reload`). Puis reconnexion Bluetooth auto.
- **Nocturne** : par projet, `projects.nightly_reload_enabled` + `projects.nightly_reload_hour` (0-23). `startNightlyReload()` relit la config en direct.
- Console → fiche projet → onglet **Tablettes** : carte « Mettre à jour les tablettes du projet » (refresh doux / rechargement / nocturne).

### Langues (FR / DE / EN / IT)
- Tablette : les écrans sont écrits en français et traduits à l'affichage par `UI_DICT_ROWS` (lignes `[fr, de, en, it]`, clé = texte français exact) + `UI_RULES` (textes avec nombres). **Toute nouvelle phrase affichée sur la tablette = ajouter sa ligne dans `UI_DICT_ROWS`.** Éviter de couper une phrase par des `<b>` / dates : mettre les valeurs dans leur propre élément.
- Projection, inscription, rapport : dictionnaires propres à chaque page, langue = `event_sessions.language`.

### Code personnel : DÉSACTIVÉ PARTOUT (décision Dan 06.11.2026)
Ni saisie avant l'Index, ni code / QR à la fin, y compris Mois et Campagne. Interrupteurs : `SHOW_PERSONAL_CODE` (`index.html`) et `PERSONAL_CODE` (`rapport.html`, progression appariée lancement → clôture). Un employé anonyme reste créé en arrière-plan pour compter les participants. À réactiver seulement si Dan le demande.

### Mode séance (séance en cours dans le projet)
- Au parc, en attente et en séance : plus de menus (`isKiosk()`). Séance : accueil selon le poste (Index, grille des jeux, station Triathlon). Pas de bannière pub / satisfaction hors libre-service. Coach : roue discrète en bas à droite → Réglages (PIN redemandé à chaque retour).

### PWA
- App installable en plein écran. Manifest **externe** `manifest.webmanifest` (⚠️ un manifest data-URI ne permet PAS l'install WebAPK Android). `sw.js` en **network-first** (jamais de code périmé). Icônes 192 + 512.

## Verrouillage des tablettes (parc ≤ 10 pour l'instant)
- **Rester sur Chrome** : les navigateurs kiosque à WebView (Fully Kiosk…) cassent le Web Bluetooth.
- Verrouillage actuel : PWA plein écran + **épinglage d'écran** Android + notifications coupées + Ne pas déranger.
- À l'échelle : envisager un **MDM Android Enterprise** (Esper / Scalefusion / SureMDM).

## Note dépôt / Google Drive
- Le dépôt vit dans **Google Drive** → `git status` signale souvent des fichiers « modifiés » à tort (Drive touche les métadonnées). **Le contenu est identique** : se fier à `git diff` (contenu), pas au status. Config déjà en place (`core.autocrlf false`, `core.checkStat minimal`, `core.trustctime false`).
- Une copie propre hors Drive existe aussi dans `C:\Users\danha\dev\pandafit` (non utilisée par défaut ; Dan garde le dossier Drive + son raccourci).

## Site vitrine pandafit.ch (dossier `site/`)
Page publique 4 langues (`site/index.html`, `site/assets/`), issue de `entreprises.html` et enrichie le 13.09.2026 (appareil, sport & performance, références Sommaruga/Streit, chronologie). **Servi par le site Netlify existant `pandafit2026`** grâce au `netlify.toml` racine (pandafit.ch/* → /site/*) ; domaine `pandafit.ch` (Hostpoint : A 75.2.60.5, CNAME www → pandafit2026.netlify.app). Tarifs/images/leads = même Supabase que la page d'origine. Toute nouvelle phrase = clé `data-i18n` + 4 traductions dans `EXTRA`. `entreprises.html` a été retiré le 13.09.2026. **URLs** : pandafit.ch = vitrine, app.pandafit.ch = app tablette (alias de pandafit2026.netlify.app ; origine différente → clé tablette et Bluetooth à ressaisir si on migre une tablette), console.pandafit.ch = pandafit-admin.html.

## Phase business — événements & réseau de coachs (depuis 2026-10)
PandaFit se structure comme **offre événementielle** (journées / demi-journées de l'équilibre animées par des coachs/physios freelance) **+ abos + franchise**. Cible commerciale prioritaire : le **chef de sécurité** (angle Suva / prévention des chutes), puis RH. Principe : **le Sales prépare (console admin), le Coach exécute (code de session sur tablette)**.
**Spec détaillée** (formats Découverte / Team building, déroulés minute par minute, process Sales→Coach, features app, cahier des charges coach, économie/marges) : **`_internal/journee-pandafit.md`** — ⚠️ **interne, non versionné** (`.gitignore` → `_internal/` ; reste dans Drive, jamais sur GitHub public ni le site, car le dépôt est public). À construire côté app : **mode événement** + **sessions admin** (table `event_sessions`) + **code de session** + **leaderboard partagé** multi-tablettes + **vue projection** + **rapport auto**.

**Formulaire de contact** : enregistre dans Supabase `website_leads` ET notifie par e-mail via **Netlify Forms** (form `name="lead"`, honeypot `bot-field`, envoi JS urlencodé en UTF-8 ; notification configurée vers `dan@katapultapp.com` dans le dashboard Netlify → Forms). ⚠️ À cause du rewrite forcé `pandafit.ch/* → /site/*` (`force=true`), Netlify Forms ne marche **qu'après avoir activé « Form detection »** dans les réglages du site Netlify (sinon POST → 404). Les leads restent aussi lisibles dans Supabase.
