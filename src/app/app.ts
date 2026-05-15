import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ResidusService } from './residus/residus.service';
import { ResiduTipus } from './residus/residu.model';

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly fb = inject(FormBuilder);
  protected readonly residusSvc = inject(ResidusService);

  protected readonly title = signal('EcoTrack');
  protected readonly showPendentsOnly = signal(false);

  protected readonly tipusOptions: readonly ResiduTipus[] = ['Perillós', 'Reciclable', 'Especial'] as const;

  protected readonly form = this.fb.nonNullable.group({
    nom: ['', [Validators.required, Validators.minLength(2)]],
    tipus: ['Reciclable' as ResiduTipus, [Validators.required]],
    pesKg: [1, [Validators.required, Validators.min(0.01)]],
    dataIso: [this.todayIso(), [Validators.required]],
  });

  protected readonly llista = computed(() =>
    this.showPendentsOnly() ? this.residusSvc.pendents() : this.residusSvc.residus()
  );

  protected togglePendentsOnly(): void {
    this.showPendentsOnly.update(v => !v);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.residusSvc.add(v);
    this.form.patchValue({ nom: '', pesKg: 1, dataIso: this.todayIso() });
  }

  protected toggleEstat(id: string): void {
    this.residusSvc.toggleEstat(id);
  }

  protected remove(id: string): void {
    this.residusSvc.remove(id);
  }

  protected resetSeed(): void {
    this.residusSvc.resetSeed();
  }

  protected clearAll(): void {
    this.residusSvc.clearAll();
  }

  private todayIso(): string {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }
}
