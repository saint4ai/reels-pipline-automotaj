import {AbsoluteFill, Img, staticFile} from 'remotion';
import {blurThrough, bloom} from '../kit/presentations';
import type {Box} from '../formats';
import type {StyleDef, SceneProps} from './engine';
import {Draw, E, Fit, k, LogoTile, NUM, numText, SANS, springAt, Words, itemAt, nodeAt, lerpBox, scale} from './parts';

// PRISM — пластичный интерфейс на светлой платине. Главная механика: ОДИН стеклянный объект сохраняет идентичность —
// компактная капсула пружиной раскрывается в объясняющую карточку (форма меняется первой, строки входят с запаздыванием),
// в конце блока карточка показывает результат. Светлое стекло с кантом, один проход света, короткое превышение пружины.
const INK = '#15181B', SUB = '#6A7078', ORANGE = '#FF7A2F', MINT = '#12A57F';
const TINTS = [['#FFE3D1', '#D6F6EC'], ['#E4ECF6', '#FFE9DA'], ['#DDF5EE', '#F3E6FF'], ['#FFF0DC', '#DCEFFA']];

const Background: StyleDef['Background'] = ({t, i, f}) => {
  const [a, b] = TINTS[i % TINTS.length];
  const drift = Math.sin(t * 0.4) * 30;
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #F7F8FA 0%, #EDEFF3 100%)'}}>
      <div style={{position: 'absolute', left: f.w * 0.55 + drift, top: f.h * 0.05, width: f.w * 0.8, height: f.w * 0.8, borderRadius: '50%', background: a, filter: 'blur(120px)', opacity: 0.9}} />
      <div style={{position: 'absolute', left: -f.w * 0.3 - drift, top: f.h * 0.45, width: f.w * 0.9, height: f.w * 0.9, borderRadius: '50%', background: b, filter: 'blur(140px)', opacity: 0.85}} />
      {/* один мягкий блик по диагонали — «призма» */}
      <div style={{position: 'absolute', inset: 0, background: `linear-gradient(115deg, transparent 38%, rgba(255,255,255,.7) ${48 + Math.sin(t * 0.3) * 4}%, transparent 60%)`, opacity: 0.55}} />
    </AbsoluteFill>
  );
};

// стеклянная панель: белое стекло 70%, кант, мягкая тень
const glass = (r: number): React.CSSProperties => ({position: 'absolute', borderRadius: r, background: 'rgba(255,255,255,.72)', backdropFilter: 'blur(24px) saturate(1.4)',
  WebkitBackdropFilter: 'blur(24px) saturate(1.4)', boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,.95), inset 0 0 0 1.5px rgba(255,255,255,.6), 0 2px 6px rgba(20,24,28,.06), 0 30px 70px rgba(20,24,28,.12)'});

// капсула → карточка: форма меняется первой (пружина с превышением), содержимое входит после
const Morph: React.FC<{t: number; at: number; from: Box; to: Box; label: string; children: (inT: number) => React.ReactNode}> = ({t, at, from, to, label, children}) => {
  const p = springAt(t, at + 0.15);
  const box = lerpBox(from, to, p);
  const pill = 1 - k(t, at + 0.15, at + 0.35);
  const inT = k(t, at + 0.45, at + 0.8, E.out);
  const sheen = k(t, at + 0.35, at + 1.2, E.inOut);
  return (
    <div style={{...glass(Math.min(box.h / 2, 44 + (1 - p) * 40)), left: box.x, top: box.y, width: box.w, height: box.h, overflow: 'hidden', opacity: k(t, at, at + 0.2)}}>
      {pill > 0 ? <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 16, padding: '0 34px', opacity: pill, fontFamily: SANS, fontWeight: 700,
        fontSize: from.h * 0.34, color: INK, whiteSpace: 'nowrap'}}><span style={{width: from.h * 0.3, height: from.h * 0.3, borderRadius: '50%', background: ORANGE, flex: 'none'}} />{label}</div> : null}
      {/* содержимое раскладывается сразу в конечном размере карточки — во время раскрытия ничего не переносится */}
      <div style={{position: 'absolute', left: 0, top: 0, width: to.w, height: to.h, opacity: inT, transform: `translateY(${(1 - inT) * 14}px)`}}>{children(inT)}</div>
      {sheen > 0 && sheen < 1 ? <div style={{position: 'absolute', top: 0, bottom: 0, left: `${-40 + 150 * sheen}%`, width: '35%', transform: 'skewX(-14deg)',
        background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.85), rgba(255,255,255,0))'}} /> : null}
    </div>
  );
};

