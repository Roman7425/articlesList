import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Article } from '../models/article.model';

@Injectable({ providedIn: 'root' })
export class ArticleService {
  private readonly STORAGE_KEY = 'articles';
  private articlesSubject = new BehaviorSubject<Article[]>(this.loadFromStorage());

  articles$ = this.articlesSubject.asObservable();

  private loadFromStorage(): Article[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveToStorage(articles: Article[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(articles));
  }

  getById(id: string): Observable<Article | undefined> {
    return this.articles$.pipe(map(articles => articles.find(a => a.id === id)));
  }

  create(title: string, content: string): Article {
    const article: Article = {
      id: crypto.randomUUID(),
      title,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const articles = [...this.articlesSubject.value, article];
    this.saveToStorage(articles);
    this.articlesSubject.next(articles);
    return article;
  }

  update(id: string, title: string, content: string): void {
    const articles = this.articlesSubject.value.map(a =>
      a.id === id ? { ...a, title, content, updatedAt: new Date().toISOString() } : a
    );
    this.saveToStorage(articles);
    this.articlesSubject.next(articles);
  }

  delete(id: string): void {
    const articles = this.articlesSubject.value.filter(a => a.id !== id);
    this.saveToStorage(articles);
    this.articlesSubject.next(articles);
  }
}
