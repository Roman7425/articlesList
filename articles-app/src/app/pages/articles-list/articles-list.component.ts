import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AsyncPipe, DatePipe } from '@angular/common';
import { ArticleService } from '../../services/article.service';

@Component({
  selector: 'app-articles-list',
  standalone: true,
  imports: [AsyncPipe, DatePipe],
  templateUrl: './articles-list.component.html',
  styleUrl: './articles-list.component.scss',
})
export class ArticlesListComponent {
  private articleService = inject(ArticleService);
  private router = inject(Router);

  articles$ = this.articleService.articles$;

  goToCreate(): void {
    this.router.navigate(['/articles/new']);
  }

  goToView(id: string): void {
    this.router.navigate(['/articles', id]);
  }

  delete(event: Event, id: string): void {
    event.stopPropagation();
    if (confirm('Удалить статью?')) {
      this.articleService.delete(id);
    }
  }
}
