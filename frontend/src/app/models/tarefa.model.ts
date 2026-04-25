import { Categoria } from './categoria.model';

export enum StatusTarefa {
    PENDENTE = 'PENDENTE',
    EM_ANDAMENTO = 'EM_ANDAMENTO',
    CONCLUIDA = 'CONCLUIDA'
}

export interface Tarefa {
    id?: number;
    titulo: string;
    descricao: string;
    dataHora: string;
    status: StatusTarefa;
    categoria?: Categoria;
}

export interface TarefaPayload {
    titulo: string;
    descricao: string;
    dataHora: string | null;
    status: StatusTarefa;
    categoriaId: number;
}

export interface Estatisticas {
    total: number;
    pendentes: number;
    emAndamento: number;
    concluidas: number;
}
