import { Injectable, computed, signal } from '@angular/core';
import { Residu, ResiduDraft, ResiduEstat, ResiduId, ResiduTipus } from './residu.model';

const STORAGE_KEY = 'ecotrack:residus:v1';

function safeParse(json: string | null): unknown {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function todayIso(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function newId(): ResiduId {
  // Small, readable id (good enough for local/offline inventory)
  return `R-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function isResiduTipus(v: unknown): v is ResiduTipus {
  return v === 'Perillós' || v === 'Reciclable' || v === 'Especial';
}

function isResiduEstat(v: unknown): v is ResiduEstat {
  return v === 'Pendent' || v === 'Processat';
}

function isResidu(v: unknown): v is Residu {
  if (!v || typeof v !== 'object') return false;
  const r = v as Partial<Residu>;
  return (
    typeof r.id === 'string' &&
    typeof r.nom === 'string' &&
    isResiduTipus(r.tipus) &&
    typeof r.pesKg === 'number' &&
    Number.isFinite(r.pesKg) &&
    typeof r.dataIso === 'string' &&
    isResiduEstat(r.estat)
  );
}

function seed(): Residu[] {
  const t = todayIso();
  return [
    { id: newId(), nom: 'Bateria industrial', tipus: 'Perillós', pesKg: 12.4, dataIso: t, estat: 'Pendent' },
    { id: newId(), nom: 'Plàstic PET', tipus: 'Reciclable', pesKg: 38.2, dataIso: t, estat: 'Pendent' },
    { id: newId(), nom: 'Dissolvent', tipus: 'Especial', pesKg: 7.1, dataIso: t, estat: 'Processat' },
  ];
}

@Injectable({ providedIn: 'root' })
export class ResidusService {
  private readonly _residus = signal<Residu[]>(this.loadInitial());

  readonly residus = computed(() => this._residus());
  readonly pendents = computed(() => this._residus().filter(r => r.estat === 'Pendent'));
  readonly stats = computed(() => {
    const all = this._residus();
    const pendents = all.filter(r => r.estat === 'Pendent').length;
    const processats = all.length - pendents;
    const totalKg = all.reduce((acc, r) => acc + r.pesKg, 0);
    return { total: all.length, pendents, processats, totalKg };
  });

  add(draft: ResiduDraft): void {
    const nom = draft.nom.trim();
    if (!nom) return;
    if (!isResiduTipus(draft.tipus)) return;
    const pesKg = Number(draft.pesKg);
    if (!Number.isFinite(pesKg) || pesKg <= 0) return;
    const dataIso = draft.dataIso || todayIso();

    const residu: Residu = {
      id: newId(),
      nom,
      tipus: draft.tipus,
      pesKg,
      dataIso,
      estat: 'Pendent',
    };

    this._residus.update(curr => {
      const next = [residu, ...curr];
      this.persist(next);
      return next;
    });
  }

  setEstat(id: ResiduId, estat: ResiduEstat): void {
    this._residus.update(curr => {
      const next = curr.map(r => (r.id === id ? { ...r, estat } : r));
      this.persist(next);
      return next;
    });
  }

  toggleEstat(id: ResiduId): void {
    const current = this._residus().find(r => r.id === id);
    if (!current) return;
    this.setEstat(id, current.estat === 'Pendent' ? 'Processat' : 'Pendent');
  }

  remove(id: ResiduId): void {
    this._residus.update(curr => {
      const next = curr.filter(r => r.id !== id);
      this.persist(next);
      return next;
    });
  }

  clearAll(): void {
    this._residus.set([]);
    this.persist([]);
  }

  resetSeed(): void {
    const next = seed();
    this._residus.set(next);
    this.persist(next);
  }

  private loadInitial(): Residu[] {
    const raw = safeParse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(raw)) {
      const parsed = raw.filter(isResidu);
      if (parsed.length > 0) return parsed;
    }
    return seed();
  }

  private persist(value: Residu[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // If storage is full/blocked, we still keep in-memory state.
    }
  }
}

