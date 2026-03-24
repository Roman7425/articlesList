import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AsyncPipe, DatePipe } from '@angular/common';
import { ArticleService } from '../../services/article.service';
import { AnnotationService } from '../../services/annotation.service';

const DELETE_CONFIRMATION = 'Удалить статью?';

@Component({
  selector: 'app-articles-list',
  standalone: true,
  imports: [AsyncPipe, DatePipe],
  templateUrl: './articles-list.component.html',
  styleUrl: './articles-list.component.scss',
})
export class ArticlesListComponent {
  private articleService = inject(ArticleService);
  private annotationService = inject(AnnotationService);
  private router = inject(Router);

  protected articles$ = this.articleService.articles$;

  protected goToCreate(): void {
    this.router.navigate(['/articles/new']);
  }

  protected goToView(id: string): void {
    this.router.navigate(['/articles', id]);
  }

  protected delete(event: Event, id: string): void {
    event.stopPropagation();
    if (confirm(DELETE_CONFIRMATION)) {
      this.articleService.delete(id);
      this.annotationService.removeByArticleId(id);
    }
  }
}