const Scene: StyleDef['Scene'] = ({t, b, zone: z}: SceneProps) => {
  const s = scale(z);
  const head = {x: z.x + 30 * s, y: z.y + 10 * s, size: 92 * s};
  const kicker = b.kicker ? <div style={{position: 'absolute', left: head.x, top: head.y - 44 * s, fontFamily: SANS, fontWeight: 700, fontSize: 34 * s, letterSpacing: '.08em',
    color: SUB, opacity: k(t, b.at, b.at + 0.3)}}>{b.kicker.toUpperCase()}</div> : null;
  const pill: Box = {x: z.x + z.w / 2 - 300 * s, y: z.y + 330 * s, w: 600 * s, h: 118 * s};
  const card = (h: number): Box => ({x: z.x + 30 * s, y: z.y + 300 * s, w: z.w - 60 * s, h: Math.min(h * s, z.h - 320 * s)});
  const title = (text: string, accent?: string) => (
    <Words t={t} at={b.at} text={text} size={head.size} color={INK} x={head.x} y={head.y} w={z.w - 60 * s} accent={accent} accentColor={ORANGE} />
  );
  switch (b.kind) {
    case 'hook': {
      const text = b.lines.join(' ');
      return (
        <>
          {kicker}
          <Words t={t} at={b.at} text={text} size={head.size * 1.25} color={INK} x={head.x} y={head.y} w={z.w - 60 * s} strike={b.strike ? {word: b.strike, at: b.strikeAt ?? b.at + 1.5, color: ORANGE} : undefined} />
          <Morph t={t} at={b.at + 0.6} from={pill} to={card(620)} label="Сначала — главное">
            {() => b.object ? <Img src={staticFile(`objects/${b.object}.webp`)} style={{position: 'absolute', left: '50%', top: '50%', width: 420 * s, height: 420 * s,
              transform: `translate(-50%, -50%) rotate(${Math.sin(t * 1.2) * 3}deg)`, objectFit: 'contain'}} /> : null}
          </Morph>
        </>
      );
    }
    case 'list': {
      const row = 150 * s;
      return (
        <>
          {kicker}{title(b.title)}
          <Morph t={t} at={b.at + 0.2} from={pill} to={card(90 + b.items.length * 150 + 60)} label={b.title}>
            {() => b.items.map((it, i) => {
              const a = k(t, itemAt(b, i) + 0.4, itemAt(b, i) + 0.8, E.out), tick = k(t, b.ticks[i], b.ticks[i] + 0.3, E.pop);
              return (
                <Fit key={it} name={`prism-row:${it}`} style={{position: 'absolute', left: 36 * s, right: 36 * s, top: 50 * s + i * row, height: row - 22 * s, borderRadius: 26 * s, overflow: 'hidden', fontSize: 60 * s,
                  background: tick > 0 ? 'rgba(18,165,127,.08)' : 'rgba(255,255,255,.7)', boxShadow: 'inset 0 0 0 1.5px rgba(20,24,28,.05)', display: 'flex', alignItems: 'center',
                  gap: 26 * s, padding: `0 ${30 * s}px`, opacity: a, transform: `translateX(${(1 - a) * -30}px)`}}>
                  <span style={{width: 56 * s, height: 56 * s, borderRadius: 16 * s, flex: 'none', background: i % 2 ? 'rgba(255,122,47,.16)' : 'rgba(18,165,127,.14)',
                    display: 'grid', placeItems: 'center', fontFamily: NUM, fontWeight: 800, fontSize: 28 * s, color: i % 2 ? ORANGE : MINT}}>{i + 1}</span>
                  <span style={{flex: 1, fontFamily: SANS, fontWeight: 700, fontSize: 60 * s, color: INK, whiteSpace: 'nowrap'}}>{it}</span>
                  <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 60 * s, color: MINT, opacity: tick, transform: `scale(${0.4 + 0.6 * tick})`}}>✓</span>
                </Fit>
              );
            })}
          </Morph>
        </>
      );
    }
    case 'stat': {
      const c = card(640);
      const fill = k(t, b.countAt, b.countAt + 1.3, E.out);
      return (
        <>
          {kicker}{title(b.caption)}
          <Morph t={t} at={b.at + 0.2} from={pill} to={c} label={b.caption}>
            {() => (
              <>
                <div style={{position: 'absolute', left: 50 * s, top: 40 * s, fontFamily: NUM, fontWeight: 900, fontSize: 210 * s, letterSpacing: '-0.05em', color: INK}}>{numText(b, t)}</div>
                {[['без системы', 0.34, '#B9C2CC'], ['с системой', 1, ORANGE]].map(([label, v, col], i) => (
                  <div key={i} style={{position: 'absolute', left: 50 * s, right: 50 * s, top: (330 + i * 130) * s}}>
                    <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 36 * s, color: SUB}}>{label as string}</div>
                    <div style={{marginTop: 12 * s, height: 44 * s, borderRadius: 14 * s, background: 'rgba(20,24,28,.06)'}}>
                      <div style={{width: `${(v as number) * fill * 100}%`, height: '100%', borderRadius: 14 * s, background: col as string}} />
                    </div>
                  </div>
                ))}
              </>
            )}
          </Morph>
        </>
      );
    }
    case 'logos': {
      const n = b.logos.length, tile = Math.min(190 * s, (z.w - 200 * s) / n - 20 * s);
      return (
        <>
          {kicker}{title(b.title)}
          <Morph t={t} at={b.at + 0.2} from={pill} to={card(420)} label={b.title}>
            {() => (
              <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28 * s}}>
                {b.logos.map((name, i) => {
                  const a = springAt(t, itemAt(b, i) + 0.45);
                  return <div key={name} style={{transform: `scale(${a}) translateY(${(1 - a) * 30}px)`}}><LogoTile name={name} size={tile} bg="#FFFFFF" shadow="0 14px 30px rgba(20,24,28,.12)" /></div>;
                })}
              </div>
            )}
          </Morph>
        </>
      );
    }
    case 'flow': {
      const c = card(700), n = b.nodes.length;
      return (
        <>
          {kicker}{title(b.title)}
          <Morph t={t} at={b.at + 0.1} from={pill} to={c} label={b.title}>
            {() => {
              const W = c.w, H = c.h, cx = W / 2;
              const pos = (i: number) => ({x: cx + (i === 0 ? 0 : (i % 2 ? -1 : 1) * W * 0.26), y: H * (0.18 + (i / Math.max(1, n - 1)) * 0.64)});
              return (
                <>
                  {b.nodes.slice(1).map((_, i) => {
                    const a = pos(i), c2 = pos(i + 1);
                    return <Draw key={i} t={t} a={nodeAt(b, i + 1) - 0.4} b={nodeAt(b, i + 1)} w={W} h={H} color="#B9C2CC" width={4 * s}
                      d={`M${a.x},${a.y} C${a.x},${(a.y + c2.y) / 2} ${c2.x},${(a.y + c2.y) / 2} ${c2.x},${c2.y}`} />;
                  })}
                  {b.nodes.map((nd, i) => {
                    const p = pos(i), a = springAt(t, nodeAt(b, i)), last = i === n - 1;
                    return (
                      <Fit key={nd.label} name={`prism-node:${nd.label}`} style={{position: 'absolute', left: p.x - 230 * s, top: p.y - 52 * s, width: 460 * s, height: 104 * s, borderRadius: 52 * s, padding: `0 ${24 * s}px`, boxSizing: 'border-box', overflow: 'hidden',
                        background: last ? 'rgba(255,122,47,.16)' : 'rgba(255,255,255,.9)', boxShadow: last ? 'inset 0 0 0 2px rgba(255,122,47,.5)' : '0 10px 26px rgba(20,24,28,.10)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 * s, transform: `scale(${a})`,
                        fontFamily: SANS, fontWeight: 700, fontSize: 40 * s, color: INK, whiteSpace: 'nowrap'}}>
                        {nd.logo ? <LogoTile name={nd.logo} size={60 * s} bg="#FFFFFF" shadow="none" /> : null}{nd.label}
                      </Fit>
                    );
                  })}
                </>
              );
            }}
          </Morph>
        </>
      );
    }
    case 'cta': {
      const typed = Math.round(b.word.length * k(t, b.typeAt, b.typeAt + 0.45, (v) => v));
      return (
        <>
          {kicker}{title(b.note)}
          <Morph t={t} at={b.at + 0.2} from={pill} to={card(560)} label="Кодовое слово">
            {() => (
              <>
                <div style={{position: 'absolute', left: 50 * s, top: 50 * s, fontFamily: SANS, fontWeight: 700, fontSize: 36 * s, letterSpacing: '.08em', color: SUB}}>КОДОВОЕ СЛОВО</div>
                <div style={{position: 'absolute', left: 50 * s, top: 110 * s, fontFamily: SANS, fontWeight: 800, fontSize: 190 * s, letterSpacing: '-0.04em', color: INK}}>
                  «{b.word.slice(0, typed)}{typed < b.word.length ? <span style={{opacity: Math.floor(t * 3) % 2 ? 1 : 0.2}}>|</span> : null}»
                </div>
                <div style={{position: 'absolute', left: 50 * s, right: 50 * s, top: 380 * s, height: 3 * s, background: 'rgba(20,24,28,.08)'}} />
                <div style={{position: 'absolute', left: 50 * s, top: 410 * s, fontFamily: SANS, fontWeight: 600, fontSize: 42 * s, color: SUB}}>в комментарии — пришлю материалы</div>
              </>
            )}
          </Morph>
        </>
      );
    }
  }
};

export const PRISM: StyleDef = {
  id: 'prism', speaker: 'card', Background, Scene,
  zone: (f) => f.card,
  captions: (f) => ({...f.captions, light: true}),
  transition: (i, f) => (i % 2 ? blurThrough({color: '#F4F5F7'}) : bloom({color: '#FFFFFF', x: f.w / 2, y: f.h * 0.35})) as never,
  sfx: {move: 'shimmer', pop: 'ui-glass', tick: 'ui-tap', count: 'counter'},
};
