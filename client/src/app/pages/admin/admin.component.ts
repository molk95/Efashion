import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DashboardService } from '../../core/dashboard.service';
import { PowerBiUrlService } from '../../core/powerbi-url.service';
import { Dashboard, DashboardInput, EmbedValidation } from '../../core/models';
import { SanitizeEmbedUrlPipe } from '../../shared/sanitize-embed-url.pipe';
import { DEFAULT_CATEGORIES, categoryStyle } from '../../shared/ui';
import { errorMessage } from '../../core/auth.guards';

const EMPTY: DashboardInput = {
  title: '',
  authorName: '',
  description: '',
  embedUrl: '',
  category: 'Développement des collections',
  displayOrder: 0,
  isActive: true,
};

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule, RouterLink, SanitizeEmbedUrlPipe],
  template: `
  <section class="mx-auto max-w-7xl px-6 py-10">
    <div class="flex flex-wrap items-end justify-between gap-4 animate-fade-up">
      <div>
        <p class="text-sm font-medium text-gold-300">Administration</p>
        <h1 class="font-display text-3xl font-extrabold text-white md:text-4xl">Gestion des <span class="text-gradient">dashboards</span></h1>
      </div>
      <button id="btn-new" class="btn-primary" (click)="startNew()">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
        Nouveau dashboard
      </button>
    </div>

    @if (toast()) {
      <div class="fixed bottom-6 right-6 z-50 glass rounded-2xl px-5 py-3 text-sm text-emerald-200 animate-fade-up">{{ toast() }}</div>
    }

    <div class="mt-8 grid gap-6 xl:grid-cols-[1fr_1.1fr]">
      <!-- Liste -->
      <div class="glass rounded-3xl p-2 self-start">
        @if (loading()) {
          @for (i of [1,2,3]; track i) { <div class="skeleton m-2 h-16"></div> }
        }
        @for (d of items(); track d.id) {
          <div class="group flex items-center gap-4 rounded-2xl px-4 py-3 transition hover:bg-white/[0.04]"
               [class]="editingId() === d.id ? 'bg-brand-500/10 ring-1 ring-brand-400/30' : ''">
            <div class="flex flex-col items-center text-xs text-slate-500 w-6">#{{ d.displayOrder }}</div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="truncate font-medium text-white">{{ d.title }}</span>
                @if (!d.isActive) { <span class="chip bg-amber-500/15 text-amber-300">Inactif</span> }
              </div>
              <div class="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                <span class="chip" [class]="style(d.category).chip">{{ d.category }}</span>
                {{ d.authorName }}
                <span class="h-1.5 w-1.5 rounded-full" [class]="pbi.parse(d.embedUrl).valid ? 'bg-emerald-400' : 'bg-slate-600'"
                      [title]="pbi.parse(d.embedUrl).valid ? 'Lien valide' : 'Lien manquant'"></span>
              </div>
            </div>
            <div class="flex gap-1 opacity-70 group-hover:opacity-100">
              <a [routerLink]="['/dashboards', d.id]" class="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white" title="Voir">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
              </a>
              <button [id]="'edit-' + d.id" (click)="edit(d)" class="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-brand-300" title="Modifier">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/></svg>
              </button>
              <button [id]="'delete-' + d.id" (click)="remove(d)" class="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-300" title="Supprimer">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
              </button>
            </div>
          </div>
        } @empty {
          @if (!loading()) { <p class="p-6 text-center text-sm text-slate-500">Aucun dashboard. Créez le premier !</p> }
        }
      </div>

      <!-- Formulaire -->
      @if (formOpen()) {
        <form class="glass rounded-3xl p-6 space-y-5 animate-fade-up" (ngSubmit)="save()" #f="ngForm">
          <div class="flex items-center justify-between">
            <h2 class="font-display text-xl font-bold text-white">{{ editingId() ? 'Modifier le dashboard' : 'Nouveau dashboard' }}</h2>
            <button type="button" class="text-sm text-slate-400 hover:text-white" (click)="close()">Fermer ✕</button>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div class="md:col-span-2">
              <label class="label" for="f-title">Titre</label>
              <input id="f-title" name="title" class="input" [(ngModel)]="model.title" required minlength="2" placeholder="Diversité des Produits du Catalogue" />
            </div>
            <div>
              <label class="label" for="f-author">Auteur·e</label>
              <input id="f-author" name="authorName" class="input" [(ngModel)]="model.authorName" required placeholder="Molk" />
            </div>
            <div>
              <label class="label" for="f-category">Catégorie</label>
              <input id="f-category" name="category" class="input" [(ngModel)]="model.category" required list="categories" />
              <datalist id="categories">
                @for (c of categories(); track c) { <option [value]="c"></option> }
              </datalist>
            </div>
            <div class="md:col-span-2">
              <label class="label" for="f-desc">Description / résumé des KPIs</label>
              <textarea id="f-desc" name="description" rows="3" class="input resize-y" [(ngModel)]="model.description"
                placeholder="Indicateurs clés, périmètre, questions métier adressées…"></textarea>
            </div>
            <div class="md:col-span-2">
              <label class="label" for="f-embed">Lien Power BI ou code &lt;iframe&gt;</label>
              <textarea id="f-embed" name="embedUrl" rows="4" class="input font-mono text-xs resize-y"
                [ngModel]="model.embedUrl" (ngModelChange)="onEmbedChange($event)"
                placeholder='https://app.powerbi.com/view?r=eyJrIjoi…   ou   <iframe title="…" src="https://app.powerbi.com/view?r=…" …></iframe>'></textarea>
              @if (model.embedUrl.trim()) {
                <div class="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span class="chip bg-white/5 text-slate-300">
                    Format détecté : {{ parsed().inputType === 'iframe' ? 'Code iframe' : parsed().inputType === 'url' ? 'Lien direct' : 'Inconnu' }}
                  </span>
                  @if (parsed().valid) {
                    <span class="chip bg-emerald-500/15 text-emerald-300">✓ URL valide</span>
                  } @else {
                    <span class="chip bg-rose-500/15 text-rose-300">✕ {{ parsed().error }}</span>
                  }
                  <button id="btn-validate" type="button" class="ml-auto text-brand-300 hover:text-brand-200 font-semibold" (click)="serverValidate()">
                    Tester côté serveur
                  </button>
                </div>
                @if (parsed().valid) {
                  <p class="mt-1 truncate font-mono text-[11px] text-slate-500" [title]="parsed().url">→ {{ parsed().url }}</p>
                }
                @if (serverResult(); as r) {
                  <p class="mt-1 text-xs" [class]="r.valid ? 'text-emerald-300' : 'text-rose-300'">
                    Serveur : {{ r.valid ? 'lien accepté ✓' : r.error }}
                  </p>
                }
              }
            </div>
            <div>
              <label class="label" for="f-order">Ordre d'affichage</label>
              <input id="f-order" name="displayOrder" type="number" class="input" [(ngModel)]="model.displayOrder" />
            </div>
            <div class="flex items-end">
              <label class="flex cursor-pointer items-center gap-3 select-none">
                <input id="f-active" name="isActive" type="checkbox" class="peer sr-only" [(ngModel)]="model.isActive" />
                <span class="relative h-6 w-11 rounded-full bg-white/10 transition peer-checked:bg-brand-500 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5"></span>
                <span class="text-sm text-slate-300">Actif (visible des lecteurs)</span>
              </label>
            </div>
          </div>

          @if (parsed().valid) {
            <div>
              <div class="label">Aperçu</div>
              <div class="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-ink-900">
                <iframe [src]="model.embedUrl | sanitizeEmbedUrl" title="Aperçu" class="absolute inset-0 h-full w-full border-0" allowfullscreen="true"></iframe>
              </div>
            </div>
          }

          @if (formError()) {
            <div class="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-200">{{ formError() }}</div>
          }

          <div class="flex justify-end gap-3 pt-2">
            <button type="button" class="btn-ghost" (click)="close()">Annuler</button>
            <button id="btn-save" type="submit" class="btn-primary"
              [disabled]="f.invalid || saving() || (!!model.embedUrl.trim() && !parsed().valid)">
              @if (saving()) { <span class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span> }
              Enregistrer
            </button>
          </div>
        </form>
      } @else {
        <div class="glass hidden xl:grid place-items-center rounded-3xl p-10 text-center self-start">
          <div>
            <p class="font-display text-lg font-semibold text-white">Sélectionnez un dashboard</p>
            <p class="mt-1 text-sm text-slate-400">ou créez-en un nouveau. Collez indifféremment le lien direct ou le code &lt;iframe&gt; de Power BI.</p>
          </div>
        </div>
      }
    </div>
  </section>
  `,
})
export class AdminComponent implements OnInit {
  private ds = inject(DashboardService);
  private route = inject(ActivatedRoute);
  pbi = inject(PowerBiUrlService);
  style = categoryStyle;

