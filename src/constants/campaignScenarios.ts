import type { SecretGoalKind } from '../types/campaign';

/**
 * Kampaňová vrstva — definice 7 scénářů kampaně + epilogů.
 * Každý kampaňový scénář odkazuje na herní scenarioId (z scenarios.ts),
 * ale přidává navíc tajné cíle, exkluzivní nákupy a historickou kroniku.
 */

export interface CampaignScenarioDefinition {
  /** Interní id (= scenarioId v ALL_SCENARIOS). */
  id: string;
  nameCs: string;
  /** Čeština: historický kontext (2–3 věty). Zobrazuje se ve Velitelské radě. */
  contextCs: string;
  /** Dobový latinský citát + český překlad (zobrazuje se v Transition screen). */
  chronicleCs: string;
  chronicleLat?: string;
  /** Cílové město/lokalita na mapě Středomoří (pro pin). */
  mapLabel: string;
  /** Přibližné souřadnice na SVG mapě Středomoří (x, y v promile 0-1000). */
  mapCoords: { x: number; y: number };
  /** Tajné cíle — 2 volby. */
  goals: {
    glory: { descriptionCs: string };
    pragma: { descriptionCs: string };
  };
  /** Exkluzivní nákup ve Velitelské radě (kromě standardních). */
  exclusiveOption?: {
    id: string;
    nameCs: string;
    cost: number;
    descriptionCs: string;
  };
  /** Když je tento scénář odemčen (pouze předchozí výhry). */
  unlockAfter: string[]; // scenario ids needed
}

// ─── Sekvence kampaně ────────────────────────────────────────────────────────
// Pro MVP Fáze 1: dara → nika → ad_decimum.
// Fáze 2: tricamarum → neapol.
// Fáze 3: roma_6a → roma_6b → (ravenna | calabria) → epilog.

export const CAMPAIGN_SCENARIO_SEQUENCE: string[] = [
  'dara',
  'nika',
  'ad_decimum',
  'tricamarum',
  'neapol',
  'roma_6a',
  'roma_6b',
  // Index 7 = Ravenna nebo Kalábrie podle favor (rozhoduje resolver)
  // Index 8 = Epilog A (volitelný) nebo konec
];

/**
 * Resolver branchingu po scénáři 6b:
 *   favor ≥ 4 → 'ravenna'  (diplomatická cesta)
 *   favor < 4 → 'calabria' (přežití)
 * Po 7A/7B → epilog_a pokud Bukelárii level ≥ 3 a naživu.
 */
export function resolveNextScenarioId(args: {
  completedScenarios: string[];
  favor: number;
  buceliariiLevel: number;
  buceliariiAlive: boolean;
}): string | null {
  const { completedScenarios, favor, buceliariiLevel, buceliariiAlive } = args;

  // Standardní sekvence 0-6
  for (const id of CAMPAIGN_SCENARIO_SEQUENCE) {
    if (!completedScenarios.includes(id)) return id;
  }

  // Po 6b → větvení
  if (!completedScenarios.includes('ravenna') && !completedScenarios.includes('calabria')) {
    return favor >= 4 ? 'ravenna' : 'calabria';
  }

  // Po ravenna/calabria — rozhodovací logika epilogů:
  //   1. Bukelárii L≥3 + alive        → epilog_a (Konstantinopol, bitva)
  //   2. Favor == 6 (bez epilog_a)    → epilog_b (Roma Nova, narrativní)
  //   3. Oba už dokončené / žádné z obou podmínek → epilog_c (titulky)
  const hasEpilogA = completedScenarios.includes('epilog_a');
  const hasEpilogB = completedScenarios.includes('epilog_b');
  const hasEpilogC = completedScenarios.includes('epilog_c');

  if (!hasEpilogA && buceliariiAlive && buceliariiLevel >= 3) return 'epilog_a';
  if (!hasEpilogB && favor === 6) return 'epilog_b';
  if (!hasEpilogC) return 'epilog_c';

  return null; // konec kampaně
}

// ─── Jednotlivé scénáře ──────────────────────────────────────────────────────

