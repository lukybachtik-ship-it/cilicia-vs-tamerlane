/**
 * Jediný zdroj pravdy pro popisy speciálních schopností a mechanik.
 * Používá se v Pravidlech (RulesModal) i ve vysvětlivkách na mapě
 * (ScenarioLegend) — obě místa čtou stejný text, takže se nemohou rozejít.
 */

export interface MechanicDesc {
  label: string;
  desc: string;
}

export const MECHANICS: Record<string, MechanicDesc> = {
  // ── Boj / pohyb (jezdecké a pěší schopnosti) ──────────────────────────────
  hitAndRun:        { label: 'Hit & Run',       desc: 'volný ústup o 1 hex po útoku' },
  breakthrough:     { label: 'Průlom',          desc: 'postup na uvolněné pole po zabití nebo zahnání obránce' },
  parthianShot:     { label: 'Parthský výstřel', desc: 'pohyb → útok → pohyb v jednom tahu' },
  charge:           { label: 'Nárazový útok',   desc: 'jízda, která se pohnula o celý svůj pohyb, útočí s +2 kostkami' },

  // ── Renesanční mechaniky ──────────────────────────────────────────────────
  pikeWall:         { label: 'Hradba kopí',     desc: 'jízda útočící na kopiníka hází o 1 kostku útoku méně (kopí tlumí nápor jízdy)' },
  volleyFire:       { label: 'Salva',           desc: '3+ mušketýrů ve stejné řadě → každý +1 kostka útoku' },
  gunpowderWeapon:  { label: 'Prachová panika', desc: 'po zásahu palnou zbraní má cíl −1 kostku útoku příští kolo' },
  setupRequired:    { label: 'Příprava děla',   desc: 'nemůže střílet v kole, kdy se pohnulo' },
  antiHeavyCavalry: { label: 'Anti-jízda',      desc: '+1 kostka proti těžké jízdě a rytířům' },
  destroysWalls:    { label: 'Ničení hradeb',   desc: 'může střílet přímo na hex hradby a probourat průchod (hradba má vlastní HP)' },
  siegeBonus:       { label: 'Obléhací bonus',  desc: '+2 kostky proti pevnosti' },

  // ── Penalizace / omezení ──────────────────────────────────────────────────
  ignoresTerrainStop:  { label: 'Průchod terénem',  desc: 'nezastavuje se při vstupu do lesa/pevnosti' },
  reducedMeleeDefense: { label: 'Slabý protiútok',  desc: '−1 kostka v protiútoku z bezprostřední blízkosti' },
  movedAttackPenalty:  { label: 'Palba po pohybu',  desc: 'pokud se v kole pohnul, útočí jen 1 kostkou' },
  meleeAttackPenalty:  { label: 'Zblízka slabší',   desc: '−1 kostka při útoku z bezprostřední blízkosti' },
};

/** Pomocník: "Label: desc" (pro tabulku jednotek v pravidlech). */
export function mechanicLine(key: keyof typeof MECHANICS | string): string {
  const m = MECHANICS[key];
  return m ? `${m.label}: ${m.desc}` : '';
}
