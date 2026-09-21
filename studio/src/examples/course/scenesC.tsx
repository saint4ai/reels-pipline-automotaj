import {AbsoluteFill, Img, staticFile} from 'remotion';
import {textDepth} from '../../ds/tokens';
import {CapsuleLine} from '../../kit/liquid/CapsuleLine';
import {GlassEnv} from '../../kit/liquid/env';
import {GlassSurface, LiquidPanel} from '../../kit/liquid/LiquidPanel';
import {NightStage, Reeded} from '../../kit/liquid/stage';
import {C, Chip, E, k, Logo, Mark, NUM, SANS} from '../montage/parts';
import {GraphiteMint, TwoLights} from './stages';
import {B} from './timing';
import {BrowserWindow, FitnessApp, PhoneFrame, UI} from './ui';
import {at} from './words';

// Ролик 22, сцены 8–12: промпт → четыре продукта агента (камера по холсту 2×2) → кейс курса → подарок с его роликами на орбите →
// «на какой ты стороне» → призыв «гоу».
const full: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: 1440, height: 2560};
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

// Приглушённое стекло для плиток внутри движущегося мира: обычное размытие фона (без линзы, копия фона там не совпала бы).
const Tile: React.FC<{x: number; y: number; w: number; h: number; label: string; children: React.ReactNode}> = ({x, y, w, h, label, children}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 36, overflow: 'hidden',
    backdropFilter: 'blur(22px) saturate(1.4)', WebkitBackdropFilter: 'blur(22px) saturate(1.4)',
    boxShadow: '0 4px 10px rgba(0,0,0,.35), 0 30px 70px rgba(0,0,0,.45)'}}>
    <GlassSurface radius={36} tone="dark" fill={0.5} moon={0.3} />
    <div style={{position: 'absolute', left: 30, top: 20, fontFamily: SANS, fontWeight: 800, fontSize: 60, letterSpacing: '-0.03em', color: C.ink, textShadow: textDepth, whiteSpace: 'nowrap'}}>{label}</div>
    <div style={{position: 'absolute', left: 20, right: 20, top: 112, bottom: 20, borderRadius: 22, overflow: 'hidden'}}>{children}</div>
  </div>
);

