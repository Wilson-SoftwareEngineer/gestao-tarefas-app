import { Routes } from '@angular/router';
import { CategoriaComponent } from './components/categoria/categoria';
import { TarefaComponent } from './components/tarefa/tarefa';

export const routes: Routes = [
  { path: 'categorias', component: CategoriaComponent },
  { path: 'tarefas', component: TarefaComponent },
  { path: '', redirectTo: '/tarefas', pathMatch: 'full' } 
];