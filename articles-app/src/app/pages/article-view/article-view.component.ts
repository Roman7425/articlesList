import { Component, ElementRef, HostListener, inject, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { combineLatest } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ArticleService } from '../../services/article.service';
import { AnnotationService } from '../../services/annotation.service';
import { Article } from '../../models/article.model';
import { Annotation } from '../../models/annotation.model';

@Component({
  selector: 'app-article-view',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './article-view.component.html',
  styleUrl: './article-view.component.scss',
})
export class ArticleViewComponent {
  @ViewChild('contentRef') private contentRef!: ElementRef<HTMLDivElement>;

  private articleService = inject(ArticleService);
  private annotationService = inject(AnnotationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);

  protected article: Article | null = null;
  protected annotations: Annotation[] = [];
  protected renderedContent: SafeHtml = '';
  protected notFound = false;

  protected readonly colors = ['#ffeb3b', '#a5d6a7', '#90caf9', '#ef9a9a', '#ce93d8', '#ffe0b2'];
  private readonly TRUNCATE_MAX = 40;

  protected popup = {
    show: false,
    x: 0,
    y: 0,
    start: 0,
    end: 0,
    text: '',
    color: '#ffeb3b',
    comment: '',
  };

  protected tooltip = { show: false, x: 0, y: 0, text: '' };

  private justOpenedPopup = false;

  constructor() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';

    combineLatest([
      this.articleService.getById(id),
      this.annotationService.getByArticleId(id),
    ])
      .pipe(takeUntilDestroyed())
      .subscribe(([article, annotations]) => {
        this.article = article ?? null;
        this.notFound = !article;
        this.annotations = annotations;
        this.updateRenderedContent();
      });
  }

  protected goBack(): void {
    this.router.navigate(['/articles']);
  }

  protected goToEdit(): void {
    if (this.article) {
      this.router.navigate(['/articles', this.article.id, 'edit']);
    }
  }

  protected truncateText(text: string): string {
    return text.length > this.TRUNCATE_MAX ? text.slice(0, this.TRUNCATE_MAX) + '…' : text;
  }

  protected onMouseUp(): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const contentEl = this.contentRef?.nativeElement;
    if (!contentEl || !contentEl.contains(range.commonAncestorContainer)) return;

    const start = this.getAbsoluteOffset(contentEl, range.startContainer, range.startOffset);
    const end = this.getAbsoluteOffset(contentEl, range.endContainer, range.endOffset);
    if (start >= end) return;

    const rect = range.getBoundingClientRect();
    const POPUP_HEIGHT = 230;
    const POPUP_WIDTH = 300;
    const MARGIN = 8;

    const x = Math.max(
      POPUP_WIDTH / 2 + MARGIN,
      Math.min(rect.left + rect.width / 2, window.innerWidth - POPUP_WIDTH / 2 - MARGIN)
    );
    const y = rect.bottom + MARGIN + POPUP_HEIGHT > window.innerHeight
      ? rect.top - POPUP_HEIGHT - MARGIN
      : rect.bottom + MARGIN;

    this.popup = {
      show: true,
      x,
      y,
      start,
      end,
      text: selection.toString(),
      color: this.popup.color,
      comment: '',
    };

    this.justOpenedPopup = true;
    setTimeout(() => { this.justOpenedPopup = false; }, 0);
    this.updateRenderedContent();
  }

  protected onContentMouseOver(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const annotationId = target.dataset['annotationId'];
    if (annotationId) {
      const ann = this.annotations.find(a => a.id === annotationId);
      if (ann?.comment) {
        const rect = target.getBoundingClientRect();
        this.tooltip = {
          show: true,
          x: rect.left + rect.width / 2,
          y: rect.top - 8,
          text: ann.comment,
        };
        return;
      }
    }
    this.tooltip.show = false;
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (this.justOpenedPopup) return;
    if (!(event.target as HTMLElement).closest('.annotation-popup')) {
      this.closePopup();
    }
  }

  protected saveAnnotation(): void {
    if (!this.article) return;
    this.popup.show = false;
    this.annotationService.add({
      articleId: this.article.id,
      selectedText: this.popup.text,
      comment: this.popup.comment,
      color: this.popup.color,
      startOffset: this.popup.start,
      endOffset: this.popup.end,
    });
    window.getSelection()?.removeAllRanges();
  }

  protected deleteAnnotation(id: string): void {
    this.annotationService.remove(id);
  }

  protected closePopup(): void {
    this.popup.show = false;
    this.updateRenderedContent();
  }

  private updateRenderedContent(): void {
    if (!this.article) { this.renderedContent = ''; return; }
    const pending = this.popup.show ? { start: this.popup.start, end: this.popup.end } : null;
    const html = this.buildHtml(this.article.content, this.annotations, pending);
    this.renderedContent = this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private buildHtml(content: string, annotations: Annotation[], pending?: { start: number, end: number } | null): string {
    const allItems: Array<Annotation | { id: '__pending__', startOffset: number, endOffset: number }> = [...annotations];
    if (pending) {
      allItems.push({ id: '__pending__', startOffset: pending.start, endOffset: pending.end });
    }

    const sorted = allItems
      .filter(a => a.startOffset < content.length && a.endOffset > a.startOffset)
      .sort((a, b) => a.startOffset - b.startOffset);

    let html = '';
    let pos = 0;

    for (const ann of sorted) {
      if (ann.startOffset < pos) continue;
      if (ann.startOffset > pos) {
        html += this.escapeHtml(content.slice(pos, ann.startOffset));
      }
      const end = Math.min(ann.endOffset, content.length);
      if (ann.id === '__pending__') {
        html += `<span class="highlight-pending">${this.escapeHtml(content.slice(ann.startOffset, end))}</span>`;
      } else {
        const a = ann as Annotation;
        const style = a.comment
          ? `background-color:${this.escapeAttr(a.color)}`
          : `border-bottom: 2px solid ${this.escapeAttr(a.color)}`;
        html += `<span class="highlight" style="${style}" data-annotation-id="${this.escapeAttr(a.id)}">${this.escapeHtml(content.slice(ann.startOffset, end))}</span>`;
      }
      pos = end;
    }

    if (pos < content.length) {
      html += this.escapeHtml(content.slice(pos));
    }

    return html;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private escapeAttr(text: string): string {
    return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  private getAbsoluteOffset(container: HTMLElement, targetNode: Node, offsetInNode: number): number {
    let total = 0;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (node === targetNode) return total + offsetInNode;
      total += node.textContent?.length ?? 0;
    }
    return total;
  }
}
