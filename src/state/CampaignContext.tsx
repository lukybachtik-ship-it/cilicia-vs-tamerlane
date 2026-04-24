import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import type {
  CampaignState,
  SecretGoalKind,
  RewardKind,
  ScenarioResult,
  PurchasedOption,
} from '../types/campaign';
import {
  FAVOR_MAX,
  FAVOR_MIN,
  SUPPLY_MAX,
  SUPPLY_MIN,
  computeBuceliariiLevel,
} from '../types/campaign';
import { supplyIncome, resolveNextScenarioId } from '../constants/campaignScenarios';
import { loadCampaign, saveCampaign, startNewCampaign, clearCampaign } from '../services/campaignStorage';

// ─── Actions ──────────────────────────────────────────────────────────────────

type CampaignAction =
  | { type: 'HYDRATE'; state: CampaignState }
  | { type: 'RESET' }
  | { type: 'SET_SECRET_GOAL'; goal: SecretGoalKind }
  | { type: 'ADD_PURCHASE'; purchase: PurchasedOption }
  | { type: 'REMOVE_PURCHASE'; purchaseId: string }
  | { type: 'CLEAR_PURCHASES' }
  | { type: 'APPLY_START_BATTLE_TICK' }  // applied when entering a battle (commit purchases, +income)
  | { type: 'COMPLETE_SCENARIO'; result: Omit<ScenarioResult, 'endedAt'> }
  | { type: 'CHOOSE_REWARD'; reward: RewardKind; xpBonus?: number }
  | { type: 'ADVANCE_TO_NEXT_SCENARIO' }
  | { type: 'UNLOCK_KATAFRAKTI' }
  | { type: 'SET_GELIMER_WOUNDED'; wounded: boolean }
  | { type: 'SET_HARDCORE'; enabled: boolean }
  | { type: 'SET_DIFFICULTY'; difficulty: 'easy' | 'normal' | 'hard' }
  | { type: 'ADD_BUCELIARII_XP'; amount: number }
  | { type: 'MARK_BUCELIARII_FALLEN' };

