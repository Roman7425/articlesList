import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Annotation } from '../models/annotation.model';

@Injectable({ providedIn: 'root' })
export class AnnotationService {
  private readonly STORAGE_KEY = 'annotations';
  private annotationsSubject = new BehaviorSubject<Annotation[]>(this.load());

  annotations$ = this.annotationsSubject.asObservable();

  getByArticleId(articleId: string): Observable<Annotation[]> {
    return this.annotations$.pipe(
      map(list => list.filter(a => a.articleId === articleId))
    );
  }

  add(annotation: Omit<Annotation, 'id'>): void {
    const next = [...this.annotationsSubject.value, { ...annotation, id: crypto.randomUUID() }];
    this.save(next);
    this.annotationsSubject.next(next);
  }

  remove(id: string): void {
    const next = this.annotationsSubject.value.filter(a => a.id !== id);
    this.save(next);
    this.annotationsSubject.next(next);
  }

  removeByArticleId(articleId: string): void {
    const next = this.annotationsSubject.value.filter(a => a.articleId !== articleId);
    this.save(next);
    this.annotationsSubject.next(next);
  }

  removeOutOfBoundsAnnotations(articleId: string, contentLength: number): void {
    const next = this.annotationsSubject.value.filter(
      a => a.articleId !== articleId || a.endOffset <= contentLength
    );
    this.save(next);
    this.annotationsSubject.next(next);
  }

  private load(): Annotation[] {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) ?? '[]');
    } catch {
      return [];
    }
  }

  private save(list: Annotation[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
  }
}
