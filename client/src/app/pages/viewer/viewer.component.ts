import { Component, ElementRef, HostListener, effect, inject, input, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../core/dashboard.service';
import { PowerBiUrlService } from '../../core/powerbi-url.service';
import { AuthService } from '../../core/auth.service';
import { Dashboard } from '../../core/models';
import { SanitizeEmbedUrlPipe } from '../../shared/sanitize-embed-url.pipe';
import { categoryStyle, initials } from '../../shared/ui';
import { errorMessage } from '../../core/auth.guards';

@Component({
  selector: 'app-viewer',
  standalone: true,
  imports: [RouterLink, SanitizeEmbedUrlPipe],
  template: `
  <section class="flex h-full flex-col p-4 md:p-6 gap-4">
    @if (error()) {
      <div class="glass m-auto max-w-md rounded-3xl p-8 text-center">
        <p class="text-rose-300">{{ error() }}</p>
        <a routerLink="/" class="btn-ghost mt-4">Retour à l'accueil</a>
      </div>
    } @else if (!dashboard()) {
      <div class="skeleton h-24 rounded-3xl"></div>
      <div class="skeleton flex-1 rounded-3xl"></div>
    } @else {
      @let d = dashboard()!;
      <!-- En-tête -->
      <header class="glass rounded-3xl p-5 md:p-6 animate-fade-up">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="chip" [class]="style(d.category).chip">{{ d.category }}</span>
              @if (!d.isActive) { <span class="chip bg-amber-500/15 text-amber-300">Inactif</span> }
            </div>
            <h1 class="mt-2 font-display text-2xl font-bold text-white md:text-3xl">{{ d.title }}</h1>
            <div class="mt-2 flex items-center gap-2 text-sm text-slate-400">
              <span class="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-gold-400 text-[9px] font-bold text-ink-950">{{ initials(d.authorName) }}</span>
              par <span class="font-medium text-slate-200">{{ d.authorName }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            @if (auth.isAdmin()) {
              <a id="btn-edit" routerLink="/admin" [queryParams]="{ edit: d.id }" class="btn-ghost">Modifier</a>
            }
            <button id="btn-kpi" class="btn-ghost" (click)="showKpi.set(!showKpi())">
              {{ showKpi() ? 'Masquer' : 'Résumé KPIs' }}
            </button>
            <button id="btn-fullscreen" class="btn-primary" (click)="toggleFullscreen()" [disabled]="!safe()">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                @if (isFullscreen()) { <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/> }
                @else { <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/> }
              </svg>
              Plein écran
            </button>
          </div>
        </div>
        @if (showKpi()) {
          <p class="mt-4 border-t border-white/[0.06] pt-4 text-sm leading-relaxed text-slate-300 animate-fade-up">
            {{ d.description || 'Aucun résumé fourni.' }}
          </p>
        }
      </header>

      <!-- Rapport -->
      <div #frameHost class="relative flex-1 min-h-[480px] overflow-hidden rounded-3xl border border-white/[0.07] bg-ink-900">
        @if (safe()) {
          @if (!loaded()) {
            <div class="absolute inset-0 z-10 flex flex-col gap-4 p-6 bg-ink-900">
              <div class="flex gap-4">
                @for (i of [1,2,3,4]; track i) { <div class="skeleton h-20 flex-1"></div> }
              </div>
              <div class="flex flex-1 gap-4">
                <div class="skeleton flex-[2]"></div>
                <div class="skeleton flex-1"></div>
              </div>
              <div class="absolute inset-0 grid place-items-center">
                <div class="flex flex-col items-center gap-3">
                  <span class="h-10 w-10 animate-spin rounded-full border-[3px] border-brand-500/20 border-t-brand-400"></span>
                  <span class="text-sm text-slate-400">Chargement du rapport Power BI…</span>
                </div>
              </div>
            </div>
          }
          <iframe [src]="d.embedUrl | sanitizeEmbedUrl" [title]="d.title" (load)="loaded.set(true)"
                  class="absolute inset-0 h-full w-full border-0" allowfullscreen="true"
                  allow="fullscreen" referrerpolicy="no-referrer-when-downgrade"></iframe>
        } @else {
          <div class="absolute inset-0 grid place-items-center p-6 text-center">
            <div class="max-w-sm">
              <div class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/5">
                <svg class="h-7 w-7 text-slate-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 3v18h18M7 15l4-4 3 3 5-6"/></svg>
              </div>
              <h2 class="mt-4 font-display text-lg font-semibold text-white">Rapport non encore publié</h2>
              <p class="mt-1 text-sm text-slate-400">{{ pbi.parse(d.embedUrl).error }}</p>
              @if (auth.isAdmin()) {
                <a routerLink="/admin" [queryParams]="{ edit: d.id }" class="btn-primary mt-5">Ajouter le lien Power BI</a>
              }
            </div>
          </div>
        }
      </div>
    }
  </section>
  `,
})
export class ViewerComponent {
  id = input.required<string>();
  private ds = inject(DashboardService);
  pbi = inject(PowerBiUrlService);
  auth = inject(AuthService);
  style = categoryStyle;
  initials = initials;

  dashboard = signal<Dashboard | null>(null);
  error = signal('');
  loaded = signal(false);
  showKpi = signal(true);
  isFullscreen = signal(false);
  safe = signal(false);
  frameHost = viewChild<ElementRef<HTMLElement>>('frameHost');

  constructor() {
    effect(() => {
      const id = this.id();
      this.dashboard.set(null);
      this.error.set('');
      this.loaded.set(false);
      this.ds.get(id).subscribe({
        next: (d) => {
          this.dashboard.set(d);
          this.safe.set(this.pbi.parse(d.embedUrl).valid);
        },
        error: (e) => this.error.set(errorMessage(e, 'Dashboard introuvable.')),
      });
    });
  }

  async toggleFullscreen() {
    const el = this.frameHost()?.nativeElement;
    if (!el) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await el.requestFullscreen?.();
  }

  @HostListener('document:fullscreenchange')
  onFs() {
    this.isFullscreen.set(!!document.fullscreenElement);
  }
}
