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
  <div class="flex h-screen overflow-hidden">
    <!-- Overlay mobile -->
    @if (open()) { <div class="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden" (click)="open.set(false)"></div> }

    <!-- Sidebar -->
    <aside id="sidebar"
      class="fixed z-40 inset-y-0 left-0 w-72 flex flex-col border-r border-white/[0.06] bg-ink-900/90 backdrop-blur-xl transition-transform duration-300 lg:static lg:translate-x-0"
      [class.-translate-x-full]="!open()">
      <a routerLink="/" class="flex items-center gap-3 px-6 h-16 border-b border-white/[0.06] shrink-0">
        <img src="favicon.svg" alt="" class="h-8 w-8" />
        <span class="font-display text-lg font-bold tracking-tight">eFashion <span class="text-gradient">BI</span></span>
      </a>

      <div class="p-4 shrink-0">
        <div class="relative">
          <svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <input id="sidebar-search" class="input pl-9 py-2" placeholder="Rechercher…" [ngModel]="query()" (ngModelChange)="query.set($event)" />
        </div>
      </div>

      <nav class="flex-1 overflow-y-auto px-3 pb-4 space-y-5">
        <a routerLink="/" routerLinkActive="!bg-white/[0.07] !text-white" [routerLinkActiveOptions]="{ exact: true }"
           class="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white transition">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>
          Vue d'ensemble
        </a>

        @if (ds.loading() && !ds.dashboards().length) {
          @for (i of [1,2,3]; track i) { <div class="skeleton h-16"></div> }
        }

        @for (g of filtered(); track g.category) {
          <div>
            <button class="flex w-full items-center justify-between px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 hover:text-slate-300"
              (click)="toggle(g.category)">
              <span class="flex items-center gap-2"><span class="h-1.5 w-1.5 rounded-full" [class]="style(g.category).dot"></span>{{ g.category }}</span>
              <span class="flex items-center gap-1.5">
                <span class="text-slate-600">{{ g.count }}</span>
                <svg class="h-3 w-3 transition-transform" [class.-rotate-90]="collapsed().has(g.category)" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
              </span>
            </button>
            @if (!collapsed().has(g.category)) {
              @for (a of g.authors; track a.author) {
                <div class="ml-2 border-l border-white/[0.06] pl-2 mb-1">
                  <div class="flex items-center gap-2 px-2 py-1 text-xs text-slate-400">
                    <span class="grid h-5 w-5 place-items-center rounded-full bg-white/10 text-[9px] font-bold text-slate-200">{{ initials(a.author) }}</span>
                    {{ a.author }}
                  </div>
                  @for (d of a.dashboards; track d.id) {
                    <a [routerLink]="['/dashboards', d.id]" routerLinkActive="!bg-brand-500/15 !text-white ring-1 ring-brand-400/30"
                       [id]="'nav-' + d.id"
                       class="group flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition">
                      <svg class="h-4 w-4 shrink-0 text-slate-500 group-hover:text-brand-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path [attr.d]="style(d.category).icon"/></svg>
                      <span class="truncate">{{ d.title }}</span>
                    </a>
                  }
                </div>
              }
            }
          </div>
        } @empty {
          @if (!ds.loading()) { <p class="px-3 text-sm text-slate-500">Aucun dashboard.</p> }
        }
      </nav>

      @if (auth.isAdmin()) {
        <div class="px-3 pb-3 shrink-0">
          <a id="nav-admin" routerLink="/admin" routerLinkActive="!border-gold-400/40 !text-gold-300"
             class="flex items-center gap-3 rounded-xl border border-white/10 px-3 py-2.5 text-sm font-medium text-slate-300 hover:border-gold-400/30 hover:text-gold-300 transition">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>
            Espace Admin
          </a>
        </div>
      }

      <div class="flex items-center gap-3 border-t border-white/[0.06] p-4 shrink-0">
        <div class="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-gold-400 text-xs font-bold text-ink-950">
          {{ initials(auth.user()?.fullName || '?') }}
        </div>
        <div class="min-w-0 flex-1">
          <div class="truncate text-sm font-medium text-white">{{ auth.user()?.fullName }}</div>
          <div class="text-[11px] uppercase tracking-wider" [class]="auth.isAdmin() ? 'text-gold-300' : 'text-slate-500'">{{ auth.user()?.role }}</div>
        </div>
        <button id="btn-logout" (click)="auth.logout()" title="Déconnexion" class="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-rose-300 transition">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
        </button>
      </div>
    </aside>

    <!-- Contenu -->
    <div class="flex min-w-0 flex-1 flex-col">
      <header class="flex h-14 items-center gap-3 border-b border-white/[0.06] px-4 lg:hidden">
        <button id="btn-menu" class="rounded-lg p-2 hover:bg-white/5" (click)="open.set(true)" aria-label="Menu">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <span class="font-display font-bold">eFashion <span class="text-gradient">BI</span></span>
      </header>
      <main class="flex-1 overflow-y-auto">
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
