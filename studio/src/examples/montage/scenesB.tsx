import {AbsoluteFill, Img, staticFile} from 'remotion';
import {Video} from '@remotion/media';
import {textDepth} from '../../ds/tokens';
import {CapsuleLine} from '../../kit/liquid/CapsuleLine';
import {GlassEnv} from '../../kit/liquid/env';
import {LiquidPanel} from '../../kit/liquid/LiquidPanel';
import {Object25D} from '../../kit/liquid/Object25D';
import {DawnSky, Grain, rnd} from '../../kit/liquid/stage';
import {B} from './timing';
import {at} from './words';
import {C, Chip, E, k, Mark, MONO, SANS, Txt} from './parts';

const line = (size: number, y: number, x = 720) => ({family: SANS, weight: 800, size, x, y, align: 'center' as const, tracking: -0.03});
const full: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: 1440, height: 2560};

// ——— B1–B2 и C0: небо на рассвете (S2). Карточки правил в облаках → ссылка в поле Claude → панель ставит всё сама → «по шагам» ———
const RULES = [
  {label: '62 приёма анимации', cover: 'r21/covers/r19.jpg', x: 100, y: 540, at: 18.3},
  {label: 'дизайн-система', cover: 'r21/covers/r20.jpg', x: 580, y: 730, at: 18.5},
  {label: 'проверка кадров', cover: 'r21/covers/r4.jpg', x: 100, y: 920, at: 19.1},
  {label: 'правила монтажа', cover: 'r21/covers/r7.jpg', x: 580, y: 1110, at: 19.78},
];
const CARD = {w: 760, h: 170};
export const RISE = [22.2, 23.0] as const;
const FIELD = {x: 170, y: 640, w: 1100, h: 150};
const PANEL = {x: 170, y: 500, w: 1100, h: 760};
const CHECKS = [
  {label: 'Node.js', at: 23.9}, {label: 'ffmpeg', at: 24.1}, {label: 'шрифты', at: 24.3}, {label: 'навыки монтажа', at: 24.5},
];
// Капсула «по шагам», из которой вырастает мир-таймлайн (переход island в Reel.tsx).
export const STEPS = {x: 370, y: 745, w: 700, h: 230};
export const STEPS_AT = at(72) - 0.1;

const RuleCard: React.FC<{t: number; r: (typeof RULES)[number]; i: number}> = ({t, r, i}) => {
  const a = k(t, r.at, r.at + 0.6, E.out);
  const away = k(t, 21.8 + i * 0.04, 22.2 + i * 0.04, E.acc);
  const back = k(t, 24.35 + i * 0.08, 24.85 + i * 0.08, E.inOut); // «сразу знает»: карточки влетают в панель
  if (a <= 0 || (away >= 1 && back <= 0) || back >= 1) return null;
  const fl = 12 * Math.sin(t * 1.3 + i);
  const cx = r.x + CARD.w / 2, cy = r.y + CARD.h / 2;
  const tx = back > 0 ? (720 - cx) * back : away * (cx < 720 ? -1100 : 1100), ty = back > 0 ? (PANEL.y + 560 - cy) * back + (1 - back) * 900 : (1 - a) * 500 + away * 200 + fl;
  const s = back > 0 ? 0.5 + 0.2 * (1 - back) : 1;
  return (
    <div style={{...full, opacity: back > 0 ? Math.min(1, back * 3) * (1 - k(t, 24.75 + i * 0.08, 24.9 + i * 0.08)) : a * (1 - away), transformOrigin: `${cx}px ${cy}px`,
      transform: `translate(${tx}px, ${ty}px) scale(${s}) rotate(${(i % 2 ? 2 : -2) * (1 - back)}deg)`}}>
      <LiquidPanel x={r.x} y={r.y} w={CARD.w} h={CARD.h} r={44} material="milk" tone="light" level={2} sheen={k(t, r.at + 0.3, r.at + 1.1)}>
        <div style={{display: 'flex', alignItems: 'center', gap: 26, height: '100%', padding: '0 30px'}}>
          <div style={{width: 112, height: 112, borderRadius: 26, overflow: 'hidden', flex: 'none', boxShadow: '0 6px 16px rgba(0,0,0,.25)',
            opacity: k(t, at(55) + i * 0.1, at(55) + i * 0.1 + 0.3), transform: `scale(${0.6 + 0.4 * k(t, at(55) + i * 0.1, at(55) + i * 0.1 + 0.4, E.pop)})`, background: '#222'}}>
            <Img src={staticFile(r.cover)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top'}} />
          </div>
          <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 54, color: C.dark, letterSpacing: '-0.02em', whiteSpace: 'nowrap'}}>{r.label}</span>
        </div>
      </LiquidPanel>
    </div>
  );
};

