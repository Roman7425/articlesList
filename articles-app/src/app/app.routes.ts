import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'articles', pathMatch: 'full' },
  {
    path: 'articles',
    loadComponent: () =>
      import('./pages/articles-list/articles-list.component').then(m => m.ArticlesListComponent),
  },
  {
    path: 'articles/new',
    loadComponent: () =>
      import('./pages/article-create/article-create.component').then(m => m.ArticleCreateComponent),
  },
  {
    path: 'articles/:id',
    loadComponent: () =>
      import('./pages/article-view/article-view.component').then(m => m.ArticleViewComponent),
  },
  {
    path: 'articles/:id/edit',
    loadComponent: () =>
      import('./pages/article-edit/article-edit.component').then(m => m.ArticleEditComponent),
  },
];
