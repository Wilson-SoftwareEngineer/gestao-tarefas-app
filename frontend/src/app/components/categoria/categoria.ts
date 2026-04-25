import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CategoriaService } from '../../services/categoria';
import { Categoria } from '../../models/categoria.model';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';

const novaCategoria = (): Categoria => ({ nome: '', corHex: '#6366f1' });

@Component({
  selector: 'app-categoria',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './categoria.html'
})
export class CategoriaComponent implements OnInit {
  private readonly categoriaService = inject(CategoriaService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  readonly categorias = signal<Categoria[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly form = signal<Categoria>(novaCategoria());
  readonly editandoId = signal<number | null>(null);

  ngOnInit(): void {
    this.carregar();
  }

  private carregar(): void {
    this.loading.set(true);
    this.categoriaService.listarTodas().subscribe({
      next: dados => {
        this.categorias.set(dados);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  atualizarCampo<K extends keyof Categoria>(campo: K, valor: Categoria[K]): void {
    this.form.update(f => ({ ...f, [campo]: valor }));
  }

  salvar(): void {
    const f = this.form();
    if (!f.nome.trim()) {
      this.toast.error('Informe o nome da categoria.');
      return;
    }
    this.saving.set(true);
    const id = this.editandoId();
    const obs = id
      ? this.categoriaService.atualizar(id, f)
      : this.categoriaService.criar(f);
    obs.subscribe({
      next: () => {
        this.toast.success(id ? 'Categoria atualizada.' : 'Categoria criada.');
        this.cancelar();
        this.saving.set(false);
        this.carregar();
      },
      error: () => this.saving.set(false)
    });
  }

  editar(categoria: Categoria): void {
    this.editandoId.set(categoria.id ?? null);
    this.form.set({ ...categoria });
  }

  cancelar(): void {
    this.editandoId.set(null);
    this.form.set(novaCategoria());
  }

  async deletar(categoria: Categoria): Promise<void> {
    if (!categoria.id) return;
    const ok = await this.confirm.ask({
      title: 'Excluir categoria',
      message: `Tem certeza que deseja excluir "${categoria.nome}"? Tarefas associadas podem ficar sem categoria.`,
      confirmLabel: 'Excluir',
      variant: 'danger'
    });
    if (!ok) return;
    this.categoriaService.deletar(categoria.id).subscribe(() => {
      this.categorias.update(list => list.filter(c => c.id !== categoria.id));
      this.toast.success('Categoria excluída.');
    });
  }
}