export const Sky: React.FC<{t: number}> = ({t}) => {
  const rise = k(t, RISE[0], RISE[1], E.inOut);
  const m = k(t, 23.3, 23.78, E.inOut); // поле перетекает в панель
  const box = {x: FIELD.x, y: FIELD.y + (PANEL.y - FIELD.y) * m, w: FIELD.w, h: FIELD.h + (PANEL.h - FIELD.h) * m};
  const fieldIn = k(t, 22.12, 22.5, E.pop) * (1 - k(t, 26.2, 26.5));
  const link = k(t, at(60) - 0.1, at(60) + 0.35, E.inOut);
  const flash = k(t, 25.0, 25.2) * (1 - k(t, 25.3, 25.8));
  const glowClaude = k(t, at(61), at(61) + 0.15) * (1 - k(t, at(61) + 0.3, at(61) + 0.7));
  const steps = k(t, STEPS_AT, STEPS_AT + 0.4, E.pop);
  return (
    <AbsoluteFill>
      <GlassEnv bg={() => <DawnSky t={t} rise={rise} />}>
        <div style={{...full, opacity: k(t, 18.2, 18.5) * (1 - k(t, 21.9, 22.25))}}>
          <CapsuleLine t={t} words={['набор', 'правил', 'и', 'приёмов']} stops={[{at: at(51), i: 1}, {at: at(53), i: 3}]} style={line(100, 372)} textShadow={textDepth}
            capsule={{material: 'solid', tone: 'mint', moon: 0.5}} />
        </div>
        {RULES.map((r, i) => <RuleCard key={i} t={t} r={r} i={i} />)}
        {/* B2: поле Claude, в него влетает ссылка; поле перетекает в панель, галочки ставятся сами */}
        {fieldIn > 0 ? (
          <div style={{...full, opacity: Math.min(1, fieldIn), transformOrigin: '720px 715px', transform: `scale(${0.85 + 0.15 * Math.min(1, fieldIn)})`}}>
            <LiquidPanel x={box.x} y={box.y} w={box.w} h={box.h} r={m > 0 ? 75 - 19 * m : 'pill'} material="frosted" level={3} moon={0.6}
              fill={0.5} sheen={k(t, 23.3, 24.1)}
              style={{boxShadow: `0 0 0 ${3 + 4 * flash}px rgba(${flash > 0 ? '61,237,195' : '217,119,87'},${0.25 + glowClaude * 0.6 + flash * 0.7}), 0 40px 90px rgba(0,0,0,.4)`}}>
              <div style={{position: 'absolute', left: 36, top: 36, display: 'flex', alignItems: 'center', gap: 22}}>
                <Mark name="claude" size={78} />
                <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 60, color: C.ink, textShadow: textDepth, opacity: m, whiteSpace: 'nowrap'}}>ставит всё сам</span>
              </div>
              {m >= 0.999 ? CHECKS.map((c, i) => {
                const a = k(t, c.at, c.at + 0.3, E.pop);
                return (
                  <div key={i} style={{position: 'absolute', left: 60, top: 190 + i * 118, display: 'flex', alignItems: 'center', gap: 30, opacity: m * k(t, c.at - 0.2, c.at)}}>
                    <div style={{width: 72, height: 72, borderRadius: '50%', display: 'grid', placeItems: 'center', flex: 'none',
                      background: a > 0.1 ? C.mint : 'rgba(255,255,255,.12)', transform: `scale(${0.6 + 0.4 * a})`, boxShadow: a > 0.1 ? '0 0 22px rgba(61,237,195,.6)' : 'none'}}>
                      <svg width={40} height={40} viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6.5" fill="none" stroke={C.mintInk} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round"
                        strokeDasharray={30} strokeDashoffset={30 * (1 - a)} /></svg>
                    </div>
                    <span style={{fontFamily: SANS, fontWeight: 700, fontSize: 58, color: C.ink, textShadow: textDepth}}>{c.label}</span>
                  </div>
                );
              }) : null}
            </LiquidPanel>
          </div>
        ) : null}
        {/* ссылка на репозиторий влетает в поле */}
        {link > 0 && m < 1 ? (
          <div style={{...full, opacity: 1 - m, transform: `translate(${(1 - link) * 420}px, ${(1 - link) * -420 + m * -40}px) scale(${1 - 0.1 * link})`, transformOrigin: '800px 715px'}}>
            <div style={{position: 'absolute', left: 300, top: 670, height: 92, padding: '0 34px', borderRadius: 46, display: 'flex', alignItems: 'center', gap: 18,
              background: 'rgba(255,255,255,.92)', boxShadow: '0 12px 30px rgba(0,0,0,.25), inset 0 2px 0 #fff'}}>
              <Mark name="github-dark" size={52} />
              <span style={{fontFamily: MONO, fontWeight: 600, fontSize: 44, color: C.dark, whiteSpace: 'nowrap'}}>saint4ai/reels-pipline-automotaj</span>
            </div>
          </div>
        ) : null}
        <Chip t={t} at={at(67) - 0.05} out={26.2} x={720} y={PANEL.y + PANEL.h + 30} label="знает, как монтировать" size={60} glass={{material: 'solid', tone: 'mint'}} />
        {/* C0: «Дальше по шагам» — капсула, из которой вырастет таймлайн */}
        {steps > 0 ? (
          <div style={{...full, opacity: Math.min(1, steps * 2), transformOrigin: `${STEPS.x + STEPS.w / 2}px ${STEPS.y + STEPS.h / 2}px`, transform: `scale(${0.5 + 0.5 * steps})`}}>
            <LiquidPanel x={STEPS.x} y={STEPS.y} w={STEPS.w} h={STEPS.h} r="pill" material="solid" tone="mint" level={3} moon={0.6} sheen={k(t, STEPS_AT + 0.2, STEPS_AT + 0.9)}>
              <div style={{display: 'grid', placeItems: 'center', height: '100%', fontFamily: SANS, fontWeight: 800, fontSize: 110, color: C.mintInk, letterSpacing: '-0.03em'}}>по шагам</div>
            </LiquidPanel>
          </div>
        ) : null}
      </GlassEnv>
    </AbsoluteFill>
  );
};