export const CAMPAIGN_SCENARIO_DARA: CampaignScenarioDefinition = {
  id: 'dara',
  nameCs: 'Bitva u Dary',
  contextCs: 'Rok 530. Východní hranice říše — perská vojska krále Kavadha pochodují proti pevnosti Dara. Belisarius, čerstvě jmenovaný magister militum, má hájit čelo imperia.',
  chronicleCs: '„Řím opět potřebuje hrdinu. Na co čeká mladý generál?" — Justinián I. ve svém listu Belisariovi.',
  chronicleLat: '«Roma rursum heroem desiderat. Quid exspectat iuvenis dux?»',
  mapLabel: 'Dara',
  mapCoords: { x: 905, y: 250 },
  goals: {
    glory: { descriptionCs: 'Zabij perského velitele Firouze.' },
    pragma: { descriptionCs: 'Žádný nepřítel se nedostane na hex s pevností Dara.' },
  },
  exclusiveOption: {
    id: 'buried_archers',
    nameCs: 'Pohřbení lukostřelci',
    cost: 2,
    descriptionCs: '1× za bitvu: útok 3 kostkami na jednu jednotku v první perské linii.',
  },
  unlockAfter: [],
};

export const CAMPAIGN_SCENARIO_NIKA: CampaignScenarioDefinition = {
  id: 'nika',
  nameCs: 'Povstání Nika',
  contextCs: 'Rok 532. Konstantinopol v plamenech — fani modrých a zelených zapálili Hippodrom a žádají abdikaci Justiniána. Císař si ponechal jediného generála: Belisaria.',
  chronicleCs: '„Purpur je nejlepší rubáš." — Theodora, panovníkova choť.',
  chronicleLat: '«Purpura optimum feretrum est.»',
  mapLabel: 'Konstantinopol',
  mapCoords: { x: 625, y: 205 },
  goals: {
    glory: { descriptionCs: 'Zabij oba vůdce povstání — Hypatia i Pompeia.' },
    pragma: { descriptionCs: 'Žádný povstalec nesmí stát sousedně s Velkým palácem.' },
  },
  exclusiveOption: {
    id: 'agent_in_crowd',
    nameCs: 'Agentka v davu',
    cost: 2,
    descriptionCs: 'Jedna povstalecká jednotka (volba hráče) začíná se 3 figurkami místo 5.',
  },
  unlockAfter: ['dara'],
};

export const CAMPAIGN_SCENARIO_AD_DECIMUM: CampaignScenarioDefinition = {
  id: 'ad_decimum',
  nameCs: 'Ad Decimum',
  contextCs: 'Rok 533. Belisarius přistál u afrického břehu s menším vojskem — proti vandalskému králi Gelimerovi, který mobilizuje přesilu. Před branami Kartága čeká rozhodující setkání.',
  chronicleCs: '„Bůh je tobě nakloněn. Pán nezaostává." — Prokopios z Kaisareie.',
  chronicleLat: '«Deus tibi favet. Dominus non cessat.»',
  mapLabel: 'Kartágo',
  mapCoords: { x: 440, y: 425 },
  goals: {
    glory: { descriptionCs: 'Ammatas padne do konce 3. kola.' },
    pragma: { descriptionCs: 'Obsaď hex vesnice Ad Decimum do konce 5. kola.' },
  },
  exclusiveOption: {
    id: 'scout_from_ship',
    nameCs: 'Výzvěd z lodi',
    cost: 1,
    descriptionCs: 'Odhalí pořadí vandalských vln před začátkem bitvy.',
  },
  unlockAfter: ['nika'],
};

export const CAMPAIGN_SCENARIO_TRICAMARUM: CampaignScenarioDefinition = {
  id: 'tricamarum',
  nameCs: 'Bitva u Tricamara',
  contextCs: 'Rok 533. Po vítězství u Ad Decima Belisarius dostihl zbytky vandalské armády. Gelimer ustupuje za potok se svým bratrem Tzazonem. Rozhodne Jan Arménský — dokud stojí, jeho jízda drtí Góty.',
  chronicleCs: '„Bůh dal vítězství skrze jednoho muže." — Prokopios z Kaisareie, De Bellis.',
  chronicleLat: '«Deus per unum virum victoriam dedit.»',
  mapLabel: 'Tricamarum',
  mapCoords: { x: 455, y: 445 },
  goals: {
    glory: { descriptionCs: 'Tzazon padne dřív než Gelimer.' },
    pragma: { descriptionCs: 'Bukelárii mají na konci bitvy alespoň 3 figurky.' },
  },
  exclusiveOption: {
    id: 'jan_left_flank',
    nameCs: 'Jan na levém křídle',
    cost: 2,
    descriptionCs: 'Jan Arménský má +1 pohyb po celou bitvu.',
  },
  unlockAfter: ['ad_decimum'],
};