// ——— 8. «Агент умеет практически всё. Собрать твой продукт целиком» → сайт, приложение, AI-менеджер, автоматизации ———
const TW = 580, TH = 460;
const TILES = [{x: 122, y: 400}, {x: 738, y: 400}, {x: 122, y: 896}, {x: 738, y: 896}];
const tc = (i: number) => ({x: TILES[i].x + TW / 2, y: TILES[i].y + TH / 2});
const PROMPT = 'Собери мой продукт целиком';
const Bubble: React.FC<{side: 'l' | 'r'; children: React.ReactNode; o?: number}> = ({side, children, o = 1}) => (
  <div style={{alignSelf: side === 'l' ? 'flex-start' : 'flex-end', maxWidth: '78%', padding: '14px 20px', borderRadius: side === 'l' ? '8px 24px 24px 24px' : '24px 8px 24px 24px',
    background: side === 'l' ? 'rgba(255,255,255,.1)' : C.mint, color: side === 'l' ? UI.text : C.mintInk, fontFamily: SANS, fontWeight: 700, fontSize: 25, lineHeight: 1.3,
    opacity: o, transform: `translateY(${(1 - o) * 12}px)`}}>{children}</div>
);
const Node: React.FC<{x: number; y: number; label: string; mint?: boolean; o: number}> = ({x, y, label, mint, o}) => (
  <div style={{position: 'absolute', left: x, top: y, width: 150, height: 84, borderRadius: 18, display: 'grid', placeItems: 'center', opacity: o,
    transform: `scale(${0.8 + 0.2 * o})`, background: mint ? C.mint : 'rgba(255,255,255,.1)', color: mint ? C.mintInk : UI.text,
    boxShadow: mint ? '0 0 30px rgba(61,237,195,.5)' : 'inset 0 0 0 2px rgba(255,255,255,.14)', fontFamily: SANS, fontWeight: 800, fontSize: 25}}>{label}</div>
);
export const ProductsScene: React.FC<{t: number}> = ({t}) => {
  const orb = k(t, B.products + 0.05, B.products + 0.6, E.pop);
  const panel = k(t, B.products + 0.35, B.products + 0.9, E.out);
  const typed = Math.round(PROMPT.length * k(t, at(121) - 0.05, at(124) + 0.3, (v) => v));
  const send = k(t, at(124) + 0.3, at(124) + 0.5) * (1 - k(t, at(124) + 0.5, at(124) + 0.8));
  const leave = k(t, at(125) - 0.35, at(125) + 0.1, E.inOut);
  // камера по холсту: сайт → приложение → AI-менеджер → автоматизации → общий план
  const enter = k(t, at(125) - 0.3, at(125) + 0.15, E.out);
  const m = [k(t, at(126) - 0.2, at(126) + 0.2, E.inOut), k(t, at(127) - 0.15, at(127) + 0.25, E.inOut), k(t, at(130) - 0.15, at(130) + 0.25, E.inOut)];
  const out = k(t, at(131) - 0.05, at(131) + 0.65, E.inOut);
  let c = tc(0);
  [1, 2, 3].forEach((i, j) => { c = {x: lerp(c.x, tc(i).x, m[j]), y: lerp(c.y, tc(i).y, m[j])}; });
  c = {x: lerp(c.x, 720, out), y: lerp(c.y, 878, out)};
  const Z = 1.85 - 0.85 * out, sy0 = lerp(860, 878, out) + (1 - enter) * 900;
  const cam = `translate(${720 - c.x * Z}px, ${sy0 - c.y * Z}px) scale(${Z})`;
  const tk = (i: number) => k(t, [at(125), at(126), at(127), at(130)][i] - 0.1, [at(125), at(126), at(127), at(130)][i] + 1.2, (v) => v);
  return (
    <AbsoluteFill>
      <GlassEnv bg={() => <GraphiteMint t={t} />}>
        {leave < 1 ? (
          <div style={{...full, opacity: 1 - leave, transform: `translateY(${-leave * 220}px) scale(${1 - 0.08 * leave})`, transformOrigin: '720px 700px'}}>
            {orb > 0 ? (
              <div style={{position: 'absolute', left: 720 - 110, top: 360, width: 220, height: 220, borderRadius: '50%', transform: `scale(${orb})`, display: 'grid', placeItems: 'center',
                background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,.95), rgba(245,236,228,.92) 45%, rgba(210,190,176,.95) 100%)',
                boxShadow: '0 0 0 4px rgba(255,255,255,.4), 0 0 80px rgba(217,119,87,.45), 0 30px 60px rgba(0,0,0,.45)'}}>
                <Mark name="claude" size={130} />
              </div>
            ) : null}
            {panel > 0 ? (
              <div style={{...full, opacity: panel, transform: `translateY(${(1 - panel) * 50}px)`}}>
                <LiquidPanel x={100} y={700} w={1240} h={200} r="pill" material="frosted" level={3} moon={0.6} sheen={k(t, at(124) + 0.2, at(124) + 0.9)} name="prompt">
                  <div style={{position: 'absolute', left: 60, top: 0, bottom: 0, right: 190, display: 'flex', alignItems: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 56,
                    color: typed ? C.ink : 'rgba(247,247,245,.45)', whiteSpace: 'nowrap', textShadow: typed ? textDepth : 'none'}}>
                    {typed ? PROMPT.slice(0, typed) : 'Спроси агента…'}
                    <span style={{display: 'inline-block', width: 5, height: 64, marginLeft: 6, background: C.mint, opacity: typed < PROMPT.length && Math.floor(t * 3) % 2 === 0 ? 1 : 0.15}} />
                  </div>
                  <div style={{position: 'absolute', right: 40, top: 40, width: 120, height: 120, borderRadius: 60, background: C.mint, display: 'grid', placeItems: 'center',
                    transform: `scale(${1 - 0.12 * send})`, boxShadow: `0 0 ${20 + 50 * send}px rgba(61,237,195,${0.4 + 0.5 * send})`}}>
                    <svg width={56} height={56} viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7" fill="none" stroke={C.mintInk} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                </LiquidPanel>
              </div>
            ) : null}
          </div>
        ) : null}
        {enter > 0 ? (
          <div style={{...full, transformOrigin: '0 0', transform: cam, opacity: Math.min(1, enter * 1.5)}}>
            <Tile {...TILES[0]} w={TW} h={TH} label="Сайт">
              <BrowserWindow w={540} h={328} url="onai.academy">
                <Img src={staticFile('r22/site-hero.png')} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center'}} />
              </BrowserWindow>
            </Tile>
            <Tile {...TILES[1]} w={TW} h={TH} label="Приложение">
              <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(60% 80% at 50% 50%, rgba(61,237,195,.18), rgba(61,237,195,0))'}} />
              <div style={{position: 'absolute', left: 540 / 2 - 77, top: 6, width: 440, height: 906, transformOrigin: '0 0', transform: 'scale(0.35)'}}>
                <PhoneFrame w={440} light><FitnessApp k={tk(1)} food={0} act={0} /></PhoneFrame>
              </div>
            </Tile>
            <Tile {...TILES[2]} w={TW} h={TH} label="AI-менеджер">
              <div style={{position: 'absolute', inset: 0, background: 'rgba(8,10,12,.6)', display: 'flex', flexDirection: 'column', gap: 14, padding: '18px 20px'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 12, fontFamily: SANS, fontWeight: 800, fontSize: 24, color: UI.text}}>
                  <span style={{width: 40, height: 40, borderRadius: 20, background: `linear-gradient(135deg, ${C.mint}, #0F6E5A)`}} />
                  менеджер продаж · <span style={{color: C.mint}}>онлайн</span>
                </div>
                <Bubble side="l" o={k(t, at(127) + 0.1, at(127) + 0.4)}>Сколько стоит обучение?</Bubble>
                <Bubble side="r" o={k(t, at(127) + 0.7, at(127) + 1.0)}>Пришлю программу и цены. Какой у вас опыт?</Bubble>
              </div>
            </Tile>
            <Tile {...TILES[3]} w={TW} h={TH} label="Автоматизации">
              <div style={{position: 'absolute', inset: 0, background: 'rgba(8,10,12,.6)'}}>
                <svg width={540} height={328} style={{position: 'absolute', left: 0, top: 0}}>
                  {[[170, 92, 195, 92], [345, 92, 370, 92], [445, 134, 445, 196], [370, 238, 345, 238]].map(([x1, y1, x2, y2], i) => {
                    const d = k(t, at(130) + 0.15 + i * 0.25, at(130) + 0.45 + i * 0.25, (v) => v);
                    return <line key={i} x1={x1} y1={y1} x2={x1 + (x2 - x1) * d} y2={y1 + (y2 - y1) * d} stroke={C.mint} strokeWidth={4} strokeDasharray="10 8" strokeLinecap="round" />;
                  })}
                </svg>
                <Node x={20} y={50} label="заявка" o={k(t, at(130), at(130) + 0.3)} />
                <Node x={195} y={50} label="агент" mint o={k(t, at(130) + 0.25, at(130) + 0.55)} />
                <Node x={370} y={50} label="CRM" o={k(t, at(130) + 0.5, at(130) + 0.8)} />
                <Node x={370} y={196} label="счёт" o={k(t, at(130) + 0.75, at(130) + 1.05)} />
                <Node x={195} y={196} label="отчёт" o={k(t, at(130) + 1.0, at(130) + 1.3)} />
              </div>
            </Tile>
          </div>
        ) : null}
      </GlassEnv>
    </AbsoluteFill>
  );
};

