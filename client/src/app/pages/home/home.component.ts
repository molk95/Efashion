import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { DashboardService } from '../../core/dashboard.service';
import { PowerBiUrlService } from '../../core/powerbi-url.service';
import { categoryStyle, initials } from '../../shared/ui';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
  <section class="mx-auto max-w-7xl px-6 py-10 bg-slate-50">
    <div class="animate-fade-up">
      <div class="flex items-center gap-2 text-sm font-semibold text-brand-600">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>
        </svg>
        Bonjour {{ firstName() }}
      </div>

      <h1 class="mt-1 font-display text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
        Portail <span class="text-gradient">décisionnel</span> eFashion
      </h1>

      <p class="mt-2 max-w-2xl text-slate-600 text-sm md:text-base leading-relaxed">
        @if (auth.isAdmin()) {
          Espace centralisé de suivi des 4 axes analytiques eFashion (Développement collections, Merchandising, Organisation catalogue, Qualité fiches).
        } @else {
          Votre espace de consultation décisionnel dédié pour le projet eFashion.
        }
      </p>
    </div>

    <!-- Stats rapides -->
    <div class="mt-7 grid grid-cols-2 gap-4 md:grid-cols-4">
      @for (s of stats(); track s.label) {
        <div class="rounded-2xl p-4 bg-white border border-slate-200/90 shadow-xs animate-fade-up">
          <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400">{{ s.label }}</div>
          <div class="mt-1 font-display text-2xl font-bold text-slate-900">{{ s.value }}</div>
        </div>
      }
    </div>

    <!-- Cartes Dashboards -->
    <div class="mt-9 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      @if (ds.loading() && !ds.dashboards().length) {
        @for (i of [1,2,3]; track i) {
          <div class="skeleton h-60 rounded-3xl bg-slate-200"></div>
        }
      }

      @for (d of ds.dashboards(); track d.id; let i = $index) {
        <a [routerLink]="['/dashboards', d.id]" [id]="'card-' + d.id"
           class="group relative flex flex-col overflow-hidden rounded-3xl p-6 bg-white border border-slate-200 hover:border-brand-400 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 animate-fade-up"
           [style.animation-delay.ms]="i * 70">

          <div class="flex items-center justify-between gap-2">
            <span class="chip" [class]="style(d.category).chip">
              <span class="h-1.5 w-1.5 rounded-full" [class]="style(d.category).dot"></span>
              {{ d.category }}
            </span>

            @if (pbi.isReady(d.embedUrl)) {
              <span class="chip bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                En ligne
              </span>
            } @else if (pbi.isPlaceholder(d.embedUrl)) {
              <span class="chip bg-amber-50 text-amber-700 border border-amber-200">
                <span class="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                En attente de lien
              </span>
            } @else {
              <span class="chip bg-slate-100 text-slate-600 border border-slate-200">
                À configurer
              </span>
            }
          </div>

          <h2 class="mt-4 font-display text-lg font-bold text-slate-900 group-hover:text-brand-600 transition">
            {{ d.title }}
          </h2>

          <p class="mt-2 line-clamp-3 flex-1 text-xs leading-relaxed text-slate-500">
            {{ d.description || 'Aucune description disponible.' }}
          </p>

          <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <div class="flex items-center gap-2 text-xs font-medium text-slate-700">
              <span class="grid h-6 w-6 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-amber-500 text-[9px] font-bold text-white shadow-xs">
                {{ initials(d.authorName) }}
              </span>
              {{ d.authorName }}
            </div>

            <span class="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 group-hover:translate-x-0.5 transition-transform">
              Consulter
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path d="M5 12h14M13 5l7 7-7 7"/>
              </svg>
            </span>
          </div>
        </a>
      } @empty {
        @if (!ds.loading()) {
          <div class="col-span-full rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xs">
            <div class="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-500 mb-3">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M9 21V9"/>
              </svg>
            </div>
            <h3 class="font-display text-base font-bold text-slate-900">Aucun dashboard disponible</h3>
            <p class="mt-1 text-xs text-slate-500">Votre compte lecteur n'a pas encore de dashboard associé actif.</p>
          </div>
        }
      }
    </div>
  </section>
  `,
})
export class HomeComponent {
  ds = inject(DashboardService);
  pbi = inject(PowerBiUrlService);
  auth = inject(AuthService);
  style = categoryStyle;
  initials = initials;

  firstName = computed(() => this.auth.user()?.fullName.split(' ')[0] ?? '');
  stats = computed(() => {
    const d = this.ds.dashboards();
    return [
      { label: 'Dashboards', value: d.length },
      { label: 'Catégories', value: new Set(d.map((x) => x.category)).size },
      { label: 'Auteurs', value: new Set(d.map((x) => x.authorName)).size },
      { label: 'En ligne', value: d.filter((x) => this.pbi.isReady(x.embedUrl)).length },
    ];
  });
}
