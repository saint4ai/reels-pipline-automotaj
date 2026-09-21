import {Img, staticFile} from 'remotion';
import type {Box} from '../formats';
import type {BlockData} from '../template/blocks';
import type {SceneProps} from './engine';
import {Draw, E, Fit, itemAt, k, LogoTile, nodeAt, NUM, numText, SANS, scale, springAt, Words} from './parts';

// Общая раскладка блоков для стилей 6–12. Раскладка одна, а «кожа» задаёт материал карточек, шрифты, акценты,
// способ отметки пунктов и подчёркивания — плюс у каждого стиля свои слои (глубина ORBIT, ручка TRACE, предметы PULSE…).
export type Skin = {
  ink: string; sub: string; accent: string; accent2: string;
  font?: string; head?: number; align?: 'left' | 'center';
  panel: (r: number) => React.CSSProperties;          // материал карточки
  row?: (on: number) => React.CSSProperties;          // материал строки списка
  pen?: boolean;                                      // рисованные отметки и подчёркивания (TRACE, экспертное стекло)
  marker?: boolean;                                   // выделение маркером под словом (подкаст)
  tile?: string;                                      // фон плитки логотипа
  objects?: boolean;                                  // крупный предмет блока (PULSE, ORBIT)
  pulse?: (t: number) => number;                      // 0…1 — энергия речи для пульса предметов
};
const DEFAULT_OBJ: Record<string, string> = {hook: 'scissors', list: 'book', stat: 'coins', flow: 'laptop', logos: 'heart', cta: 'comment'};
export const objectOf = (b: BlockData) => b.object ?? DEFAULT_OBJ[b.kind];

const wobble = (x0: number, x1: number, y: number, amp = 6) => `M${x0},${y} C${x0 + (x1 - x0) * 0.3},${y + amp} ${x0 + (x1 - x0) * 0.7},${y - amp} ${x1},${y + amp * 0.5}`;