// ——— 9. «Внутри обучения мои шаблоны и инструменты за 4 года опыта»: кейс курса, из него поднимаются материалы ———
const CASE = {x: 250, y: 780, w: 940, h: 520};
const DOCS = [{label: 'Гайды', x: 300, rot: -9, c: C.mint}, {label: 'Промпты', x: 570, rot: 0, c: '#FFB27E'}, {label: 'Шаблоны', x: 840, rot: 9, c: C.orange}];
const STACK = ['claude', 'github', 'supabase', 'vercel'];
export const InsideScene: React.FC<{t: number}> = ({t}) => {
  const box = k(t, B.inside - 0.1, B.inside + 0.45, E.out);
  const logos = (i: number) => k(t, at(136) - 0.1 + i * 0.1, at(136) + 0.3 + i * 0.1, E.pop);
  return (
    <AbsoluteFill>
      <GlassEnv bg={() => <Reeded t={t} mix={0.5} />}>
        {DOCS.map((d, i) => {
          const r = k(t, at(134) - 0.1 + i * 0.14, at(134) + 0.45 + i * 0.14, E.pop);
          return (
            <div key={i} style={{position: 'absolute', left: d.x, top: 480 + (1 - r) * 330, width: 300, height: 360, borderRadius: 26, opacity: Math.min(1, r * 3),
              transform: `rotate(${d.rot * r}deg)`, background: 'linear-gradient(180deg, #FFFFFF, #EEF0EE)', boxShadow: '0 30px 60px rgba(0,0,0,.45), inset 0 2px 0 #fff'}}>
              <div style={{position: 'absolute', left: 26, top: 26, width: 64, height: 64, borderRadius: 18, background: d.c, boxShadow: `0 8px 20px ${d.c}66`}} />
              <div style={{position: 'absolute', left: 26, top: 112, fontFamily: SANS, fontWeight: 800, fontSize: 56, letterSpacing: '-0.03em', color: C.dark}}>{d.label}</div>
              {[0, 1, 2].map((j) => <div key={j} style={{position: 'absolute', left: 26, top: 196 + j * 28, width: `${70 - j * 14}%`, height: 12, borderRadius: 6, background: '#D5D9DC'}} />)}
            </div>
          );
        })}
        <div style={{...full, opacity: box, transform: `translateY(${(1 - box) * 80}px)`}}>
          {/* ручка кейса */}
          <div style={{position: 'absolute', left: 720 - 170, top: CASE.y - 96, width: 340, height: 130, borderRadius: '60px 60px 0 0', border: '22px solid rgba(235,240,238,.75)', borderBottom: 'none',
            boxShadow: 'inset 0 3px 0 rgba(255,255,255,.6), 0 12px 30px rgba(0,0,0,.4)'}} />
          <LiquidPanel x={CASE.x} y={CASE.y} w={CASE.w} h={CASE.h} r={60} material="frosted" level={3} moon={0.7} sheen={k(t, B.inside + 0.3, B.inside + 1.2)} name="case">
            <div style={{position: 'absolute', left: 0, right: 0, top: 58, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 72, letterSpacing: '-0.03em', color: C.ink, textShadow: textDepth}}>
              Обучение вайбкодингу
            </div>
            <div style={{position: 'absolute', left: 0, right: 0, top: 160, textAlign: 'center', fontFamily: NUM, fontWeight: 700, fontSize: 52, color: C.mint}}>10 модулей · 36 уроков</div>
            <div style={{position: 'absolute', left: 0, right: 0, top: 290, display: 'flex', justifyContent: 'center', gap: 40}}>
              {STACK.map((n, i) => (
                <div key={n} style={{width: 150, height: 150, borderRadius: 40, display: 'grid', placeItems: 'center', opacity: logos(i), transform: `scale(${0.6 + 0.4 * logos(i)})`,
                  background: '#F4F5F2', boxShadow: 'inset 0 2px 0 rgba(255,255,255,.4), 0 14px 30px rgba(0,0,0,.35)'}}>
                  {n === 'claude' ? <Mark name="claude" size={92} /> : n === 'supabase' ? <Logo name="supabase" size={92} /> : <Mark name={n === 'github' ? 'github-dark' : n} size={84} color="#101214" />}
                </div>
              ))}
            </div>
          </LiquidPanel>
        </div>
        <Chip t={t} at={at(138) - 0.1} x={720} y={330} label="4 года опыта" size={72} glass={{material: 'solid', tone: 'mint', moon: 0.6}} />
      </GlassEnv>
    </AbsoluteFill>
  );
};