// ─── Reducer ──────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function campaignReducer(state: CampaignState | null, action: CampaignAction): CampaignState | null {
  if (action.type === 'HYDRATE') {
    // Backward-compat: older saved campaigns may miss `difficulty` / `hardcoreMode`
    return {
      ...action.state,
      difficulty: action.state.difficulty ?? 'normal',
      hardcoreMode: action.state.hardcoreMode ?? false,
    };
  }
  if (action.type === 'RESET') return null;
  if (!state) return null;

  switch (action.type) {
    case 'SET_SECRET_GOAL':
      return { ...state, currentSecretGoal: action.goal };

    case 'ADD_PURCHASE':
      if (state.supplyTokens < action.purchase.costPaid) return state;
      return {
        ...state,
        supplyTokens: clamp(state.supplyTokens - action.purchase.costPaid, SUPPLY_MIN, SUPPLY_MAX),
        currentPurchases: [...state.currentPurchases, action.purchase],
      };

    case 'REMOVE_PURCHASE': {
      const toRemove = state.currentPurchases.find(p => p.id === action.purchaseId);
      if (!toRemove) return state;
      return {
        ...state,
        supplyTokens: clamp(state.supplyTokens + toRemove.costPaid, SUPPLY_MIN, SUPPLY_MAX),
        currentPurchases: state.currentPurchases.filter(p => p.id !== action.purchaseId),
      };
    }

    case 'CLEAR_PURCHASES':
      return { ...state, currentPurchases: [] };

    case 'APPLY_START_BATTLE_TICK':
      // No-op — purchases are already applied on ADD_PURCHASE. Kept as hook for future.
      return state;

    case 'COMPLETE_SCENARIO': {
      const full: ScenarioResult = { ...action.result, endedAt: new Date().toISOString() };
      return {
        ...state,
        completedScenarios: [...state.completedScenarios, full],
      };
    }

    case 'CHOOSE_REWARD': {
      const last = state.completedScenarios[state.completedScenarios.length - 1];
      if (!last) return state;
      let next = {
        ...state,
        completedScenarios: state.completedScenarios.map((r, i) =>
          i === state.completedScenarios.length - 1 ? { ...r, rewardChosen: action.reward } : r
        ),
      };
      switch (action.reward) {
        case 'favor':
          next = { ...next, favor: clamp(next.favor + 2, FAVOR_MIN, FAVOR_MAX) };
          break;
        case 'supply':
          next = { ...next, supplyTokens: clamp(next.supplyTokens + 3, SUPPLY_MIN, SUPPLY_MAX) };
          break;
        case 'bukelarii_xp': {
          const extra = action.xpBonus ?? 1;
          const newXp = next.buceliarii.xp + extra;
          next = {
            ...next,
            buceliarii: {
              ...next.buceliarii,
              xp: newXp,
              level: computeBuceliariiLevel(newXp),
            },
          };
          break;
        }
      }
      // Glory / Pragma bonuses based on secret goal achievement
      if (last.secretGoalAchieved) {
        if (last.secretGoalChosen === 'glory') {
          next = { ...next, favor: clamp(next.favor + 1, FAVOR_MIN, FAVOR_MAX) };
        } else if (last.secretGoalChosen === 'pragma') {
          next = { ...next, supplyTokens: clamp(next.supplyTokens + 2, SUPPLY_MIN, SUPPLY_MAX) };
        }
      }
      // Loss of Bukelárii penalty
      if (!last.buceliariiSurvived && state.buceliarii.alive) {
        next = {
          ...next,
          favor: clamp(next.favor - 1, FAVOR_MIN, FAVOR_MAX),
          buceliarii: state.buceliarii.permanentlyLost
            ? next.buceliarii
            : {
                ...next.buceliarii,
                alive: !state.buceliarii.inRecovery, // falls → recovery first time, then permanent
                inRecovery: !state.buceliarii.inRecovery,
                recoveryScenariosRemaining: state.buceliarii.inRecovery ? 0 : 1,
                permanentlyLost: state.buceliarii.inRecovery ? true : false,
                figurineCount: 0,
              },
        };
      }
      return next;
    }

    case 'ADVANCE_TO_NEXT_SCENARIO': {
      const nextIdx = state.currentScenarioIndex + 1;
      // Apply Bukelárii recovery progression
      let buc = state.buceliarii;
      if (buc.inRecovery && buc.recoveryScenariosRemaining > 0) {
        const remaining = buc.recoveryScenariosRemaining - 1;
        if (remaining === 0) {
          buc = {
            ...buc,
            alive: true,
            inRecovery: false,
            recoveryScenariosRemaining: 0,
            figurineCount: 2,
          };
        } else {
          buc = { ...buc, recoveryScenariosRemaining: remaining };
        }
      } else if (buc.alive && !buc.inRecovery) {
        // Fully heal between scenarios
        buc = { ...buc, figurineCount: 4 };
      }
      return {
        ...state,
        currentScenarioIndex: nextIdx,
        supplyTokens: clamp(state.supplyTokens + supplyIncome(state.favor), SUPPLY_MIN, SUPPLY_MAX),
        currentSecretGoal: null,
        currentPurchases: [],
        buceliarii: buc,
      };
    }

    case 'UNLOCK_KATAFRAKTI':
      return { ...state, katafraktiUnlocked: true };

    case 'SET_GELIMER_WOUNDED':
      return { ...state, gelimerWounded: action.wounded };

    case 'SET_HARDCORE':
      return { ...state, hardcoreMode: action.enabled };

    case 'SET_DIFFICULTY':
      return { ...state, difficulty: action.difficulty };

    case 'ADD_BUCELIARII_XP': {
      const newXp = state.buceliarii.xp + action.amount;
      return {
        ...state,
        buceliarii: {
          ...state.buceliarii,
          xp: newXp,
          level: computeBuceliariiLevel(newXp),
        },
      };
    }

    case 'MARK_BUCELIARII_FALLEN':
      return {
        ...state,
        buceliarii: {
          ...state.buceliarii,
          figurineCount: 0,
          // alive/inRecovery will be flipped in CHOOSE_REWARD/ADVANCE_TO_NEXT handlers
        },
      };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface CampaignContextValue {
  campaign: CampaignState | null;
  isLoading: boolean;
  isCampaignActive: boolean;
  dispatch: React.Dispatch<CampaignAction>;
  startNew: () => Promise<void>;
  reset: () => Promise<void>;
  reload: () => Promise<void>;
  isScenarioComplete: () => boolean;
  isCampaignFinished: () => boolean;
}

const CampaignContext = createContext<CampaignContextValue | null>(null);

export function CampaignProvider({ children }: { children: React.ReactNode }) {
  const [campaign, dispatch] = useReducer(campaignReducer, null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Hydrate on mount
  useEffect(() => {
    (async () => {
      try {
        const loaded = await loadCampaign();
        if (loaded) dispatch({ type: 'HYDRATE', state: loaded });
      } catch (e) {
        console.warn('[Campaign] hydration failed:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Autosave whenever campaign changes
  useEffect(() => {
    if (!campaign) return;
    saveCampaign(campaign).catch(e => console.warn('[Campaign] autosave failed:', e));
  }, [campaign]);

  const startNew = useCallback(async () => {
    const fresh = await startNewCampaign();
    dispatch({ type: 'HYDRATE', state: fresh });
  }, []);

  const reset = useCallback(async () => {
    await clearCampaign();
    dispatch({ type: 'RESET' });
  }, []);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const loaded = await loadCampaign();
      if (loaded) dispatch({ type: 'HYDRATE', state: loaded });
      else dispatch({ type: 'RESET' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const isScenarioComplete = useCallback(() => {
    if (!campaign) return false;
    return campaign.completedScenarios.length >= campaign.currentScenarioIndex + 1;
  }, [campaign]);

  const isCampaignFinished = useCallback(() => {
    if (!campaign) return false;
    const nextId = resolveNextScenarioId({
      completedScenarios: campaign.completedScenarios.filter(r => r.victory).map(r => r.scenarioId),
      favor: campaign.favor,
      buceliariiLevel: campaign.buceliarii.level,
      buceliariiAlive: campaign.buceliarii.alive,
    });
    return nextId === null;
  }, [campaign]);

  const value: CampaignContextValue = {
    campaign,
    isLoading,
    isCampaignActive: !!campaign,
    dispatch,
    startNew,
    reset,
    reload,
    isScenarioComplete,
    isCampaignFinished,
  };

  return <CampaignContext.Provider value={value}>{children}</CampaignContext.Provider>;
}

export function useCampaign(): CampaignContextValue {
  const ctx = useContext(CampaignContext);
  if (!ctx) throw new Error('useCampaign must be used within CampaignProvider');
  return ctx;
}
