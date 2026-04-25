import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  return next(req).pipe(
    catchError(err => {
      const apiMessage = err?.error?.message;
      const fieldErrors = err?.error?.details
        ? Object.values(err.error.details).join(' • ')
        : null;
      const fallback = err?.status === 0
        ? 'Não foi possível conectar ao servidor.'
        : `Erro ${err?.status ?? ''}`.trim();
      toast.error(fieldErrors || apiMessage || fallback);
      return throwError(() => err);
    })
  );
};
