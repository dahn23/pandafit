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
- **Décor en rendu 3D (13.11.2026)**, même dossier `img/ski/`, chargé par `DECOR` / `decor(nom)` : `panorama` (montagnes, portrait seulement), `sapin-1/2`, `porte-rouge/bleue` (plus de porte grise à l'échauffement depuis le 13.11), `arche` (texte ARRIVÉE écrit au code pour rester traduit), `depart`, `fan-1/2/3` (pandas spectateurs du bord de piste **et** des tribunes via `fanMini`), `chalet-1/2`. **Chaque image est facultative** : absente ou pas encore chargée, le dessin au code prend sa place. Sapins sur fond bleu (pas vert) à la génération, sans correction de couleur ; porte bleue dérivée de la rouge avec ffmpeg (`hue`).
- **Sol en neige texturée** (`paintSnowTile` + `paintSnowTex`) : carreau fabriqué au code, dessiné en bandes horizontales avec un motif (`createPattern` + `setTransform`). **Garde-fou** `st.lite` : si le temps de dessin moyen dépasse ~22 ms, neige unie, un seul rang de sapins et plus de spectateurs au bord (mesure le calcul seulement, pas l'affichage).
- **Filets de sécurité en toile** (`paintFenceTile` + `paintFenceArt`) : bandeau fabriqué au code (plis, ourlets, « PANDAFIT »), dessiné par tranches verticales en perspective ; le sens du motif est inversé d'un côté à l'autre pour que le texte reste lisible. Avec `st.lite`, retour au bandeau orange uni. Les filets (`paintFences`) sont dessinés **après** les sapins, chalets et spectateurs (liste `outer`) et avant les portes : sinon le décor planté derrière passe par-dessus la toile.
- Images faites sur **OpenArt** (compte de Dan, personnage « Panda »), fond vert retiré avec ffmpeg : méthode dans la note de mémoire `panda-mascotte-openart`. Mascotte = peluche noire, **pattes nues** (ni gants ni manches).

### Tir au but en rendu 3D (13.11.2026)
- Même traitement que le Slalom, dans `StadiumScene` : images facultatives dans `img/foot/` chargées par `FART` / `fart(nom)` ; si une image manque, l'ancien dessin reste. Règles et commande inchangées.
- `stade` (tribune de nuit pleine de pandas, **animée** par tranches verticales : deux vagues qui se croisent + sautillements selon `st.ex` ; elle s'assombrit quand la vue zoome sur le but, sinon le ballon noir et blanc se perd devant les pandas), `course-1..4` (panda qui court, vu de dos, maillot blanc numéro 10 ; images du `<img>` avec repli sur les anciens PNG via `onerror`), `ballon`, `but` (but + filet ; image sur fond noir transformée en transparence par la luminosité avec ffmpeg ; au but, le filet se gonfle : zone ronde redessinée en plus grand).
- **Gazon texturé** au code (`paintGrassTile` + `paintGrassTex`, même principe que la neige du Slalom), **panneaux LED** gardés au code pour que le texte défile (modules, reflet, trame, lueur sur le gazon).
- Banc d'essai : `?shot=distance&live=1&axis=y` (le faux capteur balance d'avant en arrière).

### Zen en rendu 3D (13.11.2026)
- Dans `LakeScene`, images facultatives dans `img/zen/` chargées par `ZART` / `zart(nom)` : `montagnes` (ciel transparent, remplace les calques `mountDawn` / `mountDay` ; la version aube est la même image assombrie par `dawnTint`, donc le reflet dans le lac et le fondu aube → jour marchent tout seuls ; portrait seulement), `ponton` (on n'en voit que le bout), `panda` (`<img id="lakePandaArt">` à côté de l'ancien SVG `#lakePanda`, qui se cache quand l'image est chargée), `nenuphar` / `nenuphar-rouge` (hors zone).
- Restent au code : ciel, soleil, nuages, oiseaux, eau, brume, lucioles, anneau de la zone. Banc d'essai : `?shot=cross&live=1&amp=40&per=700`.
- Piège OpenArt : la zone de saisie garde l'ancien texte même quand elle paraît vide → toujours tout sélectionner avant de taper, et relire le texte avant de générer.

### Marché Express en rendu 3D (13.11.2026)
- Dans `MarketScene`, images facultatives dans `img/marche/` ; si une image manque, l'ancien dessin reste.
- **Ingrédients** : `ingredients.webp` = une seule image de 7 cases par rangée, **dans l'ordre des clés de `SHOP_DRAW`** (46 ingrédients). `makeSprites()` y découpe les sprites (étals, cagettes, vignettes de la liste via `iconURL`). Ajouter un ingrédient = ajouter son dessin dans `SHOP_DRAW` ET sa case à la suite dans l'image. Fabrication : planches de 9 sur OpenArt (fond bleu pour ce qui a du vert, fond vert sinon), découpe et assemblage par le script `atlas.sh` du scratchpad (ffmpeg `tile=7x7`).
- **Stand** (`MART` / `mart(nom)`, calques repeints par `buildLayers()` dès qu'une image arrive) : `paysage` (flouté exprès pour laisser lire les ingrédients), `plancher`, `etal` (posé sur les 3 hauteurs de `SHELVES`), `auvent`, `panier` (calque du fond = panier entier, calque de devant = tout ce qui est sous le bord avant, pour que les ingrédients tombent dedans), `patte` (gauche, miroir pour la droite).
- Restent au code : niveau à bulle, cagettes en bois, rayons de soleil, carte de la liste. Banc d'essai : `?shot=market&live=1` (ajouter `&amp=10&per=900` pour rester dans le cercle).
- Nom de la recette annoncé en grand : pendant le 3-2-1 (`marketIntroName`), puis à chaque liste complète le bandeau `shopDone` dit « Rösti ✓ Liste complète ! » et enchaîne sur le nom de la suivante (« Recette suivante », `marketOnEvent`, l'évènement `list` porte `next`).

### The Zone / Electro : fonds en rendu 3D (13.11.2026)
- Images facultatives dans `img/fonds/` (`FOND` / `fond(nom)` / `artBackdrop()`), repli sur le dessin au code : `orbite` (The Zone), `circuit` (Electro), `reseau`.
- The Zone : `ZoneScene.buildOrbit()` fait tourner très lentement la planète (rotation limitée au disque) et dériver un calque de nuages. Demande de Dan : animation **légère** seulement.

### MindFit : thème « réunion du comité » (13.11.2026)
- Idée : on se fatigue en montant l'escalier, puis on réfléchit au calme en salle de réunion (public entreprise). **Aucune marque dans le décor.**
- `MindScene.paintMeeting()` : images facultatives dans `img/mind/` (panda en costume `costume-1/2/4` qui monte les marches + les lieux), repli sur l'ancien affichage.
- **4 lieux** (`LIEUX` : `escalier`/`salle`, puis `-2` hall en marbre + salle vitrée, `-3` escalier extérieur + toit-terrasse, `-4` loft + salle de brainstorming). Ordre **tiré au hasard à chaque partie**, un lieu différent à chaque tour (demande de Dan : que les joueurs qui se suivent ne voient pas tous la même chose). Un lieu dont une image manque est sauté.
- **7 marches = 7 balancements** : 7 marches éclairées (`LEDS`, dessinées au code : vertes une fois montées, la prochaine en doré qui clignote) et le panda saute de l'une à l'autre (`STOPS`). Les 4 escaliers ont **la même géométrie** parce qu'ils ont été générés sur OpenArt avec l'escalier d'origine en image de référence (« use the reference image as an exact template ») : un nouvel escalier doit être fait pareil, sinon il faut remesurer `STOPS`, `LEDS` et `stairHalf`. Même principe pour les salles (l'écran bleu où s'affiche le radar du calme doit rester au même endroit).
- Questions (`TempoGame.generateQuestion()`), 8 sortes, jamais deux fois la même de suite, le calcul pèse double : `calc` (additions, soustractions, livrets ; **pas de divisions**), `complete` (« 7 + ? = 12 »), `suite` (nombres dans des cases, pas de point entre eux : ça ressemblait à une multiplication), `trend` (courbe + 3 flèches), `flag` (nom du pays en grand + silhouette `MQ_SHAPES`, 3 drapeaux `MQ_FLAGS` sur les boutons ; 11 pays faciles et sans polémique), `odd` (l'intrus : 3 émojis sur les boutons), `count`, `chart`. **Décisions de Dan** : consigne de 2 mots maximum (ne pas pénaliser ceux qui lisent mal la langue), rien qui fasse attendre (pas de mémoire), rien qui stigmatise, compter et barres trop fréquents à 3 sortes. Sens de la flèche et mémoire ont été refusés. Dans le `html` d'une question, `{{tr:Texte}}` est traduit à l'affichage.
- Mascotte : les 5 vidéos `MINDFUL_*_VIDEO_B64` (accueil, effort, content, raté, fin) montrent le panda en costume. 360×360, 24 i/s, sans son, 5 s en boucle. Fabrication : OpenArt, « Frame to video », modèle Kling 4.0 Flash (250 crédits le clip de 5 s) à partir du portrait en costume ; demander que le panda **revienne à sa pose de départ** (boucle sans saut) et préciser **pattes noires** ; conversion ffmpeg (`scale=360:360,fps=24`, `-crf 27`, `-an`).
- **La mascotte doit être identique partout** (exigence de Dan, 13.11.2026) : deux taches noires autour des yeux, et une grande zone vert feuille qui part du sommet du crâne, fait le tour de l'œil droit (à droite sur l'image) en arrondi, passe dessous et rejoint la joue. Le personnage « Panda » d'OpenArt est le logo dessiné, pas la peluche : toute nouvelle image du panda se fait avec de vraies images de la peluche en référence (vignettes Zen / Tir au but), jamais avec une description seule.
- Vignette du jeu : `img/vignettes/mindfit.jpg` (1488×496). L'adresse affichée par l'app est dans Supabase, `games.image_url` (id `tempo`).

### MindFit Sudoku (nouveau jeu, 13.11.2026) — id `sudoku`
- Idée de Dan : 7 mouvements d'avant en arrière (même détection que MindFit), puis le clavier se débloque **10 secondes** pour remplir un sudoku 9 × 9 presque plein ; puis on repart pour 7 mouvements. **La grille reste toujours visible** (on prépare son coup pendant l'effort). Pas de relais.
- **Stabilité exigée pour taper** (demande de Dan, 13.11.2026, comme MindFit) : même zone de calme (`CALM_RADIUS_CM` 1,875 cm) et 1 s de blocage après chaque sortie. Les 10 secondes filent pendant qu'on se stabilise : revenir vite au calme fait gagner du temps. À l'écran : bandeau rouge « Reste immobile ! », cadre rouge autour de la grille, radar du calme à la place du clavier.
- **Mouvement alterné pour varier de MindFit** : un tour d'avant en arrière (`axis` `y`), le suivant de gauche à droite (`x`), toujours un de chaque. La jauge est debout pour l'un, couchée pour l'autre (classe `axis-x`). Banc d'essai : `&axis=auto` bouge sur les deux axes et s'immobilise pendant le clavier (`&still=0` pour continuer à bouger).
- `SudokuGame` : réglages en tête du module. **`EMPTY_CELLS` (12) = LE réglage de la durée**, à ajuster après essai sur tablette. Chaque case vide n'a qu'une valeur possible d'après les chiffres donnés (aucune déduction en chaîne : voulu, « pas dur et rapide »). `MAX_SECONDS` 180 = plafond. Fin quand la grille est complète. Score = 50 par case juste − 20 par chiffre posé en rouge + 5 par seconde gagnée si la grille est finie.
- Règles d'affichage voulues par Dan : on touche une case puis un chiffre du clavier maison ; un chiffre en double sur sa ligne / colonne / carré passe **en rouge** (le chiffre donné qui fait doublon est encadré en rouge aussi) et on peut le changer ; bouton « Tout vider ».
- Écran : tout en HTML/CSS (classes `sdk-*`), pas de canvas. Fond `img/sudoku/foret.webp` (facultatif, sinon vert uni). `sizeSudokuBoard()` ajuste la grille à la place libre. Banc d'essai : `?shot=sudoku&live=1&axis=y&amp=320&per=260`.
- **Nom et habillage (décisions de Dan)** : « MindFit Sudoku » (ni « II » ni « Extrême »). Décor = **forêt de bambous, sans aucun signe de pays** : le panda est chinois, le sudoku est associé au Japon, on ne mélange pas (pas de kimono, de portique, de caractères, de mot « dojo »). Panda sans costume ; 5 vidéos `SUDOKU_*_VIDEO_B64` (accueil, effort, réflexion, erreur, victoire).
- Où un jeu doit être déclaré : `GAMES`, `GAME_LAUNCHERS`, `GAME_INFO`, `GAME_THEME_TABLET` et le dictionnaire dans `index.html` ; `GAME_THEME_ADMIN` / `GAME_ICON_ADMIN` dans `pandafit-admin.html` ; `GAME_NAMES` dans `coach/`, `projection.html`, `rapport.html` ; une ligne dans la table `games` (nom, descriptions 4 langues, vignette `img/vignettes/sudoku.jpg`). Le jeu n'apparaît sur une tablette que s'il est activé dans le projet (console, ou table `project_games`). Il n'est PAS dans `DEFAULT_PROJECT_GAMES` (comme Marché Express).

### Indice de satisfaction (décisions de Dan, 13.11.2026)
- Principe : **comme une borne d'aéroport**, le plus simple possible. Une question, trois pandas (rouge, jaune, vert), un merci de 2,5 s puis la question revient (Dan garde 2,5 s : pas de délai anti-rafale).
- **Le RH ne modifie pas la question** : le champ a été retiré de l'espace RH, qui l'affiche en lecture seule. Elle se règle seulement dans la console (par projet). Une question fixe garde les résultats comparables.
- Le RH ne crée ni questionnaire ni séance : les deux se créent dans la console (PandaFit). Lui : affichage de l'accueil, annonces, inscriptions, résultats, rapports.
- Tutoiement partout, y compris la question et le merci par défaut (4 langues).
- Bouton rouge : panda **déçu**, plus en colère (les gens hésitent à se dire fâchés). Les 3 boutons sont des images en base64 dans `index.html` (`SATISFACTION_*_B64`, 320 × 320, fond transparent) ; pour en refaire un, donner l'ancien bouton en image de référence.
- Résultats : un **indice** = part de vert − part de rouge (de −100 à +100), et une colonne par semaine. Espace RH : `satHTML` + `satTrendHTML` (8 semaines, obtenues par différence des cumuls de `rh_satisfaction(p_days)` ; rien sous 5 réponses, pour l'anonymat). Console : `satIdxLabel` + `satWeeksHTML` à partir des lignes brutes.

### Écran d'appel et étiquettes des jeux (13.11.2026)
- But : donner envie de s'arrêter à quelqu'un qui passe. Quand la tablette en accès libre n'est plus touchée depuis `APPEL_IDLE_MS` (30 s, choix de Dan), une boucle plein écran s'affiche (`appelShow`, élément `#appel`) : promesse « 1 minute pour travailler ton équilibre et déstresser », « Libre-service · sans inscription », une **petite vidéo de 6 s de chaque jeu activé en train d'être joué** (`img/appel/<id>.mp4`, 432 × 636, sans son ; l'image `img/appel/<id>.webp` reste dessous tant que la vidéo charge). Fabrication : `window.__rec(nom, zone, durée)` du banc d'essai (`shot.js`) enregistre le jeu qui tourne avec le faux capteur et dépose le fichier dans le dossier `up` du scratchpad, puis conversion ffmpeg en mp4. Pour les jeux en HTML (Sudoku), l'écran est redessiné à la main dans l'enregistreur avec le panda du jeu, sa description, un fait chiffré et **sourcé** (tiré de `BENEFIT_FACTS` : ne jamais afficher un chiffre sans source), et le défi en cours **seulement s'il y en a un**.
- **Règle de Dan** : la bannière du bas (indice de satisfaction ou annonces) reste TOUJOURS visible. L'écran d'appel s'arrête au-dessus (`appelPlace`), donc sa hauteur varie : tout nouvel écran d'accueil doit supporter d'être rogné en bas.
- Il disparaît au premier toucher. Si le capteur sent quelqu'un monter sur le plateau (`appelOnSensor`, écart de plus de `APPEL_STEP_CM`), il affiche « Bienvenue ! Choisis ton jeu » puis laisse la place à l'accueil. Un mouvement du plateau compte aussi comme activité.
- Étiquettes : `gameTagsHTML(id)` = catégorie (`GAME_INFO` / `GAME_CATEGORIES`) + durée écrite en toutes lettres (« Durée : 1 minute », « Durée : 30 secondes » ; `GAME_TIME` en secondes, `gameDurationLabel` dans la langue de la tablette), sur les vignettes de l'accueil et dans l'écran d'appel. Un nouveau jeu doit avoir son entrée dans `GAME_TIME`, `APPEL_PANDA`, son image `img/appel/<id>.webp` et sa vidéo `img/appel/<id>.mp4`. Pas de « jeu du jour » (refusé pour l'instant), pas de menus par catégorie.
- **Plus de page « Jeux » sur la tablette** (décision ferme de Dan, 13.11.2026 : « je ne veux plus voir la page jeux ») : bouton du menu, page et encadré « Prêt à jouer ? » supprimés ; `navigate('games')` renvoie à l'accueil (le mot `games` ne sert plus qu'à l'état « partie en cours »). Les jeux se lancent UNIQUEMENT depuis les vignettes de l'accueil : un jeu actif mais masqué par l'œil du « Menu tablette » de la console (`project_games.show_on_home` = false) n'est donc plus accessible. Ne jamais recréer une page ou un écran intermédiaire de choix des jeux.

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