export const CAMPAIGN_SCENARIO_NEAPOL: CampaignScenarioDefinition = {
  id: 'neapol',
  nameCs: 'Obléhání Neapole',
  contextCs: 'Rok 536. Belisarius přistál na Sicílii a nyní se blíží k Neapoli. Hradby jsou mohutné — ale pod nimi vede starý římský akvadukt. Stačí najít vchod.',
  chronicleCs: '„Když odřízli vodu, naděje gotské posádky se utopila v rezavých trubkách." — Prokopios.',
  chronicleLat: '«Cum aquam interceperunt, spes Gothorum in fistulis rubiginosis submersa est.»',
  mapLabel: 'Neapol',
  mapCoords: { x: 525, y: 330 },
  goals: {
    glory: { descriptionCs: 'Prolom hradbu (libovolný wall nebo gate hex) do konce 5. kola.' },
    pragma: { descriptionCs: 'Objev akvadukt (stůj na aqueduct_surface alespoň 1 kolo).' },
  },
  exclusiveOption: {
    id: 'local_informant',
    nameCs: 'Místní informátor',
    cost: 1,
    descriptionCs: 'Akvadukt je od začátku bitvy odhalený — lehká pěchota ho může přímo využít.',
  },
  unlockAfter: ['tricamarum'],
};

export const CAMPAIGN_SCENARIO_ROMA_6A: CampaignScenarioDefinition = {
  id: 'roma_6a',
  nameCs: 'Obrana Říma — I. nápor',
  contextCs: 'Rok 537. Witigesovi Gótové oblehli Řím. Belisarius má přežít prvních 5 kol — obléhací věže, taran, gotická jízda.',
  chronicleCs: '„Nepřítel je u brány Flaminia. Hradby drží. Zatím." — Belisariův rozkaz v první den obléhání.',
  chronicleLat: '«Hostis ad portam Flaminiam. Moenia stant. Adhuc.»',
  mapLabel: 'Řím (I)',
  mapCoords: { x: 498, y: 285 },
  goals: {
    glory: { descriptionCs: 'Zničit alespoň 1 gotickou obléhací věž dříve, než dosáhne hradby.' },
    pragma: { descriptionCs: 'Bukelárii mají na konci části 1 plné 4 figurky.' },
  },
  exclusiveOption: {
    id: 'papal_support',
    nameCs: 'Papežská podpora',
    cost: 2,
    descriptionCs: 'Chléb a oleje od Petrovy stolice: +2 bonusové kostky pro jednu jednotku v této bitvě.',
  },
  unlockAfter: ['neapol'],
};

export const CAMPAIGN_SCENARIO_ROMA_6B: CampaignScenarioDefinition = {
  id: 'roma_6b',
  nameCs: 'Obrana Říma — Prolom',
  contextCs: 'Druhý týden obléhání. Hradby jsou prolomeny, Witiges se vrací s čerstvou vlnou rytířů. Belisarius musí vydržet dalších 5 kol.',
  chronicleCs: '„Únava posádky sahala k paniku; ale Belisarius spával u hradeb." — Prokopios, De Bellis.',
  chronicleLat: '«Fessus miles ad pavorem vergebat; sed Belisarius ad moenia dormiebat.»',
  mapLabel: 'Řím (II)',
  mapCoords: { x: 502, y: 295 },
  goals: {
    glory: { descriptionCs: 'Zabij Witigese, pokud je přítomen ve 2. části.' },
    pragma: { descriptionCs: 'Ukonči bitvu s aspoň 3 byzantskými jednotkami naživu.' },
  },
  unlockAfter: ['roma_6a'],
};

export const CAMPAIGN_SCENARIO_RAVENNA: CampaignScenarioDefinition = {
  id: 'ravenna',
  nameCs: 'Dobytí Ravenny',
  contextCs: 'Rok 540. Gotské království kapituluje. Můžeš rozdrtit, nebo prijmout jejich korunu — přičemž Justinián ti už nedůvěřuje plně.',
  chronicleCs: '„Ostrogóti mu nabídli korunu. Ale Justinián by pak neměl žádného Belisaria." — Agathias.',
  chronicleLat: '«Ostrogothi coronam ei obtulerunt. At Iustinianus tum nullum Belisarium haberet.»',
  mapLabel: 'Ravenna',
  mapCoords: { x: 510, y: 215 },
  goals: {
    glory: { descriptionCs: 'Dosáhni diplomatického vítězství (Belisarius na náměstí + 3 pěšáci + ≤5 padlých Gótů).' },
    pragma: { descriptionCs: 'Obsaď gotickou pokladnici (fortress hex).' },
  },
  exclusiveOption: {
    id: 'secret_envoy',
    nameCs: 'Tajný posel',
    cost: 2,
    descriptionCs: 'Viz gotskou formaci a jeho první akci před zahájením bitvy.',
  },
  unlockAfter: ['roma_6b'],
};

