import {textDepth} from '../ds/tokens';
import {Object25D} from '../kit/liquid/Object25D';
import {LiquidPanel} from '../kit/liquid/LiquidPanel';
import {Chip, E, k, countTo, Logo, NUM, SANS} from '../montage/parts';
import type {Box} from '../formats';
import {DARK, DIM, INK, MINT, MINT_INK, NEON, RED, type Pt} from './canvas';

// Смысловые блоки шаблона. Каждый блок раскладывается от прямоугольника карточки r, поэтому один и тот же блок
// работает и в рилсе 9:16, и в YouTube 16:9. Время — секунды ролика. Курсор агента задаётся в координатах листа.
// Это стартовый набор: под каждый ролик агент придумывает свою карту и свои блоки (DIRECTION.md проекта).

type Base = {id: string; label: string; at: number; tone?: 'dark' | 'light'};
export type BlockData =
  | (Base & {kind: 'hook'; lines: [string, string]; strike?: string; strikeAt?: number; object?: string})
  | (Base & {kind: 'list'; title: string; items: string[]; ticks: number[]})
  | (Base & {kind: 'stat'; value: number; prefix?: string; suffix?: string; caption: string; countAt: number; bars?: number[]})
  | (Base & {kind: 'logos'; title: string; logos: string[]})
  | (Base & {kind: 'cta'; word: string; note: string; typeAt: number});

type P<T> = {t: number; b: T; r: Box; light: boolean};
const ink = (light: boolean) => (light ? DARK : INK);
const sub = (light: boolean) => (light ? '#5E646B' : DIM);
const depth = (light: boolean) => (light ? '0 2px 0 rgba(255,255,255,.8), 0 10px 24px rgba(0,0,0,.12)' : textDepth);

// ——— хук: заголовок печатается по словам, одно слово агент перечёркивает, справа выходит предмет ———
const Hook: React.FC<P<Extract<BlockData, {kind: 'hook'}>>> = ({t, b, r, light}) => {
  const words = [...b.lines[0].split(' ').map((w) => ({w, l: 0})), ...b.lines[1].split(' ').map((w) => ({w, l: 1}))];
  const size = Math.min(r.w * 0.085, r.h * 0.12, 150);
  const x = r.x + r.w * 0.07, y0 = r.y + r.h * 0.2;
  const strike = b.strike && b.strikeAt !== undefined ? k(t, b.strikeAt, b.strikeAt + 0.35, E.inOut) : 0;
  return (
    <>
      {[0, 1].map((line) => (
        <div key={line} style={{position: 'absolute', left: x, top: y0 + line * size * 1.18, display: 'flex', gap: size * 0.26, whiteSpace: 'nowrap',
          fontFamily: SANS, fontWeight: 800, fontSize: size, letterSpacing: '-0.035em', color: ink(light), textShadow: depth(light)}}>
          {words.map((wd, i) => ({...wd, i})).filter((wd) => wd.l === line).map((wd) => {
            const a = k(t, b.at + 0.15 + wd.i * 0.18, b.at + 0.45 + wd.i * 0.18, E.out);
            const struck = wd.w === b.strike;
            return (
              <span key={wd.i} style={{position: 'relative', opacity: a, transform: `translateY(${(1 - a) * 24}px)`, color: struck && strike > 0.5 ? sub(light) : undefined}}>
                {wd.w}
                {struck ? <span style={{position: 'absolute', left: -8, right: -8, top: '52%', height: size * 0.08, borderRadius: size * 0.04, background: RED.hex,
                  transformOrigin: 'left center', transform: `scaleX(${strike}) rotate(-3deg)`, boxShadow: `0 0 18px rgba(${RED.rgb},.5)`}} /> : null}
              </span>
            );
          })}
        </div>
      ))}
      {b.object ? <Object25D src={`objects/${b.object}.webp`} x={r.x + r.w * 0.72} y={r.y + r.h * 0.68} size={Math.min(r.w * 0.42, r.h * 0.5)} t={t} at={b.at + 0.5}
        float={10} tilt={3} shadow={false} /> : null}
    </>
  );
};

