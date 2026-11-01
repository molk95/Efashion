import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { Dashboard, DashboardInput, EmbedValidation } from './models';

export interface CategoryGroup {
  category: string;
  authors: { author: string; dashboards: Dashboard[] }[];
  count: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private base = '/api/dashboards';

  readonly dashboards = signal<Dashboard[]>([]);
  readonly loading = signal(false);

  /** Regroupement Catégorie → Auteur → Dashboards pour la sidebar. */
  readonly grouped = computed<CategoryGroup[]>(() => {
    const map = new Map<string, Map<string, Dashboard[]>>();
    for (const d of this.dashboards()) {
      if (!map.has(d.category)) map.set(d.category, new Map());
      const a = map.get(d.category)!;
      if (!a.has(d.authorName)) a.set(d.authorName, []);
      a.get(d.authorName)!.push(d);
    }
    return [...map.entries()].map(([category, authors]) => ({
      category,
      authors: [...authors.entries()].map(([author, dashboards]) => ({ author, dashboards })),
      count: [...authors.values()].reduce((n, l) => n + l.length, 0),
    }));
  });

  refresh() {
    this.loading.set(true);
    return this.http.get<Dashboard[]>(this.base).pipe(
      tap({
        next: (d) => {
          this.dashboards.set(d);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      }),
    );
  }

  listAll() {
    return this.http.get<Dashboard[]>(this.base, { params: { all: 'true' } });
  }
  get(id: string) {
    return this.http.get<Dashboard>(`${this.base}/${id}`);
  }
  create(d: DashboardInput) {
    return this.http.post<Dashboard>(this.base, d);
  }
  update(id: string, d: Partial<DashboardInput>) {
    return this.http.put<Dashboard>(`${this.base}/${id}`, d);
  }
  remove(id: string) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
  validateEmbed(embed: string) {
    return this.http.post<EmbedValidation>(`${this.base}/validate-embed`, { embed });
  }
}
