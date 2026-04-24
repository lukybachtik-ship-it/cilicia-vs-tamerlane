/**
 * Belisariova kampaň — datový model pro perzistentní stav mezi scénáři.
 * Ukládá se do Supabase (fallback localStorage). Jeden slot per uživatel.
 */

export type SecretGoalKind = 'glory' | 'pragma';
export type RewardKind = 'favor' | 'supply' | 'bukelarii_xp';

/** Bukelárii — perzistentní elitní jednotka s XP, rostoucí úrovní a rekonvalescencí po pádu. */
export interface BuceliariState {
  /** False pokud padli na 0 figurek a nejsou ještě vzkříšeni; true jinak. */
  alive: boolean;
  /** Počet figurek na začátku příští bitvy (0–4, po návratu 2). */
  figurineCount: number;
  /** Kumulativní XP z kampaně (neresetuje se mezi scénáři). */
  xp: number;
  /** Úroveň 1–4, odvozená z XP prahů. */
  level: 1 | 2 | 3 | 4;
  /** Po pádu vynechávají 1 scénář. */
  inRecovery: boolean;
  /** Zbývající počet scénářů v rekonvalescenci. */
  recoveryScenariosRemaining: number;
  /** True pokud už padli podruhé — pak je v dalších bitvách nahrazuje běžná těžká jízda. */
  permanentlyLost: boolean;
}

/** Záznam výsledku jednoho scénáře. */
export interface ScenarioResult {
  scenarioId: string;
  victory: boolean;
  secretGoalChosen: SecretGoalKind | null;
  secretGoalAchieved: boolean;
  rewardChosen: RewardKind | null;
  buceliariiSurvived: boolean;
  /** Počet XP získaných v této bitvě. */
  buceliariiXpEarned: number;
  /** Zničené nepřátelské jednotky (informativní). */
  enemiesDestroyed: number;
  /** Ztracené vlastní jednotky. */
  lossesSuffered: number;
  endedAt: string; // ISO
}

/** Nákupy z Velitelské rady aplikované do aktuálního scénáře. */
export interface PurchasedOption {
  id: string;               // 'scout', 'reinforcement', 'sector_choice', 'spy', 'katafrakti', scenarioExclusive
  costPaid: number;
  details?: Record<string, unknown>;
}

/** Kompletní stav kampaně. */
export interface CampaignState {
  campaignVersion: 1;
  campaignId: string;         // uuid v4
  createdAt: string;          // ISO
  updatedAt: string;          // ISO

  /** 0-based index do CAMPAIGN_SCENARIO_SEQUENCE. */
  currentScenarioIndex: number;

  /** Ekonomika. */
  favor: number;               // 0–6 (start 3)
  supplyTokens: number;        // 0–10 (start 5)

  /** Persistent unit. */
  buceliarii: BuceliariState;

  /** Globální stavy. */
  katafraktiUnlocked: boolean;
  gelimerWounded: boolean;

  /** Historie. */
  completedScenarios: ScenarioResult[];

  /** Stav aktuálního scénáře (před bitvou) — nastavuje se ve Velitelské radě. */
  currentSecretGoal: SecretGoalKind | null;
  currentPurchases: PurchasedOption[];

  /** Volitelný čestný mód (Fáze 3). */
  hardcoreMode: boolean;
}

// ─── Konstanty a odvozené hodnoty ────────────────────────────────────────────

export const FAVOR_MIN = 0;
export const FAVOR_MAX = 6;
export const SUPPLY_MIN = 0;
export const SUPPLY_MAX = 10;

export const START_FAVOR = 3;
export const START_SUPPLY = 5;

/** XP prahy pro úrovně Bukelárií (XP kumulativní od začátku kampaně). */
export const BUCELIARII_XP_THRESHOLDS: Record<1 | 2 | 3 | 4, number> = {
  1: 0,
  2: 2,
  3: 4,
  4: 7,
};

export function computeBuceliariiLevel(xp: number): 1 | 2 | 3 | 4 {
  if (xp >= 7) return 4;
  if (xp >= 4) return 3;
  if (xp >= 2) return 2;
  return 1;
}

/** Diegetic text pro Favor. */
export function favorText(favor: number): string {
  if (favor <= 1) return 'Justinián ti nedůvěřuje';
  if (favor <= 3) return 'Justinián tě toleruje';
  if (favor <= 5) return 'Justinián ti důvěřuje';
  return 'Justinián si tě cení nade vše';
}

/** Výchozí stav pro nově založenou kampaň. */
export function makeInitialCampaignState(campaignId: string): CampaignState {
  const now = new Date().toISOString();
  return {
    campaignVersion: 1,
    campaignId,
    createdAt: now,
    updatedAt: now,
    currentScenarioIndex: 0,
    favor: START_FAVOR,
    supplyTokens: START_SUPPLY,
    buceliarii: {
      alive: true,
      figurineCount: 4,
      xp: 0,
      level: 1,
      inRecovery: false,
      recoveryScenariosRemaining: 0,
      permanentlyLost: false,
    },
    katafraktiUnlocked: false,
    gelimerWounded: false,
    completedScenarios: [],
    currentSecretGoal: null,
    currentPurchases: [],
    hardcoreMode: false,
  };
}
