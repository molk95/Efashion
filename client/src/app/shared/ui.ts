type Style = { chip: string; dot: string; icon: string };

const PALETTE: Record<string, Style> = {
  'Développement des collections': { chip: 'bg-brand-500/15 text-brand-300', dot: 'bg-brand-400', icon: 'M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 15.6 7.1 18.2l.9-5.5-4-3.9 5.5-.8z' },
  'Merchandising produit': { chip: 'bg-emerald-500/15 text-emerald-300', dot: 'bg-emerald-400', icon: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z' },
  'Gestion du catalogue e-commerce': { chip: 'bg-sky-500/15 text-sky-300', dot: 'bg-sky-400', icon: 'M3 4h2l2.4 11h11L21 7H6.2M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z' },
  'Qualité des fiches produits': { chip: 'bg-violet-500/15 text-violet-300', dot: 'bg-violet-400', icon: 'M9 12l2 2 4-4M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z' },
};
const FALLBACK: Style = { chip: 'bg-gold-500/15 text-gold-300', dot: 'bg-gold-400', icon: 'M3 3v18h18M7 15l4-4 3 3 5-6' };

export const DEFAULT_CATEGORIES = Object.keys(PALETTE);

export const categoryStyle = (c: string) => PALETTE[c] ?? FALLBACK;

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
