# Plán: 4 nové scénáře (Řím vs Germáni, Borgiové)

## Cíl
Přidat 4 historické scénáře se 14 novými jednotkami a novými mechanikami (aktivované schopnosti, podmínkové bonusy, scénářové eventy), při zachování stávající UX a herní smyčky.

---

## Fáze 1 — Typy a datový model
- [ ] `types/unit.ts`: přidat `UnitType` hodnoty — `legionary`, `auxilia`, `equites`, `sagittarii`, `scorpio`, `praetorian`, `germanic_warrior`, `framea_thrower`, `germanic_chieftain`, `arquebusier`, `pikeman`, `gendarme`, `stradiot`, `rodelero`, `crossbowman`, `culverin`, `condottiero`, `caterina_sforza`, `cesare_borgia`, `arminius`
- [ ] `types/unit.ts`: nové flagy v `UnitDefinition` — `pilumVolley`, `warcryAbility`, `betrayalAbility`, `ambushSignalAbility`, `chargeRequires3Hex`, `volleyFireBonus`, `pikeWall`, `setupRequired`, `antiHeavyCavalry`, `gunpowderWeapon`, `namedHero`, `rangedGunpowder`
- [ ] `types/unit.ts`: `UnitInstance` — nová pole `specialAbilityUsed: boolean`, `moveHistoryThisTurn: Position[]` (pro detekci charge), `gunpowderPanicUntilTurn?: number`
- [ ] `types/terrain.ts`: nové terény — `trench`, `vineyard`, `wall`, `wagenburg`, `ambush_forest` (les, kde jsou germáni skrytí)
- [ ] `types/game.ts`: `GameState.activeScenarioEffects: ScenarioEffect[]` (id, description, fromTurn, toTurn?, effectKind)
- [ ] `types/game.ts`: `TurnPhase` — přidat `activate_ability` (nepovinné, viz Fáze 5 pro UX)

## Fáze 2 — Definice jednotek
- [ ] `constants/unitDefinitions.ts`: přidat všech 20 nových jednotek se statistikami (move/range/attack/hp + flagy)
- [ ] `constants/unitIcons.tsx`: ikony pro nové jednotky (emoji/SVG, zachovat existující styl)
- [ ] Balans: projít všechny statistiky proti existujícím jednotkám

## Fáze 3 — Herní logika
- [ ] `logic/combat.ts`:
  - [ ] Pilum volley — při útoku zkontrolovat flag, pokud aktivní a cíl je v range 1–2, použít ranged + `specialAbilityUsed = true`
  - [ ] Lance charge — při útoku zkontrolovat `moveHistoryThisTurn` (3+ hexy přímo), pokud platí → +2 kostky
  - [ ] Volley fire — při útoku arkebuzíra zkontrolovat, zda 3+ arkebuzírů stejné strany ve stejné řadě útočilo v tomto kole → +1 kostka každému (broadcast bonus)
  - [ ] Pike wall — pokud defender má pikeWall a attacker je těžká/lehká jízda → +2 obrana, 1 auto-hit na attacker
  - [ ] Anti-heavy-cavalry (rodelero) — +1 kostka vs heavy_cavalry/gendarme
  - [ ] Gunpowder panic — po zásahu gunpowderWeapon zasažená jednotka má `gunpowderPanicUntilTurn = currentTurn + 1`; v tomto kole −1 kostka útoku
- [ ] `logic/movement.ts`:
  - [ ] Zaznamenávat `moveHistoryThisTurn` při každém pohybu
  - [ ] Setup required — jednotka nemůže útočit v kole, kdy se pohla (flag kontrolován v attack validaci)
- [ ] `logic/abilities.ts` (nový soubor):
  - [ ] `canActivate(unit, state)` — dostupnost schopnosti
  - [ ] `applyWarcry(unit, state)` — +2 kostky útoku a +1 pohyb v tomto kole
  - [ ] `applyPilumReady(unit, state)` — povolí pilum ranged útok pro další útok
  - [ ] `applyBetrayal(unit, target, state)` — přepne kondotiéra na protistranu na 1 kolo
  - [ ] `applyAmbushSignal(unit, state)` — odhalí všechny skryté germány, +1 kostka útoku v tomto kole
- [ ] `logic/scenarioEffects.ts` (nový soubor):
  - [ ] `checkAndApplyScenarioEffects(state)` — volá se na začátku kola
  - [ ] Vercellae — od kola 4 přidat efekt `{ effectKind: 'heat_debuff', unitFilter: tamerlane_kimbri }`
  - [ ] Teutoburg — celou hru skrývat germány v `ambush_forest` od Římanů dokud není do 2 hexů
- [ ] `logic/los.ts`:
  - [ ] Respektovat `ambush_forest` — skryté jednotky neviditelné, pokud pozorovatel není do 2 hexů

