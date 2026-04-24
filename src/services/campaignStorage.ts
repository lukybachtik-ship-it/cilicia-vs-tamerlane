import { supabase } from '../lib/supabase';
import type { CampaignState } from '../types/campaign';
import { makeInitialCampaignState } from '../types/campaign';

/**
 * Persistence pro kampaň — Supabase je primární, localStorage je fallback
 * (když chybí env vars nebo není síť).
 *
 * Schema (musí existovat v Supabase):
 *
 *   create table if not exists campaigns (
 *     user_id text not null,
 *     slot_id int not null default 0,
 *     campaign_version int not null default 1,
 *     state jsonb not null,
 *     created_at timestamptz default now(),
 *     updated_at timestamptz default now(),
 *     primary key (user_id, slot_id)
 *   );
 *   create index if not exists campaigns_user_idx on campaigns(user_id);
 *
 * Pro MVP používáme anonymní user_id uložený v localStorage
 * (`ctg_anon_user_id`); do budoucna lze napojit auth.
 */

const LS_KEY = 'ctg_campaign_state_v1';
const ANON_USER_KEY = 'ctg_anon_user_id';
const DEFAULT_SLOT = 0;

function getAnonUserId(): string {
  try {
    let id = localStorage.getItem(ANON_USER_KEY);
    if (!id) {
      id = 'anon_' + crypto.randomUUID().slice(0, 12);
      localStorage.setItem(ANON_USER_KEY, id);
    }
    return id;
  } catch {
    return 'anon_fallback';
  }
}

function saveLocally(state: CampaignState): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('[campaignStorage] localStorage save failed:', e);
  }
}

function loadLocally(): CampaignState | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CampaignState;
    if (parsed.campaignVersion !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function supabaseAvailable(): Promise<boolean> {
  try {
    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
    return !!url && !!key;
  } catch {
    return false;
  }
}

/** Načte kampaň — Supabase first, fallback localStorage. Vrátí null pokud žádná není. */
export async function loadCampaign(): Promise<CampaignState | null> {
  const userId = getAnonUserId();
  if (await supabaseAvailable()) {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('state, campaign_version')
        .eq('user_id', userId)
        .eq('slot_id', DEFAULT_SLOT)
        .maybeSingle();
      if (error) {
        console.warn('[campaignStorage] supabase load error:', error.message);
      } else if (data && (data as { campaign_version?: number }).campaign_version === 1) {
        return (data as { state: CampaignState }).state;
      }
    } catch (e) {
      console.warn('[campaignStorage] supabase load failed:', e);
    }
  }
  return loadLocally();
}

/** Uloží kampaň — Supabase + localStorage (pro rychlý offline přístup). */
export async function saveCampaign(state: CampaignState): Promise<void> {
  const now = new Date().toISOString();
  const toSave: CampaignState = { ...state, updatedAt: now };
  saveLocally(toSave);

  if (!(await supabaseAvailable())) return;
  const userId = getAnonUserId();
  try {
    const { error } = await supabase.from('campaigns').upsert(
      {
        user_id: userId,
        slot_id: DEFAULT_SLOT,
        campaign_version: 1,
        state: toSave,
        updated_at: now,
      },
      { onConflict: 'user_id,slot_id' }
    );
    if (error) console.warn('[campaignStorage] supabase save error:', error.message);
  } catch (e) {
    console.warn('[campaignStorage] supabase save failed:', e);
  }
}

/** Smaže kampaň (start new). */
export async function clearCampaign(): Promise<void> {
  try {
    localStorage.removeItem(LS_KEY);
  } catch { /* ignore */ }
  if (!(await supabaseAvailable())) return;
  const userId = getAnonUserId();
  try {
    await supabase.from('campaigns').delete().eq('user_id', userId).eq('slot_id', DEFAULT_SLOT);
  } catch (e) {
    console.warn('[campaignStorage] supabase delete failed:', e);
  }
}

/** Založí novou kampaň (deletes any existing + creates fresh). */
export async function startNewCampaign(): Promise<CampaignState> {
  await clearCampaign();
  const id = crypto.randomUUID();
  const fresh = makeInitialCampaignState(id);
  await saveCampaign(fresh);
  return fresh;
}