// ——— C1–C3: холст-таймлайн (S4). Камера едет за мятным плейхедом по трём станциям ———
export const TL_IN = 27.0;
const XS = [0, 1600, 3200];
const MOVES = [[32.2, 32.75, 1], [36.7, 37.25, 2]] as const;
export const camX = (t: number) => {
  let x = XS[0];
  for (const [a, b, i] of MOVES) x += (XS[i] - XS[i - 1]) * k(t, a, b, E.inOut);
  return x;
};
const moving = (t: number) => MOVES.reduce((m, [a, b]) => Math.max(m, t > a && t < b ? Math.sin(Math.PI * (t - a) / (b - a)) : 0), 0);
const playhead = (t: number) => {
  const seg = [[27.4, 32.2, 0], [32.75, 36.7, 1], [37.25, 44.2, 2]] as const;
  for (const [a, b, i] of seg) if (t < b) return XS[i] + 180 + 1080 * k(t, a, b, (v) => v);
  return XS[2] + 1260;
};

// Волна «длинного подкаста»: столбики детерминированные, длина уходит за край станции.
const r0 = rnd(21);
const BARS = Array.from({length: 100}, (_, i) => 0.25 + 0.75 * Math.abs(Math.sin(i * 0.37) * 0.6 + Math.sin(i * 0.11 + 1) * 0.4) * (0.6 + 0.4 * r0()));
const CUTS = [420, 700, 980, 1240];
const STRONG = [1, 3];

