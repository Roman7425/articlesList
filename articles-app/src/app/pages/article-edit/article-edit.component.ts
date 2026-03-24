import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ArticleService } from '../../services/article.service';

@Component({
  selector: 'app-article-edit',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './article-edit.component.html',
  styleUrl: './article-edit.component.scss',
})
export class ArticleEditComponent implements OnInit {
  private articleService = inject(ArticleService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  id = '';
  title = '';
  content = '';
  notFound = false;

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    const article = this.articleService.getByIdSnapshot(this.id);
    if (!article) {
      this.notFound = true;
      return;
    }
    this.title = article.title;
    this.content = article.content;
  }

  save(): void {
    if (!this.title.trim() || !this.content.trim()) return;
    this.articleService.update(this.id, this.title.trim(), this.content.trim());
    this.router.navigate(['/articles', this.id]);
  }

  cancel(): void {
    this.router.navigate(['/articles', this.id]);
  }
}