## Fáze 4 — Reduktor a akce
- [ ] `state/actions.ts`: `ACTIVATE_ABILITY` (unitId, abilityType, targetId?)
- [ ] `state/gameReducer.ts`: handler pro `ACTIVATE_ABILITY` volá příslušnou funkci z `abilities.ts`
- [ ] `state/gameReducer.ts`: resetovat `moveHistoryThisTurn` na začátku kola
- [ ] `state/gameReducer.ts`: reset `gunpowderPanicUntilTurn` když vyprší

## Fáze 5 — UI
- [ ] `components/Units/UnitToken.tsx`:
  - [ ] Ikona ✦ v rohu tokenu, pokud `specialAbilityUsed === false` a jednotka má schopnost
  - [ ] `?` místo tokenu pro skryté germány z pohledu Římanů (Teutoburg)
  - [ ] `panic` marker (🟡) pro jednotky s aktivním gunpowder panic
- [ ] `components/UI/AbilityButton.tsx` (nový): tlačítko u aktivované jednotky v action baru
  - [ ] `🔥 Válečný řev (1/1)` / `🎯 Pilum salva (1/1)` / `🗡 Zrada` / `📯 Signál přepadu`
  - [ ] Hotkey `Q` pro aktivaci
- [ ] `components/Board/BoardCell.tsx`: při útočné fázi zvýraznit cíl + popisek bonusu — `⚡ CHARGE +2` / `🔫 VOLLEY +1` / `🛡 PIKE WALL` / `🎯 ANTI-CAV +1`
- [ ] `components/UI/ScenarioEffectsBanner.tsx` (nový): banner pod headerem s aktivními efekty — `🌞 Kolo 4+: Žár pláně (Kimbrové −1 útok)`
- [ ] `components/UI/UnitLegend.tsx`: rozšířit o nové jednotky
- [ ] `components/UI/HowToContent.tsx`: sekce "Nové mechaniky" (charge, pike wall, aktivované schopnosti, gunpowder)
- [ ] Nové styly terénů v `Board.tsx` / `BoardCell.tsx` (trench, vineyard, wall, wagenburg)

## Fáze 6 — Scénáře
- [ ] `constants/scenarios.ts`:
  - [ ] **SCENARIO_TEUTOBURG** (9 n.l.) — úzký lesní průsek, Římané ve sloupu (řady 1–4), germáni skrytí v `ambush_forest` po bocích; Arminius jako named hero; cíl Říma: 3 jednotky na sever do 10 kol; cíl Germánů: pobít 5+
  - [ ] **SCENARIO_VERCELLAE** (101 př.n.l.) — otevřená pláň, centrální wagenburg, Kimbrové přesila + fury-charge jednotky; Římané: legie + scorpio; scénářový event "Žár pláně" od kola 4
  - [ ] **SCENARIO_FORLI** (1500) — citadela Ravaldino, Borgia zdola s kulverinami, Caterina Sforza jako named hero; hradby zničitelné dělem; cíl Borgie: dobýt citadelu do 12 kol; cíl obrany: přežít NEBO zničit všechny kulveriny
  - [ ] **SCENARIO_CERIGNOLA** (1503) — vinice, zákopy, Španělé se arkebuzíry v zákopech, Francouzi gendarmy + pikenýry; cíl Francouzů: průlom do 10 kol; cíl Španělů: přežít/pobít 5+
- [ ] `constants/scenarios.ts`: `ALL_SCENARIOS` přidat 4 nové
- [ ] `constants/scenarioSetup.ts`: inicializace `activeScenarioEffects` pro nové scénáře

## Fáze 7 — Bot AI
- [ ] `logic/bot.ts`:
  - [ ] Rozšířit rozhodování o aktivaci schopností (warcry/pilum) — heuristika: použij, když chystáš rozhodující útok
  - [ ] Bot musí respektovat pike wall (neztrácet jízdu proti pike)
  - [ ] Bot využívá charge (pohne jízdu 3+ hexy v linii, když je cíl v dosahu)
  - [ ] Bot využívá volley fire (koordinuje arkebuzíry do řady)
  - [ ] Scénáře Teutoburg a Forlì — scénářová bot strategie (podobně jako už existuje pro Aškelon/Kilíkii)

## Fáze 8 — Multiplayer sync
- [ ] `services/multiplayerService.ts`: ověřit, že nové akce (ACTIVATE_ABILITY) a nová pole (`specialAbilityUsed`, `moveHistoryThisTurn`, `activeScenarioEffects`) se serializují

## Fáze 9 — Verifikace
- [ ] `npm run build` — TypeScript projde bez chyb
- [ ] Dev server: `npm run dev`
- [ ] Projít každý nový scénář manuálně (minimálně 3–4 kola):
  - [ ] Teutoburg — skrytí germáni se odhalí, Arminius signal funguje
  - [ ] Vercellae — scorpio setup required, Žár pláně banner od kola 4
  - [ ] Forlì — kulverina ničí hradby, Caterina aura, Cesare zrada
  - [ ] Cerignola — gendarm charge proti pike wall, arkebuzír volley, gunpowder panic
