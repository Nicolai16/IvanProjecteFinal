export type ResiduTipus = 'Perillós' | 'Reciclable' | 'Especial';
export type ResiduEstat = 'Pendent' | 'Processat';

export type ResiduId = string;

export interface Residu {
  id: ResiduId;
  nom: string;
  tipus: ResiduTipus;
  pesKg: number;
  dataIso: string; // yyyy-mm-dd
  estat: ResiduEstat;
}

export interface ResiduDraft {
  nom: string;
  tipus: ResiduTipus;
  pesKg: number;
  dataIso: string;
}