  items = signal<Dashboard[]>([]);
  loading = signal(true);
  formOpen = signal(false);
  editingId = signal<string | null>(null);
  saving = signal(false);
  formError = signal('');
  toast = signal('');
  embed = signal('');
  serverResult = signal<EmbedValidation | null>(null);
  model: DashboardInput = { ...EMPTY };

  parsed = computed(() => this.pbi.parse(this.embed()));
  categories = computed(() => [...new Set([...DEFAULT_CATEGORIES, ...this.items().map((d) => d.category)])]);

  ngOnInit() {
    this.load(() => {
      const id = this.route.snapshot.queryParamMap.get('edit');
      const d = id && this.items().find((x) => x.id === id);
      if (d) this.edit(d);
    });
  }

  load(after?: () => void) {
    this.loading.set(true);
    this.ds.listAll().subscribe({
      next: (d) => {
        this.items.set(d);
        this.loading.set(false);
        after?.();
      },
      error: () => this.loading.set(false),
    });
  }

  startNew() {
    this.editingId.set(null);
    this.model = { ...EMPTY, displayOrder: this.items().length + 1 };
    this.openForm();
  }

  edit(d: Dashboard) {
    this.editingId.set(d.id);
    const { id: _i, createdAt: _c, updatedAt: _u, ...rest } = d;
    this.model = { ...rest };
    this.openForm();
  }

