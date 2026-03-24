import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ArticleService } from '../../services/article.service';

@Component({
  selector: 'app-article-create',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './article-create.component.html',
  styleUrl: './article-create.component.scss',
})
export class ArticleCreateComponent {
  private articleService = inject(ArticleService);
  private router = inject(Router);

  title = '';
  content = '';

  save(): void {
    if (!this.title.trim() || !this.content.trim()) return;
    const article = this.articleService.create(this.title.trim(), this.content.trim());
    this.router.navigate(['/articles', article.id]);
  }

  cancel(): void {
    this.router.navigate(['/articles']);
  }
}
