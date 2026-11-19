// Self-contained illustrated fallback for products without an available photo.
// Never labels unrelated stock photography as the actual product.
const THEMES = {
  grocery: ["#E5F5D8", "#588A47"],
  electronics: ["#DDEBFE", "#3266A0"],
  fashion: ["#F9DFEA", "#A44873"],
  home: ["#FAEAD3", "#A26932"],
  health: ["#DEF1E8", "#35846A"],
  pet: ["#F7E7DA", "#AD6943"],
  tools: ["#E1E8F0", "#607389"],
  gifts: ["#F9E2E2", "#AB5D69"],
  default: ["#E6EBE7", "#647C69"],
};
const escapeXml = (s) => String(s ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&apos;");

export function categoryTheme(category) {
  const value = String(category ?? "").toLowerCase();
  if (/grocery|staple|snack|dairy|fruit|vegetable|personal-care/.test(value)) return "grocery";
  if (/electronic|accessor/.test(value)) return "electronics";
  if (/fashion|men|women|kids|baby/.test(value)) return "fashion";
  if (/home|kitchen|dining|household|cleaning|decor|furnish/.test(value)) return "home";
  if (/health|wellness/.test(value)) return "health";
  if (/pet|garden/.test(value)) return "pet";
  if (/tool|hardware|auto|travel/.test(value)) return "tools";
  if (/gift|festival/.test(value)) return "gifts";
  return "default";
}

const ICONS = {
  grocery: '<path d="M122 186h236l-26 132H150z" fill="none" stroke="currentColor" stroke-width="14" stroke-linejoin="round"/><path d="M190 187l50-92 50 92M189 221v60m52-60v60m52-60v60" fill="none" stroke="currentColor" stroke-width="13" stroke-linecap="round"/>',
  electronics: '<rect x="123" y="109" width="234" height="166" rx="18" fill="none" stroke="currentColor" stroke-width="15"/><path d="M240 275v54m-83 0h166" fill="none" stroke="currentColor" stroke-width="15" stroke-linecap="round"/>',
  fashion: '<path d="M175 112l65 29 65-29 65 83-52 39-20-30v120H182V204l-20 30-52-39z" fill="none" stroke="currentColor" stroke-width="14" stroke-linejoin="round"/>',
  home: '<path d="M105 204l135-113 135 113M143 186v139h194V186M209 325v-87h62v87" fill="none" stroke="currentColor" stroke-width="15" stroke-linejoin="round"/>',
  health: '<path d="M240 334s-122-76-122-151c0-37 28-63 62-63 29 0 49 16 60 37 11-21 31-37 60-37 34 0 62 26 62 63 0 75-122 151-122 151z" fill="none" stroke="currentColor" stroke-width="14"/><path d="M240 179v78m-39-39h78" stroke="currentColor" stroke-width="14" stroke-linecap="round"/>',
  pet: '<circle cx="240" cy="252" r="60" fill="none" stroke="currentColor" stroke-width="14"/><circle cx="156" cy="168" r="21" fill="currentColor"/><circle cx="214" cy="135" r="21" fill="currentColor"/><circle cx="274" cy="135" r="21" fill="currentColor"/><circle cx="332" cy="168" r="21" fill="currentColor"/>',
  tools: '<path d="M159 104c43-14 88 9 96 49l-47 47 69 69 25-25 61 61-49 49-61-61 25-25-69-69-47 47c-40-8-63-53-49-96l39 39 47-47z" fill="none" stroke="currentColor" stroke-width="14" stroke-linejoin="round"/>',
  gifts: '<rect x="124" y="192" width="232" height="146" rx="7" fill="none" stroke="currentColor" stroke-width="14"/><path d="M114 191h252v-45H114zM240 147v191M240 147c-60-85-121-42-88 0m88 0c60-85 121-42 88 0" fill="none" stroke="currentColor" stroke-width="14"/>',
  default: '<path d="M124 161l116-62 116 62v136l-116 65-116-65zM124 161l116 66 116-66m-116 66v135" fill="none" stroke="currentColor" stroke-width="14" stroke-linejoin="round"/>',
};

export function productIllustration(name, category) {
  const theme = categoryTheme(category);
  const [background, foreground] = THEMES[theme];
  const title = String(name || "Product").replace(/[\x00-\x1F]/g, " ").trim().slice(0, 52);
  const parts = title.split(/\s+/);
  const lines = [""];
  for (const word of parts) {
    const i = lines.length - 1;
    if ((lines[i] + " " + word).trim().length > 24 && lines.length < 2) lines.push(word);
    else lines[i] = (lines[i] + " " + word).trim();
  }
  const label = lines.map((line, i) =>
    `<text x="240" y="${408 + i * 32}" text-anchor="middle" font-size="22" font-weight="700" fill="#293449" font-family="Arial, sans-serif">${escapeXml(line)}</text>`
  ).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480" width="480" height="480" role="img" aria-label="Illustration of ${escapeXml(title)}">
<rect width="480" height="480" rx="22" fill="${background}"/>
<circle cx="240" cy="216" r="165" fill="#fff" opacity=".6"/>
<g color="${foreground}">${ICONS[theme]}</g>
${label}
<text x="240" y="464" text-anchor="middle" font-size="12" fill="#667085" font-family="Arial, sans-serif">BSP CART · Catalogue illustration</text>
</svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}