export const SkinScene: React.FC<SceneProps & {skin: Skin}> = ({t, b, zone: z, skin: S}) => {
  const s = scale(z), font = S.font ?? SANS, head = (S.head ?? 96) * s, align = S.align ?? 'left';
  const W = z.x + z.w + 200, H = z.y + z.h + 200;
  const tx = align === 'center' ? z.x : z.x + 20 * s, tw = z.w - (align === 'center' ? 0 : 40 * s);
  const titleY = z.y + 10 * s;
  const lines = (text: string) => Math.ceil((text.length * head * 0.52) / tw);
  const Title: React.FC<{text: string; accent?: string; size?: number}> = ({text, accent, size = head}) => {
    const n = lines(text);
    return (
      <>
        {b.kicker ? <div style={{position: 'absolute', left: tx, width: tw, top: titleY - 48 * s, textAlign: align, fontFamily: SANS, fontWeight: 700, fontSize: 34 * s,
          letterSpacing: '.08em', color: S.sub, opacity: k(t, b.at, b.at + 0.3)}}>{b.kicker.toUpperCase()}</div> : null}
        <Words t={t} at={b.at} text={text} size={size} color={S.ink} x={tx} y={titleY} w={tw} align={align} family={font} accent={accent} accentColor={S.accent}
          strike={b.kind === 'hook' && b.strike ? {word: b.strike, at: b.strikeAt ?? b.at + 1.5, color: S.accent} : undefined} />
        {S.pen ? <Draw t={t} a={b.at + 0.6} b={b.at + 1.1} w={W} h={H} color={S.accent} width={7 * s}
          d={align === 'center' ? wobble(z.x + z.w * 0.25, z.x + z.w * 0.75, titleY + size * 1.12 * n + 8 * s) : wobble(tx, tx + Math.min(tw, text.length * size * 0.5), titleY + size * 1.12 * n + 8 * s)} /> : null}
        {S.marker ? <div style={{position: 'absolute', left: tx - 10 * s, top: titleY + size * 0.55, height: size * 0.5, width: Math.min(tw, text.length * size * 0.52) * k(t, b.at + 0.4, b.at + 0.9, E.out),
          background: `${S.accent}55`, zIndex: -1}} /> : null}
      </>
    );
  };
  const body = (n: number): Box => {
    const top = titleY + head * 1.12 * n + 70 * s;
    return {x: z.x, y: top, w: z.w, h: z.y + z.h - top};
  };
  // предмет блока: у стилей с предметами — всегда, у остальных — только у хука, если он задан
  const obj = S.objects ? objectOf(b) : b.kind === 'hook' ? b.object : undefined;
  const beat = S.pulse ? S.pulse(t) : 0;
  const ObjectBig: React.FC<{box: Box; at: number}> = ({box, at}) => {
    if (!obj) return null;
    const a = springAt(t, at, 60, 12, 150), size = Math.min(box.w, box.h);
    return <Img src={staticFile(`objects/${obj}.webp`)} style={{position: 'absolute', left: box.x + (box.w - size) / 2, top: box.y + (box.h - size) / 2, width: size, height: size,
      objectFit: 'contain', opacity: Math.min(1, a * 1.5), transform: `scale(${(0.6 + 0.4 * a) * (1 + 0.05 * beat)}) rotate(${(1 - a) * -12 + Math.sin(t * 1.1) * 2}deg)`,
      filter: 'drop-shadow(0 30px 40px rgba(0,0,0,.22))'}} />;
  };
  switch (b.kind) {
    case 'hook': {
      const text = b.lines.join(' '), n = lines(text) + 1, B = body(n);
      return (
        <>
          <Title text={text} size={head * 1.22} />
          {obj ? <ObjectBig box={{x: B.x + B.w * 0.2, y: B.y, w: B.w * 0.6, h: Math.min(B.h, B.w * 0.6)}} at={b.at + 0.5} /> : null}
        </>
      );
    }
    case 'list': {
      const B = body(lines(b.title)), n = b.items.length, row = Math.min(170 * s, (B.h - 60 * s) / n), text = Math.min(64 * s, row * 0.42);
      const done = b.ticks.reduce((a, tc) => a + k(t, tc, tc + 0.3), 0) / n;
      return (
        <>
          <Title text={b.title} />
          <div style={{...S.panel(40 * s), position: 'absolute', left: B.x, top: B.y, width: B.w, height: row * n + 80 * s, opacity: k(t, b.at + 0.15, b.at + 0.45)}} />
          {b.items.map((it, i) => {
            const a = k(t, itemAt(b, i), itemAt(b, i) + 0.4, E.out), tc = b.ticks[i] ?? 1e9;
            const on = k(t, tc, tc + 0.25, E.pop), line = k(t, tc + 0.05, tc + 0.35, E.out), flash = k(t, tc, tc + 0.08) * (1 - k(t, tc + 0.08, tc + 0.5));
            const y = B.y + 40 * s + i * row, bx = B.x + 50 * s, box = row * 0.42;
            return (
              <Fit key={it} name={`row:${it}`} style={{position: 'absolute', left: B.x + 24 * s, width: B.w - 48 * s, top: y, height: row - 12 * s, borderRadius: 24 * s, display: 'flex', alignItems: 'center',
                gap: 30 * s, paddingLeft: Math.max(bx - B.x - 24 * s, text * 0.6), paddingRight: text * 0.6, fontSize: text, boxSizing: 'border-box', overflow: 'hidden', opacity: a, transform: `translateY(${(1 - a) * 30}px) translateX(${flash * 10}px)`,
                ...(S.row ? S.row(on) : {}), boxShadow: flash > 0.05 ? `0 0 ${40 * flash}px ${S.accent2}88` : (S.row ? S.row(on).boxShadow : undefined)}}>
                <svg width={box} height={box} viewBox="0 0 40 40" style={{flex: 'none', overflow: 'visible'}}>
                  {S.pen ? null : <rect x={2} y={2} width={36} height={36} rx={10} fill={on > 0 ? S.accent2 : 'none'} stroke={on > 0 ? S.accent2 : S.sub} strokeWidth={3.5} />}
                  <path d={S.pen ? 'M4 22 L15 33 L38 4' : 'M10 21 L17 28 L31 12'} fill="none" stroke={S.pen ? S.accent : '#05231D'} strokeWidth={S.pen ? 5 : 4.5}
                    strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${on} 1`} />
                  {S.pen && on <= 0 ? <circle cx={20} cy={20} r={15} fill="none" stroke={S.sub} strokeWidth={2.5} strokeDasharray="4 5" /> : null}
                </svg>
                <span style={{position: 'relative', fontFamily: font, fontWeight: 700, fontSize: text, color: on > 0 ? S.sub : S.ink, whiteSpace: 'nowrap'}}>
                  {it}
                  <span style={{position: 'absolute', left: -4, right: 0, top: '54%', height: Math.max(4, text * 0.08), borderRadius: 3, background: S.accent,
                    transformOrigin: 'left center', transform: `scaleX(${line})`}} />
                </span>
              </Fit>
            );
          })}
          <div style={{position: 'absolute', left: B.x + 50 * s, width: B.w * 0.5, top: B.y + 40 * s + n * row + 6 * s, height: 12 * s, borderRadius: 6 * s, background: `${S.sub}33`,
            opacity: k(t, b.at + 0.4, b.at + 0.8)}}>
            <div style={{width: `${done * 100}%`, height: '100%', borderRadius: 6 * s, background: S.accent2}} />
          </div>
        </>
      );
    }
    case 'stat': {
      const B = body(0), size = Math.min(260 * s, B.w * 0.2);
      const fill = k(t, b.countAt, b.countAt + 1.3, E.out), shown = k(t, b.countAt - 0.2, b.countAt);
      const bars = [0.35, 0.5, 0.45, 0.68, 0.82, 1];
      return (
        <>
          <div style={{position: 'absolute', left: z.x, width: z.w, top: z.y + 20 * s, textAlign: align === 'center' ? 'center' : 'left', paddingLeft: align === 'center' ? 0 : 20 * s,
            fontFamily: NUM, fontWeight: 900, fontSize: size, letterSpacing: '-0.05em', color: S.accent, opacity: shown}}>{numText(b, t)}</div>
          {S.pen ? <Draw t={t} a={b.countAt + 1.2} b={b.countAt + 1.7} w={W} h={H} color={S.accent} width={6 * s}
            d={`M${z.x + 30 * s},${z.y + size * 1.1} C${z.x + z.w * 0.3},${z.y + size * 1.2} ${z.x + z.w * 0.6},${z.y + size * 1.02} ${z.x + z.w * 0.78},${z.y + size * 1.1}`} /> : null}
          <Words t={t} at={b.countAt + 0.2} text={b.caption} size={head * 0.72} color={S.ink} x={tx} y={z.y + size * 1.25} w={tw} align={align} family={font} />
          {obj ? <ObjectBig box={{x: z.x + z.w * 0.55, y: z.y + z.h * 0.45, w: z.w * 0.42, h: z.h * 0.5}} at={b.countAt} /> : null}
          <div style={{position: 'absolute', left: z.x + 20 * s, width: obj ? z.w * 0.5 : z.w - 40 * s, top: z.y + z.h * 0.6, height: z.h * 0.34, display: 'flex', alignItems: 'flex-end', gap: 16 * s}}>
            {bars.map((v, i) => {
              const g = k(t, b.countAt + i * 0.1, b.countAt + 0.5 + i * 0.1, E.pop);
              return <div key={i} style={{flex: 1, height: `${v * 100 * g * (0.3 + 0.7 * fill)}%`, borderRadius: 12 * s, background: i === bars.length - 1 ? S.accent : `${S.sub}44`}} />;
            })}
          </div>
        </>
      );
    }
    case 'logos': {
      const B = body(lines(b.title)), n = b.logos.length, tile = Math.min(220 * s, (B.w - 100 * s) / n - 26 * s);
      return (
        <>
          <Title text={b.title} />
          <div style={{position: 'absolute', left: B.x, width: B.w, top: B.y + 40 * s, display: 'flex', justifyContent: align === 'center' ? 'center' : 'flex-start', gap: 26 * s,
            paddingLeft: align === 'center' ? 0 : 20 * s}}>
            {b.logos.map((name, i) => {
              const a = springAt(t, itemAt(b, i));
              return <div key={name} style={{transform: `translateY(${(1 - a) * 60 - beat * 6 * (i % 2 ? 1 : -1)}px) scale(${0.5 + 0.5 * a})`, opacity: Math.min(1, a * 2)}}>
                <LogoTile name={name} size={tile} bg={S.tile} /></div>;
            })}
          </div>
          {obj ? <ObjectBig box={{x: B.x + B.w * 0.25, y: B.y + tile + 100 * s, w: B.w * 0.5, h: B.h - tile - 120 * s}} at={b.at + 0.9} /> : null}
        </>
      );
    }
    case 'flow': {
      const B = body(lines(b.title)), n = b.nodes.length, vertical = B.h >= B.w * 0.55;
      const nh = Math.min(132 * s, (vertical ? B.h / n : B.h * 0.3) * 0.66), nw = vertical ? Math.min(620 * s, B.w * 0.62) : Math.min(440 * s, (B.w / n) * 0.86);
      const pos = (i: number) => vertical
        ? {x: B.x + B.w / 2 + (i % 2 ? 1 : -1) * B.w * 0.14, y: B.y + (B.h / n) * (i + 0.5)}
        : {x: B.x + (B.w / n) * (i + 0.5), y: B.y + B.h * (i % 2 ? 0.62 : 0.32)};
      return (
        <>
          <Title text={b.title} />
          {b.nodes.slice(1).map((_, i) => {
            const a = pos(i), c = pos(i + 1);
            const d = vertical ? `M${a.x},${a.y + nh / 2} C${a.x},${(a.y + c.y) / 2} ${c.x},${(a.y + c.y) / 2} ${c.x},${c.y - nh / 2}`
              : `M${a.x + nw / 2},${a.y} C${(a.x + c.x) / 2},${a.y} ${(a.x + c.x) / 2},${c.y} ${c.x - nw / 2},${c.y}`;
            return <Draw key={i} t={t} a={nodeAt(b, i + 1) - 0.45} b={nodeAt(b, i + 1) - 0.05} w={W} h={H} color={S.pen ? S.accent : S.accent2} width={(S.pen ? 6 : 5) * s}
              glow={S.pen ? undefined : `${S.accent2}88`} d={d} />;
          })}
          {b.nodes.map((nd, i) => {
            const p = pos(i), a = springAt(t, nodeAt(b, i)), last = i === n - 1;
            return (
              <Fit key={nd.label} name={`node:${nd.label}`} style={{...S.panel(nh / 2), position: 'absolute', left: p.x - nw / 2, top: p.y - nh / 2, width: nw, height: nh, display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 14 * s, padding: `0 ${nh * 0.3}px`, boxSizing: 'border-box', overflow: 'hidden', transform: `scale(${a})`, opacity: Math.min(1, a * 2),
                outline: last ? `${4 * s}px solid ${S.accent}` : undefined, fontFamily: font, fontWeight: 700, fontSize: nh * 0.36, color: S.ink, whiteSpace: 'nowrap'}}>
                {nd.logo ? <LogoTile name={nd.logo} size={nh * 0.62} bg={S.tile} shadow="none" /> : null}{nd.label}
              </Fit>
            );
          })}
        </>
      );
    }
    case 'cta': {
      const typed = Math.round(b.word.length * k(t, b.typeAt, b.typeAt + 0.45, (v) => v)), posted = k(t, b.typeAt + 0.8, b.typeAt + 1.1, E.pop);
      const B = body(lines(b.note)), fh = Math.min(150 * s, B.h * 0.2), fw = Math.min(B.w * 0.9, 1100 * s), fx = B.x + (B.w - fw) / 2;
      return (
        <>
          <Title text={b.note} />
          <div style={{position: 'absolute', left: B.x, width: B.w, top: B.y + 10 * s, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: Math.min(220 * s, B.h * 0.3),
            letterSpacing: '-0.04em', color: S.accent, opacity: posted, transform: `scale(${0.8 + 0.2 * posted})`}}>«{b.word}»</div>
          <Fit name="cta-field" style={{...S.panel(fh / 2), position: 'absolute', left: fx, top: B.y + B.h * 0.5, width: fw, height: fh, display: 'flex', alignItems: 'center', padding: `0 ${fh * 0.35}px`,
            boxSizing: 'border-box', overflow: 'hidden', whiteSpace: 'nowrap', fontFamily: SANS, fontWeight: 700, fontSize: fh * 0.36, color: typed ? S.ink : S.sub, opacity: k(t, b.at + 0.3, b.at + 0.6)}}>
            {typed ? b.word.slice(0, typed) : 'Добавить комментарий…'}
          </Fit>
          {obj ? <ObjectBig box={{x: B.x + B.w * 0.7, y: B.y + B.h * 0.66, w: B.w * 0.28, h: B.h * 0.32}} at={b.typeAt + 0.9} /> : null}
        </>
      );
    }
  }
};