export const CAMPAIGN_SCENARIO_CALABRIA: CampaignScenarioDefinition = {
  id: 'calabria',
  nameCs: 'Ústup do Kalábrie',
  contextCs: 'Rok 548. Totila obnovil gotské království. Belisarius, bez posil, ustupuje k jadranskému přístavu. Hory a lesy jsou jeho jediný přítel.',
  chronicleCs: '„Bez zlata, bez vojska, ale s Belisariem." — lidové rčení konstantinopolského lidu.',
  chronicleLat: '«Sine auro, sine exercitu, sed cum Belisario.»',
  mapLabel: 'Kalábrie',
  mapCoords: { x: 545, y: 415 },
  goals: {
    glory: { descriptionCs: 'Zabij Totilu.' },
    pragma: { descriptionCs: 'Žádná Bukelárská figurka nepadne.' },
  },
  exclusiveOption: {
    id: 'guerrilla_network',
    nameCs: 'Partyzánská síť',
    cost: 2,
    descriptionCs: '1× za bitvu přepad z lesního hexu s +2 útočnými kostkami.',
  },
  unlockAfter: ['roma_6b'],
};

export const CAMPAIGN_SCENARIO_EPILOG_B: CampaignScenarioDefinition = {
  id: 'epilog_b',
  nameCs: 'Roma Nova — V senátě',
  contextCs: 'Žádná bitva. Belisarius před Justiniánem, 3 politické volby, které určí jeho odkaz.',
  chronicleCs: '„Purpur je nejlepší rubáš, ale slovo generála je víc než meč." — Theodorin odkaz.',
  mapLabel: 'Senát',
  mapCoords: { x: 620, y: 210 },
  goals: {
    glory: { descriptionCs: 'Nenastane (narrativní epilog).' },
    pragma: { descriptionCs: 'Nenastane (narrativní epilog).' },
  },
  unlockAfter: ['ravenna', 'calabria'],
};

export const CAMPAIGN_SCENARIO_EPILOG_C: CampaignScenarioDefinition = {
  id: 'epilog_c',
  nameCs: 'Titulky',
  contextCs: 'Shrnutí kampaně. Tvá cesta od Dary ke Konstantinopoli.',
  chronicleCs: '„Vše pomine. Říše, generálové, císaři. Zůstane jen vzpomínka na čest." — Prokopios.',
  mapLabel: 'Konec',
  mapCoords: { x: 495, y: 300 },
  goals: {
    glory: { descriptionCs: 'Nenastane.' },
    pragma: { descriptionCs: 'Nenastane.' },
  },
  unlockAfter: [],
};

export const CAMPAIGN_SCENARIO_EPILOG_A: CampaignScenarioDefinition = {
  id: 'epilog_a',
  nameCs: 'Poslední vítězství',
  contextCs: 'Rok 559. Belisarius, stařec, zachraňuje Konstantinopol před hunským nájezdem. Malá armáda, elitní veteráni. Možnost legendárního konce.',
  chronicleCs: '„A tak generál, oslepený závistí císaře, zachránil říši naposledy." — Prokopios.',
  chronicleLat: '«Ita dux, invidia imperatoris caecatus, imperium postremo servavit.»',
  mapLabel: 'Konstantinopol',
  mapCoords: { x: 615, y: 220 },
  goals: {
    glory: { descriptionCs: 'Vyhraj bez jediné ztráty.' },
    pragma: { descriptionCs: 'Zabij Zabergana.' },
  },
  unlockAfter: ['ravenna', 'calabria'],
};

export const ALL_CAMPAIGN_SCENARIOS: CampaignScenarioDefinition[] = [
  CAMPAIGN_SCENARIO_DARA,
  CAMPAIGN_SCENARIO_NIKA,
  CAMPAIGN_SCENARIO_AD_DECIMUM,
  CAMPAIGN_SCENARIO_TRICAMARUM,
  CAMPAIGN_SCENARIO_NEAPOL,
  CAMPAIGN_SCENARIO_ROMA_6A,
  CAMPAIGN_SCENARIO_ROMA_6B,
  CAMPAIGN_SCENARIO_RAVENNA,
  CAMPAIGN_SCENARIO_CALABRIA,
  CAMPAIGN_SCENARIO_EPILOG_A,
  CAMPAIGN_SCENARIO_EPILOG_B,
  CAMPAIGN_SCENARIO_EPILOG_C,
];

// ─── Standardní Velitelská rada (non-scenario-specific) ──────────────────────

