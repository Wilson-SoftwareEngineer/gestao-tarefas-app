import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ConfirmService } from '../../services/confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (state(); as s) {
      <div class="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade">
        <div class="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 animate-pop">
          <div class="p-6">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">{{ s.title }}</h3>
            <p class="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{{ s.message }}</p>
          </div>
          <div class="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 rounded-b-2xl">
            <button
              (click)="respond(false)"
              class="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              {{ s.cancelLabel }}
            </button>
            <button
              (click)="respond(true)"
              [class]="confirmClass()"
              class="px-4 py-2 rounded-lg text-sm font-medium text-white transition shadow-sm">
              {{ s.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .animate-fade { animation: fade 150ms ease-out; }
    .animate-pop { animation: pop 180ms ease-out; }
    @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes pop { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class ConfirmDialogComponent {
  private readonly service = inject(ConfirmService);
  readonly state = this.service.state;
  readonly confirmClass = computed(() => {
    return this.state()?.variant === 'danger'
      ? 'bg-rose-600 hover:bg-rose-700'
      : 'bg-indigo-600 hover:bg-indigo-700';
  });

  respond(ok: boolean): void { this.service.respond(ok); }
}