const Timeline: React.FC<{t: number}> = ({t}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: 4800, height: 2560, background: '#16181B', overflow: 'hidden'}}>
    {/* зоны света: оранжевая → мятная → графит */}
    {[['255,122,47', 720, 0.32], ['61,237,195', 2320, 0.26], ['230,236,240', 3920, 0.16]].map(([c, x, o], i) => (
      <div key={i} style={{position: 'absolute', left: Number(x) - 1300, top: -300, width: 2600, height: 2600, borderRadius: '50%',
        background: `radial-gradient(closest-side, rgba(${c},${o}) 0%, rgba(${c},${Number(o) * 0.35}) 45%, rgba(${c},0) 100%)`}} />
    ))}
    <div style={{position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.05) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,.05) 2px, transparent 2px)', backgroundSize: '80px 80px'}} />
    <div style={{position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,.09) 2px, transparent 2px)', backgroundSize: '400px 100%'}} />
    {/* линейка с таймкодами */}
    <div style={{position: 'absolute', left: 0, top: 380, width: 4800, height: 70, borderBottom: '2px solid rgba(255,255,255,.18)',
      backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,.35) 2px, transparent 2px)', backgroundSize: '80px 22px', backgroundRepeat: 'repeat-x', backgroundPosition: '0 48px'}} />
    {Array.from({length: 12}, (_, i) => (
      <div key={i} style={{position: 'absolute', left: i * 400 + 12, top: 382, fontFamily: MONO, fontWeight: 500, fontSize: 44, color: 'rgba(255,255,255,.55)'}}>
        {`00:${String(i * 5).padStart(2, '0')}`}
      </div>
    ))}
    {/* дорожки */}
    {[960, 1100, 1290].map((y, i) => (
      <div key={i} style={{position: 'absolute', left: 0, top: y, width: 4800, height: i === 1 ? 170 : 90, background: 'rgba(255,255,255,.035)',
        borderTop: '2px solid rgba(255,255,255,.07)', borderBottom: '2px solid rgba(255,255,255,.07)'}} />
    ))}
    <Grain o={0.06} />
  </div>
);

