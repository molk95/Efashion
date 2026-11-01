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
  <section class="mx-auto max-w-7xl px-6 py-10 bg-slate-50">
    <!-- En-tête -->
    <div class="flex flex-wrap items-end justify-between gap-4 animate-fade-up">
      <div>
        <div class="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700">
          <svg class="h-4 w-4 text-amber-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>
          </svg>
          Administration du portail
        </div>
        <h1 class="mt-1 font-display text-3xl font-extrabold text-slate-900 md:text-4xl">
          Gestion des <span class="text-gradient">dashboards</span>
        </h1>
      </div>
      <button id="btn-new" class="btn-primary" (click)="startNew()">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        Nouveau dashboard
      </button>
    </div>

    <!-- Notification Toast -->
    @if (toast()) {
      <div class="fixed bottom-6 right-6 z-50 rounded-2xl bg-slate-900 text-white px-5 py-3 text-xs font-semibold shadow-lg flex items-center gap-2 animate-fade-up">
        <svg class="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M5 13l4 4L19 7"/>
        </svg>
        <span>{{ toast() }}</span>
      </div>
    }

    <!-- Grille principale -->
    <div class="mt-8 grid gap-6 xl:grid-cols-[1fr_1.15fr]">
      <!-- Liste des Dashboards -->
      <div class="rounded-3xl p-3 bg-white border border-slate-200/90 shadow-sm self-start space-y-1">
        <div class="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <span>Dashboards enregistrés</span>
          <span>{{ items().length }} au total</span>
        </div>

        @if (loading()) {
          @for (i of [1,2,3,4]; track i) {
            <div class="skeleton m-2 h-16 bg-slate-100 rounded-2xl"></div>
          }
        }

        @for (d of items(); track d.id) {
          <div class="group flex items-center gap-3 rounded-2xl px-4 py-3 transition hover:bg-slate-50 border border-transparent"
               [class.!bg-brand-50]="editingId() === d.id"
               [class.!border-brand-200]="editingId() === d.id">
            <div class="flex flex-col items-center text-xs font-bold text-slate-400 w-6">#{{ d.displayOrder }}</div>

            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="truncate text-sm font-bold text-slate-900">{{ d.title }}</span>
                @if (!d.isActive) {
                  <span class="chip bg-amber-50 text-amber-700 border border-amber-200 text-[10px]">Inactif</span>
                }
              </div>

              <div class="mt-1 flex items-center gap-2 text-xs text-slate-500">
                <span class="chip" [class]="style(d.category).chip">{{ d.category }}</span>
                <span class="font-medium text-slate-700">{{ d.authorName }}</span>
                <span class="h-2 w-2 rounded-full"
                      [class]="pbi.isReady(d.embedUrl) ? 'bg-emerald-500' : pbi.isPlaceholder(d.embedUrl) ? 'bg-amber-500' : 'bg-slate-300'"
                      [title]="pbi.isReady(d.embedUrl) ? 'Lien actif' : pbi.isPlaceholder(d.embedUrl) ? 'En attente de lien (placeholder)' : 'Lien manquant'"></span>
              </div>
            </div>

            <div class="flex gap-1">
              <a [routerLink]="['/dashboards', d.id]"
                 class="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition" title="Consulter">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>
                </svg>
              </a>
              <button [id]="'edit-' + d.id" (click)="edit(d)"
                      class="rounded-xl p-2 text-slate-400 hover:bg-brand-50 hover:text-brand-600 transition" title="Modifier le dashboard">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/>
                </svg>
              </button>
              <button [id]="'delete-' + d.id" (click)="remove(d)"
                      class="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition" title="Supprimer">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                </svg>
              </button>
            </div>
          </div>
        } @empty {
          @if (!loading()) {
            <p class="p-6 text-center text-xs text-slate-400">Aucun dashboard enregistré.</p>
          }
        }
      </div>

      <!-- Formulaire d'édition / création -->
      @if (formOpen()) {
        <form class="rounded-3xl p-6 sm:p-7 bg-white border border-slate-200/90 shadow-md space-y-5 animate-fade-up" (ngSubmit)="save()" #f="ngForm">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 class="font-display text-lg font-bold text-slate-900">
                {{ editingId() ? 'Modifier le dashboard' : 'Nouveau dashboard' }}
              </h2>
              <p class="text-xs text-slate-400 mt-0.5">Collez soit le lien direct Power BI, soit la balise &lt;iframe&gt; brute.</p>
            </div>
            <button type="button" class="inline-flex items-center gap-1 rounded-xl p-2 text-xs font-semibold text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition" (click)="close()">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
              Fermer
            </button>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div class="md:col-span-2">
              <label class="label" for="f-title">Titre du dashboard</label>
              <input id="f-title" name="title" class="input" [(ngModel)]="model.title" required minlength="2" placeholder="Diversité des Produits du Catalogue" />
            </div>

            <div>
              <label class="label" for="f-author">Auteur·e (Responsable)</label>
              <input id="f-author" name="authorName" class="input" [(ngModel)]="model.authorName" required placeholder="Molk" />
            </div>

            <div>
              <label class="label" for="f-category">Catégorie métier</label>
              <input id="f-category" name="category" class="input" [(ngModel)]="model.category" required list="categories" />
              <datalist id="categories">
                @for (c of categories(); track c) { <option [value]="c"></option> }
              </datalist>
            </div>

            <div class="md:col-span-2">
              <label class="label" for="f-desc">Description / Résumé des indicateurs</label>
              <textarea id="f-desc" name="description" rows="3" class="input resize-y text-xs" [(ngModel)]="model.description"
                placeholder="Indicateurs clés, périmètre et objectifs métier du rapport…"></textarea>
            </div>

            <div class="md:col-span-2">
              <label class="label" for="f-embed">Lien Power BI ou tag &lt;iframe&gt;</label>
              <textarea id="f-embed" name="embedUrl" rows="4" class="input font-mono text-xs resize-y"
                [ngModel]="model.embedUrl" (ngModelChange)="onEmbedChange($event)"
                placeholder='https://app.powerbi.com/reportEmbed?reportId=… ou <iframe src="https://app.powerbi.com/view?r=…" …></iframe>'></textarea>

              @if (model.embedUrl.trim()) {
                <div class="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                  <span class="chip bg-slate-100 text-slate-700 border border-slate-200">
                    Format : {{ parsed().inputType === 'iframe' ? 'Balise iframe' : parsed().inputType === 'url' ? 'Lien direct' : 'Format non reconnu' }}
                  </span>

                  @if (parsed().valid) {
                    <span class="chip bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <svg class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7"/>
                      </svg>
                      URL valide
                    </span>
                  } @else {
                    <span class="chip bg-rose-50 text-rose-700 border border-rose-200">
                      <svg class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                        <path d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                      {{ parsed().error }}
                    </span>
                  }

                  <button id="btn-validate" type="button" class="ml-auto inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700" (click)="serverValidate()">
                    <svg class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    Tester via le serveur
                  </button>
                </div>

                @if (serverResult(); as r) {
                  <p class="mt-1 text-xs font-semibold" [class]="r.valid ? 'text-emerald-700' : 'text-rose-700'">
                    Serveur : {{ r.valid ? 'Lien conforme et validé avec succès' : r.error }}
                  </p>
                }
              }
            </div>

            <div>
              <label class="label" for="f-order">Ordre d'affichage</label>
              <input id="f-order" name="displayOrder" type="number" class="input" [(ngModel)]="model.displayOrder" />
            </div>

            <div class="flex items-end pb-1">
              <label class="flex cursor-pointer items-center gap-3 select-none">
                <input id="f-active" name="isActive" type="checkbox" class="peer sr-only" [(ngModel)]="model.isActive" />
                <span class="relative h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-brand-600 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-xs after:transition peer-checked:after:translate-x-5"></span>
                <span class="text-xs font-semibold text-slate-700">Actif (visible pour les lecteurs)</span>
              </label>
            </div>
          </div>

          <!-- Aperçu Iframe si valide -->
          @if (pbi.isReady(model.embedUrl)) {
            <div class="pt-2">
              <div class="label">Aperçu en direct</div>
              <div class="relative aspect-video overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-xs">
                <iframe [src]="model.embedUrl | sanitizeEmbedUrl" title="Aperçu" class="absolute inset-0 h-full w-full border-0"
                        allowfullscreen="true"
                        allowFullScreen="true"
                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"></iframe>
              </div>
            </div>
          } @else if (pbi.isPlaceholder(model.embedUrl) && model.embedUrl.trim()) {
            <div class="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800">
              <span class="font-bold">Lien temporaire (placeholder) :</span>
              Ce dashboard est en attente du lien réel Power BI publié par l'auteur·e. Vous pouvez coller ici le lien définitif ou le tag &lt;iframe&gt; dès qu'il est disponible.
            </div>
          }

          @if (formError()) {
            <div class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700 flex items-center gap-2">
              <svg class="h-4 w-4 shrink-0 text-rose-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
              </svg>
              <span>{{ formError() }}</span>
            </div>
          }

          <div class="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" class="btn-ghost" (click)="close()">Annuler</button>
            <button id="btn-save" type="submit" class="btn-primary"
              [disabled]="f.invalid || saving() || (!!model.embedUrl.trim() && !parsed().valid)">
              @if (saving()) {
                <span class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
              }
              Enregistrer les modifications
            </button>
          </div>
        </form>
      } @else {
        <div class="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-12 text-center self-start hidden xl:grid place-items-center">
          <div class="max-w-xs">
            <div class="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </div>
            <h3 class="font-display text-sm font-bold text-slate-800">Éditer un dashboard</h3>
            <p class="mt-1 text-xs text-slate-500 leading-relaxed">
              Sélectionnez un dashboard dans la liste de gauche pour mettre à jour son URL Power BI ou créer un nouveau rapport.
            </p>
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
        this.notify(id ? 'Dashboard mis à jour avec succès' : 'Dashboard créé avec succès');
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
