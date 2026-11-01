/**
 * Utilitaires Power BI : accepte un lien direct "Publier sur le web"
 * ou un snippet <iframe ... src="..."> complet, et renvoie l'URL nettoyée.
 */
const ALLOWED_HOSTS = ['app.powerbi.com', 'app.powerbigov.us', 'app.powerbi.cn'];

export interface EmbedValidation {
  valid: boolean;
  url: string | null;
  inputType: 'iframe' | 'url' | 'empty' | 'unknown';
  error?: string;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

export function extractEmbedUrl(raw: string | null | undefined): { url: string; inputType: EmbedValidation['inputType'] } {
  const input = (raw ?? '').trim();
  if (!input) return { url: '', inputType: 'empty' };
  if (/<iframe[\s>]/i.test(input)) {
    const m = input.match(/\ssrc\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const src = m ? m[2] ?? m[3] ?? m[4] ?? '' : '';
    return { url: decodeEntities(src.trim()), inputType: 'iframe' };
  }
  return { url: decodeEntities(input), inputType: /^https?:\/\//i.test(input) ? 'url' : 'unknown' };
}

export function validateEmbed(raw: string | null | undefined): EmbedValidation {
  const { url, inputType } = extractEmbedUrl(raw);
  if (inputType === 'empty') return { valid: false, url: null, inputType, error: 'Aucune valeur fournie.' };
  if (!url) return { valid: false, url: null, inputType, error: "Attribut src introuvable dans l'iframe." };
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, url: null, inputType, error: 'URL invalide.' };
  }
  if (parsed.protocol !== 'https:') return { valid: false, url: null, inputType, error: "L'URL doit être en HTTPS." };
  if (!ALLOWED_HOSTS.includes(parsed.hostname.toLowerCase()))
    return { valid: false, url: null, inputType, error: `Domaine non autorisé (${parsed.hostname}). Attendu : app.powerbi.com.` };
  const isView = parsed.pathname.startsWith('/view') && !!parsed.searchParams.get('r');
  const isEmbed = parsed.pathname.toLowerCase().startsWith('/reportembed');
  if (!isView && !isEmbed)
    return { valid: false, url: null, inputType, error: 'Format attendu : https://app.powerbi.com/view?r=...' };
  return { valid: true, url: parsed.toString(), inputType };
}
