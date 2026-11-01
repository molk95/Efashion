import { Injectable, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

const ALLOWED_HOSTS = ['app.powerbi.com', 'app.powerbigov.us', 'app.powerbi.cn'];

export interface ParsedEmbed {
  inputType: 'iframe' | 'url' | 'empty' | 'unknown';
  url: string | null;
  valid: boolean;
  error?: string;
}

/**
 * Gère les deux formats fournis par Power BI « Publier sur le web » :
 *  1. lien direct  : https://app.powerbi.com/view?r=...
 *  2. snippet HTML : <iframe title="..." src="https://app.powerbi.com/view?r=..." ...></iframe>
 */
@Injectable({ providedIn: 'root' })
export class PowerBiUrlService {
  private sanitizer = inject(DomSanitizer);

  /** Extrait l'URL brute (src de l'iframe ou lien direct), sans validation. */
  extract(raw: string | null | undefined): { url: string; inputType: ParsedEmbed['inputType'] } {
    const input = (raw ?? '').trim();
    if (!input) return { url: '', inputType: 'empty' };

    if (/<iframe[\s>]/i.test(input)) {
      let src = '';
      // 1) DOMParser : parsing HTML robuste (aucun script exécuté, document inerte)
      try {
        const doc = new DOMParser().parseFromString(input, 'text/html');
        src = doc.querySelector('iframe')?.getAttribute('src') ?? '';
      } catch {
        /* fallback regex ci-dessous */
      }
      // 2) Fallback regex
      if (!src) {
        const m = input.match(/\ssrc\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
        src = m ? (m[2] ?? m[3] ?? m[4] ?? '') : '';
      }
      return { url: this.decode(src.trim()), inputType: 'iframe' };
    }
    return { url: this.decode(input), inputType: /^https?:\/\//i.test(input) ? 'url' : 'unknown' };
  }

  /** Extrait + valide (HTTPS, domaine Power BI, chemin /view?r= ou /reportEmbed). */
  parse(raw: string | null | undefined): ParsedEmbed {
    const { url, inputType } = this.extract(raw);
    if (inputType === 'empty') return { inputType, url: null, valid: false, error: 'Aucun lien renseigné.' };
    if (!url) return { inputType, url: null, valid: false, error: "Attribut src introuvable dans l'iframe." };
    let u: URL;
    try {
      u = new URL(url);
    } catch {
      return { inputType, url: null, valid: false, error: 'URL invalide.' };
    }
    if (u.protocol !== 'https:') return { inputType, url: null, valid: false, error: "L'URL doit être en HTTPS." };
    if (!ALLOWED_HOSTS.includes(u.hostname.toLowerCase()))
      return { inputType, url: null, valid: false, error: `Domaine non autorisé : ${u.hostname}` };
    const isView = u.pathname.startsWith('/view') && !!u.searchParams.get('r');
    const isEmbed = u.pathname.toLowerCase().startsWith('/reportembed');
    if (!isView && !isEmbed)
      return { inputType, url: null, valid: false, error: 'Format attendu : https://app.powerbi.com/view?r=…' };
    return { inputType, url: u.toString(), valid: true };
  }

  /** URL sécurisée prête pour [src] d'une iframe, ou null si invalide. */
  toSafeUrl(raw: string | null | undefined): SafeResourceUrl | null {
    const p = this.parse(raw);
    // L'URL est validée (https + domaine Power BI) AVANT le bypass : aucune URL arbitraire n'est approuvée.
    return p.valid && p.url ? this.sanitizer.bypassSecurityTrustResourceUrl(p.url) : null;
  }

  private decode(s: string): string {
    return s
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>');
  }
}
