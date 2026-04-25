import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
}

interface ConfirmState extends ConfirmOptions {
  resolve: (ok: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly state = signal<ConfirmState | null>(null);

  ask(options: ConfirmOptions): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      this.state.set({
        confirmLabel: 'Confirmar',
        cancelLabel: 'Cancelar',
        variant: 'primary',
        ...options,
        resolve
      });
    });
  }

  respond(ok: boolean): void {
    const current = this.state();
    if (current) {
      current.resolve(ok);
      this.state.set(null);
    }
  }
}
