/**
 * Centrální branding — jediné místo, kde se mění název hry a přístup
 * do skrytého vývojářského režimu.
 */

export const APP_TITLE = 'Bojiště času';
export const APP_SUBTITLE = 'Taktická tahová válečná hra';

/**
 * Neutrální fallback názvy stran. Skutečné názvy definuje každý scénář
 * přes ciliciaLabel/tamerlaneLabel — tyhle se zobrazí jen tam, kde scénář
 * není známý (např. výběr strany před volbou scénáře).
 */
export const BLUE_LABEL_FALLBACK = 'Modrá strana';
export const RED_LABEL_FALLBACK = 'Červená strana';

/**
 * Heslo pro skrytý dev režim (kampaň + neveřejné scénáře).
 * Pozn.: jde o „táborovou“ úroveň zabezpečení — heslo je v bundlu čitelné,
 * chrání před běžným hráčem, ne před odhodlaným vývojářem.
 */
export const ADMIN_PASSWORD = 'kronikar';
const ADMIN_STORAGE_KEY = 'bc_admin_unlocked';

export function isAdminUnlocked(): boolean {
  try {
    return localStorage.getItem(ADMIN_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function unlockAdmin(password: string): boolean {
  if (password.trim().toLowerCase() === ADMIN_PASSWORD) {
    try {
      localStorage.setItem(ADMIN_STORAGE_KEY, '1');
    } catch {
      /* private mode — unlock platí jen pro tento render */
    }
    return true;
  }
  return false;
}

export function lockAdmin(): void {
  try {
    localStorage.removeItem(ADMIN_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