// ——— 10. «И в подарок моя премиальная система монтажа, которой собран этот ролик»: подарок, вокруг — его ролики ———
const COVERS = ['r19', 'r20', 'r7', 'r13', 'r14', 'r16', 'r21'];
const GIFT = {x: 470, y: 900, w: 500, h: 380};
const ORB = {cx: 720, cy: 1040, rx: 610, ry: 150};
const SELF = at(151); // «этот ролик»
export const GiftScene: React.FC<{t: number}> = ({t}) => {
  const moon = {x: 1180, y: 360, r: 150, beam: {angle: -35, spread: 12, power: 0.95}};
  const box = k(t, B.gift - 0.05, B.gift + 0.5, E.out);
  const ring = k(t, at(143) - 0.1, at(143) + 0.9, E.out); // «подарок»
  const self = k(t, SELF - 0.15, SELF + 0.45, E.out);
  const items = COVERS.map((c, i) => {
    const a = (i / COVERS.length) * Math.PI * 2 + t * 0.55;
    const z = Math.sin(a);
    return {c, x: ORB.cx + Math.cos(a) * ORB.rx * (0.6 + 0.4 * ring), y: ORB.cy + z * ORB.ry, z, s: 0.74 + 0.26 * (z + 1) / 2};
  });
  const cover = (it: typeof items[number]) => {
    const w = 180 * it.s, h = 320 * it.s;
    return (
      <div key={it.c} style={{position: 'absolute', left: it.x - w / 2, top: it.y - h / 2 - 90, width: w, height: h, borderRadius: 22 * it.s, overflow: 'hidden', opacity: ring * (0.55 + 0.45 * (it.z + 1) / 2) * (1 - 0.6 * self),
        filter: `brightness(${0.55 + 0.45 * (it.z + 1) / 2})`, boxShadow: '0 0 0 3px rgba(255,255,255,.35), 0 20px 40px rgba(0,0,0,.5)'}}>
        <Img src={staticFile(`r22/orbit/${it.c}.jpg`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </div>
    );
  };
  return (
    <AbsoluteFill>
      <GlassEnv bg={() => <NightStage t={t} moon={moon} floor={1330} dust={60} />}>
        {items.filter((it) => it.z < 0).map(cover)}
        <div style={{...full, opacity: box, transformOrigin: `720px ${GIFT.y + GIFT.h}px`, transform: `scale(${0.85 + 0.15 * box})`}}>
          <LiquidPanel x={GIFT.x} y={GIFT.y} w={GIFT.w} h={GIFT.h} r={34} material="clear" level={3} moon={0.9} name="gift">
            <div style={{position: 'absolute', left: GIFT.w / 2 - 40, top: 0, width: 80, height: GIFT.h, background: 'linear-gradient(90deg, #2BC9A3, #3DEDC3 40%, #9FF7E2 55%, #2BC9A3)'}} />
          </LiquidPanel>
          <LiquidPanel x={GIFT.x - 30} y={GIFT.y - 110} w={GIFT.w + 60} h={120} r={30} material="clear" level={2} moon={0.9} name="lid">
            <div style={{position: 'absolute', left: (GIFT.w + 60) / 2 - 40, top: 0, width: 80, height: 120, background: 'linear-gradient(90deg, #2BC9A3, #3DEDC3 40%, #9FF7E2 55%, #2BC9A3)'}} />
          </LiquidPanel>
          {/* бант */}
          {[-1, 1].map((sd) => (
            <div key={sd} style={{position: 'absolute', left: 720 + (sd < 0 ? -150 : 10), top: GIFT.y - 200, width: 140, height: 100, borderRadius: '50%', border: '20px solid #3DEDC3',
              transform: `rotate(${sd * 20}deg)`, boxShadow: '0 0 30px rgba(61,237,195,.5)'}} />
          ))}
          <div style={{position: 'absolute', left: 720 - 34, top: GIFT.y - 150, width: 68, height: 56, borderRadius: 18, background: '#3DEDC3', boxShadow: '0 0 24px rgba(61,237,195,.7)'}} />
        </div>
        {items.filter((it) => it.z >= 0).map(cover)}
        {self > 0 ? (
          <div style={{position: 'absolute', left: 720 - 170, top: lerp(GIFT.y - 100, 470, self), width: 340, height: 604, borderRadius: 36, overflow: 'hidden',
            transformOrigin: '50% 100%', transform: `scale(${0.3 + 0.7 * self})`, opacity: Math.min(1, self * 2),
            boxShadow: '0 0 0 5px #3DEDC3, 0 0 70px rgba(61,237,195,.6), 0 40px 80px rgba(0,0,0,.6)'}}>
            <Img src={staticFile('r22/orbit/r22-self.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </div>
        ) : null}
        <Chip t={t} at={at(145) - 0.1} out={SELF - 0.3} x={720} y={372} label="премиальная система монтажа" size={59} glass={{material: 'frosted', moon: 0.6}} />
        <Chip t={t} at={SELF} x={720} y={1110} label="этот ролик" size={64} glass={{material: 'solid', tone: 'mint', moon: 0.6}} />
      </GlassEnv>
    </AbsoluteFill>
  );
};

// ——— 11. «Замена всё равно будет. Вопрос — на какой ты стороне» ———
const Cursor: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size * 1.2} viewBox="0 0 80 96">
    <path d="M6 4 L6 76 L24 60 L37 90 L51 84 L38 55 L62 55 Z" fill="#E4E6E8" stroke="#5E6368" strokeWidth={5} strokeLinejoin="round" />
  </svg>
);
export const SideScene: React.FC<{t: number}> = ({t}) => {
  const l = k(t, B.side - 0.05, B.side + 0.45, E.out), r = k(t, B.side + 0.25, B.side + 0.75, E.out);
  const pick = k(t, at(159) - 0.05, at(160) + 0.3, E.inOut); // «на какой ты стороне»
  return (
    <AbsoluteFill>
      <GlassEnv bg={() => <TwoLights t={t} grey={0.6 + 0.4 * pick} />}>
        <div style={{...full, opacity: l * (1 - 0.45 * pick), transform: `translateX(${-(1 - l) * 200}px)`, filter: `saturate(${1 - pick})`}}>
          <LiquidPanel x={80} y={560} w={610} h={600} r={56} material="frosted" level={3} moon={0.3} name="hands">
            <div style={{position: 'absolute', left: 0, right: 0, top: 110, display: 'flex', justifyContent: 'center'}}><Cursor size={170} /></div>
            <div style={{position: 'absolute', left: 0, right: 0, top: 380, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 96, letterSpacing: '-0.03em', color: '#C9CDD0', textShadow: textDepth}}>руками</div>
          </LiquidPanel>
        </div>
        <div style={{...full, opacity: r, transform: `translateX(${(1 - r) * 200}px)`, transformOrigin: '1055px 860px'}}>
          <div style={{...full, transformOrigin: '1055px 860px', transform: `scale(${1 + 0.05 * pick})`}}>
            <LiquidPanel x={750} y={560} w={610} h={600} r={56} material="frosted" level={3} moon={0.8} name="agent"
              style={{boxShadow: `0 0 0 4px rgba(61,237,195,${0.5 + 0.4 * pick}), 0 0 ${40 + 60 * pick}px rgba(61,237,195,${0.3 + 0.3 * pick}), 0 40px 90px rgba(0,0,0,.5)`}}>
              <div style={{position: 'absolute', left: 305 - 105, top: 100, width: 210, height: 210, borderRadius: '50%', display: 'grid', placeItems: 'center',
                background: 'radial-gradient(circle at 35% 30%, rgba(214,255,245,.95), rgba(61,237,195,.9) 45%, rgba(15,110,90,.95) 100%)', boxShadow: '0 0 50px rgba(61,237,195,.6)'}}>
                <Mark name="claude" size={120} color="#FFFFFF" />
              </div>
              <div style={{position: 'absolute', left: 0, right: 0, top: 380, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 96, letterSpacing: '-0.03em', color: C.ink, textShadow: textDepth}}>с агентом</div>
            </LiquidPanel>
          </div>
        </div>
        <div style={{...full, opacity: k(t, at(157) - 0.1, at(157) + 0.2)}}>
          <CapsuleLine t={t} words={['На', 'какой', 'ты', 'стороне?']} stops={[{at: at(159), i: 1, j: 3}]}
            style={{family: SANS, weight: 800, size: 88, x: 720, y: 1220, align: 'center', tracking: -0.02}} textShadow={textDepth}
            capsule={{material: 'solid', tone: 'mint', moon: 0.5}} />
        </div>
      </GlassEnv>
    </AbsoluteFill>
  );
};

// ——— 12. «Напиши «гоу» в комментариях, пришлю программу, агент ответит… Добро пожаловать на старт обучения по вайбкодингу» ———
const GO = at(162);
export const CtaScene: React.FC<{t: number}> = ({t}) => {
  const moon = {x: 1190, y: 330, r: 140, beam: {angle: -30 + 8 * k(t, 69, 70.5, E.inOut), spread: 11, power: 1}};
  const field = k(t, B.cta - 0.05, B.cta + 0.45, E.out);
  const typed = Math.round(3 * k(t, GO - 0.05, GO + 0.35, (v) => v));
  const post = k(t, GO + 0.55, GO + 0.8) * (1 - k(t, GO + 0.8, GO + 1.1));
  const dmIn = k(t, at(165) - 0.2, at(165) + 0.35, E.out); // «пришлю программу»
  const fin = k(t, at(175) - 0.25, at(175) + 0.3, E.inOut); // «Добро пожаловать»
  const doc = k(t, at(166) - 0.1, at(166) + 0.35, E.pop);
  const typing = k(t, at(169) - 0.1, at(169) + 0.1) * (1 - k(t, at(170) + 0.2, at(170) + 0.3));
  const reply = k(t, at(170) + 0.25, at(170) + 0.6, E.out);
  return (
    <AbsoluteFill>
      <GlassEnv bg={() => <NightStage t={t} moon={moon} floor={1420} dust={60} />}>
        {dmIn < 1 ? (
          <div style={{...full, opacity: field * (1 - dmIn), transform: `translateY(${(1 - field) * 60 - dmIn * 200}px)`}}>
            <div style={{position: 'absolute', left: 150, top: 590, display: 'flex', alignItems: 'center', gap: 22, fontFamily: SANS, fontWeight: 700, fontSize: 59, color: C.dim}}>
              <Mark name="instagram" size={64} />комментарии
            </div>
            <LiquidPanel x={120} y={720} w={1200} h={190} r="pill" material="frosted" level={3} moon={0.7} sheen={post > 0 ? post : undefined} name="comment">
              <div style={{position: 'absolute', left: 36, top: 35, width: 120, height: 120, borderRadius: 60, padding: 6, boxSizing: 'border-box',
                background: 'linear-gradient(135deg, #FDF497, #FD5949 50%, #D6249F)'}}>
                <div style={{width: '100%', height: '100%', borderRadius: '50%', background: '#1B1E22', border: '5px solid #0C0D0F', boxSizing: 'border-box'}} />
              </div>
              <div style={{position: 'absolute', left: 190, top: 0, bottom: 0, display: 'flex', alignItems: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 84, color: C.ink, textShadow: textDepth}}>
                {['', '«г', '«го', '«гоу»'][typed]}
                <span style={{display: 'inline-block', width: 6, height: 84, marginLeft: 8, background: C.mint, opacity: typed < 3 && Math.floor(t * 3) % 2 === 0 ? 1 : 0.1}} />
              </div>
              <div style={{position: 'absolute', right: 50, top: 0, bottom: 0, display: 'flex', alignItems: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 52,
                color: typed === 3 ? C.mint : 'rgba(61,237,195,.35)', textShadow: post > 0 ? `0 0 ${30 * post}px rgba(61,237,195,.9)` : 'none'}}>Отправить</div>
            </LiquidPanel>
          </div>
        ) : null}
        {dmIn > 0 && fin < 1 ? (
          <div style={{...full, opacity: dmIn * (1 - fin), transform: `translateY(${(1 - dmIn) * 120 - fin * 160}px)`}}>
            <LiquidPanel x={110} y={440} w={1220} h={900} r={60} material="frosted" level={3} moon={0.7} name="dm">
              <div style={{position: 'absolute', left: 50, top: 40, right: 50, height: 110, display: 'flex', alignItems: 'center', gap: 22, borderBottom: '2px solid rgba(255,255,255,.1)',
                fontFamily: SANS, fontWeight: 800, fontSize: 59, color: C.ink}}>
                <Mark name="instagram" size={64} />Директ
              </div>
              <div style={{position: 'absolute', left: 50, top: 190, width: 820, borderRadius: '14px 44px 44px 44px', padding: '32px 36px', background: 'rgba(255,255,255,.1)',
                opacity: doc, transform: `translateY(${(1 - doc) * 30}px) scale(${0.9 + 0.1 * doc})`, transformOrigin: '0 0', display: 'flex', gap: 30, alignItems: 'center'}}>
                <div style={{width: 130, height: 160, borderRadius: 20, background: 'linear-gradient(160deg, #FFB27E, #FF7A2F)', display: 'grid', placeItems: 'center',
                  fontFamily: NUM, fontWeight: 900, fontSize: 40, color: '#2A1206', boxShadow: '0 14px 30px rgba(255,122,47,.4)'}}>PDF</div>
                <div>
                  <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 59, color: C.ink, lineHeight: 1.1}}>Программа обучения</div>
                  <div style={{marginTop: 14, fontFamily: NUM, fontWeight: 700, fontSize: 48, color: C.mint}}>10 модулей · 36 уроков</div>
                </div>
              </div>
              {typing > 0 ? (
                <div style={{position: 'absolute', left: 50, top: 470, padding: '28px 36px', borderRadius: '14px 44px 44px 44px', background: 'rgba(61,237,195,.18)', display: 'flex', gap: 14, opacity: typing}}>
                  {[0, 1, 2].map((i) => <span key={i} style={{width: 22, height: 22, borderRadius: 11, background: C.mint, opacity: 0.35 + 0.65 * Math.abs(Math.sin(t * 6 + i))}} />)}
                </div>
              ) : null}
              {reply > 0 ? (
                <div style={{position: 'absolute', left: 50, top: 470, width: 900, padding: '30px 38px', borderRadius: '14px 44px 44px 44px', background: C.mint, opacity: reply,
                  transform: `translateY(${(1 - reply) * 24}px)`, display: 'flex', alignItems: 'center', gap: 24}}>
                  <span style={{width: 76, height: 76, flex: 'none', borderRadius: 38, background: '#05231D', display: 'grid', placeItems: 'center', fontFamily: NUM, fontWeight: 900, fontSize: 30, color: C.mint}}>AI</span>
                  <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 56, color: C.mintInk, lineHeight: 1.15}}>Отвечу на все твои вопросы</span>
                </div>
              ) : null}
            </LiquidPanel>
          </div>
        ) : null}
        {fin > 0 ? (
          <div style={{...full, opacity: fin, transform: `translateY(${(1 - fin) * 80}px)`}}>
            <div style={{position: 'absolute', left: 0, right: 0, top: 520, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 72, color: C.dim, textShadow: textDepth}}>Добро пожаловать</div>
            <div style={{position: 'absolute', left: 0, right: 0, top: 620, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 124, letterSpacing: '-0.04em', color: C.ink, textShadow: textDepth}}>на старт обучения</div>
            <CapsuleLine t={t} words={['по', 'вайбкодингу']} stops={[{at: at(181) - 0.05, i: 1}]}
              style={{family: SANS, weight: 800, size: 124, x: 720, y: 790, align: 'center', tracking: -0.04}} textShadow={textDepth}
              capsule={{material: 'solid', tone: 'mint', moon: 0.6}} />
          </div>
        ) : null}
        <Chip t={t} at={at(178)} x={720} y={1080} label="напиши «гоу» в комментариях" icon="mark:instagram" size={59} glass={{material: 'frosted', moon: 0.6}} />
      </GlassEnv>
    </AbsoluteFill>
  );
};