- [ ] Bot v každém novém scénáři na obou stranách hraje rozumně
- [ ] Všechny aktivované schopnosti zobrazují ikonu ✦, po použití zmizí
- [ ] Scénářové banner se zobrazuje a skryje správně
- [ ] Undo funguje i s novými akcemi

---

## Pořadí prací (doporučené)

1. **Typy** (Fáze 1) — základ
2. **Definice jednotek + ikony** (Fáze 2) — data
3. **Logika podmínkových bonusů** (část Fáze 3: charge, pike wall, volley, setup, anti-cav, gunpowder panic) — „čistě výpočetní"
4. **Aktivované schopnosti + reduktor** (Fáze 3 abilities, Fáze 4) — interaktivní
5. **Scénářové eventy** (Fáze 3 scenarioEffects) — závisí na reduktoru
6. **UI** (Fáze 5) — viditelné výsledky
7. **Scénáře** (Fáze 6) — vše dohromady
8. **Bot** (Fáze 7) — po scénářích
9. **MP sync + verifikace** (Fáze 8, 9) — finále

## Review sekce

### Co je hotové
- **20 nových jednotek** v `unitDefinitions.ts`: legionář, auxilia, equites, sagittarii, scorpio, praetorián, germánský válečník/oštěpník/náčelník, Arminius, arkebuzír, pikenýr, gendarm, stradiot, rodelero, kušiník, kulverina, kondotiér, Caterina Sforza, Cesare Borgia — všechny se SVG ikonami.
- **5 nových terénů**: `trench`, `vineyard`, `wall` (structureHp), `wagenburg` (structureHp), `ambush_forest` — včetně gradientů na boardu.
- **Aktivované schopnosti (1×/hru)**: Válečný řev, Pilum salva, Zrada (Cesare), Signál přepadu (Arminius) — tlačítka v action baru, ✦ marker na tokenu, hotkey-free UX.
- **Podmínkové bonusy**: Lance charge (3+ hex v linii, cube coords), Volley fire (3+ arkebuzíři stejná řada), Pike wall (+2 obr., auto-hit vs jízda), Anti-heavy-cavalry (rodelero), Setup required (kulverina/scorpio), Crossbow vs plate penalty.
- **Scénářové efekty**: heat_debuff (Vercellae od kola 4), ambush_hidden (Teutoburg), named_hero_rule (Forlì / Teutoburg); banner pod headerem.
- **4 nové scénáře**: Les Teutoburský, Vercellae, Obléhání Forlì, Bitva u Cerignoly — všechny s vítěznými podmínkami v `victory.ts`.
- **Akce/reducer**: `ACTIVATE_ABILITY`, `SELECT_BETRAYAL_TARGET`, `CANCEL_BETRAYAL`, `ATTACK_TERRAIN` + `select_betrayal_target` fáze.
- **Bot AI**: používá aktivované schopnosti (warcry před útokem, pilum v range 1-2, zrada na adjacent kondotiéra, ambush signal při 2+ germánech v dosahu), preferuje ostřelování hradeb, scénářová strategie pro všechny 4 nové bitvy.
- **Multiplayer**: celý GameState se serializuje, nová pole se automaticky syncují.
- **Visibility**: skryté germány v ambush_forest renderovány jako `?` pro Římany; odhaleno do 2 hexů nebo po Arminiově Signálu přepadu.
- **Destruktibilní terén**: hradby (HP 3) a wagenburg (HP 4) lze ostřelovat kulverinou/scorpiem; při HP=0 se mění na plain.

### Kompromisy / věci, které jsem zjednodušil
- **Condottiero loyalty (d6 refusal)** vynechána — přidala by randomness bez dobré UX. Kondotiér je teď jen těžká jízda alternativní ke Gendarmovi.
- **Gunpowder panic** jen 1 kolo po zásahu (ne permanentní) — funguje jako "paralyze", ne "debilitate".
- **Cilicia counter-bonus z fortress/hill** zůstal v kódu i pro nové scénáře (malý balance artifact); nepředělával jsem.
- **Krosbu vs plate (−1 kostka)** je jednoduchý flag na typu `crossbowman`, nikoli generický `antiHeavyArmor` flag.
- **Vineyard** funguje jen jako "stop-terrain" (musí zastavit), nikoli "extra cost".
- **Setup required** zakazuje útok v kole, kdy se jednotka pohla — jednodušší než true setup-turn mechanika.

### Co zbývá doladit (follow-up návrhy)
- Balance testing — projít 2–3 hry každého nového scénáře a upravit HP/počty.
- UnitLegend rozšířit o nové jednotky (zatím spadá zpátky na `abbrevCs`).
- HowToContent sekce "Nové mechaniky" s vysvětlením charge/pike wall/gunpowder.
- Scénáře jsou hratelné proti botovi, ale bot je "vanilla" heuristika — mohl by být chytřejší (např. Cesare by měl prioritně chránit kulveriny).
