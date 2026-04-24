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
  // Phase 3 placeholders:
  // 'roma_6a',
  // 'roma_6b',
];

// ─── Jednotlivé scénáře ──────────────────────────────────────────────────────

export const CAMPAIGN_SCENARIO_DARA: CampaignScenarioDefinition = {
  id: 'dara',
  nameCs: 'Bitva u Dary',
  contextCs: 'Rok 530. Východní hranice říše — perská vojska krále Kavadha pochodují proti pevnosti Dara. Belisarius, čerstvě jmenovaný magister militum, má hájit čelo imperia.',
  chronicleCs: '„Řím opět potřebuje hrdinu. Na co čeká mladý generál?" — Justinián I. ve svém listu Belisariovi.',
  chronicleLat: '«Roma rursum heroem desiderat. Quid exspectat iuvenis dux?»',
  mapLabel: 'Dara',
  mapCoords: { x: 760, y: 360 },
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
  mapCoords: { x: 615, y: 240 },
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
  mapCoords: { x: 400, y: 460 },
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
  mapCoords: { x: 400, y: 480 },
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
  mapCoords: { x: 520, y: 330 },
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

export const ALL_CAMPAIGN_SCENARIOS: CampaignScenarioDefinition[] = [
  CAMPAIGN_SCENARIO_DARA,
  CAMPAIGN_SCENARIO_NIKA,
  CAMPAIGN_SCENARIO_AD_DECIMUM,
  CAMPAIGN_SCENARIO_TRICAMARUM,
  CAMPAIGN_SCENARIO_NEAPOL,
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

// ─── Helper: získat aktuální scénář podle CampaignState.currentScenarioIndex ──

export function getCurrentCampaignScenario(index: number): CampaignScenarioDefinition | null {
  const id = CAMPAIGN_SCENARIO_SEQUENCE[index];
  if (!id) return null;
  return ALL_CAMPAIGN_SCENARIOS.find(s => s.id === id) ?? null;
}

// ─── Secret goal evaluation context ──────────────────────────────────────────
// Každý scénář má unikátní check funkci (v campaignGoalChecker.ts).

export function isSecretGoalOfKind(_scenario: CampaignScenarioDefinition, _kind: SecretGoalKind): boolean {
  return true; // každý scénář má oba typy; implementační check v runtime
}
