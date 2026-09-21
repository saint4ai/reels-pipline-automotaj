import {AbsoluteFill} from 'remotion';
import {textDepth} from '../../ds/tokens';
import {CapsuleLine} from '../../kit/liquid/CapsuleLine';
import {GlassEnv} from '../../kit/liquid/env';
import {LiquidPanel} from '../../kit/liquid/LiquidPanel';
import {Beam, DawnSky, Dust, Grain, Pool, type Spot} from '../../kit/liquid/stage';
import {C, Chip, E, k, NUM, SANS} from '../montage/parts';
import {Aurora} from './stages';
import {B} from './timing';
import {BrowserWindow, ExcelSheet, FitnessApp, ForwarderDashboard, Laptop, PhoneFrame, SalesAnalytics} from './ui';
import {at} from './words';

// Ролик 22, сцены 4–7: галерея трёх работ учеников (камера едет вдоль стены) → «собрали ученики» (отъезд) →
// «без опыта в программировании» (настройки: программирование — выкл, личный опыт — вкл) → модуль 1 → рост до эксперта.
const full: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: 1440, height: 2560};

// ——— Галерея: мир шириной 3 кадра, экспонаты в центрах 720 / 2160 / 3600, камера — центр cx и масштаб s ———
export const GX = [720, 2160, 3600];
export type Cam = {cx: number; s: number; back: number};
export const galleryCam = (t: number): Cam => {
  const p1 = k(t, 19.45, 20.15, E.inOut), p2 = k(t, 24.05, 24.75, E.inOut);
  const x0 = 720 + 1440 * (p1 + p2);
  const back = k(t, B.students - 0.5, B.students + 0.3, E.inOut);
  return {cx: x0 + (2160 - x0) * back, s: 1 - 0.66 * back, back};
};
const sx = (wx: number, c: Cam) => (wx - c.cx) * c.s + 720;
const sy = (wy: number, c: Cam) => (wy - 900) * c.s + 900;

// Фон галереи рисуется в координатах кадра (ниши, лучи и пол пересчитываются от камеры) — чтобы на отъезде стена не кончалась.
export const GalleryBg: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const hz = sy(1470, cam);
  const spots: Spot[] = GX.map((x) => ({x: sx(x, cam), y: sy(-260, cam), angle: 0, spread: 11, power: 0.72, color: '255,236,214', len: 1900 * cam.s}));
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: `linear-gradient(180deg, #221A15 0px, #1A1411 ${hz}px, #0E0B09 ${hz + 2}px, #070606 100%)`}}>
      {/* тёплый свет по стене, чтобы фон не был чёрным */}
      <div style={{position: 'absolute', left: -300, top: -400, width: 2040, height: 1500, borderRadius: '50%', filter: 'blur(40px)',
        background: 'radial-gradient(closest-side, rgba(255,122,47,.16), rgba(255,122,47,0))', transform: `translateX(${-(cam.cx - 2160) * 0.08}px)`}} />
      {GX.map((x, i) => (
        <div key={i} style={{position: 'absolute', left: sx(x - 640, cam), top: sy(250, cam), width: 1280 * cam.s, height: 1220 * cam.s, borderRadius: 48 * cam.s,
          background: 'radial-gradient(70% 60% at 50% 30%, rgba(255,230,205,.13), rgba(255,230,205,0) 72%)', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,.035)'}} />
      ))}
      {spots.map((s, i) => <Beam key={i} s={s} />)}
      {GX.map((x, i) => <Pool key={i} x={sx(x, cam)} y={hz + 40 * cam.s} w={1000 * cam.s} o={0.42} />)}
      <Dust t={t} spots={spots} n={50} />
      <AbsoluteFill style={{background: 'radial-gradient(140% 90% at 50% 40%, transparent 55%, rgba(0,0,0,.5) 100%)'}} />
      <Grain o={0.06} />
    </AbsoluteFill>
  );
};