// Макет кадра рилса с кнопками Instagram справа: лицо, подпись, надпись — проверка до рендера.
const MockFrame: React.FC<{t: number; x: number; y: number; w: number}> = ({t, x, y, w}) => {
  const h = (w * 16) / 9;
  const scan = k(t, at(102), at(102) + 1.0, E.inOut);
  const capFix = k(t, at(108) - 0.1, at(108) + 0.35, E.inOut);
  const tagFix = k(t, at(113) - 0.1, at(113) + 0.35, E.inOut);
  const faceBad = k(t, at(106), at(106) + 0.15) * (1 - capFix);
  const tagBad = k(t, at(111), at(111) + 0.15) * (1 - tagFix);
  const faceY = y + h * 0.47, faceX = x + w * 0.45;
  const rail = ['M12 21s-7-4.4-9.5-8.6C.9 9.5 2.6 6 6 6c2 0 3.3 1.1 4 2.2C10.7 7.1 12 6 14 6c3.4 0 5.1 3.5 3.5 6.4C19 16.6 12 21 12 21z',
    'M4 5h16v11H9l-5 4z', 'M3 11l18-8-7 18-3-7z'];
  return (
    <>
      <LiquidPanel x={x - 18} y={y - 18} w={w + 36} h={h + 36} r={46} material="clear" level={3} moon={0.4} />
      <div style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 32, overflow: 'hidden', background: '#0B0C0E'}}>
        <Video src={staticFile('r21/speaker.mp4')} muted objectFit="cover" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.9}} />
        <div style={{position: 'absolute', left: w * 0.08, top: h * 0.08, width: w * 0.62, height: h * 0.07, borderRadius: 12, background: 'rgba(255,255,255,.85)'}} />
        <div style={{position: 'absolute', left: w * 0.08, top: h * 0.165, width: w * 0.44, height: h * 0.045, borderRadius: 10, background: 'rgba(255,255,255,.5)'}} />
        {/* кнопки Instagram справа */}
        {rail.map((d, i) => (
          <svg key={i} width={w * 0.1} height={w * 0.1} viewBox="0 0 24 24" style={{position: 'absolute', left: w * 0.86, top: h * (0.56 + i * 0.075)}}>
            <path d={d} fill="none" stroke="#fff" strokeWidth={2} strokeLinejoin="round" />
          </svg>
        ))}
        <div style={{position: 'absolute', left: w * 0.06, top: h * 0.86, width: w * 0.5, height: h * 0.022, borderRadius: 6, background: 'rgba(255,255,255,.7)'}} />
        <div style={{position: 'absolute', left: w * 0.06, top: h * 0.9, width: w * 0.7, height: h * 0.018, borderRadius: 6, background: 'rgba(255,255,255,.45)'}} />
      </div>
      {/* подпись: сначала на лице, потом уезжает вверх */}
      <div style={{position: 'absolute', left: x + w * 0.12, top: faceY - 20 - capFix * h * 0.2, width: w * 0.62, height: 58, borderRadius: 29,
        background: 'rgba(18,20,24,.7)', display: 'grid', placeItems: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 32, color: '#fff',
        opacity: k(t, 37.0, 37.3), boxShadow: faceBad > 0 ? `0 0 0 ${4 * faceBad}px #FF5A5F` : undefined}}>субтитры</div>
      {/* надпись: сначала под кнопками, потом уезжает влево */}
      <div style={{position: 'absolute', left: x + w * 0.6 - tagFix * w * 0.42, top: y + h * 0.63, height: 58, padding: '0 22px', borderRadius: 16,
        background: C.orange, display: 'grid', placeItems: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 32, color: '#1B0C05', whiteSpace: 'nowrap',
        opacity: k(t, 37.2, 37.5), boxShadow: tagBad > 0 ? `0 0 0 ${4 * tagBad}px #FF5A5F` : undefined}}>надпись</div>
      {/* рамка лица */}
      <div style={{position: 'absolute', left: faceX - w * 0.2, top: faceY - w * 0.26, width: w * 0.4, height: w * 0.5, borderRadius: 24,
        border: `4px solid ${faceBad > 0.5 ? '#FF5A5F' : C.mint}`, opacity: k(t, at(105), at(105) + 0.2), boxShadow: capFix > 0.5 ? '0 0 24px rgba(61,237,195,.6)' : undefined}} />
      {/* лазер-сканер */}
      {scan > 0 && scan < 1 ? (
        <div style={{position: 'absolute', left: x - 30, top: y + h * scan - 3, width: w + 60, height: 6, background: C.mint, boxShadow: '0 0 24px 6px rgba(61,237,195,.7)', borderRadius: 3}} />
      ) : null}
      {scan > 0 ? (
        <div style={{position: 'absolute', left: x + w * 0.06, top: y + h * 0.07, width: w * 0.76, height: h * 0.86 * Math.min(1, scan), border: `3px dashed rgba(61,237,195,.8)`, borderRadius: 18}} />
      ) : null}
    </>
  );
};

const Check: React.FC<{t: number; at: number; x: number; y: number; label: string}> = ({t, at: a, x, y, label}) => (
  <Chip t={t} at={a} x={x} y={y} label={label} size={56} center={false} glass={{material: 'solid', tone: 'mint'}}>
    <svg width={48} height={48} viewBox="0 0 24 24" style={{flex: 'none'}}><path d="M4 12.5l5 5L20 6.5" fill="none" stroke={C.mintInk} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" /></svg>
  </Chip>
);