export interface CouncilOption {
  id: string;
  nameCs: string;
  cost: number;
  descriptionCs: string;
  /** Pokud vyžaduje flag v campaign state (např. katafrakti). */
  requires?: (cs: { katafraktiUnlocked: boolean; favor: number }) => boolean;
}

export const STANDARD_COUNCIL_OPTIONS: CouncilOption[] = [
  {
    id: 'recon',
    nameCs: 'Průzkum',
    cost: 1,
    descriptionCs: 'Odhalí 1 nepřátelské nasazení — zvolíš, které.',
  },
  {
    id: 'reinforcement',
    nameCs: 'Posila',
    cost: 2,
    descriptionCs: '+1 lehká jednotka do hráčem zvoleného sektoru (levý/střed/pravý).',
  },
  {
    id: 'sector_choice',
    nameCs: 'Volba sektoru',
    cost: 2,
    descriptionCs: 'Belisarius startuje v hráčem zvoleném hexu z definovaných pozic.',
  },
  {
    id: 'spy',
    nameCs: 'Špion',
    cost: 3,
    descriptionCs: '1× za bitvu: zobrazí nepřátelovy karty v ruce.',
  },
  {
    id: 'katafrakti',
    nameCs: 'Nasazení Katafraktů',
    cost: 3,
    descriptionCs: 'Přidá jednotku katafraktů do hráčova nasazení (vyžaduje odemčení).',
    requires: cs => cs.katafraktiUnlocked,
  },
  {
    id: 'legionary_devotion',
    nameCs: 'Obětavost legionářů',
    cost: 5,
    descriptionCs: 'Ultimátní spálení tokenů: všechny tvé jednotky mají +1 kostku útoku po celé 1 kolo. 1× za bitvu.',
  },
];

// ─── Dostupnost Velitelské rady podle Favor ──────────────────────────────────

/**
 * Počet voleb dostupných v Radě podle aktuálního Favor.
 * Favor 0-1: jen 2 volby + -1 supply na start.
 * Favor 2+: všechny.
 */
export function councilChoicesAvailable(favor: number): number {
  return favor <= 1 ? 2 : 99; // 99 = bez limitu
}

/** Supply penalty na začátku bitvy podle Favor. */
export function startBattleSupplyPenalty(favor: number): number {
  return favor <= 1 ? -1 : 0;
}

/** Bonus karta v ruce po celou bitvu podle Favor. */
export function extraCardsFromFavor(favor: number): number {
  if (favor >= 6) return 1; // +1 karta + katafrakti zdarma
  if (favor >= 4) return 1;
  return 0;
}

/** Katafrakti zdarma při Favor 6 (nemusíš platit 3 tokeny). */
export function katafraktiFreeAtFavor(favor: number): boolean {
  return favor >= 6;
}

/** Logistický příjem supply mezi scénáři. */
export function supplyIncome(favor: number): number {
  return 1 + Math.floor(favor / 3);
}

// ─── Helper: získat aktuální scénář podle CampaignState ──

/**
 * Vrací scénář, který má hráč zrovna hrát (včetně branching po 6b).
 * Přijímá celý campaign state pro resolver.
 */
export function getCurrentCampaignScenario(
  indexOrState: number | {
    currentScenarioIndex: number;
    completedScenarios: { scenarioId: string; victory: boolean }[];
    favor: number;
    buceliarii: { level: number; alive: boolean };
  }
): CampaignScenarioDefinition | null {
  // Backward compat: old callers passed just an index
  if (typeof indexOrState === 'number') {
    const id = CAMPAIGN_SCENARIO_SEQUENCE[indexOrState];
    if (!id) return null;
    return ALL_CAMPAIGN_SCENARIOS.find(s => s.id === id) ?? null;
  }
  const completedIds = indexOrState.completedScenarios
    .filter(r => r.victory)
    .map(r => r.scenarioId);
  const nextId = resolveNextScenarioId({
    completedScenarios: completedIds,
    favor: indexOrState.favor,
    buceliariiLevel: indexOrState.buceliarii.level,
    buceliariiAlive: indexOrState.buceliarii.alive,
  });
  if (!nextId) return null;
  return ALL_CAMPAIGN_SCENARIOS.find(s => s.id === nextId) ?? null;
}

// ─── Secret goal evaluation context ──────────────────────────────────────────
// Každý scénář má unikátní check funkci (v campaignGoalChecker.ts).

export function isSecretGoalOfKind(_scenario: CampaignScenarioDefinition, _kind: SecretGoalKind): boolean {
  return true; // každý scénář má oba typy; implementační check v runtime
}