const G1 = at(45), G2 = at(52), G3 = at(64); // «Система аналитики…», «приложение…», «сквозная аналитика…»
export const GalleryScene: React.FC<{t: number}> = ({t}) => {
  const cam = galleryCam(t);
  const rise = (a: number) => k(t, a - 0.25, a + 0.45, E.out);
  // экспонат 1: ноутбук; лист Excel лежит поверх и падает на «вместо Excel»
  const r1 = rise(G1), fall = k(t, at(49) + 0.05, at(49) + 0.75, E.acc);
  // экспонат 2: телефон со смещением вправо — слева место под подписи
  const r2 = rise(G2 - 0.1);
  const r3 = rise(G3 - 0.1), ai = k(t, at(69) - 0.1, at(69) + 0.45, E.out);
  const world: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: 4320, height: 2560, transformOrigin: '0 0',
    transform: `translate(${720 - cam.cx * cam.s}px, ${900 - 900 * cam.s}px) scale(${cam.s})`};
  const ex = (a: number): React.CSSProperties => ({opacity: Math.min(1, a * 1.6), transform: `translateY(${(1 - a) * 90}px)`});
  return (
    <AbsoluteFill>
      <GlassEnv bg={() => <GalleryBg t={t} cam={cam} />}>
        <div style={world}>
          <div style={{position: 'absolute', left: 720 - 598, top: 540, ...ex(r1)}}>
            <Laptop w={1030}><ForwarderDashboard k={k(t, G1 + 0.2, G1 + 2.4, (v) => v)} /></Laptop>
          </div>
          {fall < 1 ? (
            <div style={{position: 'absolute', left: 150, top: 830, opacity: Math.min(1, r1 * 1.6) * (1 - k(t, at(49) + 0.35, at(49) + 0.75)),
              transformOrigin: '260px 180px', transform: `translate(${-fall * 120}px, ${fall * 620}px) rotate(${-7 - fall * 38}deg)`, filter: fall > 0 ? `blur(${fall * 10}px)` : undefined}}>
              <ExcelSheet />
            </div>
          ) : null}
          <div style={{position: 'absolute', left: 2160 + 200 - 250, top: 360, ...ex(r2)}}>
            <PhoneFrame w={500} light>
              <FitnessApp k={k(t, G2, G2 + 2.0, (v) => v)} food={k(t, at(61) - 0.1, at(61) + 0.3) * (1 - k(t, at(63) - 0.1, at(63) + 0.2))} act={k(t, at(63) - 0.1, at(63) + 0.3)} />
            </PhoneFrame>
          </div>
          <div style={{position: 'absolute', left: 3600 - 640, top: 470, ...ex(r3)}}>
            <BrowserWindow w={1280} h={820} url="analytics.app"><SalesAnalytics k={k(t, G3, G3 + 1.8, (v) => v)} ai={ai} /></BrowserWindow>
          </div>
        </div>
        {/* подписи в кадре (не в мире): одна-две за экспонат */}
        <Chip t={t} at={at(47) - 0.05} out={19.3} x={720} y={372} label="для экспедиторов" size={64} glass={{material: 'frosted', moon: 0.5}} />
        <Chip t={t} at={at(53) - 0.05} out={24.0} x={80} y={620} center={false} label="для тренеров" size={64} glass={{material: 'frosted', moon: 0.5}} />
        <Chip t={t} at={at(59) - 0.05} out={24.0} x={80} y={1000} center={false} label="с AI" size={64} glass={{material: 'solid', tone: 'mint'}} />
        <Chip t={t} at={at(70) - 0.1} out={B.students - 0.2} x={720} y={372} label="AI-таргетолог" size={64} glass={{material: 'solid', tone: 'mint'}} />
        {cam.back > 0 ? (
          <div style={{...full, opacity: k(t, at(72) - 0.1, at(72) + 0.2)}}>
            <CapsuleLine t={t} words={['Это', 'собрали', 'мои', 'ученики']} stops={[{at: at(72), i: 1, j: 3}]}
              style={{family: SANS, weight: 800, size: 88, x: 720, y: 1170, align: 'center', tracking: -0.02}} textShadow={textDepth}
              capsule={{material: 'solid', tone: 'mint', moon: 0.5}} />
          </div>
        ) : null}
      </GlassEnv>
    </AbsoluteFill>
  );
};

