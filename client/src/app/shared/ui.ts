const PALETTE: Record<string, { chip: string; dot: string; icon: string }> = {
  Catalogue: { chip: 'bg-brand-500/15 text-brand-300', dot: 'bg-brand-400', icon: 'M4 6h16M4 12h16M4 18h10' },
  Ventes: { chip: 'bg-emerald-500/15 text-emerald-300', dot: 'bg-emerald-400', icon: 'M3 17l6-6 4 4 8-8M14 7h7v7' },
  Logistique: { chip: 'bg-sky-500/15 text-sky-300', dot: 'bg-sky-400', icon: 'M3 7h11v10H3zM14 10h4l3 3v4h-7' },
};
const FALLBACK = { chip: 'bg-gold-500/15 text-gold-300', dot: 'bg-gold-400', icon: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z' };

export const categoryStyle = (c: string) => PALETTE[c] ?? FALLBACK;

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
