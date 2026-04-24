# Plán: Belisariova kampaň

## Cíl
Nový samostatný herní mód „Kampaň" (vedle Lokální / Online / Bot) se sérií 7 propojených scénářů, perzistentní ekonomikou (Favor/Supply), rostoucí persistent unit (Bukelárii XP) a asymetrickým botem. Všechny existující mechaniky nejdřív zrefaktorovat do jednotného Event/Modifier systému.

---

## Architektonická východiska

### Centrální Event/Modifier systém

Dnes máme **rozdrobené** modifikátory (`attackBonus`, `moveBonus` na `UnitInstance`, `activeScenarioEffects` v `GameState`, `gunpowderPanicUntilTurn` jako ad-hoc pole, `warcryActive`/`pilumReady` flagy, `namedHero` aury). Kampaň extrémně spoléhá na dočasné/podmíněné efekty (Firouz padne → Peršané −1 útok 1 kolo; Theodora → +1 karta a +2 kostky; brod stream → −1 kostka v kole přechodu; zásoby ≤2 → milice −1 útok…). Kdybychom to **hardcodovali** scénář po scénáři, Fáze 2-3 se rozpadnou.

**Jednotná struktura:**

```ts
interface ActiveModifier {
  id: string;
  source: 'commander_death' | 'ability' | 'scenario' | 'aura' | 'card' | 'status' | 'supply';
  sourceUnitId?: string;           // která jednotka modifier přinesla
  descriptionCs: string;           // diegetický text do UI
  targetFilter: ModifierTargetFilter;
  effect: ModifierEffect;
  duration: ModifierDuration;
}

interface ModifierTargetFilter {
  faction?: FactionId;
  unitIds?: string[];
  unitTypes?: UnitType[];
  unitClass?: UnitClass;
  isCavalry?: boolean;
  withinRadiusOf?: { position: Position; radius: number };
  excludeSourceUnit?: boolean;     // aura nepostihuje svůj zdroj
}

interface ModifierEffect {
  attackDice?: number;             // +/-N
  defenseDice?: number;
  moveBonus?: number;
  rangeBonus?: number;
  cannotMove?: boolean;
  cannotAttack?: boolean;
  ignoresRetreat?: boolean;
  autoHitOnAttacker?: number;      // pike wall
}

interface ModifierDuration {
  kind: 'turns' | 'permanent' | 'until_turn' | 'single_attack' | 'recompute_each_turn';
  remainingTurns?: number;
  untilTurn?: number;
  consumed?: boolean;              // pilum
}
```

Combat/movement pak volá `getAttackDiceBonus(unit, state)`, které iteruje `state.activeModifiers` a sčítá relevantní. Veškerá terénní logika (trench, hill, forest…) zůstává on-the-fly výpočet — ne jako modifier — protože je vázaná na konkrétní (attacker, defender) pár.

