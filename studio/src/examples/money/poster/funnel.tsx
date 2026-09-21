import {AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile} from 'remotion';
import {Video} from '@remotion/media';
import {Barcode, chamfer, ChamferBox, GlassStage, Grain, MediaFrame, mono, PC, PlateCanvas, plateText, poster, TECH, toStage, type PlateDraw} from '../../../kit/poster';
import {ClaudeMark, ServiceChip} from './blocks';
import {GlassBars, GlassBubble, GlassFunnel, GlassMegaphone} from './objects';

// Холст-воронка ролика 20 (16,25–63,55 с): четыре этапа — полосы-плакаты 1440×2940 сеткой 2×2 на тёмной подложке.
// 01 Реклама (Pipeboard) → 02 Заявки (Zernio) → 03 Сделки (MCP для amoCRM и Битрикс24) → 04 Деньги (Metabase).
// Камера — точка мира в центре окна (720, 735) и зум; окно — верх кадра 1440×1470, ниже — чёрный подвал с субтитрами и спикером.
// Каждый переезд — по слову речи; на длинных переездах камера отъезжает (провал зума), и видно, как рисуется связь между этапами.
export const CANVAS_IN = 16.25, CANVAS_OUT = 63.55;
const BW = 1440, VH = 1470, BH = VH * 2, GAP = 400;
const WORLD_W = BW * 2 + GAP, WORLD_H = BH * 2 + GAP;
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const out = Easing.bezier(0.16, 1, 0.3, 1);
const inOut = Easing.bezier(0.65, 0, 0.35, 1);
const appear = (t: number, a: number, d = 0.3) => interpolate(t, [a, a + d], [0, 1], {...cl, easing: out});
const pos = (x: number, y: number): React.CSSProperties => ({position: 'absolute', left: x, top: y});

type Stage = {x: number; y: number; bg: string; ink: string; num: string; title: string; glass: [number, number]};
const S: Stage[] = [
  {x: 0, y: 0, bg: PC.orange, ink: PC.ink, num: '01', title: 'РЕКЛАМА', glass: [19.0, 24.1]},
  {x: BW + GAP, y: 0, bg: PC.mint, ink: PC.mintInk, num: '02', title: 'ЗАЯВКИ', glass: [30.8, 35.5]},
  {x: BW + GAP, y: BH + GAP, bg: PC.ink, ink: PC.white, num: '03', title: 'СДЕЛКИ', glass: [37.9, 43.7]},
  {x: 0, y: BH + GAP, bg: PC.grey, ink: PC.ink, num: '04', title: 'ДЕНЬГИ', glass: [53.9, 58.1]},
];

// ---------- камера ----------
type Cam = {x: number; y: number; z: number};
const view = (i: number, sub: 0 | 1): Cam => ({x: S[i].x + BW / 2, y: S[i].y + sub * VH + VH / 2, z: 1});
const OVER: Cam = {x: WORLD_W / 2, y: WORLD_H / 2 - 60, z: 0.215};
// Дашборд Metabase в полосе 04: рамка 1312 шириной с отступом 8 внутри, картинка 2510×1380.
const DASH = {x: S[3].x + 64 + 8, y: S[3].y + VH + 450 + 8, sc: 1296 / 2510};
// Центр камеры не даёт окну выйти за край полосы 04 (иначе сбоку видна тёмная подложка).
const roi = (cx: number, cy: number, z = 1.4): Cam => {
  const half = BW / 2 / z;
  return {x: Math.min(S[3].x + BW - half, Math.max(S[3].x + half, DASH.x + cx * DASH.sc)), y: DASH.y + cy * DASH.sc, z};
};
const ROI = {pay: roi(840, 960), src: roi(1108, 380), bot: roi(2103, 600)};
const MOVES: {at: number; d: number; to: Cam; dip?: number}[] = [
  {at: 19.3, d: 0.95, to: view(0, 0)},          // «Первый — Pipeboard»
  {at: 23.3, d: 0.6, to: view(0, 1)},           // «Claude видит бюджеты»
  {at: 31.05, d: 1.0, to: view(1, 0), dip: 0.5}, // «Второй — Zernio»
  {at: 34.7, d: 0.6, to: view(1, 1)},           // «Claude отвечает клиентам»
  {at: 38.15, d: 0.9, to: view(2, 0), dip: 0.35}, // «Третий»
  {at: 42.9, d: 0.6, to: view(2, 1)},           // «Ставишь к своей CRM»
  {at: 50.25, d: 1.1, to: OVER},                // «финальный коннектор, который сведёт всё воедино»
  {at: 54.15, d: 1.0, to: view(3, 0)},          // «Это Metabase»
  {at: 57.15, d: 0.6, to: view(3, 1)},          // «Claude сам собирает отчёты»
  {at: 58.6, d: 0.55, to: ROI.pay},             // «окупаемость рекламы»
  {at: 59.8, d: 0.55, to: ROI.src},             // «воронки по источникам»
  {at: 61.2, d: 0.55, to: ROI.bot},             // «какие клиенты приносят больше всего денег»
];
export const camAt = (t: number): Cam => {
  let c = OVER;
  for (const m of MOVES) {
    const p = interpolate(t, [m.at, m.at + m.d], [0, 1], {...cl, easing: inOut});
    if (p <= 0) break;
    const z = Math.exp(Math.log(c.z) + (Math.log(m.to.z) - Math.log(c.z)) * p) * (1 - (m.dip ?? 0) * Math.sin(Math.PI * p));
    c = {x: c.x + (m.to.x - c.x) * p, y: c.y + (m.to.y - c.y) * p, z};
  }
  return c;
};

