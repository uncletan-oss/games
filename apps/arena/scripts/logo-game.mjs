/**
 * Logo (SVG 512×512) tiap game. Gaya sama dengan logo Mahjong & Arena: kain giok + benda gading.
 * Isi utama dibungkus <g id="isi"> supaya versi "maskable" bisa diperkecil.
 */
const DEFS = `
  <defs>
    <radialGradient id="kain" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="#1E5246"/><stop offset="1" stop-color="#0B211C"/></radialGradient>
    <linearGradient id="muka" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFBF0"/><stop offset="1" stop-color="#EADFC4"/></linearGradient>
    <linearGradient id="kayu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A56A37"/><stop offset="1" stop-color="#6E3F1B"/></linearGradient>
  </defs>`;
const bungkus = isi => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${DEFS}
  <rect id="latar" width="512" height="512" fill="url(#kain)"/>
  <g id="isi">${isi}</g>
</svg>`;

/** Kartu remi gading berputar di sekitar (cx, cy). */
function kartu(cx, cy, sudut, isi, w = 170, h = 240) {
  return `<g transform="rotate(${sudut} ${cx} ${cy})">
    <rect x="${cx - w / 2 - 6}" y="${cy - h / 2 + 8}" width="${w}" height="${h}" rx="20" fill="#C9A24A"/>
    <rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="20" fill="url(#muka)" stroke="#D9CCAA" stroke-width="2"/>
    ${isi(cx - w / 2, cy - h / 2, w, h)}
  </g>`;
}
const teks = (x, y, ukuran, warna, isi, extra = '') =>
  `<text x="${x}" y="${y}" font-family="DejaVu Serif, Georgia, serif" font-weight="700" font-size="${ukuran}" fill="${warna}" text-anchor="middle" ${extra}>${isi}</text>`;
const kartuRemi = (pkt, simbol, warna) => (x, y, w, h) =>
  teks(x + 26, y + 46, 38, warna, pkt) + teks(x + 26, y + 80, 30, warna, simbol) + teks(x + w / 2 + 8, y + h / 2 + 44, 110, warna, simbol);

const TITIK = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
/** Kartu domino tegak di (cx, cy). */
function domino(cx, cy, sudut, a, b, w = 130) {
  const h = w * 2, d = w * 0.27, r = w * 0.085;
  const sisi = (n, oy) => TITIK[n].map(([i, j]) => `<circle cx="${cx + i * d}" cy="${oy + j * d}" r="${r}" fill="${a === b ? '#B3261E' : '#1d1d1b'}"/>`).join('');
  return `<g transform="rotate(${sudut} ${cx} ${cy})">
    <rect x="${cx - w / 2 - 6}" y="${cy - h / 2 + 8}" width="${w}" height="${h}" rx="18" fill="#C9A24A"/>
    <rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="18" fill="url(#muka)" stroke="#D9CCAA" stroke-width="2"/>
    <line x1="${cx - w / 2 + 14}" y1="${cy}" x2="${cx + w / 2 - 14}" y2="${cy}" stroke="#A79F8B" stroke-width="5" stroke-linecap="round"/>
    ${sisi(a, cy - h / 4)}${sisi(b, cy + h / 4)}
  </g>`;
}

export const LOGO = {
  ludo: () => {
    const kuadran = (x, y, warna) => `<rect x="${x}" y="${y}" width="124" height="124" rx="22" fill="${warna}"/>
      <circle cx="${x + 62}" cy="${y + 62}" r="36" fill="#FFFDF6"/><circle cx="${x + 62}" cy="${y + 62}" r="22" fill="${warna}" stroke="#fff" stroke-width="5"/>`;
    return bungkus(`
      <rect x="100" y="104" width="320" height="320" rx="40" fill="#C9A24A"/>
      <rect x="96" y="96" width="320" height="320" rx="40" fill="url(#muka)"/>
      ${kuadran(110, 110, '#D9483B')}${kuadran(278, 110, '#2E9E5B')}${kuadran(110, 278, '#2F7BD6')}${kuadran(278, 278, '#E2B33B')}
      <polygon points="234,234 278,234 256,256" fill="#2E9E5B"/><polygon points="278,234 278,278 256,256" fill="#E2B33B"/>
      <polygon points="278,278 234,278 256,256" fill="#2F7BD6"/><polygon points="234,278 234,234 256,256" fill="#D9483B"/>`);
  },
  ulartangga: () => {
    let sel = '';
    for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) sel += `<rect x="${96 + j * 64}" y="${96 + i * 64}" width="64" height="64" fill="${(i + j) % 2 ? '#F2D79A' : '#FFF4D6'}"/>`;
    let anak = '';
    for (let t = 0.12; t < 0.95; t += 0.14) {
      const x = 150 + (320 - 150) * t, y = 390 - (390 - 130) * t;
      anak += `<line x1="${x - 24}" y1="${y - 14}" x2="${x + 24}" y2="${y + 14}" stroke="#8B5A2B" stroke-width="10" stroke-linecap="round"/>`;
    }
    return bungkus(`
      <rect x="100" y="104" width="320" height="320" rx="34" fill="#C9A24A"/>
      <clipPath id="papan"><rect x="96" y="96" width="320" height="320" rx="34"/></clipPath>
      <g clip-path="url(#papan)">${sel}</g>
      <line x1="126" y1="376" x2="296" y2="116" stroke="#8B5A2B" stroke-width="12" stroke-linecap="round"/>
      <line x1="174" y1="404" x2="344" y2="144" stroke="#8B5A2B" stroke-width="12" stroke-linecap="round"/>
      ${anak}
      <path d="M372 150 C 300 170, 400 250, 300 270 S 220 330, 160 360" fill="none" stroke="#1E7A44" stroke-width="34" stroke-linecap="round"/>
      <path d="M372 150 C 300 170, 400 250, 300 270 S 220 330, 160 360" fill="none" stroke="#9BE08F" stroke-width="8" stroke-dasharray="14 18" stroke-linecap="round"/>
      <circle cx="376" cy="148" r="28" fill="#1E7A44"/><circle cx="368" cy="140" r="6" fill="#fff"/><circle cx="386" cy="140" r="6" fill="#fff"/>
      <path d="M376 172 l 0 18 m 0 0 l -8 10 m 8 -10 l 8 10" stroke="#D9483B" stroke-width="5" fill="none" stroke-linecap="round"/>`);
  },
  catur: () => {
    let sel = '';
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) sel += `<rect x="${120 + j * 68}" y="${150 + i * 68}" width="68" height="68" fill="${(i + j) % 2 ? '#B07A4E' : '#EEDDB8'}"/>`;
    return bungkus(`
      <rect x="114" y="152" width="284" height="284" rx="20" fill="#3E2614"/>
      <clipPath id="papan"><rect x="120" y="150" width="272" height="272" rx="18"/></clipPath>
      <g clip-path="url(#papan)">${sel}</g>
      ${teks(270, 400, 330, '#3E2614', '♞', 'font-family="DejaVu Sans"')}
      ${teks(256, 388, 330, '#FFFBF0', '♞', 'font-family="DejaVu Sans" stroke="#1d1d1b" stroke-width="8" paint-order="stroke"')}`);
  },
  halma: () => {
    const kel = (x, y, w) => `<circle cx="${x}" cy="${y}" r="17" fill="${w}" stroke="#fff" stroke-width="4"/>`;
    return bungkus(`
      <g transform="translate(6 10)" fill="#C9A24A"><polygon points="256,62 424,353 88,353"/><polygon points="256,450 424,159 88,159"/></g>
      <g fill="url(#muka)" stroke="#B58B52" stroke-width="4" stroke-linejoin="round"><polygon points="256,62 424,353 88,353"/><polygon points="256,450 424,159 88,159"/></g>
      ${kel(256, 112, '#D9483B')}${kel(236, 148, '#D9483B')}${kel(276, 148, '#D9483B')}
      ${kel(256, 400, '#2E9E5B')}${kel(236, 364, '#2E9E5B')}${kel(276, 364, '#2E9E5B')}
      ${kel(140, 190, '#2F7BD6')}${kel(176, 190, '#2F7BD6')}${kel(158, 222, '#2F7BD6')}
      ${kel(372, 322, '#E2B33B')}${kel(336, 322, '#E2B33B')}${kel(354, 290, '#E2B33B')}
      ${kel(256, 256, '#D9483B')}<circle cx="300" cy="256" r="14" fill="#8A6A3E" fill-opacity=".35"/><circle cx="212" cy="256" r="14" fill="#8A6A3E" fill-opacity=".35"/>`);
  },
  congklak: () => {
    const lubang = (x, y, biji) => `<ellipse cx="${x}" cy="${y}" rx="30" ry="34" fill="#3E220D"/>` +
      Array.from({ length: biji }, (_, i) => `<circle cx="${x - 10 + (i % 2) * 20}" cy="${y - 10 + Math.floor(i / 2) * 18}" r="8" fill="#F4EEDD"/>`).join('');
    return bungkus(`
      <g transform="rotate(-18 256 256)">
        <rect x="58" y="186" width="396" height="160" rx="80" fill="#4A2A10"/>
        <rect x="52" y="176" width="396" height="160" rx="80" fill="url(#kayu)"/>
        <rect x="74" y="200" width="56" height="112" rx="28" fill="#3E220D"/>
        <rect x="370" y="200" width="56" height="112" rx="28" fill="#3E220D"/>
        <circle cx="94" cy="236" r="8" fill="#F4EEDD"/><circle cx="110" cy="256" r="8" fill="#F4EEDD"/><circle cx="94" cy="276" r="8" fill="#F4EEDD"/>
        <circle cx="390" cy="246" r="8" fill="#F4EEDD"/><circle cx="406" cy="266" r="8" fill="#F4EEDD"/>
        ${lubang(176, 220, 3)}${lubang(240, 220, 2)}${lubang(304, 220, 4)}
        ${lubang(176, 292, 2)}${lubang(240, 292, 4)}${lubang(304, 292, 1)}
      </g>`);
  },
  uno: () => {
    const warna = ['#D7262E', '#EDB21B', '#2E9E4B', '#1E6FD0'];
    const label = ['7', '2', '⇄', '+4'];
    return bungkus(warna.map((w, i) => {
      const sudut = -21 + i * 14;
      return `<g transform="rotate(${sudut} 256 470) translate(6 12)">
        <rect x="174" y="118" width="164" height="236" rx="20" fill="rgba(0,0,0,.35)"/>
        <rect x="168" y="108" width="164" height="236" rx="20" fill="${w}" stroke="#fff" stroke-width="9"/>
        <ellipse cx="250" cy="226" rx="56" ry="80" fill="#fff" transform="rotate(28 250 226)"/>
        ${teks(250, 252, i === 3 ? 66 : 76, w, label[i], 'font-family="DejaVu Sans" font-style="italic"')}
      </g>`;
    }).join(''));
  },
  remi: () => bungkus(
    kartu(206, 268, -18, kartuRemi('K', '♥', '#B3261E')) +
    kartu(256, 252, 0, kartuRemi('Q', '♣', '#1d1d1b')) +
    kartu(306, 268, 18, kartuRemi('A', '♠', '#1d1d1b'))),
  cangkul: () => bungkus(
    kartu(230, 270, -12, kartuRemi('A', '♠', '#1d1d1b'), 190, 268) + `
    <g transform="rotate(24 340 270)">
      <rect x="328" y="150" width="24" height="290" rx="12" fill="#6E3F1B"/>
      <rect x="332" y="150" width="8" height="290" rx="4" fill="#A56A37"/>
      <path d="M296 122 L392 122 L384 182 L304 182 Z" fill="#8E9AA3" stroke="#5F6B73" stroke-width="5" stroke-linejoin="round"/>
      <rect x="320" y="166" width="40" height="22" rx="6" fill="#5F6B73"/>
    </g>`),
  capsa: () => bungkus(
    kartu(196, 280, -24, kartuRemi('3', '♦', '#B3261E'), 150, 220) +
    kartu(236, 266, -8, kartuRemi('3', '♣', '#1d1d1b'), 150, 220) +
    kartu(276, 266, 8, kartuRemi('3', '♥', '#B3261E'), 150, 220) +
    kartu(316, 280, 24, kartuRemi('2', '♠', '#1d1d1b'), 150, 220)),
  ceki: () => {
    const ceki = (cx, sudut, han, simbol, warna) => `<g transform="rotate(${sudut} ${cx} 300)">
      <rect x="${cx - 46}" y="128" width="100" height="270" rx="14" fill="#C9A24A"/>
      <rect x="${cx - 52}" y="118" width="100" height="270" rx="14" fill="url(#muka)" stroke="#C8B98F" stroke-width="3"/>
      <text x="${cx - 2}" y="270" font-family="WenQuanYi Zen Hei, sans-serif" font-size="92" font-weight="700" fill="${warna}" text-anchor="middle">${han}</text>
      <text x="${cx - 2}" y="360" font-family="WenQuanYi Zen Hei, DejaVu Sans, sans-serif" font-size="58" fill="${warna}" text-anchor="middle">${simbol}</text>
    </g>`;
    return bungkus(ceki(170, -14, '一', '●', '#1F5FB0') + ceki(258, 0, '五', '‖', '#1E7A44') + ceki(346, 14, '九', '萬', '#B3261E'));
  },
  gaple: () => bungkus(domino(196, 262, -16, 6, 6) + domino(318, 270, 14, 3, 5))
};
