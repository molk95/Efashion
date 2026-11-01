import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { errorMessage } from '../../core/auth.guards';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
  <main class="min-h-screen grid lg:grid-cols-2 bg-slate-50">
    <!-- Panneau visuel (clair, pastel doux) -->
    <section class="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-brand-50/70 via-white to-amber-50/50 border-r border-slate-200/80">
      <div class="absolute -top-32 -left-32 h-[26rem] w-[26rem] rounded-full bg-brand-200/35 blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-0 right-0 h-[22rem] w-[22rem] rounded-full bg-amber-200/30 blur-3xl pointer-events-none"></div>

      <div class="relative flex items-center gap-3">
        <img src="favicon.svg" alt="" class="h-10 w-10 shadow-sm rounded-xl" />
        <span class="font-display text-xl font-bold tracking-tight text-slate-900">
          eFashion <span class="text-gradient">BI</span>
        </span>
      </div>

      <div class="relative space-y-6 animate-fade-up">
        <h2 class="font-display text-5xl font-extrabold leading-tight text-slate-900">
          Le décisionnel<br /><span class="text-gradient">de la mode</span>, réuni.
        </h2>

        <p class="max-w-md text-slate-600 text-base leading-relaxed">
          Catalogue, collections, merchandising et fiches produits : vos dashboards Power BI sécurisés dans un portail collaboratif dédié.
        </p>

        <div class="inline-flex gap-3 max-w-md">
          @for (k of kpis; track k.l) {
            <div class="glass rounded-2xl px-6 py-4 bg-white/80 border border-slate-200 shadow-sm">
              <div class="font-display text-3xl font-bold text-slate-900">{{ k.v }}</div>
              <div class="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-0.5">{{ k.l }}</div>
            </div>
          }
        </div>
      </div>

      <p class="relative text-xs font-medium text-slate-500">eFashion · 2026</p>
    </section>

    <!-- Formulaire -->
    <section class="flex items-center justify-center p-6 bg-slate-50/70">
      <div class="glass w-full max-w-md rounded-3xl p-8 sm:p-10 animate-fade-up bg-white border border-slate-200/90 shadow-xl shadow-slate-200/50">
        <div class="flex items-center justify-between">
          <h1 class="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            {{ isLogin ? 'Connexion' : 'Créer un compte' }}
          </h1>
          <div class="grid h-10 w-10 place-items-center rounded-2xl bg-brand-50 border border-brand-100 text-brand-600">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              @if (isLogin) {
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>
              } @else {
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM20 8v6M23 11h-6"/>
              }
            </svg>
          </div>
        </div>

        <p class="mt-1.5 text-sm text-slate-500">
          {{ isLogin ? 'Accédez à votre tableau de bord Power BI.' : 'Accédez à votre espace en tant que lecteur (VIEWER).' }}
        </p>

        <form class="mt-8 space-y-4" (ngSubmit)="submit()" #f="ngForm">
          @if (!isLogin) {
            <div>
              <label class="label" for="fullName">Nom complet</label>
              <input id="fullName" name="fullName" class="input" [(ngModel)]="fullName" required minlength="2" placeholder="Jeanne Dupont" />
            </div>
          }
          <div>
            <label class="label" for="email">Adresse email</label>
            <input id="email" name="email" type="email" class="input" [(ngModel)]="email" required email placeholder="prenom.nom@esprit.tn" autocomplete="email" />
          </div>
          <div>
            <label class="label" for="password">Mot de passe</label>
            <input id="password" name="password" type="password" class="input" [(ngModel)]="password" required [minlength]="isLogin ? 1 : 8"
              placeholder="••••••••" [autocomplete]="isLogin ? 'current-password' : 'new-password'" />
          </div>

          @if (error()) {
            <div class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700 flex items-center gap-2">
              <svg class="h-4 w-4 shrink-0 text-rose-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
              </svg>
              <span>{{ error() }}</span>
            </div>
          }

          <button id="auth-submit" type="submit" class="btn-primary w-full py-3" [disabled]="f.invalid || loading()">
            @if (loading()) {
              <span class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
            }
            {{ isLogin ? 'Se connecter' : 'Créer mon compte' }}
          </button>
        </form>

        <p class="mt-6 text-center text-sm text-slate-500">
          @if (isLogin) {
            Pas encore de compte ? <a id="link-register" routerLink="/register" class="font-semibold text-brand-600 hover:text-brand-700">S'inscrire</a>
          } @else {
            Déjà inscrit ? <a id="link-login" routerLink="/login" class="font-semibold text-brand-600 hover:text-brand-700">Se connecter</a>
          }
        </p>
      </div>
    </section>
  </main>
  `,
})
export class AuthComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isLogin = this.route.snapshot.data['mode'] !== 'register';
  kpis = [
    { v: '4', l: 'Décideurs' },
  ];
  fullName = '';
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  submit() {
    this.loading.set(true);
    this.error.set('');
    const req = this.isLogin
      ? this.auth.login(this.email, this.password)
      : this.auth.register(this.fullName, this.email, this.password);
    req.subscribe({
      next: () => this.router.navigateByUrl(this.route.snapshot.queryParamMap.get('redirect') || '/'),
      error: (e) => {
        this.error.set(errorMessage(e));
        this.loading.set(false);
      },
    });
  }
}
