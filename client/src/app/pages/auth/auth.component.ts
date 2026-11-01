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
  <main class="min-h-screen grid lg:grid-cols-2">
    <!-- Panneau visuel -->
    <section class="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden">
      <div class="absolute -top-32 -left-32 h-[28rem] w-[28rem] rounded-full bg-brand-500/25 blur-3xl"></div>
      <div class="absolute bottom-0 right-0 h-[22rem] w-[22rem] rounded-full bg-gold-400/15 blur-3xl"></div>
      <div class="relative flex items-center gap-3">
        <img src="favicon.svg" alt="" class="h-10 w-10" />
        <span class="font-display text-xl font-bold tracking-tight">eFashion <span class="text-gradient">BI</span></span>
      </div>
      <div class="relative space-y-6 animate-fade-up">
        <h2 class="font-display text-5xl font-extrabold leading-tight">
          Le décisionnel<br /><span class="text-gradient">de la mode</span>, réuni.
        </h2>
        <p class="max-w-md text-slate-400">
          Catalogue, ventes, logistique : tous les dashboards Power BI de l'équipe dans un seul portail élégant et sécurisé.
        </p>
        <div class="grid grid-cols-3 gap-3 max-w-md">
          @for (k of kpis; track k.l) {
            <div class="glass rounded-2xl p-4">
              <div class="font-display text-2xl font-bold text-white">{{ k.v }}</div>
              <div class="text-xs text-slate-400">{{ k.l }}</div>
            </div>
          }
        </div>
      </div>
      <p class="relative text-xs text-slate-500">Projet décisionnel eFashion · Power BI</p>
    </section>

    <!-- Formulaire -->
    <section class="flex items-center justify-center p-6">
      <div class="glass w-full max-w-md rounded-3xl p-8 animate-fade-up">
        <h1 class="font-display text-3xl font-bold text-white">{{ isLogin ? 'Bon retour 👋' : 'Créer un compte' }}</h1>
        <p class="mt-1 text-sm text-slate-400">
          {{ isLogin ? 'Connectez-vous pour accéder aux dashboards.' : 'Accès en lecture aux dashboards de l\\'équipe.' }}
        </p>

        <form class="mt-8 space-y-4" (ngSubmit)="submit()" #f="ngForm">
          @if (!isLogin) {
            <div>
              <label class="label" for="fullName">Nom complet</label>
              <input id="fullName" name="fullName" class="input" [(ngModel)]="fullName" required minlength="2" placeholder="Jeanne Dupont" />
            </div>
          }
          <div>
            <label class="label" for="email">Email</label>
            <input id="email" name="email" type="email" class="input" [(ngModel)]="email" required email placeholder="vous@exemple.com" autocomplete="email" />
          </div>
          <div>
            <label class="label" for="password">Mot de passe</label>
            <input id="password" name="password" type="password" class="input" [(ngModel)]="password" required [minlength]="isLogin ? 1 : 8"
              placeholder="••••••••" [autocomplete]="isLogin ? 'current-password' : 'new-password'" />
          </div>

          @if (error()) {
            <div class="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-200">{{ error() }}</div>
          }

          <button id="auth-submit" type="submit" class="btn-primary w-full py-3" [disabled]="f.invalid || loading()">
            @if (loading()) { <span class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span> }
            {{ isLogin ? 'Se connecter' : 'Créer mon compte' }}
          </button>
        </form>

        <p class="mt-6 text-center text-sm text-slate-400">
          @if (isLogin) {
            Pas encore de compte ? <a id="link-register" routerLink="/register" class="font-semibold text-brand-300 hover:text-brand-200">S'inscrire</a>
          } @else {
            Déjà inscrit ? <a id="link-login" routerLink="/login" class="font-semibold text-brand-300 hover:text-brand-200">Se connecter</a>
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
    { v: '3', l: 'Domaines' },
    { v: '100%', l: 'Power BI' },
    { v: '24/7', l: 'Accès' },
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
