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
- Préfixes de nom du capteur : `ASI_BLE` / `AdMOS_BLE` / `PandaFit` (capteurs d'origine, fournisseur disparu en 11.2026).
- **WitMotion (en test depuis le 11.11.2026)** : préfixes `WT` / `Wit` / `WIT`. Trames 0x55 0x61 de 20 octets, accélération X/Y → mêmes unités que l'ancien capteur via `WIT_SCALE` (provisoire, 1 g = 4000 : **à recaler avec le capteur réel**). Service découvert automatiquement (UUID non documentés : les trouvés sont écrits dans le journal), vitesse réglée à 100 Hz à la connexion. Modèle visé : WT9011DCL-BT5.0.

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

### Challenges inter-entreprises (par projet, depuis le 06.11.2026)
Console → Challenges : on coche des **projets** en cours ou à venir (`challenge_participants.project_id`, client déduit par trigger), un jeu, une période (bouton « période commune » ou une partie seulement). Classement = total des scores du jeu par projet sur la période (`tablet_challenge_totals`). Affiché automatiquement sur l'écran en accès libre des tablettes des projets participants, sauf si le projet décoche « Afficher le challenge inter-entreprises » (onglet Jeux, `projects.show_challenges`, défaut oui ; l'œil du Menu tablette agit sur ce même réglage).

### Code personnel : DÉSACTIVÉ PARTOUT (décision Dan 06.11.2026)
Ni saisie avant l'Index, ni code / QR à la fin, y compris Mois et Campagne. Interrupteurs : `SHOW_PERSONAL_CODE` (`index.html`) et `PERSONAL_CODE` (`rapport.html`, progression appariée lancement → clôture). Un employé anonyme reste créé en arrière-plan pour compter les participants. À réactiver seulement si Dan le demande.

### Mode séance (séance en cours dans le projet)
- Au parc, en attente et en séance : plus de menus (`isKiosk()`). Séance : accueil selon le poste (Index, jeux libres, station Triathlon). **Écran en accès libre** (`freePlayScreen()`) = libre-service OU poste « Jeux libres » en séance (`postejeuxSeance()`) : même accueil que le libre-service, avec encadrés / vignettes / menu / défis / annonces / pubs / satisfaction du projet. Jamais au poste Index ni aux stations. Console : tous les onglets pour tous les formats ; options d'écran en haut de l'onglet Jeux ; PIN dans l'onglet Projet. Coach : roue discrète en bas à droite → Réglages (PIN redemandé à chaque retour).

### Slalom en vue subjective (12.11.2026)
- Le Slalom se joue **par les yeux du skieur** (`SkiScene` dans `index.html`, constante `SKI_FPV`). Commande et règles inchangées (`SlalomGame` non touché). L'ancienne vue de derrière reste là : ajouter `?skiview=classic` à l'adresse.
- **Pas de mal de mer** (demande de Dan) : horizon et montagnes fixes, inclinaison ~1,4°, aucun tremblement, skis et pattes fixes à l'écran, portes qui s'effacent juste avant d'être dépassées. Réglages dans l'objet `FPV` (`turn` = ampleur du virage, `roll` = inclinaison) : à ajuster si Dan trouve ça inconfortable sur le vrai plateau.
- **Images en rendu 3D** (style de la mascotte) dans `img/ski/` : `patte.webp` (patte gauche qui tient le bâton, pouce côté intérieur, dragonne rouge), `patte-levee.webp` (bras levé à l'arrivée), `spatules.webp`. Seule la patte gauche existe, la droite est son miroir (`paintRiderArt`). Si une image manque, repli sur le dessin au code (`paintRider`).
- Images faites sur **OpenArt** (compte de Dan, personnage « Panda »), fond vert retiré avec ffmpeg : méthode dans la note de mémoire `panda-mascotte-openart`. Mascotte = peluche noire, **pattes nues** (ni gants ni manches).

### PWA
- App installable en plein écran. Manifest **externe** `manifest.webmanifest` (⚠️ un manifest data-URI ne permet PAS l'install WebAPK Android). `sw.js` en **network-first** (jamais de code périmé). Icônes 192 + 512.

### Robustesse tablette (11.11.2026)
- **Écran toujours allumé** : `keepScreenAwake()` (Wake Lock du navigateur, tablettes seulement).
- **Démarrage sans réseau** (ex. après redémarrage, Wi-Fi pas encore prêt) : `startWithSavedKey()` affiche « Connexion au serveur… » et réessaie (5 s + évènement `online`) ; l'écran de clé n'apparaît que si le serveur refuse la clé (`err.badKey`). `render()` ne fait rien tant que `clientConfig` est vide.
- **File d'attente des scores** : partie non envoyée (réseau) → `localStorage` `pandafit_play_queue`, renvoyée au retour du réseau / chaque minute / au démarrage. `tablet_record_play` accepte `p_played_at` (vraie heure, ≤ 7 jours) et `p_client_play_id` (anti-doublon).
- **Orientation** : Android 16 ignore le blocage portrait sur tablette → rotation auto ON, la tablette debout.

## Verrouillage des tablettes (parc ≤ 10 pour l'instant)
- **MDM retenu : Scalefusion**, mode entièrement géré (Android Enterprise, compte mdm@pandafit.ch), app web Google « PandaFit » en application unique, profil + config d'inscription « PandaFit borne ». Procédure complète et pièges : `_internal/test-mdm.md`. Écran de balayage = **écran de verrouillage Scalefusion** (Utilities → Global Settings → Android Settings → Lock Screen OFF).
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
