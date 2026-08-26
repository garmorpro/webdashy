const AVATAR_PALETTE = [
  { bg: "#FFF1E0", text: "#B8621B" },
  { bg: "#EAF0FF", text: "#2D4FA8" },
  { bg: "#F1E9FF", text: "#6B3FB8" },
  { bg: "#EFFFE0", text: "#3E6013" },
  { bg: "#FFE4EC", text: "#B8214F" },
];

/**
 * Deterministic pastel color pair for a name-initials avatar chip — same
 * hash-into-a-fixed-palette approach as portal-template-card.tsx's
 * gradientFor. No color is ever stored; the same business name always
 * lands on the same pair, which is what lets it look consistent across
 * the Dashboard's activity feed and the Clients table without the two
 * being wired together.
 */
export function avatarColorsFor(name: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
