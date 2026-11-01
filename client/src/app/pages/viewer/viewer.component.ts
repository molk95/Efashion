import { Component, ElementRef, HostListener, computed, effect, inject, input, signal, viewChild } from '@angular/core';
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
  <section class="flex h-full flex-col p-4 md:p-6 gap-4 bg-slate-50">
    @if (error()) {
      <div class="m-auto max-w-md rounded-3xl p-8 text-center bg-white border border-slate-200 shadow-md">
        <div class="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-600 mb-4">
          <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
          </svg>
        </div>
        <h2 class="font-display text-lg font-bold text-slate-900 mb-1">Accès non autorisé ou introuvable</h2>
        <p class="text-xs text-slate-500 mb-5 leading-relaxed">{{ error() }}</p>
        <a routerLink="/" class="btn-primary">Retour à l'accueil</a>
      </div>
    } @else if (!dashboard()) {
      <div class="skeleton h-24 rounded-3xl bg-slate-200"></div>
      <div class="skeleton flex-1 rounded-3xl bg-slate-200"></div>
    } @else {
      @let d = dashboard()!;

      <!-- En-tête (Thème Clair) -->
      <header class="rounded-3xl p-5 md:p-6 bg-white border border-slate-200/90 shadow-xs animate-fade-up">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="chip" [class]="style(d.category).chip">
                <span class="h-1.5 w-1.5 rounded-full" [class]="style(d.category).dot"></span>
                {{ d.category }}
              </span>
              @if (!d.isActive) {
                <span class="chip bg-amber-50 text-amber-700 border border-amber-200">Inactif</span>
              }
            </div>

            <h1 class="mt-2 font-display text-2xl font-bold text-slate-900 md:text-3xl">{{ d.title }}</h1>

            <div class="mt-2 flex items-center gap-2 text-xs font-medium text-slate-500">
              <span class="grid h-6 w-6 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-amber-500 text-[9px] font-bold text-white shadow-xs">
                {{ initials(d.authorName) }}
              </span>
              Responsable : <span class="font-bold text-slate-800">{{ d.authorName }}</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            @if (auth.isAdmin()) {
              <a id="btn-edit" routerLink="/admin" [queryParams]="{ edit: d.id }" class="btn-ghost text-xs">
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/>
                </svg>
                Modifier
              </a>
            }
            <button id="btn-kpi" class="btn-ghost text-xs" (click)="showKpi.set(!showKpi())">
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
              </svg>
              {{ showKpi() ? 'Masquer description' : 'Description & KPIs' }}
            </button>
            <button id="btn-fullscreen" class="btn-primary text-xs" (click)="toggleFullscreen()" [disabled]="!safe()">
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                @if (isFullscreen()) {
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                } @else {
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                }
              </svg>
              {{ isFullscreen() ? 'Quitter plein écran' : 'Plein écran' }}
            </button>
          </div>
        </div>

        @if (showKpi()) {
          <p class="mt-4 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-600 animate-fade-up">
            {{ d.description || 'Aucun résumé métier fourni.' }}
          </p>
        }
      </header>

      <!-- Indicateur d'authentification SSO Microsoft pour les rapports sécurisés -->
      @if (safe() && isAutoAuth()) {
        <div class="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50/90 p-3.5 text-xs text-sky-900 animate-fade-up shadow-xs">
          <svg class="h-4 w-4 shrink-0 text-sky-600 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
          </svg>
          <div class="leading-relaxed">
            <span class="font-bold text-sky-950">Connexion Microsoft requise (SSO) :</span>
            Ce rapport est sécurisé via Microsoft Power BI.
            Assurez-vous d'être connecté à votre compte organisationnel Microsoft dans votre navigateur pour charger les données.
          </div>
        </div>
      }

      <!-- Conteneur Rapport Iframe -->
      <div #frameHost class="relative flex-1 min-h-[500px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
        @if (safe()) {
          @if (!loaded()) {
            <div class="absolute inset-0 z-10 flex flex-col gap-4 p-6 bg-slate-50/90">
              <div class="flex gap-4">
                @for (i of [1,2,3,4]; track i) { <div class="skeleton h-20 flex-1 bg-slate-200"></div> }
              </div>
              <div class="flex flex-1 gap-4">
                <div class="skeleton flex-[2] bg-slate-200"></div>
                <div class="skeleton flex-1 bg-slate-200"></div>
              </div>
              <div class="absolute inset-0 grid place-items-center">
                <div class="flex flex-col items-center gap-3 bg-white/90 px-6 py-4 rounded-2xl border border-slate-200 shadow-sm">
                  <span class="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-500/20 border-t-brand-600"></span>
                  <span class="text-xs font-semibold text-slate-700">Chargement du rapport Power BI…</span>
                </div>
              </div>
            </div>
          }
          <iframe [src]="d.embedUrl | sanitizeEmbedUrl"
                  [title]="d.title"
                  (load)="loaded.set(true)"
                  class="absolute inset-0 h-full w-full border-0"
                  allowfullscreen="true"
                  allowFullScreen="true"
                  allow="fullscreen"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                  referrerpolicy="no-referrer-when-downgrade"></iframe>
        } @else {
          <div class="absolute inset-0 grid place-items-center p-6 text-center">
            <div class="max-w-md animate-fade-up">
              <div class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 mb-4">
                <svg class="h-7 w-7" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>

              <h2 class="font-display text-xl font-bold text-slate-900">
                {{ isPlaceholder() ? 'Lien en attente de publication' : 'Rapport non encore configuré' }}
              </h2>

              <p class="mt-2 text-xs leading-relaxed text-slate-500">
                @if (isPlaceholder()) {
                  Le dashboard de <span class="font-bold text-slate-700">{{ d.authorName }}</span> attend son lien Power BI définitif.
                } @else {
                  {{ pbi.parse(d.embedUrl).error || 'Lien Power BI manquant ou invalide.' }}
                }
              </p>

              @if (auth.isAdmin()) {
                <div class="mt-6 flex flex-wrap justify-center gap-3">
                  <a routerLink="/admin" [queryParams]="{ edit: d.id }" class="btn-primary text-xs">
                    <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/>
                    </svg>
                    Renseigner le lien Power BI
                  </a>
                  <a routerLink="/" class="btn-ghost text-xs">Retour</a>
                </div>
              } @else {
                <p class="mt-4 text-[11px] text-slate-400">
                  L'administrateur mettra à jour ce lien prochainement dès validation du rapport.
                </p>
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
  isAutoAuth = computed(() => this.pbi.isAutoAuth(this.dashboard()?.embedUrl));
  isPlaceholder = computed(() => this.pbi.isPlaceholder(this.dashboard()?.embedUrl));
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
          this.safe.set(this.pbi.isReady(d.embedUrl));
        },
        error: (e) => this.error.set(errorMessage(e, 'Dashboard introuvable ou accès non autorisé.')),
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
