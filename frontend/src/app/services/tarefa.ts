import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Estatisticas, StatusTarefa, Tarefa, TarefaPayload } from '../models/tarefa.model';

@Injectable({
  providedIn: 'root'
})
export class TarefaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/tarefas`;

  listarTodas(): Observable<Tarefa[]> {
    return this.http.get<Tarefa[]>(this.apiUrl);
  }

  criar(payload: TarefaPayload): Observable<Tarefa> {
    return this.http.post<Tarefa>(this.apiUrl, payload);
  }

  atualizar(id: number, payload: TarefaPayload): Observable<Tarefa> {
    return this.http.put<Tarefa>(`${this.apiUrl}/${id}`, payload);
  }

  atualizarStatus(id: number, status: StatusTarefa): Observable<Tarefa> {
    return this.http.patch<Tarefa>(`${this.apiUrl}/${id}/status`, { status });
  }

  deletar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  estatisticas(): Observable<Estatisticas> {
    return this.http.get<Estatisticas>(`${this.apiUrl}/estatisticas`);
  }
}