// ——— список: курсор щёлкает галочки; задача зачёркивается, строка вспыхивает, снизу наливается полоса «сделано» ———
const List: React.FC<P<Extract<BlockData, {kind: 'list'}>>> = ({t, b, r, light}) => {
  const L = listGeom(r, b.items.length);
  const done = b.ticks.reduce((a, tc) => a + k(t, tc, tc + 0.3, E.out), 0) / b.ticks.length;
  return (
    <>
      <div style={{position: 'absolute', left: L.x, top: r.y + r.h * 0.1, fontFamily: SANS, fontWeight: 800, fontSize: L.title, letterSpacing: '-0.03em', color: ink(light),
        textShadow: depth(light), opacity: k(t, b.at, b.at + 0.35), whiteSpace: 'nowrap'}}>{b.title}</div>
      {b.items.map((it, i) => {
        const tc = b.ticks[i] ?? 1e9;
        const rise = k(t, b.at + 0.25 + i * 0.14, b.at + 0.65 + i * 0.14, E.pop);
        const d = k(t, tc, tc + 0.22, E.pop), line = k(t, tc + 0.06, tc + 0.34, E.out);
        const flash = k(t, tc, tc + 0.08) * (1 - k(t, tc + 0.08, tc + 0.5));
        return (
          <div key={it} style={{position: 'absolute', left: L.x, top: L.y + i * L.row, height: L.row, display: 'flex', alignItems: 'center', gap: L.box * 0.5,
            opacity: rise, transform: `translateY(${(1 - rise) * 40}px) translateX(${flash * 10}px)`}}>
            <div style={{position: 'absolute', left: -24, right: -40, top: 8, bottom: 8, borderRadius: 20, background: `rgba(61,237,195,${0.22 * flash})`}} />
            <div style={{position: 'relative', width: L.box, height: L.box, borderRadius: L.box * 0.28, boxSizing: 'border-box', display: 'grid', placeItems: 'center', flex: 'none',
              border: `5px solid ${d > 0 ? MINT : light ? 'rgba(20,24,28,.3)' : 'rgba(255,255,255,.35)'}`, background: d > 0 ? MINT : 'transparent', transform: `scale(${1 + 0.35 * flash})`}}>
              {d > 0 ? <svg width={L.box * 0.6} height={L.box * 0.6} viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={MINT_INK} strokeWidth={3.4}
                strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${Math.min(1, d)} 1`} /></svg> : null}
            </div>
            <span style={{position: 'relative', fontFamily: SANS, fontWeight: 700, fontSize: L.text, color: d > 0 ? sub(light) : ink(light), whiteSpace: 'nowrap'}}>
              {it}
              <span style={{position: 'absolute', left: -4, right: 0, top: '53%', height: 6, borderRadius: 3, background: MINT, transformOrigin: 'left center', transform: `scaleX(${line})`}} />
            </span>
          </div>
        );
      })}
      <div style={{position: 'absolute', left: L.x, width: r.w * 0.6, top: L.y + b.items.length * L.row + 30, height: 14, borderRadius: 7,
        background: light ? 'rgba(20,24,28,.1)' : 'rgba(255,255,255,.1)', opacity: k(t, b.at + 0.4, b.at + 0.8)}}>
        <div style={{width: `${done * 100}%`, height: '100%', borderRadius: 7, background: `linear-gradient(90deg, ${MINT}, #9FF7E2)`, boxShadow: '0 0 18px rgba(61,237,195,.55)'}} />
      </div>
    </>
  );
};
export const listGeom = (r: Box, n: number) => {
  const text = Math.min(r.w * 0.052, 72), row = Math.min(text * 1.9, (r.h * 0.62) / n);
  return {x: r.x + r.w * 0.09, y: r.y + r.h * 0.3, row, text, box: text * 0.95, title: Math.min(r.w * 0.07, 96)};
};

// ——— цифра: счёт с нуля, подпись, столбики растут под счёт ———
const Stat: React.FC<P<Extract<BlockData, {kind: 'stat'}>>> = ({t, b, r, light}) => {
  const n = countTo(t, b.countAt, b.countAt + 1.3, b.value);
  const size = Math.min(r.w * 0.2, r.h * 0.3, 300);
  const bars = b.bars ?? [0.3, 0.45, 0.4, 0.62, 0.78, 1];
  const shown = k(t, b.countAt - 0.2, b.countAt);
  return (
    <>
      <div style={{position: 'absolute', left: r.x, width: r.w, top: r.y + r.h * 0.12, textAlign: 'center', fontFamily: NUM, fontWeight: 900, fontSize: size,
        letterSpacing: '-0.05em', color: MINT, opacity: shown, textShadow: `0 6px 0 ${light ? '#0F6E5A' : '#0B3F34'}, 0 24px 60px rgba(61,237,195,.35)`}}>
        {b.prefix ?? ''}{n}{b.suffix ?? ''}
      </div>
      <div style={{position: 'absolute', left: r.x, width: r.w, top: r.y + r.h * 0.12 + size * 1.12, textAlign: 'center', fontFamily: SANS, fontWeight: 700,
        fontSize: Math.min(r.w * 0.05, 66), color: ink(light), textShadow: depth(light), opacity: k(t, b.countAt + 0.2, b.countAt + 0.6)}}>{b.caption}</div>
      <div style={{position: 'absolute', left: r.x + r.w * 0.2, width: r.w * 0.6, top: r.y + r.h * 0.62, height: r.h * 0.26, display: 'flex', alignItems: 'flex-end', gap: r.w * 0.025}}>
        {bars.map((v, i) => {
          const g = k(t, b.countAt + i * 0.12, b.countAt + 0.5 + i * 0.12, E.pop);
          return <div key={i} style={{flex: 1, height: `${v * 100 * g}%`, borderRadius: 14, background: i === bars.length - 1 ? MINT : light ? 'rgba(20,24,28,.18)' : 'rgba(255,255,255,.16)',
            boxShadow: i === bars.length - 1 ? '0 0 30px rgba(61,237,195,.45)' : 'none'}} />;
        })}
      </div>
    </>
  );
};

// ——— логотипы сервисов: плитки выпрыгивают по одной, по каждой пробегает блик ———
const Logos: React.FC<P<Extract<BlockData, {kind: 'logos'}>>> = ({t, b, r, light}) => {
  const n = b.logos.length, tile = Math.min((r.w * 0.8) / n - 30, r.h * 0.28, 240);
  const gap = Math.min(40, tile * 0.2), total = n * tile + (n - 1) * gap;
  return (
    <>
      <div style={{position: 'absolute', left: r.x, width: r.w, top: r.y + r.h * 0.14, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: Math.min(r.w * 0.068, 96),
        letterSpacing: '-0.03em', color: ink(light), textShadow: depth(light), opacity: k(t, b.at, b.at + 0.35)}}>{b.title}</div>
      {b.logos.map((name, i) => {
        const t0 = b.at + 0.3 + i * 0.16, a = k(t, t0, t0 + 0.5, E.pop), land = k(t, t0 + 0.3, t0 + 0.9, E.inOut);
        return (
          <div key={name} style={{position: 'absolute', left: r.x + (r.w - total) / 2 + i * (tile + gap), top: r.y + r.h * 0.46, width: tile, height: tile, borderRadius: tile * 0.26,
            background: '#F4F5F2', display: 'grid', placeItems: 'center', overflow: 'hidden', opacity: Math.min(1, a * 2), transform: `translateY(${(1 - a) * 60}px) scale(${0.6 + 0.4 * a})`,
            boxShadow: 'inset 0 3px 0 rgba(255,255,255,.7), inset 0 -6px 12px rgba(0,0,0,.12), 0 18px 40px rgba(0,0,0,.4)'}}>
            <Logo name={name} size={tile * 0.56} />
            {land > 0 && land < 1 ? <div style={{position: 'absolute', top: -20, bottom: -20, left: `${-50 + 160 * land}%`, width: '45%', transform: 'skewX(-16deg)',
              background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.6), rgba(255,255,255,0))'}} /> : null}
          </div>
        );
      })}
    </>
  );
};

// ——— призыв: в поле комментария печатается кодовое слово, комментарий публикуется, чип закреплён до конца ———
const Cta: React.FC<P<Extract<BlockData, {kind: 'cta'}>>> = ({t, b, r, light}) => {
  const typed = Math.round(b.word.length * k(t, b.typeAt, b.typeAt + 0.45, (v) => v));
  const posted = k(t, b.typeAt + 0.8, b.typeAt + 1.1, E.pop);
  const fw = Math.min(r.w * 0.8, 1100), fh = Math.min(r.h * 0.14, 150), fx = r.x + (r.w - fw) / 2, fy = r.y + r.h * 0.58;
  return (
    <>
      <div style={{position: 'absolute', left: r.x, width: r.w, top: r.y + r.h * 0.16, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: Math.min(r.w * 0.07, 104),
        letterSpacing: '-0.035em', color: ink(light), textShadow: depth(light), opacity: k(t, b.at, b.at + 0.35)}}>{b.note}</div>
      {posted > 0 ? (
        <div style={{position: 'absolute', left: fx, top: fy - fh * 1.3 - (1 - posted) * 30, width: fw, height: fh, opacity: posted, display: 'flex', alignItems: 'center', gap: 24}}>
          <span style={{width: fh * 0.62, height: fh * 0.62, borderRadius: '50%', flex: 'none', background: 'linear-gradient(135deg, #FDF497, #FD5949 50%, #D6249F)'}} />
          <span style={{fontFamily: SANS, fontWeight: 800, fontSize: fh * 0.4, color: ink(light)}}>{b.word}</span>
        </div>
      ) : null}
      <LiquidPanel x={fx} y={fy} w={fw} h={fh} r="pill" material="frosted" level={2} name="cta-field">
        <div style={{display: 'flex', alignItems: 'center', height: '100%', padding: `0 ${fh * 0.3}px`, gap: fh * 0.2}}>
          <span style={{flex: 1, fontFamily: SANS, fontWeight: 800, fontSize: fh * 0.36, color: typed ? INK : 'rgba(242,241,238,.5)', whiteSpace: 'nowrap'}}>
            {typed ? b.word.slice(0, typed) : 'Добавить комментарий…'}
          </span>
          <span style={{width: fh * 0.7, height: fh * 0.7, borderRadius: '50%', flex: 'none', display: 'grid', placeItems: 'center', background: typed === b.word.length ? `rgb(${NEON.rgb})` : 'rgba(255,255,255,.14)'}}>
            <svg width={fh * 0.34} height={fh * 0.34} viewBox="0 0 24 24"><path d="M4 12l16-8-6 16-2-6-8-2z" fill="#0B1116" /></svg>
          </span>
        </div>
      </LiquidPanel>
      <Chip t={t} at={b.typeAt + 1.2} x={r.x + r.w / 2} y={r.y + r.h * 0.82} label={`напиши «${b.word}» в комментариях`} size={Math.min(r.w * 0.04, 52)}
        glass={{material: 'solid', tone: 'mint', moon: 0.5}} />
    </>
  );
};

export const BlockView: React.FC<{t: number; b: BlockData; r: Box; light: boolean}> = ({t, b, r, light}) => {
  switch (b.kind) {
    case 'hook': return <Hook t={t} b={b} r={r} light={light} />;
    case 'list': return <List t={t} b={b} r={r} light={light} />;
    case 'stat': return <Stat t={t} b={b} r={r} light={light} />;
    case 'logos': return <Logos t={t} b={b} r={r} light={light} />;
    case 'cta': return <Cta t={t} b={b} r={r} light={light} />;
  }
};

// Путь курсора внутри блока (координаты листа) и секунды щелчков.
export const cursorOf = (b: BlockData, r: Box): {pts: Pt[]; clicks: number[]} => {
  const rest: Pt = [b.at + 0.2, r.x + r.w * 0.86, r.y + r.h * 0.9];
  switch (b.kind) {
    case 'list': {
      const L = listGeom(r, b.items.length);
      const pts: Pt[] = [rest];
      b.ticks.forEach((tc, i) => {
        const cx = L.x + L.box / 2, cy = L.y + i * L.row + L.row / 2;
        pts.push([tc - 0.3, cx, cy], [tc + 0.15, cx, cy]);
      });
      return {pts, clicks: b.ticks};
    }
    case 'hook':
      return b.strikeAt !== undefined ? {pts: [rest, [b.strikeAt - 0.1, r.x + r.w * 0.5, r.y + r.h * 0.4], [b.strikeAt + 0.4, r.x + r.w * 0.62, r.y + r.h * 0.4]], clicks: [b.strikeAt]} : {pts: [rest], clicks: []};
    case 'cta': {
      const fw = Math.min(r.w * 0.8, 1100), fh = Math.min(r.h * 0.14, 150), fx = r.x + (r.w - fw) / 2, fy = r.y + r.h * 0.58;
      return {pts: [rest, [b.typeAt - 0.3, fx + fw * 0.4, fy + fh / 2], [b.typeAt + 0.5, fx + fw - fh * 0.5, fy + fh / 2], [b.typeAt + 1.4, r.x + r.w * 0.8, r.y + r.h * 0.95]],
        clicks: [b.typeAt - 0.2, b.typeAt + 0.65]};
    }
    default:
      return {pts: [rest, [b.at + 1.2, r.x + r.w * 0.8, r.y + r.h * 0.86]], clicks: []};
  }
};
