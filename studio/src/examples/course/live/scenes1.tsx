import {textDepth} from '../../../ds/tokens';
import {LiquidPanel} from '../../../kit/liquid/LiquidPanel';
import {Object25D} from '../../../kit/liquid/Object25D';
import {useFontsReady} from '../../../kit/liquid/useAssetReady';
import {fontSpec, textWidth} from '../../../kit/liquid/words';
import {Chip, E, k, Mark, SANS} from '../../montage/parts';
import {ExcelSheet, ForwarderDashboard, Laptop, UI} from '../ui';
import {at, WORDS22} from '../words';
import {BLUE, DARK_INK, DIM, INK, MINT, MINT_INK, RED, Selection, type Pt} from './canvas';
import {Hourglass} from './Hourglass';

// Блоки 1–3. Координаты — внутри кадра своего блока (0…1440 × 0…2560).
// 01 — белая карточка во весь кадр: цитата крупным планом, человечек в смокинге, агент перечёркивает его и стирает «не».

const Q = {x: 150, size: 158, l1: 470, l2: 640, l3: 860, size3: 74};
const QF = fontSpec(800, Q.size, SANS), QF3 = fontSpec(700, Q.size3, SANS);
const TR = -0.04;
const clean = (s: string) => s.replace(/[.,]/g, '');
const typed = (t: number, i: number) => {
  const w = clean(WORDS22[i].text), s = WORDS22[i].start;
  return w.slice(0, Math.round(w.length * k(t, s - 0.02, s + Math.min(0.3, 0.06 * w.length), (v) => v)));
};
export const MAN = {x: 1035, y: 1010, s: 780};
// Сетка с эффектом рыбьего глаза: линии выгибаются от центра, кадр кажется объёмным (правка Александра 20.09).
const Fisheye: React.FC<{cx: number; cy: number; t: number; step?: number; color?: string}> = ({cx, cy, t, step = 124, color = 'rgba(20,24,28,.2)'}) => {
  const kf = 0.26 + 0.035 * Math.sin(t * 0.55);            // лёгкое «дыхание» линзы
  const off = ((t * 9) % step) - step;                      // медленный дрейф сетки
  const R = 1500;
  const warp = (x: number, y: number) => {
    const dx = (x - cx) / R, dy = (y - cy) / R, f = 1 + kf * (dx * dx + dy * dy);
    return [cx + dx * R * f, cy + dy * R * f];
  };
  const line = (fixed: number, vertical: boolean) => {
    const pts: string[] = [];
    for (let v = -900; v <= 3500; v += 60) {
      const [x, y] = vertical ? warp(fixed, v) : warp(v, fixed);
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return pts.join(' ');
  };
  const cols = [], rows = [];
  for (let x = -600; x <= 2100; x += step) cols.push(x + off);
  for (let y = -400; y <= 2900; y += step) rows.push(y + off * 0.6);
  return (
    <svg width={1440} height={2560} style={{position: 'absolute', left: 0, top: 0}}>
      {cols.map((x, i) => <polyline key={`c${i}`} points={line(x, true)} fill="none" stroke={color} strokeWidth={i % 4 === 0 ? 3.4 : 2} />)}
      {rows.map((y, i) => <polyline key={`r${i}`} points={line(y, false)} fill="none" stroke={color} strokeWidth={i % 4 === 0 ? 3.4 : 2} />)}
      <defs>
        <radialGradient id="fgv" cx="50%" cy="42%" r="62%"><stop offset="0.55" stopColor="rgba(255,255,255,0)" /><stop offset="1" stopColor="rgba(190,186,176,.55)" /></radialGradient>
      </defs>
      <rect width={1440} height={2560} fill="url(#fgv)" />
    </svg>
  );
};
export const A1Quote: React.FC<{t: number}> = ({t}) => {
  const ready = useFontsReady([QF, QF3]);
  if (!ready) return null;
  const wid = (s: string, f = QF, size = Q.size) => textWidth(s, f, size, TR);
  const sp = wid(' ');
  const sel = k(t, 4.3, 4.38), gone = k(t, 4.5, 4.75, E.inOut);
  const underline = k(t, 4.85, 5.15, E.inOut), strike = k(t, 5.2, 5.6, E.inOut);
  const x1 = k(t, 3.9, 4.12, E.out), x2 = k(t, 4.14, 4.36, E.out);
  const l1 = `${typed(t, 0)}${t >= at(1) ? ' ' + typed(t, 1) : ''}`;
  const ne = typed(t, 2), zam = typed(t, 3);
  const l3 = [4, 5, 6, 7].filter((i) => t >= at(i) - 0.02).map((i) => typed(t, i)).join(' ');
  const big: React.CSSProperties = {position: 'absolute', left: Q.x, fontFamily: SANS, fontWeight: 800, fontSize: Q.size, lineHeight: 1, letterSpacing: `${TR}em`,
    color: DARK_INK, whiteSpace: 'nowrap'};
  const bolW = wid('у меня ', QF3, Q.size3), opW = wid('большой опыт', QF3, Q.size3);
  return (
    <>
      <Fisheye cx={MAN.x} cy={MAN.y} t={t} />
      <Object25D src="objects/tuxedo.webp" x={MAN.x} y={MAN.y} size={MAN.s} t={t} at={-0.35} float={8} tilt={2} shadow={false}
        style={{filter: x2 > 0.5 ? `contrast(${1 - 0.25 * x2}) opacity(${1 - 0.25 * x2})` : undefined}} />
      {x1 > 0 ? (
        <svg width={MAN.s} height={MAN.s} style={{position: 'absolute', left: MAN.x - MAN.s / 2, top: MAN.y - MAN.s / 2, overflow: 'visible'}}>
          {[[x1, 150, 120, MAN.s - 150, MAN.s - 120], [x2, MAN.s - 150, 120, 150, MAN.s - 120]].map(([p, ax, ay, bx, by], i) => (
            <line key={i} x1={ax} y1={ay} x2={ax + (bx - ax) * p} y2={ay + (by - ay) * p} stroke={RED.hex} strokeWidth={30} strokeLinecap="round"
              style={{filter: `drop-shadow(0 0 22px rgba(${RED.rgb},.55))`}} />
          ))}
        </svg>
      ) : null}
      <div style={{...big, top: Q.l1}}>{l1}</div>
      <div style={{...big, top: Q.l2, display: 'flex'}}>
        {gone < 1 ? (
          <span style={{position: 'relative', display: 'inline-block', width: ne ? (wid('не') + sp) * (1 - gone) : 0, opacity: 1 - gone}}>
            {sel > 0 ? <span style={{position: 'absolute', left: -10, top: 4, width: (wid('не') + 20) * (1 - gone), height: Q.size * 1.02, background: BLUE.hex, opacity: 0.85 * sel, borderRadius: 10}} /> : null}
            <span style={{position: 'relative', color: sel > 0.5 ? '#FFFFFF' : DARK_INK}}>{ne}</span>
          </span>
        ) : null}
        <span style={{position: 'relative'}}>
          {zam}
          <span style={{position: 'absolute', left: 0, bottom: -4, height: 12, width: `${underline * 100}%`, borderRadius: 6, background: RED.hex}} />
        </span>
      </div>
      {/* вторая строка: зачёркивание ровно по центру букв */}
      <div style={{position: 'absolute', left: Q.x, top: Q.l3, fontFamily: SANS, fontWeight: 700, fontSize: Q.size3, lineHeight: 1, letterSpacing: `${TR}em`, color: '#5C6167', whiteSpace: 'nowrap'}}>
        {l3}
        <span style={{position: 'absolute', left: bolW, top: Q.size3 * 0.36, height: 7, width: opW * strike, borderRadius: 4, background: RED.hex}} />
      </div>
    </>
  );
};
export const a1Cursor = (): {pts: Pt[]; clicks: number[]} => {
  const size = (s: string, f = QF, sz = Q.size) => textWidth(s, f, sz, TR);
  const pts: Pt[] = [[0, 1330, 1700]];
  const row = (i: number) => (i < 2 ? Q.l1 : i < 4 ? Q.l2 : Q.l3) + (i < 4 ? Q.size * 0.9 : Q.size3 * 1.0);
  const pre = (i: number) => (i === 0 || i === 2 || i === 4 ? '' : i === 1 ? 'Меня ' : i === 3 ? 'не ' : ['у', 'у меня', 'у меня большой'][i - 5] + ' ');
  for (let i = 0; i <= 7; i++) {
    const w = clean(WORDS22[i].text), s = WORDS22[i].start, f = i < 4 ? QF : QF3, sz = i < 4 ? Q.size : Q.size3;
    pts.push([s, Q.x + size(pre(i), f, sz) + 20, row(i)], [s + Math.min(0.3, 0.06 * w.length), Q.x + size(pre(i) + w, f, sz) + 20, row(i)]);
  }
  const neX = Q.x + size('не') / 2, neY = Q.l2 + Q.size * 0.6;
  const zamW = size('заменит'), l3y = Q.l3 + Q.size3 * 0.5, bol = Q.x + size('у меня ', QF3, Q.size3), op = size('большой опыт', QF3, Q.size3);
  pts.push([3.75, MAN.x - MAN.s / 2 + 150, MAN.y - MAN.s / 2 + 120], [4.12, MAN.x + MAN.s / 2 - 150, MAN.y + MAN.s / 2 - 120],
    [4.14, MAN.x + MAN.s / 2 - 150, MAN.y - MAN.s / 2 + 120], [4.36, MAN.x - MAN.s / 2 + 150, MAN.y + MAN.s / 2 - 120],
    [4.5, neX, neY], [4.75, neX, neY], [4.85, Q.x, Q.l2 + Q.size * 1.05], [5.15, Q.x + zamW, Q.l2 + Q.size * 1.05],
    [5.2, bol, l3y], [5.6, bol + op, l3y], [5.85, 1300, 620]);
  return {pts, clicks: [4.32]};
};

// ——— 02 · твоё время: песочные часы переворачиваются, справа коллега с агентом ———
const HG = {left: 120, top: 320, w: 1060, h: 1120};
const CARD2 = {x: 780, y: 430, w: 560, h: 840};
const TASKS = ['таблицы', 'отчёты', 'переписка'];
const TICK = [13.55, 14.15, 14.75];
export const A2Threat: React.FC<{t: number}> = ({t}) => {
  const move = k(t, 7.95, 8.45, E.inOut);
  const flip = k(t, 7.18, 7.85, E.pop), flow = k(t, 7.9, 15.72, (v) => v);
  const hx = 700 - 280 * move, hs = 1 - 0.22 * move;
  const cardIn = k(t, 8.3, 8.8, E.out), exp = 1 - 0.62 * k(t, 9.1, 9.55, E.inOut);
  const dock = k(t, 10.45, 10.95, E.inOut), rows = k(t, 11.25, 11.7, E.out);
  const cardX = CARD2.x + (1 - cardIn) * 700;
  const agentX = 1080 + (CARD2.x + 90 - 1080) * dock, agentY = 1520 + (CARD2.y - 62 - 1520) * dock;
  return (
    <>
      <div style={{position: 'absolute', left: hx - 250 * hs, top: 840 + 400 * hs, width: 500 * hs, height: 66 * hs, borderRadius: '50%',
        background: 'radial-gradient(closest-side, rgba(0,0,0,.5), transparent)', filter: 'blur(6px)'}} />
      <div style={{position: 'absolute', left: HG.left, top: HG.top}}>
        <Hourglass w={HG.w} h={HG.h} x={hx - HG.left} y={850 - HG.top} scale={hs} flip={flip} flow={flow} spin={0.35 + t * 0.12} />
      </div>
      {cardIn > 0 ? (
        <LiquidPanel x={cardX} y={CARD2.y} w={CARD2.w} h={CARD2.h} r={44} material="frosted" level={3} moon={0.4} name="colleague"
          style={dock >= 1 ? {boxShadow: `0 0 0 4px rgba(${BLUE.rgb},.9), 0 0 60px rgba(${BLUE.rgb},.4), 0 40px 90px rgba(0,0,0,.5)`} : undefined}>
          {/* улыбающийся человечек за ноутбуком — эмоция «ему легко» */}
          <div style={{position: 'absolute', left: 0, right: 0, top: 10, height: 300}}>
            <Object25D src="objects/dev-happy.webp" x={CARD2.w / 2} y={170 - TICK.reduce((a, tc) => a + 16 * Math.sin(Math.PI * k(t, tc, tc + 0.32)), 0)} size={330} t={t} at={8.5} float={9} tilt={3} shadow={false}
              scale={1 + 0.05 * TICK.reduce((a, tc) => a + Math.sin(Math.PI * k(t, tc, tc + 0.32)), 0)} />
          </div>
          <div style={{position: 'absolute', left: 44, right: 44, top: 310}}>
            <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 78, letterSpacing: '-0.03em', color: INK, textShadow: textDepth}}>Коллега</div>
            <div style={{marginTop: 24, fontFamily: SANS, fontWeight: 700, fontSize: 52, color: DIM}}>опыт</div>
            <div style={{marginTop: 12, height: 22, borderRadius: 11, background: 'rgba(255,255,255,.1)'}}>
              <div style={{width: `${exp * 100}%`, height: '100%', borderRadius: 11, background: '#B9BEC4'}} />
            </div>
            {rows > 0 ? (
              <div style={{marginTop: 26, opacity: rows}}>
                {TASKS.map((n, i) => {
                  const d = k(t, TICK[i], TICK[i] + 0.22, E.pop);        // галочка
                  const line = k(t, TICK[i] + 0.06, TICK[i] + 0.34, E.out); // зачёркивание
                  const flash = k(t, TICK[i], TICK[i] + 0.08) * (1 - k(t, TICK[i] + 0.08, TICK[i] + 0.5));
                  return (
                    <div key={n} style={{position: 'relative', display: 'flex', alignItems: 'center', gap: 18, height: 74,
                      transform: `translateX(${flash * 10}px)`}}>
                      <div style={{position: 'absolute', left: -18, right: -18, top: 4, bottom: 4, borderRadius: 16,
                        background: `rgba(61,237,195,${0.22 * flash})`, boxShadow: flash > 0.05 ? `0 0 ${40 * flash}px rgba(61,237,195,${0.35 * flash})` : 'none'}} />
                      <div style={{position: 'relative', width: 46, height: 46, borderRadius: 13, border: `4px solid ${d > 0 ? MINT : 'rgba(255,255,255,.35)'}`,
                        background: d > 0 ? MINT : 'transparent', display: 'grid', placeItems: 'center', boxSizing: 'border-box',
                        transform: `scale(${1 + 0.35 * flash})`}}>
                        {d > 0 ? <svg width={26} height={26} viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={MINT_INK} strokeWidth={3.4} strokeLinecap="round"
                          strokeLinejoin="round" pathLength={1} strokeDasharray={`${Math.min(1, d)} 1`} /></svg> : null}
                      </div>
                      <span style={{position: 'relative', fontFamily: SANS, fontWeight: 700, fontSize: 50, color: d > 0 ? DIM : INK}}>
                        {n}
                        <span style={{position: 'absolute', left: -4, right: 0, top: '52%', height: 5, borderRadius: 3, background: MINT, transformOrigin: 'left center',
                          transform: `scaleX(${line})`}} />
                      </span>
                    </div>
                  );
                })}
                {/* полоса «сделано» наливается с каждой галочкой */}
                <div style={{marginTop: 12, height: 12, borderRadius: 6, background: 'rgba(255,255,255,.1)'}}>
                  <div style={{width: `${TICK.reduce((a, tc) => a + k(t, tc, tc + 0.3, E.out), 0) / TICK.length * 100}%`, height: '100%', borderRadius: 6,
                    background: `linear-gradient(90deg, ${MINT}, #9FF7E2)`, boxShadow: '0 0 18px rgba(61,237,195,.55)'}} />
                </div>
              </div>
            ) : null}
          </div>
        </LiquidPanel>
      ) : null}
      {t > 10.2 ? (
        <div style={{position: 'absolute', left: agentX, top: agentY, display: 'flex', alignItems: 'center', gap: 14, padding: '14px 26px 14px 14px', borderRadius: 999,
          background: '#16181B', boxShadow: `0 0 0 4px rgba(${BLUE.rgb},.85), 0 16px 40px rgba(0,0,0,.5)`, opacity: k(t, 10.2, 10.4), whiteSpace: 'nowrap'}}>
          <span style={{width: 62, height: 62, borderRadius: 31, background: '#FFFFFF', display: 'grid', placeItems: 'center'}}><Mark name="claude" size={40} /></span>
          <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 46, color: INK}}>ИИ-агент</span>
        </div>
      ) : null}
      <Chip t={t} at={at(44) - 0.1} x={CARD2.x + CARD2.w / 2} y={CARD2.y + CARD2.h + 20} label="быстрее" size={60} glass={{material: 'solid', tone: 'mint'}} />
    </>
  );
};
export const a2Cursor = (): {pts: Pt[]; clicks: number[]} => {
  const bx = CARD2.x + 44 + 60, by = 430 + 560;            // колонка галочек внутри карточки коллеги
  return {
    pts: [[7.0, 1100, 520], [7.12, 740, 460], [7.9, 740, 800], [8.45, 440, 800], [8.6, 1420, 900], [8.8, 810, 900],
      [9.05, CARD2.x + 44 + (CARD2.w - 88) * 0.95, CARD2.y + 420], [9.55, CARD2.x + 44 + (CARD2.w - 88) * 0.36, CARD2.y + 420],
      [10.2, 1130, 1540], [10.95, CARD2.x + 200, CARD2.y - 20], [11.6, 1160, 1220],
      [13.4, bx, by], [13.62, bx, by], [14.0, bx, by + 74], [14.22, bx, by + 74], [14.6, bx, by + 148], [14.82, bx, by + 148],
      [15.6, 1230, 1180], [16.15, 1400, 1300]],
    clicks: [7.14, 10.95, 13.55, 14.15, 14.75],
  };
};