**Co se migruje:**
| Dnes | Nově |
|---|---|
| `unit.attackBonus`, `unit.moveBonus` (per-turn fields) | modifikátor s `duration.recompute_each_turn` nebo `turns:1` |
| `state.activeScenarioEffects[].kind: 'heat_debuff'` | modifier `source:'scenario'` |
| `state.activeScenarioEffects[].kind: 'ambush_hidden'` | zůstává samostatné pole (není dice-modifier, je to viditelnostní pravidlo) |
| `state.activeScenarioEffects[].kind: 'named_hero_rule'` | zůstává (vítězná podmínka, ne modifier) |
| `unit.gunpowderPanicUntilTurn` | modifier s `duration.until_turn` |
| `unit.warcryActive`, `unit.pilumReady` | modifiery (warcry = turns:1; pilum = single_attack) |
| `unit.betrayedUntilTurn` + `betrayedOriginalFaction` | modifier + faction swap handled by modifier apply/expire |
| Caterina Sforza aura („sousední obránci nemají panic retreat") | modifier `source:'aura'`, `withinRadiusOf:{caterina.pos, 1}`, `effect.ignoresRetreat: true`, `duration.recompute_each_turn` |

**Pozn.:** Po refactoru kód v `combat.ts` bude **kratší** a jednodušší — místo 10 if-větví pro různé flagy bude jedna smyčka přes modifiery.

---

## FÁZE 0 — Event/Modifier refactor (nezbytná příprava)

### Cíl
Sjednotit všechny stávající mechaniky do `ActiveModifier` infrastruktury, **bez regrese** současných 5 scénářů. Žádná viditelná změna pro hráče.

### Úlohy

#### 0.1 Nový modul `logic/modifiers.ts`
- [ ] Typy `ActiveModifier`, `ModifierTargetFilter`, `ModifierEffect`, `ModifierDuration`
- [ ] `modifierApplies(mod, unit, state): boolean` — všechny filtry
- [ ] `getAttackDiceBonus(unit, state): number`
- [ ] `getDefenseDiceBonus(defender, attacker, state): number`
- [ ] `getMoveBonus(unit, state): number`
- [ ] `getRangeBonus(unit, state): number`
- [ ] `cannotMove(unit, state): boolean`, `cannotAttack(unit, state): boolean`
- [ ] `advanceModifiers(state): state` — v END_TURN: `remainingTurns--`, vyřazuje vypršené
- [ ] `applySingleAttackConsume(state, attackerId): state` — mark single_attack jako consumed
- [ ] `recomputeAuraModifiers(state): state` — na začátku kola přegenerovat všechny `aura` modifiery (poziční závislost)

#### 0.2 Migrace GameState
- [ ] Přidat `state.activeModifiers: ActiveModifier[]`
- [ ] Odstranit `unit.attackBonus`, `unit.moveBonus` (nahradit modifiery, ale s `sourceUnitId` pro snadné cílení)
- [ ] Odstranit `unit.warcryActive`, `unit.pilumReady` (nahradit modifiery)
- [ ] Odstranit `unit.gunpowderPanicUntilTurn` (nahradit modifiery)
- [ ] `activeScenarioEffects` → `heat_debuff` migrovat jako modifier; `ambush_hidden` + `named_hero_rule` nechat v původním poli (nejsou to dice modifiery)

#### 0.3 Přepis combat.ts
- [ ] Odstranit všech ~10 if-větví pro bonusy (pilum, warcry, charge, volley, anti-cav, heat, panic…) a nahradit `getAttackDiceBonus`
- [ ] Terénní modifikátory zůstávají v combat.ts (jsou pair-dependent)
- [ ] Charge (isChargingThisTurn) zůstává computovaná funkce (závisí na `moveHistoryThisTurn`, není modifier)
- [ ] Pike wall auto-hit zůstává ad-hoc (strukturální mechanika, ne modifier)

#### 0.4 Přepis abilities.ts
- [ ] `applyWarcry` → generuje modifier `{ source: 'ability', targetFilter: { unitIds: [id] }, effect: { attackDice: +2, moveBonus: +1 }, duration: { kind: 'turns', remainingTurns: 1 } }`
- [ ] `applyPilumReady` → generuje modifier `{ effect: { attackDice: +2, rangeBonus: +1 }, duration: { kind: 'single_attack' } }`
- [ ] `applyAmbushSignal` → generuje modifier pro všechny germánské jednotky + odstraní `ambush_hidden` scénářový efekt
- [ ] `applyBetrayal` → zůstává zvláštní (faction swap)

#### 0.5 Commander infrastruktura
- [ ] `UnitDefinition.isCommander?: boolean` — volitelný marker
- [ ] `UnitDefinition.commanderDeathEffect?: CommanderDeathSpec` — specifikace co se stane (faction, attackDice delta, duration)
- [ ] V reduceru při úmrtí jednotky: pokud commander → generuj příslušný modifier
- [ ] Migrace existujících `namedHero` jednotek: Arminius, Caterina, Cesare dostanou `isCommander: true` a vhodný `commanderDeathEffect` (pokud existuje)

#### 0.6 Aura infrastruktura
- [ ] `UnitDefinition.auraEffect?: AuraSpec` — specifikace (radius, filter, effect)
- [ ] `recomputeAuraModifiers` volá se na začátku každého kola + po pohybu jednotek (aura zóna se mění)
- [ ] Migrace: Caterina Sforza aura → `auraEffect` spec

#### 0.7 UI podpora
- [ ] `ScenarioEffectsBanner` rozšířit — zobrazuje aktivní modifiery s `source:'commander_death'`, `'scenario'`, `'aura'` (ne ty ephemeral)
- [ ] Unit tooltip: ukázat aktivní modifiery na jednotce

#### 0.8 Regresní test (manuální)
- [ ] Projít každý z 9 současných scénářů a ověřit, že se hra chová identicky:
  - [ ] Bitva o střed (karty + jednotky)
  - [ ] Ankara (obklíčení)
  - [ ] Obléhání pevností (siege)
  - [ ] Aškelon (sleeping units probouzení)
  - [ ] Kilíkie (vlny + named hero nic — není)
  - [ ] Teutoburg (ambush hidden + Arminius ability + named hero rule)
  - [ ] Vercellae (heat debuff banner od kola 4 + wagenburg)
  - [ ] Forlì (Caterina aura + Cesare betrayal + kulverina na hradby)
  - [ ] Cerignola (arquebusier volley + gunpowder panic + gendarm charge + pike wall)
- [ ] Bot v každém hraje rozumně

---

## FÁZE 1 — MVP Kampaň (scénáře 1-3)

### Cíl
Plná infrastruktura kampaně + první 3 scénáře. Hráč může odehrát Dara → Nika → Ad Decimum s perzistencí, tajnými cíli, odměnami.

### Úlohy

#### 1.1 Datový model + perzistence
- [ ] `types/campaign.ts`: `CampaignState`, `ScenarioResult`, `BuceliariState`, `SecretGoal` enumy
- [ ] `services/campaignStorage.ts`: `saveCampaign`, `loadCampaign`, `clearCampaign` (Supabase backend + fallback na localStorage pokud offline)
- [ ] Supabase schema: tabulka `campaigns` (user_id, slot_id, state JSONB, updated_at)
- [ ] `campaignVersion: 1` — při mismatch nabídnout „Start new" / „Try to migrate"
- [ ] Autosave hook po každé ScenarioResult

#### 1.2 Nové jednotky
- [ ] `buceliarii` (perzistentní elitní těžká jízda, XP rostoucí přes bitvy, named hero + isCommander:false — Bukelárii nejsou velitel, jen elite)
- [ ] `cataphract` (odemknutelný přes Favor 6 nebo výhru Tricamarum)
- [ ] `isaurian_infantry` (+1 útok v kopcích, −1 na rovině → modifier aura ze sebe-sama)
- [ ] `heruli` (+1 útok, −1 obrana — stálý modifier)
- [ ] `mauri_spearmen` (lehká jízda + range 2, skirmisher = hit-and-run + ústup při kontaktu)
- [ ] `persian_immortal` (+1 obrana)
- [ ] `persian_cavalry`, `vandal_cavalry`, `vandal_infantry` (varianty)
- [ ] `elephant` (nová mechanika „panika při 2+ zásazích z lukostřelby" — modifier s conditional trigger)
- [ ] `civilian_mob` (5 figurek / 5 HP, útok 1) — **vyžaduje HP>3 support**, zvýšit `maxHp` limit
- [ ] `stone_throwing_mob` (civilian + range 1)

**Nová mechanika:** `multiFigureHp` = jednotka může mít HP až 5. Upravit UI pro vykreslení správného počtu figurek na tokenu + balanc.

#### 1.3 Commander buff/debuff specs
- [ ] Firouz: perská jízda + `commanderDeathEffect: { targetFilter: { faction: 'tamerlane' (=bot Peršané) }, effect: { attackDice: -1 }, duration: { turns: 1 } }`
- [ ] Hypatius, Pompeius: civilian_mob + commander. Oba padnou → −2 útok po zbytek bitvy.
- [ ] Ammatas, Gelimer, Tzazon, Witiges, Totila, Zabergan: různé varianty (viz scénáře)
- [ ] Jan Arménský (ally commander): padne → player cavalry −1 útok 2 kola
- [ ] Totila aura: +1 útok všem ve 3 hexech (auraEffect spec)

#### 1.4 Persistent Bukelárii
- [ ] `CampaignState.buceliarii.xp` load na začátku scénáře → spočítá level → aplikuje bonusy na Bukelárii unit při spawnu
- [ ] V bitvě: sledovat úspěšné útoky Bukelárií, na konci přičíst XP
- [ ] Pokud v bitvě padnou všechny figurky → `alive:false, inRecovery:true, recoveryScenarios:1`
- [ ] Následující scénář neobsahuje Bukelárii; přes 1 scénář se vrací se 2 figurkami
- [ ] Pokud padnou 2× → `alive:false` trvale, v další bitvě se spawne obyčejná heavy_cavalry bez XP

#### 1.5 Favor & Supply ekonomie
- [ ] Favor 0-6, efekty podle tabulky: 0-1 = −1 supply + jen 2 možnosti rady; 4-5 = +1 karta; 6 = +1 karta + kataphracts zdarma
- [ ] Supply logistický příjem mezi scénáři: `1 + floor(favor/3)`
- [ ] Supply cap 10
- [ ] **Supply sink endgame (5-token ultimate):** „Obětavost legionářů" — všechny mé jednotky +1 útok na celé 1 kolo (použitelné 1× za bitvu v pre-battle radě jako toggle „připraveno k odpálení")

#### 1.6 Secret goals system
- [ ] Pre-battle screen: 2 karty Glory/Pragma, hráč klikne jednu → uloženo do `currentScenarioSecretGoal`
- [ ] Během bitvy: goal checker zkouší po každé akci (smrt jednotky, pozice, počet kol)
- [ ] Po výhře: pokud splněno → přidat +1 Favor / +2 Supply
- [ ] UI: malý tracker v rohu (jen pro hráče, bot nevidí)

#### 1.7 In-battle Supply actions
- [ ] Panel Supply tokenů ve spodní liště s 3 tlačítky:
  - [ ] **Přehodit** (1 SP) — po combat roll se zobrazí „Přehodit za 1 SP?" tlačítko na 3 s
  - [ ] **Posila** (2 SP) — vyvolá dialog „vyber sektor/hex" → spawn 1 lehké jednotky
  - [ ] **Nahlédnout do karet** (3 SP) — zobrazí soupeřovu ruku na 5 s
- [ ] Supply tokens zobrazeny jako mince v pravém dolním rohu (bez emoji)

#### 1.8 Campaign Lobby + Hub UI
- [ ] `LobbyScreen` — nová čtvrtá volba „Kampaň" (vedle „Lokální", „Online", „Proti botovi")
- [ ] `CampaignHub` komponenta:
  - SVG mapa Středomoří (stylizovaná, na míru — výchozí SVG z `commons.wikimedia.org/Byzantine_Empire_animated.svg` nebo podobné; zvolím vektorové pod permissive license)
  - Pins na scénáře (dokončené/aktuální/zamčené)
  - Panel stavů: Favor (text „Justinián ti důvěřuje / je nedůvěřivý / tě má rád" + číslo v detailu), Supply (text + číslo), Bukelárii (level + status)
  - Tlačítko „Pokračovat v kampani"
  - Historie scénářů (seznam)

#### 1.9 Velitelská rada (pre-battle) UI
- [ ] Shrnutí scénáře (název, historický kontext 2-3 věty, náhled mapy, nepřítel)
- [ ] Volba tajného cíle (2 karty)
- [ ] Velitelská rada — seznam možností (standardních + scénářových) s cenou v SP
- [ ] Dynamický náhled nasazení (co mi přibyde za koupené akce)
- [ ] Tlačítko „Zahájit bitvu"

#### 1.10 Post-victory screen
- [ ] Shrnutí bitvy (zničené jednotky, splnění tajného cíle, XP Bukelárií získané)
- [ ] Volba odměny (3 karty: +2 Favor / +3 Supply / +1 Bukelárii XP)
- [ ] Kronika (historický dobový text, generovaný z reálných citátů — např. Prokopios z Kaesareie *Dějiny válek* pro tyto scénáře)
- [ ] Tlačítko „Pokračovat"

#### 1.11 Transition screen mezi scénáři
- [ ] Středomořská mapa + animace pohybu (Konstantinopol → Dara → Konstantinopol → Kartágo…)
- [ ] Dobový zápis s historickým citátem
- [ ] Shrnutí stavu (Favor, Supply, Bukelárii level)
- [ ] Skip po 3 s (nebo klikem)

#### 1.12 Scénář 1 — Dara (530)
- [ ] Mapa 13×9, pevnost Dara (3 hexy), 2 linie zákopů, 2 pahorky, centrální poušť, perská zóna (sever)
- [ ] Nasazení hráče: 2× těžká pěchota, 1× lukostřelci, Belisarius+Bukelárii, 2× hunská jízda
- [ ] Nasazení bota: 4× perská jízda, 2× Nesmrtelní, 1× perští lukostřelci, 1× slon, Firouz
- [ ] Exkluzivní rada (2 SP): „Pohřbení lukostřelci" → in-battle jednorázová akce 3 kostky útok
- [ ] Tajné cíle: Glory = zabij Firouze / Pragma = žádný nepřítel na Dara
- [ ] Vítězství: hráč 5 praporků, bot 6 praporků
- [ ] Bot AI: postupuje na centrum, obklíčení, slon míří na nejsilnější, Nesmrtelní pomalu, ústup při ztrátách ≥ 30 %

#### 1.13 Scénář 2 — Nika (532)
- [ ] Mapa 11×9, Hippodrom (3 centrální hexy), Velký palác (2 hexy, týl hráče), 3 barikády
- [ ] Nové terény: `hippodrome` (+1 obrana povstalcům), `palace` (nepřítel tam → prohra), `barricade` (−1 útok skrz; pěchota co stojí sousedně může 1 kolo odstranit)
- [ ] Nasazení hráče: Belisarius+Bukelárii, 2× římská pěchota, 2× hunská jízda (v paláci a okolí)
- [ ] Nasazení bota: Hypatius, Pompeius v hippodromu, 4× civilní dav v ulicích, 2× stone-throwing mob
- [ ] Exkluzivní rada (2 SP): „Agentka v davu" → 1 povstalecká jednotka začíná s 3 figurkami místo 5
- [ ] Event karta **Theodora** — přidá se do ruky hráče na začátku 3. kola, dá +1 kartu + +2 kostky pro 1 jednotku
- [ ] Tajné cíle: Glory = oba vůdci padnou / Pragma = žádný nepřítel sousední k paláci
- [ ] Vítězství: hráč 6 zničených jednotek, bot palác nebo 4 jednotky hráče
- [ ] Bot AI: postup k paláci, Hypatius/Pompeius hýčkají hippodrom, civilní davy vlnově

#### 1.14 Scénář 3 — Ad Decimum (533)
- [ ] Mapa 13×9, pobřežní Afrika, vesnice Ad Decimum (2 hexy), 3 přístupové cesty (SZ, S, SV)
- [ ] **Wave spawning** (generalizovat existující Kilíkie waves): vlna A (kolo 1, SZ), vlna B (kolo 3, S), vlna C (kolo 5, SV)
- [ ] Skryté pořadí vln: hráč na začátku nevidí, odhalí se při prvním vstupu
- [ ] Nasazení hráče: Belisarius+Bukelárii, 2× hunská jízda, 1× Herulové, 1× Maurijští oštěpaři, 2× pěchota
- [ ] Exkluzivní rada (1 SP): „Výzvěd z lodi" → odhalí pořadí vln
- [ ] Tajné cíle: Glory = Ammatas padne do konce 3. kola → +1 Favor + `gelimerWounded:true` / Pragma = obsaď vesnici na konci 5. kola
- [ ] Commander modifier: Ammatas padne včas → všechny Vandaly −1 útok 2 kola
- [ ] Vítězství: 5 praporků each
- [ ] Bot AI: každá vlna k nejbližšímu hráči; Gelimer defenzivně 1 kolo po Ammatas smrti; cíl zabít Belisaria

#### 1.15 Bot — 3-vrstvé rozhodování (v MVP scope)
- [ ] **Strategická vrstva**: per-scenario goal (např. `dara: aggressive_center`, `nika: reach_palace`, `ad_decimum: destroy_belisarius`)
- [ ] **Taktická vrstva**: poziční síla (obklíčení, synergická seskupení)
- [ ] **Reaktivní vrstva**: pokud jednotka 1 figurka → ustupuje; pokud ho minulé kolo někdo zaútočil → counter-target
- [ ] **`targetPriority: 'nearest_threat'`** pro kampaň (tvůj tip): nepreferuje zabíjet Bukelárii ze strategických důvodů, místo toho cílí na nejbližší hrozbu nebo toho, kdo ho minule zasáhl
- [ ] Per-commander unique chování (Firouz agresivní, Hypatius defenzivní, Ammatas spíše aggressive…)

---

## FÁZE 2 — Obléhací mechaniky + scénáře 4-5

### Cíl
Přidat siege mechaniky, které scénáře 5 a 6 vyžadují; uzavřít 4 a 5.

### Úlohy

#### 2.1 Siege infrastruktura
- [ ] `TerrainType`: `city_wall` (3 HP), `gate` (4 HP), `aqueduct_entry`, `aqueduct_surface` (skrytý teleport hex), `castel_santangelo`, `stream`
- [ ] **Siege tower** (nová jednotka): 1 HP struktura, pohyb 1, při dosažení hradby umožní 2 kola přechod pěchoty
- [ ] **Siege ram** (nová jednotka): 1 HP, pohyb 1, boří `gate` (2× úspěšný útok)
- [ ] Aqueduct mechanika: lehká jednotka co stojí 1 kolo na `aqueduct_surface` → odhalí + 1× za bitvu 1 pěší se teleportuje dovnitř

#### 2.2 Scénář 4 — Tricamarum (533)
- [ ] Mapa 13×9, potok vodorovně, hřeben severně
- [ ] Terén `stream`: +1 pohyb náklad; nemůže útočit v kole přechodu
- [ ] Nasazení hráče: Belisarius+Bukelárii, Jan Arménský, 2× těžká pěchota, 1× lukostřelci, 2× hunská jízda, Katafrakti (pokud odemčené)
- [ ] Nasazení bota: Gelimer, Tzazon, 3× vandalská jízda, 2× vandalská pěchota
- [ ] Pokud `gelimerWounded` → Gelimer začíná s 3 figurkami
- [ ] Commander: Tzazon padne → Gelimer nemůže hýbat jednotkami 1 kolo (panika) — modifier `cannotMove: true`
- [ ] Jan Arménský (ally commander): padne → player cavalry −1 útok 2 kola
- [ ] Tajné cíle: Glory = Tzazon dřív než Gelimer / Pragma = Bukelárii ≥ 3 figurky na konci
- [ ] Exkluzivní rada (2 SP): „Jan na levém křídle" → Jan má +1 pohyb celé bitvy
- [ ] **Odemčení po výhře:** Katafrakti trvale odemčeni

#### 2.3 Scénář 5 — Obléhání Neapole (536)
- [ ] Mapa 13×11, město obklopené hradbami (uzavřená oblast 5×5, 2 brány N+V)
- [ ] 1 skrytý hex akvaduktu
- [ ] Nasazení hráče: Belisarius+Bukelárii, 2× těžká pěchota, 2× lukostřelci, 1× Isaurijská horská pěchota, 1× obléhací beran
- [ ] Nasazení bota: 2× gótská pěchota, 2× gótská milice, 2× gótští lukostřelci na hradbách (speciální pozice +1 dostřel)
- [ ] Exkluzivní rada (1 SP): „Místní informátor" → akvadukt odhalen od začátku
- [ ] Tajné cíle: Glory = prolom hradbu do 5. kola / Pragma = objev akvadukt
- [ ] Vítězství: 4 nepřátelské jednotky NEBO 3 jednotky uvnitř města
- [ ] Bot AI Neapol: čistě defenzivní, lukostřelci na hradbách cílí lehčí jednotky, milice se seskupí u bráněné brány

#### 2.4 Debug menu (cross-phase)
- [ ] Přeskok na libovolný scénář s nastavitelnými Favor/Supply
- [ ] Ruční nastavení Bukelárii XP
- [ ] Log bot rozhodnutí (console)
- [ ] Metrika délky bitvy

---

## FÁZE 3 — Finále (scénáře 6a/6b, 7A/7B, epilogy)

### Cíl
Dotáhnout větvení kampaně, dvoudílný scénář 6, epilogy, polish.

### Úlohy

#### 3.1 Scénář 6 — Obrana Říma (6a/6b, 537)
- [ ] Mapa 15×11, Aureliánské hradby, Andělský hrad (týl), 4 brány (Flaminia S, Pincia SV, Salaria V, Aurelia Z)
- [ ] **Globální počítadlo zásob** = scénářový efekt s `turn_counter: decrement per turn`; +2 za 1 SP
- [ ] Event karta „Sally brána" (jednorázová Belisariova akce — dvě jednotky ven přes Flaminia)
- [ ] Vlny: kolo 1 průzkum (Witiges + 2 jednotky + siege tower); kolo 4 hlavní (2 pěchota + tower + rytíři)
- [ ] Exkluzivní rada (2 SP): „Papežská podpora" → zásoby start 11 místo 8
- [ ] Tajné cíle 6a: Glory = zničit 1 siege tower před hradbou / Pragma = Bukelárii na 4 figurkách
- [ ] Vítězství 6a: do konce 5. kola bez pádu Říma
- [ ] **Force save + return to hub** mezi 6a a 6b (user explicit choice)
- [ ] Scénář 6b: pokračuje se stavy z 6a; vlna 3 v kole 3 (= originální kolo 8)
- [ ] Tajné cíle 6b: Glory = Witiges / Pragma = zásoby ≥ 3 na konci
- [ ] Vítězství 6b: dalších 5 kol
- [ ] Bonusová odměna: +1 Supply (celkem +4 místo +3 pokud zvolí supply)

#### 3.2 Branching
- [ ] Po scénáři 6: pokud `favor >= 4` → 7A Ravenna, jinak → 7B Kalábrie

#### 3.3 Scénář 7A — Ravenna (540)
- [ ] Mapa 11×9, městský, `ravenna_plaza` (2 hexy), `treasury` (1 hex)
- [ ] **Dva způsoby vítězství:**
  - Vojenské: 5 gótských jednotek
  - Diplomatické: Belisarius na plaza + 3 sousední pěšáci + ≤5 padlých gótských figurek
- [ ] Tracker „pobito gótů" — po 5 se diplomatická varianta uzamkne
- [ ] Exkluzivní rada (2 SP): „Tajný posel" → vidí formaci bota a jeho první akci
- [ ] Tajné cíle: Glory = diplomatická výhra / Pragma = obsaď treasury
- [ ] Bot AI Ravenna: adaptivní — reaguje na hráčovu agresivitu; při dosažení plazy se pokusí Belisaria zabít na posledním tahu

#### 3.4 Scénář 7B — Kalábrie (548)
- [ ] Mapa 13×9, horský italský terén, mnoho `hill`+`forest`, řeka diagonálně, `port` (2 hexy, týl)
- [ ] **Skryté nasazení Belisaria** (reuse `ambush_hidden` mechanika): hráčovy jednotky jsou markery „skrytá jednotka", odhalí se při prvním útoku nebo přiblížení bota na 1 hex
- [ ] Hráč před bitvou volí **5 z 8** jednotek z rosteru (Belisarius+Bukelárii povinně)
- [ ] Nové jednotky: Isaurijská horská pěchota (odemčena), 1× lukostřelci
- [ ] Nasazení bota: Totila (aura +1 všem Gótům ve 3 hexech), 4× gótská pěchota, 2× gótští rytíři, 2× milice
- [ ] Exkluzivní rada (2 SP): „Partyzánská síť" → 1× za bitvu přepad z `forest` hexu s +2 kostkami
- [ ] Tajné cíle: Glory = Totila / Pragma = žádná Bukelárská figurka nepadne
- [ ] **Supply tokens se neobnovují** po této bitvě (mezi 7B a epilogem 0 příjem)
- [ ] Vítězství: přežít 8 kol + 2 jednotky na `port` zóně
- [ ] Bot AI Kalábrie: Totila tlačí k přístavu, obkličuje; skryté jednotky bot systematicky loví

#### 3.5 Epilogy
- [ ] **Epilog A — Konstantinopol (559)** (pokud Bukelárii `level>=3` a alive): stínové tokeny mechanika, 3× hunská kočovná jízda + 2× hunští lukostřelci + Zabergan, cíl 4 jednotky bez ztráty → legendární konec
- [ ] **Epilog B — Roma Nova** (pokud `favor==6`): narativní, 3 volby rozhovoru, žádná bitva
- [ ] **Epilog C — Titulky**: narativní shrnutí s metrikami (kolik bitev, tajných cílů, stav Bukelárií)
- [ ] Pokud hráč splňuje A+B → volba

#### 3.6 Polish & zvuk
- [ ] Animace Středomořské mapy při přechodu (pomalý trace linie)
- [ ] Dobové texty z reálných pramenů (Prokopios *Dějiny válek*, Agathias, Ammianus)
  - Zdroj: `https://www.documentacatholicaomnia.eu/` nebo `https://www.perseus.tufts.edu/`
- [ ] Zvukové podkresy (klávesové přechody, bitevní shumy — ale ať jsou minimalistické)

#### 3.7 Obtížnosti bota
- [ ] **Easy**: žádné bonusy, přímočará hra
- [ ] **Normal** (default MVP): +1 lehká jednotka + běžná logika
- [ ] **Hard**: +1 jednotka + 1 karta + preference optimálních tahů + agresivita

#### 3.8 Čestný mód (permadeath)
- [ ] Přepínač v settings: zapnout = prohra = konec kampaně (save smazán)
- [ ] Varovný dialog při aktivaci

#### 3.9 Debug menu expand
- [ ] Skok na jakýkoliv scénář včetně 7A/7B/epilogy
- [ ] Set Bukelárii level 1-4
- [ ] Toggle `gelimerWounded`, `katafraktiUnlocked`

---

## Supabase schema

```sql
create table if not exists campaigns (
  user_id text not null,
  slot_id int not null default 0,
  campaign_version int not null default 1,
  state jsonb not null,        -- CampaignState serialized
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (user_id, slot_id)
);
create index if not exists campaigns_user_idx on campaigns(user_id);
```

- Každý uživatel 1 slot (slot_id=0 default; budoucí multi-slot vezme ID)
- Při conflict při uložení: server-wins (latest updated_at)

---

## Riziková místa

- **Fáze 0 regrese:** Refactor může rozbít existující scénáře — proto manuální regresní matice na všech 9. Pojistka: commitovat Fáze 0 postupně (terénní check první, pak modifiery).
- **Multi-figure HP >3:** UI vykreslení token dots, zatím max 5 — ošetřit overflow.
- **Bot performance:** 3-vrstvé rozhodování pro 7 scénářů — každý scénář vlastní bot config soubor.
- **Save migration:** `campaignVersion` — když změním schema, offer „start new".

---

## Pořadí implementace a commit strategy

Každá úloha = vlastní commit. Po každé subfázi push + deploy na preview URL. Hlavní milníky:

1. `[FÁZE 0 DONE]` Event/Modifier refactor bez regresí → testable
2. `[FÁZE 1 MVP]` Kampaň hratelná přes 3 scénáře → první hratelný kampaň release
3. `[FÁZE 2]` Scénáře 4-5 → siege demo
4. `[FÁZE 3]` Kompletní kampaň → full release

## Review (vyplnit po dokončení)
