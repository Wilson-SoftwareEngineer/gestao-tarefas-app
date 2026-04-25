import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TarefaService } from '../../services/tarefa';
import { CategoriaService } from '../../services/categoria';
import { StatusTarefa, Tarefa, TarefaPayload } from '../../models/tarefa.model';
import { Categoria } from '../../models/categoria.model';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';

interface FormState {
  titulo: string;
  descricao: string;
  dataHora: string;
  status: StatusTarefa;
  categoriaId: number | null;
}

const emptyForm = (): FormState => ({
  titulo: '',
  descricao: '',
  dataHora: '',
  status: StatusTarefa.PENDENTE,
  categoriaId: null
});

@Component({
  selector: 'app-tarefa',
  imports: [DatePipe, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tarefa.html'
})
export class TarefaComponent implements OnInit {
  private readonly tarefaService = inject(TarefaService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  readonly tarefas = signal<Tarefa[]>([]);
  readonly categorias = signal<Categoria[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);

  readonly editandoId = signal<number | null>(null);
  readonly mostrarFormulario = signal(false);
  readonly form = signal<FormState>(emptyForm());

  readonly busca = signal('');
  readonly filtroStatus = signal<StatusTarefa | 'TODOS'>('TODOS');
  readonly filtroCategoriaId = signal<number | 'TODAS'>('TODAS');

  readonly statusList = Object.values(StatusTarefa);

  readonly estatisticas = computed(() => {
    const list = this.tarefas();
    return {
      total: list.length,
      pendentes: list.filter(t => t.status === StatusTarefa.PENDENTE).length,
      emAndamento: list.filter(t => t.status === StatusTarefa.EM_ANDAMENTO).length,
      concluidas: list.filter(t => t.status === StatusTarefa.CONCLUIDA).length
    };
  });

  readonly tarefasFiltradas = computed(() => {
    const termo = this.busca().trim().toLowerCase();
    const status = this.filtroStatus();
    const catId = this.filtroCategoriaId();
    return this.tarefas().filter(t => {
      if (status !== 'TODOS' && t.status !== status) return false;
      if (catId !== 'TODAS' && t.categoria?.id !== catId) return false;
      if (termo && !`${t.titulo} ${t.descricao ?? ''}`.toLowerCase().includes(termo)) return false;
      return true;
    });
  });

  ngOnInit(): void {
    this.carregar();
  }

  private carregar(): void {
    this.loading.set(true);
    this.tarefaService.listarTodas().subscribe({
      next: dados => {
        this.tarefas.set(dados);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
    this.categoriaService.listarTodas().subscribe(dados => this.categorias.set(dados));
  }

  abrirNova(): void {
    this.editandoId.set(null);
    this.form.set(emptyForm());
    this.mostrarFormulario.set(true);
  }

  editar(tarefa: Tarefa): void {
    this.editandoId.set(tarefa.id ?? null);
    this.form.set({
      titulo: tarefa.titulo,
      descricao: tarefa.descricao ?? '',
      dataHora: tarefa.dataHora ? tarefa.dataHora.substring(0, 16) : '',
      status: tarefa.status,
      categoriaId: tarefa.categoria?.id ?? null
    });
    this.mostrarFormulario.set(true);
  }

  cancelar(): void {
    this.editandoId.set(null);
    this.form.set(emptyForm());
    this.mostrarFormulario.set(false);
  }

  atualizarCampo<K extends keyof FormState>(campo: K, valor: FormState[K]): void {
    this.form.update(f => ({ ...f, [campo]: valor }));
  }

  salvar(): void {
    const f = this.form();
    if (!f.titulo.trim() || !f.categoriaId) {
      this.toast.error('Preencha o título e selecione uma categoria.');
      return;
    }
    const payload: TarefaPayload = {
      titulo: f.titulo.trim(),
      descricao: f.descricao,
      dataHora: f.dataHora || null,
      status: f.status,
      categoriaId: f.categoriaId
    };
    this.saving.set(true);
    const id = this.editandoId();
    const obs = id ? this.tarefaService.atualizar(id, payload) : this.tarefaService.criar(payload);
    obs.subscribe({
      next: () => {
        this.toast.success(id ? 'Tarefa atualizada.' : 'Tarefa criada.');
        this.cancelar();
        this.saving.set(false);
        this.carregar();
      },
      error: () => this.saving.set(false)
    });
  }

  alternarStatus(tarefa: Tarefa): void {
    if (!tarefa.id) return;
    const proximo = this.proximoStatus(tarefa.status);
    this.tarefaService.atualizarStatus(tarefa.id, proximo).subscribe(atualizada => {
      this.tarefas.update(list => list.map(t => t.id === atualizada.id ? atualizada : t));
      this.toast.success(`Status alterado para ${this.statusLabel(proximo)}.`);
    });
  }

  async deletar(tarefa: Tarefa): Promise<void> {
    if (!tarefa.id) return;
    const ok = await this.confirm.ask({
      title: 'Excluir tarefa',
      message: `Tem certeza que deseja excluir "${tarefa.titulo}"? Essa ação não pode ser desfeita.`,
      confirmLabel: 'Excluir',
      variant: 'danger'
    });
    if (!ok) return;
    this.tarefaService.deletar(tarefa.id).subscribe(() => {
      this.tarefas.update(list => list.filter(t => t.id !== tarefa.id));
      this.toast.success('Tarefa excluída.');
    });
  }

  statusLabel(status: StatusTarefa): string {
    switch (status) {
      case StatusTarefa.PENDENTE: return 'Pendente';
      case StatusTarefa.EM_ANDAMENTO: return 'Em andamento';
      case StatusTarefa.CONCLUIDA: return 'Concluída';
    }
  }

  statusBadgeClass(status: StatusTarefa): string {
    switch (status) {
      case StatusTarefa.PENDENTE:
        return 'bg-gradient-to-b from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/40 ring-1 ring-white/30 antialiased';
      case StatusTarefa.EM_ANDAMENTO:
        return 'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/40 ring-1 ring-white/30 antialiased';
      case StatusTarefa.CONCLUIDA:
        return 'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/40 ring-1 ring-white/30 antialiased';
    }
  }

  private proximoStatus(atual: StatusTarefa): StatusTarefa {
    switch (atual) {
      case StatusTarefa.PENDENTE: return StatusTarefa.EM_ANDAMENTO;
      case StatusTarefa.EM_ANDAMENTO: return StatusTarefa.CONCLUIDA;
      case StatusTarefa.CONCLUIDA: return StatusTarefa.PENDENTE;
    }
  }
}