export const TimelineScene: React.FC<{t: number}> = ({t}) => {
  const cx = camX(t), mv = moving(t);
  const ph = playhead(t);
  const S0 = XS[0], S1 = XS[1], S2 = XS[2];
  const drop = k(t, at(74) - 0.1, at(75) + 0.2, E.inOut);
  const wave = k(t, at(77) - 0.1, at(78) + 0.6, E.inOut);
  const cut = k(t, at(83), at(83) + 0.6, E.inOut);
  const strong = k(t, at(84), at(84) + 0.3);
  const weak = k(t, at(85), at(85) + 0.3);
  const WORDS1 = ['кидаешь', 'запись', 'подкаст', 'расшифрует', 'речь'];
  const POS1 = [[330, 640], [650, 640], [960, 640], [470, 760], [820, 760]];
  const TILES = ['хук', 'проблема', 'шаг 1', 'шаг 2', 'проверка', 'призыв'];
  const LOGO_IN = [{tile: 2, name: 'instagram', at: 35.4}, {tile: 4, name: 'telegram', at: 35.55}, {tile: 5, name: 'github', at: 35.7}, {tile: 0, name: 'claude', at: 35.85}];
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#16181B'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 4800, height: 2560, transform: `translateX(${-cx}px) scale(${1 - 0.04 * mv})`, transformOrigin: `${cx + 720}px 900px`,
        filter: mv > 0.05 ? `blur(${mv * 6}px)` : undefined}}>
        <GlassEnv w={4800} bg={() => <Timeline t={t} />}>
          {/* пунктир между станциями рисуется по ходу камеры */}
          <svg width={4800} height={2560} style={{position: 'absolute', left: 0, top: 0}}>
            {[[S0 + 1180, S1 + 260, 32.2], [S1 + 1180, S2 + 260, 36.7]].map(([a, b, s], i) => (
              <line key={i} x1={a} y1={525} x2={a + (b - a) * k(t, s, s + 0.55, E.inOut)} y2={525} stroke="rgba(61,237,195,.8)" strokeWidth={5} strokeDasharray="18 16" strokeLinecap="round" />
            ))}
          </svg>
          {/* плейхед — под стеклянными деталями, не режет плашки */}
          <div style={{position: 'absolute', left: ph - 3, top: 430, width: 6, height: 990, background: C.mint, boxShadow: '0 0 18px rgba(61,237,195,.7)', borderRadius: 3}} />
          <div style={{position: 'absolute', left: ph - 22, top: 404, width: 44, height: 44, background: C.mint, borderRadius: '10px 10px 50% 50%', boxShadow: '0 0 18px rgba(61,237,195,.7)'}} />
          {/* станция 1: запись → волна → слова → нарезка */}
          <Chip t={t} at={27.35} x={S0 + 720} y={470} label="01 · запись и расшифровка" size={56} glass={{material: 'frosted', moon: 0.4}} />
          <div style={{position: 'absolute', left: S0 + 150 + drop * 0, top: 600 + drop * 360, width: 480 - drop * 0, height: 270 - drop * 170, borderRadius: 26, overflow: 'hidden',
            opacity: k(t, at(74) - 0.25, at(74)), boxShadow: '0 20px 50px rgba(0,0,0,.5), inset 0 0 0 2px rgba(255,255,255,.2)'}}>
            <Video src={staticFile('r21/speaker.mp4')} muted objectFit="cover" style={{width: '100%', height: '100%'}} />
          </div>
          <Object25D src="objects/mic.webp" x={S0 + 1230} y={690} size={280} t={t} at={at(75) - 0.1} sheenAt={at(75) + 0.4} moon={0.5} />
          {BARS.map((v, i) => {
            const bx = S0 + 150 + i * 16;
            if (bx > S0 + 150 + wave * 1600) return null;
            const seg = CUTS.findIndex((c) => bx - S0 < c);
            const segI = seg < 0 ? CUTS.length : seg;
            const isStrong = STRONG.includes(segI) && bx - S0 < 1400;
            const gapHit = CUTS.some((c) => Math.abs(bx - S0 - c) < 14 && cut > (c - 150) / 1250);
            if (gapHit) return null;
            const hgt = 150 * v;
            return <div key={i} style={{position: 'absolute', left: bx, top: 1185 - hgt / 2 - (isStrong ? strong * 14 : 0), width: 9, height: hgt, borderRadius: 5,
              background: isStrong && strong > 0 ? C.mint : '#E8ECEF', opacity: isStrong ? 1 : 1 - 0.7 * weak * (bx - S0 < 1400 ? 1 : 0),
              boxShadow: isStrong && strong > 0 ? '0 0 12px rgba(61,237,195,.7)' : undefined}} />;
          })}
          {WORDS1.map((w, i) => {
            const a0 = at(80) + i * 0.13;
            const p = k(t, a0, a0 + 0.5, E.out);
            return p > 0 ? (
              <div key={i} style={{...full, width: 4800, opacity: k(t, a0, a0 + 0.15) * (1 - k(t, 32.25, 32.6)), transform: `translateY(${(1 - p) * 420}px)`}}>
                <Chip t={t} at={a0} x={S0 + POS1[i][0]} y={POS1[i][1]} label={w} size={48} glass={{material: 'frosted', moon: 0.3}} />
              </div>
            ) : null;
          })}
          {cut > 0 && cut < 1 ? <Object25D src="objects/scissors.webp" x={S0 + 150 + cut * 1250} y={1140} size={230} t={t} at={at(83) - 0.1} float={0} tilt={0} /> : null}
          {/* станция 2: раскадровка, скрины и логотипы */}
          <Chip t={t} at={32.5} x={S1 + 720} y={470} label="02 · раскадровка" size={56} glass={{material: 'frosted', moon: 0.4}} />
          {TILES.map((label, i) => {
            const a0 = at(88) + i * 0.1;
            const p = k(t, a0, a0 + 0.55, E.pop);
            const col = i % 3, row = Math.floor(i / 3);
            const x = S1 + 130 + col * 405, y = 600 + row * 400;
            const shot = (i === 1 || i === 3) ? k(t, at(93) + (i === 3 ? 0.12 : 0), at(93) + (i === 3 ? 0.12 : 0) + 0.35, E.pop) : 0;
            const lg = LOGO_IN.find((l) => l.tile === i);
            const lp = lg ? k(t, lg.at, lg.at + 0.45, E.pop) : 0;
            return p > 0 ? (
              <div key={i} style={{...full, width: 4800, opacity: k(t, a0, a0 + 0.15), transformOrigin: `${S1 + 720}px 900px`,
                transform: `translate(${(1 - p) * (S1 + 720 - x - 180)}px, ${(1 - p) * (900 - y - 170)}px) scale(${0.5 + 0.5 * p})`}}>
                <LiquidPanel x={x} y={y} w={360} h={360} r={36} material="frosted" level={2} moon={0.3}>
                  <div style={{position: 'absolute', left: 22, top: 20, fontFamily: MONO, fontWeight: 600, fontSize: 44, color: C.mint}}>К{i + 1}</div>
                  <div style={{position: 'absolute', left: 22, right: 22, top: 84, height: 180, borderRadius: 20, background: 'rgba(255,255,255,.07)', overflow: 'hidden', display: 'grid', placeItems: 'center'}}>
                    {shot > 0 ? <Img src={staticFile(i === 1 ? 'r21/covers/r20.jpg' : 'r21/covers/r16.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', opacity: shot, transform: `scale(${1.3 - 0.3 * shot})`}} /> : null}
                    {lp > 0 ? <div style={{transform: `translateY(${(1 - lp) * -160}px) scale(${lp})`}}><Mark name={lg!.name} size={112} /></div> : null}
                  </div>
                  <div style={{position: 'absolute', left: 22, bottom: 20, fontFamily: SANS, fontWeight: 700, fontSize: 48, color: C.ink, textShadow: textDepth}}>{label}</div>
                </LiquidPanel>
              </div>
            ) : null;
          })}
          {/* станция 3: сборка и проверка кадров */}
          <Chip t={t} at={37.0} x={S2 + 720} y={470} label="03 · проверка кадров" size={56} glass={{material: 'frosted', moon: 0.4}} />
          {t > 36.6 ? <MockFrame t={t} x={S2 + 500} y={610} w={440} /> : null}
          <Check t={t} at={at(108) + 0.2} x={S2 + 60} y={880} label="лицо" />
          <Check t={t} at={at(113) + 0.2} x={S2 + 60} y={1060} label="кнопки" />
          <div style={{position: 'absolute', left: S2 + 1000, top: 1040, opacity: k(t, at(114) - 0.05, at(114) + 0.2), transform: `scale(${0.6 + 0.4 * k(t, at(114) - 0.05, at(114) + 0.35, E.pop)})`}}>
            <Mark name="instagram" size={150} />
          </div>
        </GlassEnv>
      </div>
    </AbsoluteFill>
  );
};