// ——— 03 · экспедиторы: ноутбук, сборка интерфейса, Excel удаляется ———
const LAP = {x: 130, y: 470, w: 1020};
const SCR = {x: LAP.x + LAP.w * 0.08 + LAP.w * 0.018, y: LAP.y + LAP.w * 0.018, w: LAP.w, h: LAP.w * 0.625};
const XL = {x: 90, y: 1010, w: 520, h: 360};
const BUILD = [16.75, 17.65] as const;
export const Skeleton: React.FC<{t: number}> = ({t}) => {
  const sh = (t * 0.9) % 1;
  const blk = (s: React.CSSProperties) => <div style={{position: 'absolute', borderRadius: 12, background: '#1D252E', ...s}} />;
  return (
    <div style={{position: 'absolute', inset: 0, background: UI.bg, overflow: 'hidden'}}>
      {blk({left: 0, top: 0, width: '17%', height: '100%', borderRadius: 0, background: '#111820'})}
      {[0, 1, 2, 3].map((i) => blk({left: '2%', top: 90 + i * 58, width: '13%', height: 36}))}
      {blk({left: '20%', top: 30, width: '52%', height: 34})}
      {blk({left: '20%', top: 90, width: '38%', height: 150})}
      {blk({left: '60%', top: 90, width: '37%', height: 150})}
      {[0, 1, 2, 3].map((i) => blk({left: '20%', top: 270 + i * 62, width: '77%', height: 44}))}
      <div style={{position: 'absolute', inset: 0, background: `linear-gradient(100deg, transparent ${sh * 140 - 40}%, rgba(255,255,255,.06) ${sh * 140 - 20}%, transparent ${sh * 140}%)`}} />
    </div>
  );
};
export const A3Forwarder: React.FC<{t: number}> = ({t}) => {
  const b = k(t, BUILD[0], BUILD[1], E.inOut);
  const lapIn = k(t, 16.35, 16.8, E.out);
  const sel = k(t, at(49) + 0.02, at(49) + 0.1), del = k(t, at(50) + 0.02, at(50) + 0.32, E.acc);
  return (
    <>
      <div style={{position: 'absolute', left: LAP.x, top: LAP.y, opacity: lapIn, transform: `translateY(${(1 - lapIn) * 60}px)`}}>
        <Laptop w={LAP.w}>
          <ForwarderDashboard k={k(t, BUILD[1] - 0.2, BUILD[1] + 1.4, (v) => v)} />
          {b < 1 ? <div style={{position: 'absolute', inset: 0, clipPath: `inset(${b * 100}% 0 0 0)`}}><Skeleton t={t} /></div> : null}
          {b > 0 && b < 1 ? <div style={{position: 'absolute', left: 0, right: 0, top: `${b * 100}%`, height: 4, marginTop: -2, background: BLUE.hex,
            boxShadow: `0 0 24px 6px rgba(${BLUE.rgb},.6)`}} /> : null}
        </Laptop>
      </div>
      {del < 1 ? (
        <div style={{position: 'absolute', left: XL.x, top: XL.y, width: XL.w, height: XL.h, opacity: lapIn * (1 - del), transformOrigin: '50% 50%',
          transform: `rotate(${-5 * (1 - del)}deg) scale(${1 - del})`, filter: del > 0 ? `blur(${del * 8}px)` : undefined}}>
          <ExcelSheet />
          <Selection x={-14} y={-14} w={XL.w + 28} h={XL.h + 28} o={sel * (1 - del)} size={false} color={BLUE.hex} />
        </div>
      ) : null}
      <Chip t={t} at={at(47) - 0.05} x={720} y={412} label="для экспедиторов" size={60} glass={{material: 'frosted', moon: 0.4}} />
    </>
  );
};
export const a3Cursor = (): {pts: Pt[]; clicks: number[]; keys: [number, string, number, number][]} => ({
  pts: [[16.4, 1300, 1500], [BUILD[0], SCR.x + SCR.w - 40, SCR.y + 10], [BUILD[1], SCR.x + SCR.w - 40, SCR.y + SCR.h - 10],
    [at(49) - 0.1, XL.x + XL.w * 0.55, XL.y + XL.h * 0.5], [at(50) + 0.4, XL.x + XL.w * 0.55, XL.y + XL.h * 0.5], [19.4, 1350, 1300]],
  clicks: [at(49) + 0.02],
  keys: [[at(50), '⌫', XL.x + XL.w * 0.55 + 70, XL.y + XL.h * 0.5 + 120]],
});