// ——— «Без опыта в программировании, только личный опыт» → «первые решения — в первом же модуле» ———
const Toggle: React.FC<{on: number; x: number; y: number}> = ({on, x, y}) => (
  <div style={{position: 'absolute', left: x, top: y, width: 210, height: 118, borderRadius: 59,
    background: `rgba(${Math.round(90 + (61 - 90) * on)},${Math.round(96 + (237 - 96) * on)},${Math.round(104 + (195 - 104) * on)},1)`,
    boxShadow: `inset 0 3px 8px rgba(0,0,0,.35), 0 0 ${40 * on}px rgba(61,237,195,${0.6 * on})`}}>
    <div style={{position: 'absolute', left: 9 + 92 * on, top: 9, width: 100, height: 100, borderRadius: 50,
      background: 'radial-gradient(circle at 35% 30%, #FFFFFF, #E4E7EA 70%, #C9CDD1)', boxShadow: '0 6px 14px rgba(0,0,0,.4)'}} />
  </div>
);
const PANEL = {x: 150, y: 470, w: 1140, h: 560};
const M1 = at(88); // «первом»
export const NoCodeScene: React.FC<{t: number}> = ({t}) => {
  const pin = k(t, B.noCode + 0.05, B.noCode + 0.55, E.out);
  const offCode = 1 - k(t, at(78) + 0.1, at(78) + 0.55, E.inOut); // программирование: выключается
  const onExp = k(t, at(81) - 0.05, at(81) + 0.4, E.inOut);        // личный опыт: включается
  const away = k(t, at(83) - 0.25, at(83) + 0.25, E.inOut);         // «Первые решения» — панель уходит вверх
  const track = k(t, at(83) - 0.05, at(83) + 0.6, E.out);
  const m1 = k(t, M1 - 0.1, M1 + 0.5, E.pop);
  const row = (y: number, label: string, on: number, dim: number) => (
    <div style={{position: 'absolute', left: 64, right: 64, top: y, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
      <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 80, letterSpacing: '-0.03em', color: C.ink, opacity: dim, textShadow: textDepth}}>{label}</span>
      <div style={{position: 'relative', width: 210, height: 118}}><Toggle on={on} x={0} y={0} /></div>
    </div>
  );
  const N = 10, D = 104, GAP = 16, TX = 720 - (N * D + (N - 1) * GAP) / 2, TY = 560;
  return (
    <AbsoluteFill>
      <GlassEnv bg={() => <Aurora t={t} />}>
        {away < 1 ? (
          <div style={{...full, opacity: pin * (1 - away), transform: `translateY(${(1 - pin) * 60 - away * 160}px)`}}>
            <LiquidPanel x={PANEL.x} y={PANEL.y} w={PANEL.w} h={PANEL.h} r={64} material="frosted" level={3} moon={0.6} name="settings">
              {row(70, 'Программирование', offCode, 0.45 + 0.55 * offCode)}
              <div style={{position: 'absolute', left: 64, right: 64, top: 270, height: 2, background: 'rgba(255,255,255,.12)'}} />
              {row(310, 'Личный опыт', onExp, 0.6 + 0.4 * onExp)}
            </LiquidPanel>
          </div>
        ) : null}
        {track > 0 ? (
          <div style={{...full, opacity: track}}>
            {/* дорожка из 10 модулей, модуль 1 загорается и раскрывается в карточку */}
            <div style={{position: 'absolute', left: TX + D / 2, top: TY + D / 2 - 2, width: (N - 1) * (D + GAP) * track, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.22)'}} />
            {Array.from({length: N}, (_, i) => {
              const a = k(t, at(83) + i * 0.05, at(83) + 0.35 + i * 0.05, E.pop);
              const lit = i === 0 ? m1 : 0;
              return (
                <div key={i} style={{position: 'absolute', left: TX + i * (D + GAP), top: TY, width: D, height: D, borderRadius: D / 2,
                  transform: `scale(${(0.5 + 0.5 * a) * (1 + 0.18 * lit)})`, opacity: a, display: 'grid', placeItems: 'center',
                  background: lit > 0 ? `rgba(61,237,195,${0.3 + 0.7 * lit})` : 'rgba(255,255,255,.09)',
                  boxShadow: `inset 0 2px 0 rgba(255,255,255,.35), 0 0 0 2px rgba(255,255,255,.18), 0 0 ${50 * lit}px rgba(61,237,195,${0.8 * lit})`,
                  fontFamily: NUM, fontWeight: 800, fontSize: 44, color: lit > 0.5 ? C.mintInk : C.ink}}>{String(i + 1).padStart(2, '0')}</div>
              );
            })}
            {m1 > 0 ? (
              <div style={{...full, opacity: Math.min(1, m1 * 1.5), transformOrigin: `${TX + D / 2}px ${TY + D}px`, transform: `scale(${0.6 + 0.4 * m1})`}}>
                <LiquidPanel x={150} y={760} w={1140} h={500} r={56} material="frosted" level={3} moon={0.7} name="module1">
                  {/* мини-лендинг: макет первой страницы */}
                  <div style={{position: 'absolute', left: 48, top: 48, width: 400, height: 404, borderRadius: 26, overflow: 'hidden', background: '#F5F6F4',
                    boxShadow: '0 20px 40px rgba(0,0,0,.35)'}}>
                    <div style={{height: 34, background: '#E6E8E5', display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px'}}>
                      {[0, 1, 2].map((i) => <span key={i} style={{width: 10, height: 10, borderRadius: 5, background: '#C4C8CC'}} />)}
                    </div>
                    <div style={{padding: 24}}>
                      <div style={{width: '82%', height: 30, borderRadius: 8, background: '#101214'}} />
                      <div style={{width: '60%', height: 30, borderRadius: 8, background: '#101214', marginTop: 12}} />
                      <div style={{width: '90%', height: 14, borderRadius: 7, background: '#C9CDD1', marginTop: 24}} />
                      <div style={{width: '70%', height: 14, borderRadius: 7, background: '#C9CDD1', marginTop: 10}} />
                      <div style={{width: 170, height: 58, borderRadius: 29, background: C.mint, marginTop: 28, boxShadow: '0 8px 20px rgba(61,237,195,.5)'}} />
                      <div style={{display: 'flex', gap: 12, marginTop: 28}}>
                        {[0, 1, 2].map((i) => <div key={i} style={{flex: 1, height: 70, borderRadius: 14, background: i === 1 ? '#FFD9C2' : '#E6E8E5'}} />)}
                      </div>
                    </div>
                  </div>
                  <div style={{position: 'absolute', left: 500, top: 92, right: 40}}>
                    <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 59, color: C.mint}}>Модуль 1</div>
                    <div style={{marginTop: 18, fontFamily: SANS, fontWeight: 800, fontSize: 76, lineHeight: 1.05, letterSpacing: '-0.03em', color: C.ink, textShadow: textDepth}}>
                      первый<br />лендинг<br />за вечер
                    </div>
                  </div>
                </LiquidPanel>
              </div>
            ) : null}
          </div>
        ) : null}
      </GlassEnv>
    </AbsoluteFill>
  );
};

// ——— «Для тех, кто силён в своём деле» (профессия перелистывается) → «из пользователя ChatGPT в эксперта с агентами» ———
const JOBS = ['маркетолог', 'тренер', 'логист', 'юрист', 'в своём деле'];
const FLIP0 = at(93), FLIP_STEP = 0.36; // «кто уже силён в своём деле»
const P0 = {x: 330, y: 1190}, P1 = {x: 980, y: 700};
const pathD = `M${P0.x},${P0.y} C${P0.x + 420},${P0.y + 30} ${P1.x - 380},${P1.y + 40} ${P1.x},${P1.y}`;
export const GrowthScene: React.FC<{t: number}> = ({t}) => {
  const card = k(t, B.growth + 0.05, B.growth + 0.55, E.out);
  const away = k(t, at(103) - 0.3, at(103) + 0.1, E.inOut); // «из рядового…»
  const fi = t < FLIP0 ? 0 : Math.min(JOBS.length - 1, 1 + Math.floor((t - FLIP0) / FLIP_STEP));
  const fp = fi === 0 ? 1 : Math.min(1, (t - FLIP0 - (fi - 1) * FLIP_STEP) / 0.16);
  const draw = k(t, at(106) + 0.2, at(108) + 0.25, E.inOut);
  const pulse = k(t, at(111) - 0.05, at(111) + 0.3) * (1 - k(t, at(113) + 0.3, at(114) + 0.2));
  const dot = draw;
  // точка на кривой Безье
  const bez = (u: number) => {
    const p = [P0, {x: P0.x + 420, y: P0.y + 30}, {x: P1.x - 380, y: P1.y + 40}, P1];
    const m = 1 - u;
    return {x: m ** 3 * p[0].x + 3 * m * m * u * p[1].x + 3 * m * u * u * p[2].x + u ** 3 * p[3].x,
      y: m ** 3 * p[0].y + 3 * m * m * u * p[1].y + 3 * m * u * u * p[2].y + u ** 3 * p[3].y};
  };
  const d = bez(dot);
  return (
    <AbsoluteFill>
      <GlassEnv bg={() => <DawnSky t={t} rise={0.15 + 0.25 * k(t, B.growth, B.products, (v) => v)} />}>
        {away < 1 ? (
          <div style={{...full, opacity: card * (1 - away), transform: `translateY(${(1 - card) * 60 - away * 140}px)`}}>
            <LiquidPanel x={170} y={560} w={1100} h={420} r={60} material="frosted" level={3} moon={0.4} name="jobs">
              <div style={{position: 'absolute', left: 0, right: 0, top: 70, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 59, color: C.dim}}>ты уже силён:</div>
              <div style={{position: 'absolute', left: 0, right: 0, top: 170, height: 150, overflow: 'hidden'}}>
                {[fi - 1, fi].filter((i) => i >= 0).map((i) => {
                  const cur = i === fi;
                  const y = cur ? (1 - fp) * 150 : -fp * 150;
                  return (
                    <div key={i} style={{position: 'absolute', left: 0, right: 0, top: 0, height: 150, lineHeight: '150px', textAlign: 'center',
                      transform: `translateY(${y}px)`,
                      fontFamily: SANS, fontWeight: 800, fontSize: 118, letterSpacing: '-0.035em', color: i === JOBS.length - 1 ? C.mint : C.ink, textShadow: textDepth}}>{JOBS[i]}</div>
                  );
                })}
              </div>
            </LiquidPanel>
          </div>
        ) : null}
        {away > 0 ? (
          <>
            <svg width={1440} height={2560} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
              <defs><filter id="gw" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={10 + 14 * pulse} /></filter></defs>
              <path d={pathD} fill="none" stroke="rgba(61,237,195,.9)" strokeWidth={18 + 10 * pulse} strokeLinecap="round" pathLength={1} strokeDasharray={`${draw} 1`} filter="url(#gw)" opacity={0.55 + 0.4 * pulse} />
              <path d={pathD} fill="none" stroke="#E9FFF8" strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray={`${draw} 1`} />
              {draw > 0 && draw < 1 ? <circle cx={d.x} cy={d.y} r={18} fill="#FFFFFF" style={{filter: 'drop-shadow(0 0 16px rgba(61,237,195,.9))'}} /> : null}
            </svg>
            <Chip t={t} at={at(105) - 0.1} x={P0.x - 70} y={P0.y + 50} center={false} label="пользователь ChatGPT" icon="mark:openai" size={59} glass={{material: 'frosted', moon: 0.3}} color="#D7DBDE" />
            <div style={{...full, transformOrigin: `${P1.x}px ${P1.y - 150}px`, transform: `scale(${1 + 0.08 * pulse})`}}>
              <Chip t={t} at={at(108) - 0.05} x={740} y={P1.y - 250} label="эксперт с агентами" icon="mark:claude" size={76} glass={{material: 'solid', tone: 'mint', moon: 0.6}} />
            </div>
          </>
        ) : null}
      </GlassEnv>
    </AbsoluteFill>
  );
};
