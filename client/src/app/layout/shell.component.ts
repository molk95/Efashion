import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { DashboardService } from '../core/dashboard.service';
import { categoryStyle, initials } from '../shared/ui';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
  template: `
  <div class="flex h-screen overflow-hidden bg-slate-50 text-slate-800">
    <!-- Overlay mobile -->
    @if (open()) {
      <div class="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden" (click)="open.set(false)"></div>
    }

    <!-- Sidebar (Theme Clair) -->
    <aside id="sidebar"
      class="fixed z-40 inset-y-0 left-0 w-72 flex flex-col border-r border-slate-200 bg-white shadow-sm transition-transform duration-300 lg:static lg:translate-x-0"
      [class.-translate-x-full]="!open()">

      <!-- Logo -->
      <a routerLink="/" class="flex items-center gap-3 px-6 h-16 border-b border-slate-200/80 shrink-0 hover:bg-slate-50/60 transition">
        <img src="favicon.svg" alt="" class="h-8 w-8 rounded-xl shadow-xs" />
        <span class="font-display text-lg font-bold tracking-tight text-slate-900">
          eFashion <span class="text-gradient">BI</span>
        </span>
      </a>

      <!-- Recherche -->
      <div class="p-4 shrink-0">
        <div class="relative">
          <svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
          </svg>
          <input id="sidebar-search" class="input pl-9 py-2 bg-slate-50/80 border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:bg-white"
            placeholder="Rechercher…" [ngModel]="query()" (ngModelChange)="query.set($event)" />
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto px-3 pb-4 space-y-4">
        <a routerLink="/" routerLinkActive="!bg-brand-50 !text-brand-700 font-semibold border-l-2 !border-brand-500" [routerLinkActiveOptions]="{ exact: true }"
           class="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-l-2 border-transparent transition">
          <svg class="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>
          </svg>
          Vue d'ensemble
        </a>

        <div class="pt-2">
          <div class="px-3 mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>{{ auth.isAdmin() ? 'Dashboards Équipe' : 'Mon Dashboard' }}</span>
            <span class="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{{ ds.dashboards().length }}</span>
          </div>

          @if (ds.loading() && !ds.dashboards().length) {
            @for (i of [1,2]; track i) {
              <div class="skeleton h-12 my-2 bg-slate-100 rounded-xl"></div>
            }
          }

          @for (g of filtered(); track g.category) {
            <div class="mb-3">
              <button class="flex w-full items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                (click)="toggle(g.category)">
                <span class="flex items-center gap-2 truncate">
                  <span class="h-2 w-2 rounded-full" [class]="style(g.category).dot"></span>
                  <span class="truncate">{{ g.category }}</span>
                </span>
                <span class="flex items-center gap-1.5 text-slate-400">
                  <span class="text-[11px]">{{ g.count }}</span>
                  <svg class="h-3 w-3 transition-transform" [class.-rotate-90]="collapsed().has(g.category)" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </span>
              </button>

              @if (!collapsed().has(g.category)) {
                @for (a of g.authors; track a.author) {
                  <div class="ml-2 border-l border-slate-200 pl-2 mt-1 space-y-1">
                    @for (d of a.dashboards; track d.id) {
                      <a [routerLink]="['/dashboards', d.id]"
                         routerLinkActive="!bg-brand-50/80 !text-brand-700 font-semibold ring-1 !ring-brand-200"
                         [id]="'nav-' + d.id"
                         class="group flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition">
                        <svg class="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-brand-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path [attr.d]="style(d.category).icon"/>
                        </svg>
                        <span class="truncate">{{ d.title }}</span>
                      </a>
                    }
                  </div>
                }
              }
            </div>
          } @empty {
            @if (!ds.loading()) {
              <p class="px-3 py-2 text-xs text-slate-400">Aucun dashboard disponible.</p>
            }
          }
        </div>
      </nav>

      <!-- Bouton Espace Admin (si ADMIN) -->
      @if (auth.isAdmin()) {
        <div class="px-3 pb-3 shrink-0">
          <a id="nav-admin" routerLink="/admin" routerLinkActive="!bg-amber-100 !text-amber-900 !border-amber-300"
             class="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition">
            <svg class="h-4 w-4 text-amber-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
              <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>
            </svg>
            Espace Administration
          </a>
        </div>
      }

      <!-- Profil utilisateur -->
      <div class="flex items-center gap-3 border-t border-slate-200 bg-slate-50/70 p-3.5 shrink-0">
        <div class="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-amber-500 text-xs font-bold text-white shadow-xs">
          {{ initials(auth.user()?.fullName || '?') }}
        </div>
        <div class="min-w-0 flex-1">
          <div class="truncate text-xs font-bold text-slate-800">{{ auth.user()?.fullName }}</div>
          <div class="truncate text-[10px] text-slate-500 font-medium">{{ auth.user()?.email }}</div>
        </div>
        <button id="btn-logout" (click)="auth.logout()" title="Déconnexion"
          class="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
        </button>
      </div>
    </aside>

    <!-- Contenu principal -->
    <div class="flex min-w-0 flex-1 flex-col">
      <header class="flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:hidden shadow-xs">
        <button id="btn-menu" class="rounded-lg p-2 hover:bg-slate-100 text-slate-700" (click)="open.set(true)" aria-label="Menu">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <span class="font-display font-bold text-slate-900">eFashion <span class="text-gradient">BI</span></span>
      </header>
      <main class="flex-1 overflow-y-auto bg-slate-50">
        <router-outlet />
      </main>
    </div>
  </div>
  `,
})
export class ShellComponent {
  auth = inject(AuthService);
  ds = inject(DashboardService);
  private router = inject(Router);

  open = signal(false);
  query = signal('');
  collapsed = signal(new Set<string>());
  style = categoryStyle;
  initials = initials;

  filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.ds.grouped();
    return this.ds
      .grouped()
      .map((g) => ({
        ...g,
        authors: g.authors
          .map((a) => ({
            ...a,
            dashboards: a.dashboards.filter((d) =>
              [d.title, d.authorName, d.category].some((s) => s.toLowerCase().includes(q)),
            ),
          }))
          .filter((a) => a.dashboards.length),
      }))
      .filter((g) => g.authors.length);
  });

  constructor() {
    this.ds.refresh().subscribe();
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.open.set(false));
  }

  toggle(c: string) {
    const s = new Set(this.collapsed());
    s.has(c) ? s.delete(c) : s.add(c);
    this.collapsed.set(s);
  }
}