// ---------- постер этапа (вид «а»): огромный номер, название; стеклянный предмет поверх номера ----------
const stagePlate = (s: Stage): PlateDraw => (ctx, w, h) => {
  ctx.fillStyle = s.bg; ctx.fillRect(0, 0, w, h);
  plateText(ctx, s.num, 30, 770, 560, {family: TECH, weight: 800, color: s.ink, track: -0.02});
  plateText(ctx, s.title, 700, 452, 150, {color: s.ink});
  ctx.fillStyle = s.ink; ctx.fillRect(64, 262, 1312, 4);
};
const StageHead: React.FC<{t: number; i: number; right: string; children?: React.ReactNode}> = ({t, i, right, children}) => {
  const s = S[i];
  const [lo, hi] = s.glass;
  const glassOn = t >= lo && t < hi;
  // Предмет — над номером, левее названия этапа (x 700): рупор длиннее вправо, поэтому левее остальных.
  const place: [number, number, number][] = [[330, 590, 0.8], [380, 580, 0.85], [380, 600, 0.85], [380, 560, 0.85]];
  const [px, py, sc] = place[i];
  const [gx, gy] = toStage(BW, VH, px, py);
  const obj = [GlassMegaphone, GlassBubble, GlassFunnel, GlassBars][i];
  const Obj = obj as React.FC<{t: number; x: number; y: number; at: number; tint?: string; from?: 'top' | 'bottom'}>;
  return (
    <>
      <div style={pos(0, 0)}>
        {glassOn ? (
          <GlassStage w={BW} h={VH} plate={stagePlate(s)} shadow={i === 2 ? 0.35 : 0.2}>
            <group position={[gx, gy, 0]} scale={sc}><Obj t={t} x={0} y={0} at={lo + 0.75} tint="#F4FFFC" from="bottom" /></group>
          </GlassStage>
        ) : <PlateCanvas w={BW} h={VH} plate={stagePlate(s)} />}
      </div>
      <div style={{...pos(64, 196), width: 1312, display: 'flex', ...mono(48, 600), color: s.ink}}>
        <span>ЭТАП {s.num} / 04</span><span style={{marginLeft: 'auto'}}>{right}</span>
      </div>
      {children}
    </>
  );
};

// Смена заголовка по словам: старое слово уезжает вверх, новое выезжает снизу (маска по строке).
const Headline: React.FC<{t: number; items: [number, string][]; size: number; color: string; x?: number; y: number}> = ({t, items, size, color, x = 64, y}) => (
  <div style={{...pos(x, y), height: size * 1.02, width: 1312, overflow: 'hidden'}}>
    {items.map(([a, text], i) => {
      const next = items[i + 1]?.[0] ?? 1e9;
      // Барабан: входящее и уходящее слово двигаются одной кривой и ровно на строку друг от друга — не накладываются.
      const k = (i === 0 ? interpolate(t, [a, a + 0.32], [1, 0], {...cl, easing: out}) : interpolate(t, [a, a + 0.32], [1, 0], {...cl, easing: inOut}))
        + interpolate(t, [next, next + 0.32], [0, -1], {...cl, easing: inOut});
      if (t < a - 0.01 || t > next + 0.33) return null;
      return <div key={text} style={{position: 'absolute', left: 0, top: 0, ...poster(size), color, whiteSpace: 'nowrap', transform: `translateY(${k * size * 1.05}px)`}}>{text}</div>;
    })}
  </div>
);

