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
  <section class="mx-auto max-w-7xl px-6 py-10">
    <div class="animate-fade-up">
      <p class="text-sm font-medium text-brand-300">Bonjour {{ firstName() }} ✨</p>
      <h1 class="mt-1 font-display text-4xl font-extrabold tracking-tight text-white md:text-5xl">
        Portail <span class="text-gradient">décisionnel</span> eFashion
      </h1>
      <p class="mt-3 max-w-2xl text-slate-400">
        Retrouvez les tableaux de bord Power BI de chaque membre de l'équipe, organisés par domaine métier.
      </p>
    </div>

    <div class="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
      @for (s of stats(); track s.label) {
        <div class="glass rounded-2xl p-5 animate-fade-up">
          <div class="text-xs uppercase tracking-wider text-slate-500">{{ s.label }}</div>
          <div class="mt-1 font-display text-3xl font-bold text-white">{{ s.value }}</div>
        </div>
      }
    </div>

    <div class="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      @if (ds.loading() && !ds.dashboards().length) {
        @for (i of [1,2,3]; track i) { <div class="skeleton h-64 rounded-3xl"></div> }
      }
      @for (d of ds.dashboards(); track d.id; let i = $index) {
        <a [routerLink]="['/dashboards', d.id]" [id]="'card-' + d.id"
           class="group glass relative flex flex-col overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-400/30 hover:shadow-glow animate-fade-up"
           [style.animation-delay.ms]="i * 70">
          <div class="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand-500/10 blur-2xl transition group-hover:bg-brand-500/25"></div>
          <div class="flex items-center justify-between">
            <span class="chip" [class]="style(d.category).chip">{{ d.category }}</span>
            @if (pbi.isReady(d.embedUrl)) {
              <span class="chip bg-emerald-500/10 text-emerald-300"><span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>En ligne</span>
            } @else if (pbi.isPlaceholder(d.embedUrl)) {
              <span class="chip bg-amber-500/10 text-amber-300 border border-amber-500/20"><span class="h-1.5 w-1.5 rounded-full bg-amber-400"></span>En attente de lien</span>
            } @else {
              <span class="chip bg-white/5 text-slate-400">À configurer</span>
            }
          </div>
          <h2 class="mt-5 font-display text-xl font-bold text-white group-hover:text-brand-200 transition">{{ d.title }}</h2>
          <p class="mt-2 line-clamp-3 flex-1 text-sm text-slate-400">{{ d.description || 'Aucune description.' }}</p>
          <div class="mt-6 flex items-center justify-between">
            <div class="flex items-center gap-2 text-sm text-slate-300">
              <span class="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-brand-400/80 to-gold-400/80 text-[10px] font-bold text-ink-950">{{ initials(d.authorName) }}</span>
              {{ d.authorName }}
            </div>
            <span class="flex items-center gap-1 text-sm font-semibold text-brand-300 opacity-0 -translate-x-2 transition group-hover:opacity-100 group-hover:translate-x-0">
              Ouvrir <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </span>
          </div>
        </a>
      }
    </div>
  </section>
  `,
})
export class HomeComponent {
  ds = inject(DashboardService);
  pbi = inject(PowerBiUrlService);
  private auth = inject(AuthService);
  style = categoryStyle;
  initials = initials;

  firstName = computed(() => this.auth.user()?.fullName.split(' ')[0] ?? '');
  stats = computed(() => {
    const d = this.ds.dashboards();
    return [
      { label: 'Dashboards', value: d.length },
      { label: 'Catégories', value: new Set(d.map((x) => x.category)).size },
      { label: 'Contributeurs', value: new Set(d.map((x) => x.authorName)).size },
      { label: 'Publiés', value: d.filter((x) => this.pbi.parse(x.embedUrl).valid).length },
    ];
  });
}