  private openForm() {
    this.embed.set(this.model.embedUrl);
    this.serverResult.set(null);
    this.formError.set('');
    this.formOpen.set(true);
  }

  close() {
    this.formOpen.set(false);
    this.editingId.set(null);
  }

  onEmbedChange(v: string) {
    this.model.embedUrl = v;
    this.embed.set(v);
    this.serverResult.set(null);
  }

  serverValidate() {
    this.ds.validateEmbed(this.model.embedUrl).subscribe({
      next: (r) => this.serverResult.set(r),
      error: (e) => this.serverResult.set({ valid: false, url: null, inputType: 'unknown', error: errorMessage(e) }),
    });
  }

  save() {
    this.saving.set(true);
    this.formError.set('');
    const body = { ...this.model, displayOrder: Number(this.model.displayOrder) || 0 };
    const id = this.editingId();
    const req = id ? this.ds.update(id, body) : this.ds.create(body);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.notify(id ? 'Dashboard mis à jour ✓' : 'Dashboard créé ✓');
        this.close();
        this.load();
        this.ds.refresh().subscribe();
      },
      error: (e) => {
        this.saving.set(false);
        this.formError.set(errorMessage(e));
      },
    });
  }

  remove(d: Dashboard) {
    if (!confirm(`Supprimer « ${d.title} » ?`)) return;
    this.ds.remove(d.id).subscribe({
      next: () => {
        if (this.editingId() === d.id) this.close();
        this.notify('Dashboard supprimé');
        this.load();
        this.ds.refresh().subscribe();
      },
      error: (e) => alert(errorMessage(e)),
    });
  }

  private notify(msg: string) {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 2500);
  }
}