// ---------- 01 · Реклама / Pipeboard ----------
const AD_LOGOS: [string, number][] = [['brand/meta.svg', 21.3], ['brand/googleads.svg', 21.71], ['brand/linkedin.svg', 22.28], ['brand/tiktok.svg', 22.98]];
type Row = {name: string; budget: string; cpl: string; tone: string; bad?: boolean; test?: 0 | 1};
const ROWS: Row[] = [
  {name: 'Лиды · Instagram', budget: '$40', cpl: '$3,9', tone: PC.orange},
  {name: 'Ретаргет', budget: '$25', cpl: '$2,7', tone: PC.mint},
  {name: 'Холодный трафик', budget: '$60', cpl: '$14,8', tone: '#8C9196', bad: true},
  {name: 'Тест A', budget: '$15', cpl: '—', tone: '#FFB07A', test: 0},
  {name: 'Тест B', budget: '$15', cpl: '—', tone: '#8FFBDD', test: 1},
];
const AdTable: React.FC<{t: number}> = ({t}) => {
  const hl = (a: number) => interpolate(t, [a - 0.05, a + 0.15, a + 1.5, a + 1.8], [0, 1, 1, 0], cl);
  const cols = [{n: 'КАМПАНИЯ', w: 430}, {n: 'БЮДЖЕТ', w: 240, h: hl(24.16)}, {n: 'КРЕАТИВ', w: 250, h: hl(24.79)}, {n: 'ЦЕНА ЗАЯВКИ', w: 360, h: hl(25.43)}];
  const tests = appear(t, 29.34, 0.35) + appear(t, 29.69, 0.35);
  const bad = interpolate(t, [26.9, 27.2], [0, 1], cl), off = interpolate(t, [27.8, 28.1], [0, 1], {...cl, easing: out});
  return (
    <ChamferBox w={1312} h={Math.round(150 + 102 * (3 + tests))} cut={[0, 46, 0, 46]} fill={PC.white} stroke={PC.ink} sw={5}>
      <div style={{position: 'absolute', left: 16, top: 18, width: 1280}}>
        <div style={{display: 'flex', height: 84, borderBottom: `4px solid ${PC.ink}`}}>
          {cols.map((c) => (
            <div key={c.n} style={{width: c.w, display: 'flex', alignItems: 'center', padding: '0 16px', boxSizing: 'border-box', ...poster(48, 800, -0.01), whiteSpace: 'nowrap',
              background: `rgba(10,11,13,${c.h ?? 0})`, color: (c.h ?? 0) > 0.5 ? PC.mint : PC.ink}}>{c.n}</div>
          ))}
        </div>
        {ROWS.map((r) => {
          const k = r.test === undefined ? 1 : appear(t, 29.34 + r.test * 0.35, 0.35);
          const dead = r.bad ? off : 0;
          return (
            <div key={r.name} style={{display: 'flex', height: 102 * k, overflow: 'hidden', opacity: k, borderBottom: `2px solid rgba(10,11,13,.15)`,
              background: r.bad ? `rgba(255,122,47,${0.28 * bad * (1 - dead * 0.6)})` : r.test !== undefined ? `rgba(61,237,195,${0.25 * k})` : 'transparent'}}>
              <div style={{width: 430, display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px', boxSizing: 'border-box', ...poster(48, 700, -0.02), color: PC.ink, opacity: 1 - dead * 0.5}}>
                {r.test !== undefined ? <span style={{...mono(48, 700), background: PC.ink, color: PC.mint, padding: '2px 10px'}}>NEW</span> : null}
                <span style={{textDecoration: dead > 0.5 ? 'line-through' : 'none', whiteSpace: 'nowrap'}}>{r.name}</span>
              </div>
              <div style={{width: 240, display: 'flex', alignItems: 'center', padding: '0 16px', boxSizing: 'border-box', ...poster(52, 800, -0.02), color: PC.ink, opacity: 1 - dead * 0.5}}>{r.budget}</div>
              <div style={{width: 250, display: 'flex', alignItems: 'center', padding: '0 16px', boxSizing: 'border-box'}}>
                <span style={{width: 76, height: 76, clipPath: chamfer(76, 76, [0, 14, 0, 14]), background: `linear-gradient(135deg, ${r.tone}, ${PC.ink})`, opacity: 1 - dead * 0.5}} />
              </div>
              <div style={{width: 360, display: 'flex', alignItems: 'center', gap: 18, padding: '0 16px', boxSizing: 'border-box', ...poster(52, 800, -0.02), color: r.bad && dead < 0.5 ? '#C4410B' : PC.ink}}>
                <span style={{opacity: 1 - dead * 0.5}}>{r.cpl}</span>
                {r.bad ? (
                  <span style={{marginLeft: 'auto', width: 104, height: 56, background: dead > 0.5 ? '#8C9196' : PC.ink, position: 'relative', flex: 'none', clipPath: chamfer(104, 56, [0, 10, 0, 10])}}>
                    <span style={{position: 'absolute', top: 8, left: 8 + (1 - off) * 48, width: 40, height: 40, background: dead > 0.5 ? PC.white : PC.mint}} />
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </ChamferBox>
  );
};
const Stage1: React.FC<{t: number}> = ({t}) => {
  const rec = appear(t, 20.55, 0.45);
  const stamp = interpolate(t, [30.39, 30.6], [0, 1], {...cl, easing: Easing.bezier(0.3, 1.6, 0.6, 1)});
  return (
    <>
      <StageHead t={t} i={0} right="БЕСПЛАТНО · MCP" />
      <div style={pos(700, 490)}><ServiceChip logo="brand/pipeboard.png" label="PIPEBOARD" w={676} h={120} k={appear(t, 19.85)} /></div>
      <div style={{...pos(64, 800), opacity: rec, transform: `translateY(${(1 - rec) * 120}px)`}}>
        <MediaFrame w={1080} h={630}>
          <Sequence from={Math.round(20.5 * 60)} layout="none">
            <Video src={staticFile('reels/money/pipeboard.mp4')} trimBefore={Math.round(2.6 * 60)} muted
              style={{position: 'absolute', left: '50%', top: '50%', width: 1188, height: 687, transform: 'translate(-50%, -50%)', objectFit: 'cover'}} />
          </Sequence>
        </MediaFrame>
      </div>
      {AD_LOGOS.map(([l, a], i) => {
        const k = interpolate(t, [a - 0.05, a + 0.25], [0, 1], {...cl, easing: Easing.bezier(0.34, 1.5, 0.64, 1)});
        return (
          <div key={l} style={{...pos(1186, 800 + i * 160), width: 150, height: 150, display: 'grid', placeItems: 'center', background: '#FFFFFF',
            clipPath: chamfer(150, 150, [0, 24, 0, 24]), opacity: Math.min(1, k * 2), transform: `scale(${0.4 + 0.6 * k})`}}>
            <Img src={staticFile(l)} style={{width: 92, height: 92, objectFit: 'contain'}} />
          </div>
        );
      })}
      {/* Вид «б»: кабинет рекламы */}
      <div style={{...pos(64, VH + 196), width: 1312, display: 'flex', ...mono(48, 600), color: PC.ink}}><span>КАБИНЕТ / КАМПАНИИ</span><span style={{marginLeft: 'auto'}}>PIPEBOARD → CLAUDE</span></div>
      <div style={{...pos(64, VH + 262), width: 1312, height: 4, background: PC.ink}} />
      <Headline t={t} y={VH + 300} size={150} color={PC.ink} items={[[23.4, 'CLAUDE ВИДИТ'], [26.33, 'ЧТО ОТКЛЮЧИТЬ'], [28.76, 'НОВЫЕ ТЕСТЫ']]} />
      <div style={pos(64, VH + 480)}><AdTable t={t} /></div>
      <div style={{...pos(170, VH + 1170), opacity: Math.min(1, stamp * 3), transform: `rotate(-4deg) scale(${1.5 - 0.5 * stamp})`}}>
        <div style={{padding: '26px 44px', clipPath: chamfer(1100, 170, [0, 34, 0, 34]), width: 1100, height: 170, boxSizing: 'border-box', background: PC.ink, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <span style={{...poster(100), color: PC.white, whiteSpace: 'nowrap'}}>ТАРГЕТОЛОГИ, СОРИ<span style={{color: PC.mint}}>_</span></span>
        </div>
      </div>
    </>
  );
};

// ---------- 02 · Заявки / Zernio ----------
const Speech: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24"><path d="M3 4h18v12H9l-5 4v-4H3z" fill="none" stroke={color} strokeWidth={2.4} strokeLinejoin="miter" /></svg>
);
const CHANNELS: {logo: string; label: string; at: number}[] = [
  {logo: 'brand/instagram.svg', label: 'ДИРЕКТ', at: 32.42}, {logo: 'speech', label: 'КОММЕНТАРИИ', at: 32.85},
  {logo: 'brand/whatsapp.svg', label: 'WHATSAPP', at: 33.65}, {logo: 'brand/telegram.svg', label: 'TELEGRAM', at: 34.28},
];
const Stage2: React.FC<{t: number}> = ({t}) => {
  const reply = 'Добрый день! Пришлю цены и запишу вас.';
  const typed = reply.slice(0, Math.round(interpolate(t, [35.6, 36.5], [0, reply.length], cl)));
  const leads = t < 36.65 ? 0 : t < 36.95 ? 1 : t < 37.25 ? 2 : 3;
  const status = appear(t, 37.39, 0.3);
  return (
    <>
      <StageHead t={t} i={1} right="БЕСПЛАТНО · MCP" />
      <div style={pos(700, 490)}><ServiceChip logo="brand/zernio.png" label="ZERNIO" w={676} h={120} k={appear(t, 31.84)} /></div>
      {CHANNELS.map((c, i) => (
        <div key={c.label} style={pos(64 + (i % 2) * 672, 830 + Math.floor(i / 2) * 170)}>
          {c.logo === 'speech' ? (
            <div style={{width: 640, height: 140, display: 'flex', alignItems: 'center', gap: 26, clipPath: chamfer(640, 140, [0, 26, 0, 26]), background: PC.white,
              opacity: appear(t, c.at - 0.05), transform: `translateY(${(1 - appear(t, c.at - 0.05)) * 50}px)`}}>
              <span style={{display: 'grid', placeItems: 'center', width: 140, height: 140, borderRight: `3px solid ${PC.ink}`}}><Speech size={80} color={PC.ink} /></span>
              <span style={{...poster(60, 800, -0.02), color: PC.ink}}>{c.label}</span>
            </div>
          ) : <ServiceChip logo={c.logo} label={c.label} w={640} h={140} k={appear(t, c.at - 0.05)} dx={0} />}
        </div>
      ))}
      <div style={{...pos(64, 1190), width: 1312, display: 'flex', alignItems: 'center', gap: 24, opacity: appear(t, 34.4)}}>
        <span style={{...mono(48, 700), color: PC.mintInk}}>ВСЕ ВХОДЯЩИЕ →</span>
        <span style={{display: 'flex', alignItems: 'center', gap: 16, background: PC.ink, padding: '12px 24px', clipPath: chamfer(420, 96, [0, 18, 0, 18]), width: 420, height: 96, boxSizing: 'border-box'}}>
          <ClaudeMark size={60} /><span style={{...poster(58, 800, -0.02), color: PC.white}}>CLAUDE</span>
        </span>
        <span style={{marginLeft: 'auto'}}><Barcode w={330} h={80} seed={31} color={PC.mintInk} /></span>
      </div>
      {/* Вид «б»: переписка и заявки */}
      <div style={{...pos(64, VH + 196), width: 1312, display: 'flex', ...mono(48, 600), color: PC.mintInk}}><span>ДИРЕКТ / ПЕРЕПИСКА</span><span style={{marginLeft: 'auto'}}>ZERNIO → CLAUDE</span></div>
      <div style={{...pos(64, VH + 262), width: 1312, height: 4, background: PC.mintInk}} />
      <Headline t={t} y={VH + 300} size={140} color={PC.mintInk} items={[[34.85, 'ОТВЕЧАЕТ'], [36.17, 'СОБИРАЕТ ЗАЯВКИ'], [37.39, 'ПОКА ТЫ ЗАНЯТ']]} />
      <div style={pos(64, VH + 470)}>
        <ChamferBox w={1312} h={560} cut={[0, 46, 0, 46]} fill={PC.ink}>
          <div style={{position: 'absolute', inset: 0, padding: '40px 44px'}}>
            <div style={{maxWidth: 820, padding: '22px 30px', background: PC.white, clipPath: chamfer(820, 150, [0, 0, 22, 0]), height: 150, boxSizing: 'border-box',
              ...poster(50, 600, -0.01), lineHeight: 1.2, color: PC.ink, opacity: appear(t, 34.95), transform: `translateY(${(1 - appear(t, 34.95)) * 30}px)`}}>
              Здравствуйте! Сколько стоит и как записаться?
            </div>
            <div style={{position: 'absolute', right: 44, top: 210, width: 900, height: 240, padding: '22px 30px', boxSizing: 'border-box', background: PC.mint,
              clipPath: chamfer(900, 240, [0, 0, 0, 22]), ...poster(50, 600, -0.01), lineHeight: 1.2, color: PC.mintInk, opacity: appear(t, 35.5)}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 12, ...mono(48, 700), marginBottom: 6}}><ClaudeMark size={44} /> CLAUDE</div>
              {typed}<span style={{opacity: t < 36.6 && Math.floor(t * 3) % 2 === 0 ? 1 : 0}}>▍</span>
            </div>
            <div style={{position: 'absolute', left: 44, bottom: 36, display: 'flex', alignItems: 'center', gap: 16, ...mono(48, 700), color: PC.mint, opacity: appear(t, 36.65)}}>
              ✓ НОВАЯ ЗАЯВКА → CRM
            </div>
          </div>
        </ChamferBox>
      </div>
      <div style={{...pos(64, VH + 1070), width: 1312, display: 'flex', alignItems: 'center', gap: 28}}>
        <span style={{...mono(48, 700), color: PC.mintInk}}>ЗАЯВКИ</span>
        <span style={{...poster(130, 900, -0.02), color: PC.mintInk, fontFamily: TECH, fontWeight: 800, opacity: appear(t, 36.6)}}>{String(leads).padStart(2, '0')}</span>
        <div style={{marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: 12, opacity: status, transform: `translateX(${(1 - status) * 60}px)`}}>
          <span style={{display: 'flex', alignItems: 'center', gap: 14, ...mono(48, 700), color: PC.mintInk}}><span style={{width: 22, height: 22, background: '#5A6268'}} />ТЫ: ЗАНЯТ ДРУГИМ</span>
          <span style={{display: 'flex', alignItems: 'center', gap: 14, ...mono(48, 700), color: PC.mintInk}}><span style={{width: 22, height: 22, background: PC.ink}} />CLAUDE: НА СВЯЗИ</span>
        </div>
      </div>
    </>
  );
};

// ---------- 03 · Сделки / MCP для amoCRM и Битрикс24 ----------
const GhShot: React.FC<{src: string; logo: string; name: string; k: number; side: 'left' | 'right'}> = ({src, logo, name, k, side}) => (
  <div style={{opacity: k, transform: `translateY(${(1 - k) * 90}px)`}}>
    <MediaFrame w={1100} h={528} dark>
      <Img src={staticFile(src)} style={{position: 'absolute', left: 0, top: -52, width: 2220}} />
    </MediaFrame>
    <div style={{position: 'absolute', [side]: side === 'left' ? 0 : -16, top: -40, display: 'flex', gap: 10}}>
      <span style={{display: 'flex', alignItems: 'center', gap: 14, background: PC.white, padding: '10px 18px', clipPath: chamfer(330, 90, [0, 16, 0, 16]), width: 330, height: 90, boxSizing: 'border-box'}}>
        <Img src={staticFile(logo)} style={{width: 60, height: 60, objectFit: 'contain'}} /><span style={{...poster(44, 800, -0.02), color: PC.ink, whiteSpace: 'nowrap'}}>{name}</span>
      </span>
      <span style={{...mono(48, 700), background: PC.mint, color: PC.mintInk, padding: '16px 18px'}}>MIT</span>
    </div>
  </div>
);
const KANBAN = [{n: 'НОВЫЕ', c: 2}, {n: 'В РАБОТЕ', c: 2}, {n: 'СЧЁТ', c: 4, stuck: true}, {n: 'ОПЛАТА', c: 1}];
const Kanban: React.FC<{t: number}> = ({t}) => {
  const stuck = appear(t, 47.08, 0.35), mgr = appear(t, 49.0, 0.35);
  return (
    <div style={{display: 'flex', gap: 18}}>
      {KANBAN.map((col, ci) => (
        <div key={col.n} style={{position: 'relative'}}>
          <ChamferBox w={314} h={640} cut={[0, 28, 0, 28]} fill={col.stuck ? `rgba(255,122,47,${0.22 * stuck})` : 'rgba(238,239,240,.06)'} stroke={col.stuck && stuck > 0.02 ? PC.orange : 'rgba(238,239,240,.35)'} sw={col.stuck ? 3 + 4 * stuck : 3}>
            <div style={{position: 'absolute', left: 16, top: 20, right: 16}}>
              <div style={{...mono(48, 700), color: col.stuck && stuck > 0.5 ? PC.orange : PC.white, marginBottom: 18}}>{col.n}</div>
              {Array.from({length: col.c}).map((_, i) => {
                const k = appear(t, 45.03 + ci * 0.12 + i * 0.08, 0.25);
                const isMgr = col.stuck && i === 1;
                return (
                  <div key={i} style={{display: 'flex', alignItems: 'center', gap: 12, height: 104, marginBottom: 12, padding: '0 14px', boxSizing: 'border-box', background: PC.white,
                    clipPath: chamfer(282, 104, [0, 16, 0, 16]), opacity: k, transform: `translateY(${(1 - k) * 30}px)`, outline: 'none'}}>
                    <span style={{width: 56, height: 56, borderRadius: '50%', background: isMgr ? `rgb(${255},${Math.round(122 + (1 - mgr) * 20)},47)` : '#C3C7CB', flex: 'none',
                      boxShadow: isMgr ? `0 0 0 ${6 * mgr}px ${PC.ink}` : 'none'}} />
                    <span style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 10}}>
                      <span style={{height: 12, width: '90%', background: PC.ink}} /><span style={{height: 12, width: '55%', background: '#9CA1A6'}} />
                    </span>
                  </div>
                );
              })}
            </div>
          </ChamferBox>
          {col.stuck ? (
            <>
              <div style={{position: 'absolute', left: 0, top: -84, ...mono(48, 700), background: PC.orange, color: PC.ink, padding: '12px 18px', opacity: stuck, transform: `translateY(${(1 - stuck) * 20}px)`}}>ЗАСТРЯЛИ</div>
              <div style={{position: 'absolute', left: 150, top: 290, whiteSpace: 'nowrap', ...mono(48, 700), background: PC.ink, color: PC.white, padding: '14px 20px',
                border: `4px solid ${PC.orange}`, opacity: mgr, transform: `scale(${0.7 + 0.3 * mgr})`, transformOrigin: 'left center'}}>МЕНЕДЖЕР 02</div>
            </>
          ) : null}
        </div>
      ))}
    </div>
  );
};
const Stage3: React.FC<{t: number}> = ({t}) => (
  <>
    <StageHead t={t} i={2} right="MCP · $0" />
    <div style={pos(700, 490)}><ServiceChip logo="brand/github.svg" label="MCP-СЕРВЕРЫ" w={676} h={120} k={appear(t, 38.9)} /></div>
    <div style={{...pos(700, 640), display: 'flex', gap: 12}}>
      <span style={{...mono(48, 700), background: PC.mint, color: PC.mintInk, padding: '14px 16px', whiteSpace: 'nowrap', opacity: appear(t, 38.95)}}>БЕСПЛАТНО</span>
      <span style={{...mono(48, 700), color: PC.white, padding: '11px 13px', border: `3px solid ${PC.white}`, whiteSpace: 'nowrap', opacity: appear(t, 40.55)}}>ОТКРЫТЫЙ КОД</span>
    </div>
    <div style={pos(64, 840)}><GhShot src="reels/money/gh-amocrm-mcp.png" logo="brand/amocrm.png" name="amoCRM" k={appear(t, 41.7, 0.4)} side="left" /></div>
    <div style={pos(290, 930)}><GhShot src="reels/money/gh-bitrix24-mcp.png" logo="brand/bitrix24.svg" name="Битрикс24" k={appear(t, 42.25, 0.4)} side="right" /></div>
    {/* Вид «б»: доска сделок */}
    <div style={{...pos(64, VH + 196), width: 1312, display: 'flex', ...mono(48, 600), color: PC.white}}><span>CRM / СДЕЛКИ</span><span style={{marginLeft: 'auto'}}>AMOCRM · БИТРИКС24</span></div>
    <div style={{...pos(64, VH + 262), width: 1312, height: 4, background: PC.white}} />
    <Headline t={t} y={VH + 300} size={104} color={PC.white} items={[[42.95, 'СТАВИШЬ К CRM'], [45.03, 'ВИДИТ СДЕЛКИ'], [47.08, 'ГДЕ ЗАСТРЕВАЮТ'], [48.49, 'У КАКОГО МЕНЕДЖЕРА']]} />
    <div style={pos(64, VH + 560)}><Kanban t={t} /></div>
  </>
);

// ---------- 04 · Деньги / Metabase ----------
const REPORTS: {label: string; at: number; to: number; box: [number, number, number, number]}[] = [
  {label: 'ОКУПАЕМОСТЬ РЕКЛАМЫ', at: 58.79, to: 59.8, box: [40, 566, 1640, 1320]},
  {label: 'ВОРОНКИ ПО ИСТОЧНИКАМ', at: 59.99, to: 61.2, box: [580, 54, 1636, 536]},
  {label: 'ТОП КЛИЕНТОВ ПО ДЕНЬГАМ', at: 61.39, to: 99, box: [1696, 0, 2510, 1120]},
];
const Stage4: React.FC<{t: number}> = ({t}) => {
  const reveal = appear(t, 54.69, 0.35);
  // При заходе камеры в отчёты (зум > 1) заголовок и шапка вида «б» гаснут, чтобы сверху не торчали обрезанные буквы.
  const head = 1 - interpolate(camAt(t).z, [1.02, 1.2], [0, 1], cl);
  return (
    <>
      <StageHead t={t} i={3} right="ФИНАЛЬНЫЙ КОННЕКТОР" />
      <div style={pos(700, 490)}>
        {reveal < 1 ? (
          <div style={{position: 'absolute', width: 676, height: 120, clipPath: chamfer(676, 120, [0, 26, 0, 26]), border: 'none', background: PC.ink, display: 'flex', alignItems: 'center', justifyContent: 'center',
            ...mono(48, 700), color: PC.white, opacity: 1 - reveal}}>КОННЕКТОР 04 · ?</div>
        ) : null}
        <ServiceChip logo="brand/metabase.svg" label="METABASE" w={676} h={120} k={reveal} dx={0} />
      </div>
      <div style={{...pos(64, 840), display: 'flex', gap: 32}}>
        <ServiceChip logo="brand/metabase.svg" label="ДАШБОРДЫ" w={640} h={140} k={appear(t, 55.5)} dx={0} />
        <ServiceChip logo="brand/powerbi.svg" label="POWER BI" w={640} h={140} k={appear(t, 56.35)} dx={0} />
      </div>
      <div style={{...pos(64, 1050), width: 1312, display: 'flex', alignItems: 'center', gap: 30, opacity: appear(t, 55.8)}}>
        <Barcode w={620} h={120} seed={41} />
        <span style={{...mono(48, 700), color: PC.ink}}>ВСЕ ПОКАЗАТЕЛИ<br />В ОДНОМ МЕСТЕ</span>
      </div>
      {/* Вид «б»: настоящий дашборд Metabase, камера заходит в отчёты */}
      <div style={{opacity: t > 58 ? head : 1}}>
        <div style={{...pos(64, VH + 196), width: 1312, display: 'flex', ...mono(48, 600), color: PC.ink}}><span>METABASE / ДАШБОРД</span><span style={{marginLeft: 'auto'}}>CLAUDE → ОТЧЁТЫ</span></div>
        <div style={{...pos(64, VH + 262), width: 1312, height: 4, background: PC.ink}} />
        <Headline t={t} y={VH + 290} size={130} color={PC.ink} items={[[57.2, 'СОБИРАЕТ ОТЧЁТЫ']]} />
      </div>
      <div style={pos(64, VH + 450)}>
        <MediaFrame w={1312} h={729}><Img src={staticFile('reels/money/metabase-dashboard.png')} style={{position: 'absolute', left: 0, top: 0, width: 1296}} /></MediaFrame>
      </div>
      {REPORTS.map((r) => {
        const k = interpolate(t, [r.at - 0.1, r.at + 0.2, r.to, r.to + 0.3], [0, 1, 1, 0.0], cl);
        const [x0, y0, x1, y1] = r.box.map((v) => v * DASH.sc);
        return (
          <div key={r.label} style={{...pos(64 + 8 + x0, VH + 450 + 8 + y0), width: x1 - x0, height: y1 - y0, boxSizing: 'border-box', border: `5px solid ${PC.orange}`, opacity: k}}>
            <span style={{position: 'absolute', [r.box[0] > 1200 ? 'right' : 'left']: -5, top: r.box[1] < 100 ? 8 : -58, whiteSpace: 'nowrap', ...mono(40, 700), background: PC.orange, color: PC.ink, padding: '6px 12px'}}>{r.label}</span>
          </div>
        );
      })}
    </>
  );
};

// ---------- связи между этапами ----------
type Link = {d: string; a: number; b: number};
const LINKS: Link[] = [
  {d: `M${BW + 30} ${VH / 2} H${BW + GAP - 60}`, a: 17.6, b: 18.0},                                          // 01 → 02
  {d: `M${BW + GAP + BW / 2} ${BH + 30} V${BH + GAP - 60}`, a: 18.0, b: 18.4},                                // 02 → 03
  {d: `M${BW + GAP - 30} ${BH + GAP + VH / 2} H${BW + 60}`, a: 18.4, b: 18.8},                                 // 03 → 04
  {d: `M${BW / 2} ${BH + 30} V${BH + GAP - 60}`, a: 52.5, b: 53.1},                                           // 01 → 04: «сведёт воедино»
  {d: `M${BW + 60} ${BH + 40} L${BW + GAP - 160} ${BH + GAP - 60}`, a: 52.8, b: 53.4},                         // 02 → 04
];
const Links: React.FC<{t: number}> = ({t}) => (
  <svg width={WORLD_W} height={WORLD_H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
    <defs>
      <marker id="arr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill={PC.mint} /></marker>
      {LINKS.map((l, i) => {
        const p = interpolate(t, [l.a, l.b], [0, 1], {...cl, easing: inOut});
        return <mask key={i} id={`lk${i}`} maskUnits="userSpaceOnUse" x={0} y={0} width={WORLD_W} height={WORLD_H}><path d={l.d} pathLength={1} stroke="#fff" strokeWidth={60} fill="none" strokeDasharray={`${p} 1`} /></mask>;
      })}
    </defs>
    {LINKS.map((l, i) => {
      const p = interpolate(t, [l.a, l.b], [0, 1], cl);
      if (p <= 0) return null;
      return (
        <g key={i}>
          <path d={l.d} stroke={PC.mint} strokeWidth={22} fill="none" strokeDasharray="60 40" strokeDashoffset={-t * 140} mask={`url(#lk${i})`} />
          {p >= 1 ? <path d={l.d} stroke="none" fill="none" markerEnd="url(#arr)" strokeWidth={22} /> : null}
        </g>
      );
    })}
  </svg>
);

// Подложка мира: тёмная сетка и метки-перекрестья на углах полос.
const WorldGround: React.FC = () => (
  <div style={{position: 'absolute', left: -2000, top: -2000, width: WORLD_W + 4000, height: WORLD_H + 4000, background: PC.ink,
    backgroundImage: 'linear-gradient(rgba(238,239,240,.06) 2px, transparent 2px), linear-gradient(90deg, rgba(238,239,240,.06) 2px, transparent 2px)', backgroundSize: '80px 80px'}} />
);

export const FunnelCanvas: React.FC<{t: number}> = ({t}) => {
  const c = camAt(t);
  const stages = [Stage1, Stage2, Stage3, Stage4];
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1440, height: VH, overflow: 'hidden', background: PC.ink}}>
        <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${720 - c.x * c.z}px, ${VH / 2 - c.y * c.z}px) scale(${c.z})`}}>
          <WorldGround />
          {S.map((s, i) => {
            const St = stages[i];
            return (
              <div key={s.num} style={{position: 'absolute', left: s.x, top: s.y, width: BW, height: BH, background: s.bg, overflow: 'hidden'}}>
                <St t={t} />
              </div>
            );
          })}
          <Links t={t} />
        </div>
        <Grain opacity={0.1} />
      </div>
      <div style={{position: 'absolute', left: 0, top: VH, width: 1440, height: 2560 - VH, background: PC.ink}}>
        <div style={{height: 4, background: PC.mint}} />
      </div>
    </AbsoluteFill>
  );
};
