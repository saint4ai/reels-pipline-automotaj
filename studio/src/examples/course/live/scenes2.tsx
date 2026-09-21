import {textDepth} from '../../../ds/tokens';
import {useFontsReady} from '../../../kit/liquid/useAssetReady';
import {fontSpec, textWidth} from '../../../kit/liquid/words';
import {LiquidPanel} from '../../../kit/liquid/LiquidPanel';
import {Chip, E, k, Mark, NUM, SANS} from '../../montage/parts';
import {BrowserWindow, FitnessApp, PhoneFrame, SalesAnalytics, UI} from '../ui';
import {at} from '../words';
import {BLUE, DIM, INK, MINT, MINT_INK, ORANGE, type Pt} from './canvas';

// Листы 04–07: трекер на светлом листе (камера влетает в экран телефона), сквозная аналитика, «без кода» на светлом листе, рост до эксперта.
const DARK = '#15181B';

// ——— 04 · тренеры (светлый лист): телефон поднимается снизу, камера влетает в экран ———
export const PHONE = {x: 460, y: 350, w: 520};
export const PhoneScreen = {x: PHONE.x + 17, y: PHONE.y + 17, w: PHONE.w - 34, h: PHONE.w * 2.06 - 34};
export const A4Fitness: React.FC<{t: number}> = ({t}) => {
  const rise = k(t, 19.95, 20.6, E.out);
  const build = k(t, 20.4, 21.6, (v) => v);
  return (
    <>
      <div style={{position: 'absolute', left: PHONE.x, top: PHONE.y, opacity: Math.min(1, rise * 2), transform: `translateY(${(1 - rise) * 620}px)`}}>
        <PhoneFrame w={PHONE.w} light>
          <FitnessApp k={build} food={k(t, at(61) - 0.1, at(61) + 0.3) * (1 - k(t, at(63) - 0.1, at(63) + 0.2))} act={k(t, at(63) - 0.1, at(63) + 0.3)} />
        </PhoneFrame>
      </div>
      <Chip t={t} at={at(53) - 0.05} out={21.1} x={720} y={345} label="приложение для тренеров" size={64} glass={{material: 'solid', tone: 'light'}} color={DARK} />
    </>
  );
};
export const a4Cursor = (): {pts: Pt[]; clicks: number[]} => ({
  pts: [[19.8, 1350, 1500], [20.5, 900, 900], [21.4, 760, 700], [23.6, 820, 1180], [24.2, 1300, 1400]],
  clicks: [20.6],
});

// ——— 05 · аналитика: окно поднимается, камера подъезжает, на «AI-таргетологом» выезжает панель ———
export const ADS = {x: 100, y: 470, w: 1240, h: 830};
export const A5Ads: React.FC<{t: number}> = ({t}) => {
  const rise = k(t, 24.5, 25.1, E.out);
  return (
    <>
      <div style={{position: 'absolute', left: ADS.x, top: ADS.y, opacity: Math.min(1, rise * 2), transform: `translateY(${(1 - rise) * 500}px)`}}>
        <BrowserWindow w={ADS.w} h={ADS.h} url="analytics.app">
          <SalesAnalytics k={k(t, 24.9, 26.4, (v) => v)} ai={k(t, at(69) - 0.1, at(69) + 0.45, E.out)} t={t} />
        </BrowserWindow>
      </div>
      <Chip t={t} at={at(64) - 0.05} out={26.3} x={720} y={360} label="сквозная аналитика" size={64} glass={{material: 'frosted', moon: 0.4}} />
      <Chip t={t} at={at(70) - 0.1} out={27.7} x={720} y={360} label="AI-таргетолог" size={64} glass={{material: 'solid', tone: 'mint'}} />
    </>
  );
};
export const a5Cursor = (): {pts: Pt[]; clicks: number[]} => ({
  pts: [[24.4, 1340, 1450], [25.2, 900, 950], [26.5, 1150, 900], [27.6, 1330, 1350]],
  clicks: [25.3],
});

// ——— 06 · без кода (светлый лист): два переключателя, дорожка модулей, карточка первого модуля ———
const Toggle: React.FC<{on: number}> = ({on}) => (
  <div style={{position: 'relative', width: 230, height: 126, borderRadius: 63, flex: 'none',
    background: on > 0.5 ? MINT : '#C7C9C4', boxShadow: `inset 0 3px 8px rgba(0,0,0,.18), 0 0 ${44 * on}px rgba(61,237,195,${0.5 * on})`}}>
    <div style={{position: 'absolute', left: 10 + 100 * on, top: 10, width: 106, height: 106, borderRadius: 53, background: '#FFFFFF',
      boxShadow: '0 8px 18px rgba(0,0,0,.28)'}} />
  </div>
);
const N = 10, D = 104, GAP = 16, TX = 720 - (N * D + (N - 1) * GAP) / 2, TY = 858;
const M1 = at(88);
export const A6NoCode: React.FC<{t: number}> = ({t}) => {
  const pin = k(t, 29.9, 30.4, E.out);
  const offCode = 1 - k(t, at(78) + 0.1, at(78) + 0.6, E.inOut);
  const onExp = k(t, at(81) - 0.05, at(81) + 0.45, E.inOut);
  const away = k(t, at(83) - 0.3, at(83) + 0.1, E.inOut);
  const track = k(t, at(83), at(83) + 0.6, E.out);
  const run = k(t, at(83) + 0.45, M1 - 0.25, E.inOut);          // мятный бегунок проходит все 10 модулей
  const head = run * (N - 1);
  const m1 = k(t, M1 - 0.1, M1 + 0.5, E.pop);
  const sweep = k(t, M1 + 0.05, M1 + 0.95, E.inOut);            // блик сборки по карточке
  const bar = k(t, M1 + 0.18, M1 + 0.42, E.out);
  const ln1 = k(t, M1 + 0.3, M1 + 0.58, E.out);
  const ln2 = k(t, M1 + 0.4, M1 + 0.68, E.out);
  const btn = k(t, M1 + 0.58, M1 + 0.86, E.pop);
  const ttl = k(t, M1 + 0.22, M1 + 0.6, E.out);
  // строка настройки: выключенное слово гаснет и зачёркивается, включённое подсвечивается мятой
  const row = (y: number, label: string, on: number, dim: number, strike: number) => (
    <div style={{position: 'absolute', left: 120, right: 120, top: y, height: 126, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
      <span style={{position: 'relative', fontFamily: SANS, fontWeight: 800, fontSize: 84, letterSpacing: '-0.03em', color: DARK, opacity: dim,
        transform: `translateX(${strike * -10}px)`}}>
        {label}
        <span style={{position: 'absolute', left: -6, right: 0, top: '54%', height: 6, borderRadius: 3, background: '#9AA0A6', transformOrigin: 'left center', transform: `scaleX(${strike})`}} />
      </span>
      <Toggle on={on} />
    </div>
  );
  return (
    <>
      {away < 1 ? (
        <div style={{position: 'absolute', inset: 0, opacity: pin * (1 - away), transform: `translateY(${(1 - pin) * 60 - away * 180}px)`}}>
          {row(400, 'Программирование', offCode, 0.3 + 0.7 * offCode, 1 - offCode)}
          <div style={{position: 'absolute', left: 120, right: 120, top: 590, height: 3, background: 'rgba(20,24,28,.12)'}} />
          {row(660, 'Личный опыт', onExp, 0.45 + 0.55 * onExp, 0)}
          {onExp > 0 ? (
            <div style={{position: 'absolute', left: 120, top: 786, width: (720 - 120) * onExp, height: 6, borderRadius: 3, background: MINT,
              boxShadow: '0 0 22px rgba(61,237,195,.6)'}} />
          ) : null}
        </div>
      ) : null}
      {track > 0 ? (
        <div style={{position: 'absolute', inset: 0, opacity: track}}>
          <div style={{position: 'absolute', left: TX + D / 2, top: TY + D / 2 - 2, width: (N - 1) * (D + GAP) * track, height: 4, borderRadius: 2, background: 'rgba(20,24,28,.18)'}} />
          {/* пройденный путь наливается мятой */}
          <div style={{position: 'absolute', left: TX + D / 2, top: TY + D / 2 - 3, width: head * (D + GAP), height: 6, borderRadius: 3, background: MINT,
            boxShadow: '0 0 20px rgba(61,237,195,.55)'}} />
          {Array.from({length: N}, (_, i) => {
            const a = k(t, at(83) + i * 0.05, at(83) + 0.35 + i * 0.05, E.pop);
            const passed = Math.max(0, Math.min(1, head - i + 1));
            const hit = Math.max(0, 1 - Math.abs(head - i) * 2.2);       // всплеск под бегунком
            const lit = i === 0 ? Math.max(m1, passed * 0.9) : passed;
            const on = i === 0 && m1 > 0.5;
            return (
              <div key={i} style={{position: 'absolute', left: TX + i * (D + GAP), top: TY - 16 * hit, width: D, height: D, borderRadius: D / 2,
                transform: `scale(${(0.5 + 0.5 * a) * (1 + 0.16 * (i === 0 ? m1 : 0) + 0.18 * hit)})`,
                opacity: a, display: 'grid', placeItems: 'center', background: on ? MINT : `rgba(255,255,255,${0.85 + 0.15 * lit})`,
                boxShadow: `0 ${6 + 10 * hit}px ${16 + 14 * hit}px rgba(0,0,0,.14), inset 0 0 0 3px rgba(61,237,195,${on ? 0 : 0.85 * lit}), 0 0 ${34 * hit}px rgba(61,237,195,${0.5 * hit})`,
                fontFamily: NUM, fontWeight: 800, fontSize: 44, color: on ? MINT_INK : lit > 0.4 ? '#12A57F' : '#6C7176'}}>{String(i + 1).padStart(2, '0')}</div>
            );
          })}
          {m1 > 0 ? (
            <div style={{position: 'absolute', left: 150, top: 1030, width: 1140, height: 330, borderRadius: 40, background: '#FFFFFF', opacity: Math.min(1, m1 * 1.5),
              transformOrigin: `${TX + D / 2 - 150}px ${TY + D / 2 - 1030}px`, transform: `scale(${0.62 + 0.38 * m1})`,
              boxShadow: `0 30px 60px rgba(0,0,0,.18), 0 0 ${60 * (1 - sweep)}px rgba(61,237,195,${0.45 * (1 - sweep)})`, overflow: 'hidden'}}>
              {/* каркас лендинга собирается сам: шапка → строки → кнопка */}
              <div style={{position: 'absolute', left: 36, top: 36, width: 300, height: 258, borderRadius: 22, background: '#F1EFE9', overflow: 'hidden'}}>
                <div style={{height: 28, background: '#E1DED6', transformOrigin: 'left center', transform: `scaleX(${bar})`}} />
                <div style={{padding: 20}}>
                  <div style={{width: `${80 * ln1}%`, height: 24, borderRadius: 6, background: DARK}} />
                  <div style={{width: `${55 * ln2}%`, height: 24, borderRadius: 6, background: DARK, marginTop: 10}} />
                  <div style={{width: 140, height: 44, borderRadius: 22, background: MINT, marginTop: 24, transform: `scale(${btn})`, transformOrigin: 'left center',
                    boxShadow: `0 0 ${26 * btn}px rgba(61,237,195,.6)`}} />
                </div>
              </div>
              <div style={{position: 'absolute', left: 380, top: 66, right: 40, opacity: ttl, transform: `translateY(${(1 - ttl) * 22}px)`}}>
                <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 52, color: '#12A57F'}}>Модуль 1</div>
                <div style={{marginTop: 14, fontFamily: SANS, fontWeight: 800, fontSize: 76, lineHeight: 1.05, letterSpacing: '-0.03em', color: DARK}}>первый лендинг<br />за вечер</div>
              </div>
              {sweep > 0 && sweep < 1 ? (
                <div style={{position: 'absolute', top: 0, bottom: 0, left: `${-30 + 130 * sweep}%`, width: '26%', transform: 'skewX(-14deg)',
                  background: 'linear-gradient(90deg, rgba(61,237,195,0), rgba(61,237,195,.35), rgba(61,237,195,0))'}} />
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
};
export const a6Cursor = (): {pts: Pt[]; clicks: number[]} => ({
  pts: [[29.7, 1350, 1500], [at(78) + 0.05, 1180, 465], [at(78) + 0.5, 1180, 465], [at(81) - 0.1, 1180, 725], [at(81) + 0.45, 1180, 725],
    [at(83) + 0.45, TX + D / 2, TY + D / 2 + 96], [M1 - 0.2, TX + D / 2, TY + D / 2 + 96], [M1 + 0.4, TX + D / 2, TY + D / 2], [35.1, 1330, 1350]],
  clicks: [at(78) + 0.12, at(81) + 0.02, M1],
});

// ——— 07 · рост: профессия перелистывается, чип «пользователь ChatGPT» курсор тянет за угол — он вырастает в «эксперта с агентами» ———
const JOBS = ['маркетолог', 'тренер', 'логист', 'юрист', 'в своём деле'];
const FLIP0 = at(93), STEP = 0.36;
const SMALL = {label: 'пользователь ChatGPT', size: 50, x: 210, y: 1130, h: 126};
const BIGL = {label: 'эксперт с агентами', size: 84, x: 210, y: 560, h: 210};
// Ширина считается по реальному тексту (иначе слово вылезает за подложку, правка Александра 20.09).
const boxOf = (label: string, size: number, h: number, x: number, y: number) => {
  const icon = h * 0.55, pad = h * 0.3, gap = h * 0.22;
  const w = textWidth(label, fontSpec(800, size, SANS), size, -0.03) + pad * 2 + icon + gap;
  return {x, y, w, h, icon, pad, gap};
};
export const A7Growth: React.FC<{t: number}> = ({t}) => {
  const ready = useFontsReady([fontSpec(800, SMALL.size, SANS), fontSpec(800, BIGL.size, SANS)]);
  const card = k(t, 35.7, 36.2, E.out);
  const away = k(t, at(107) - 0.35, at(107) + 0.05, E.inOut);   // профессии держатся, пока не начнётся рост чипа
  const fi = t < FLIP0 ? 0 : Math.min(JOBS.length - 1, 1 + Math.floor((t - FLIP0) / STEP));
  const fp = fi === 0 ? 1 : Math.min(1, (t - FLIP0 - (fi - 1) * STEP) / 0.16);
  const chip = k(t, at(105) - 0.1, at(105) + 0.4, E.pop);
  const grow = k(t, at(107) - 0.05, at(108) + 0.45, E.inOut);
  const pulse = k(t, at(111) - 0.05, at(111) + 0.3) * (1 - k(t, at(113) + 0.3, at(114) + 0.2));
  const draw = k(t, at(107) - 0.1, at(108) + 0.35, E.inOut) * (1 - k(t, at(108) + 0.7, at(108) + 1.3, E.inOut));
  if (!ready) return null;
  const A = boxOf(SMALL.label, SMALL.size, SMALL.h, SMALL.x, SMALL.y), B = boxOf(BIGL.label, BIGL.size, BIGL.h, BIGL.x, BIGL.y);
  const box = {x: A.x + (B.x - A.x) * grow, y: A.y + (B.y - A.y) * grow, w: A.w + (B.w - A.w) * grow, h: A.h + (B.h - A.h) * grow};
  const big = grow > 0.5;
  const size = SMALL.size + (BIGL.size - SMALL.size) * grow, icon = A.icon + (B.icon - A.icon) * grow, pad = A.pad + (B.pad - A.pad) * grow;
  return (
    <>
      {draw > 0 ? (
        <svg width={1440} height={2560} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <path d={`M${A.x + A.w / 2},${A.y - 26} C${A.x + A.w / 2},${A.y - 300} ${B.x + B.w / 2},${B.y + B.h + 320} ${B.x + B.w / 2},${B.y + B.h + 30}`}
            fill="none" stroke={MINT} strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray={`${draw} 1`}
            style={{filter: 'drop-shadow(0 0 14px rgba(61,237,195,.5))'}} />
        </svg>
      ) : null}
      {away < 1 ? (
        <div style={{position: 'absolute', inset: 0, opacity: card * (1 - away), transform: `translateY(${(1 - card) * 50 - away * 140}px)`}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: 470, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 59, color: DIM}}>ты уже силён:</div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 610, height: 170}}>
            {/* профессия перелистывается коротким подъёмом с растворением — слово не может дойти до подписи сверху */}
            {[fi - 1, fi].filter((i) => i >= 0).map((i) => (
              <div key={i} style={{position: 'absolute', left: 0, right: 0, top: 0, height: 170, lineHeight: '170px', textAlign: 'center',
                transform: `translateY(${i === fi ? (1 - fp) * 46 : -fp * 46}px)`, opacity: i === fi ? fp : 1 - fp,
                fontFamily: SANS, fontWeight: 800, fontSize: 118, letterSpacing: '-0.035em',
                color: i === JOBS.length - 1 ? MINT : INK, textShadow: textDepth}}>{JOBS[i]}</div>
            ))}
          </div>
        </div>
      ) : null}
      {chip > 0 ? (
        <div style={{position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, opacity: Math.min(1, chip * 2),
          transform: `scale(${(0.85 + 0.15 * Math.min(1, chip)) * (1 + 0.04 * pulse)})`, transformOrigin: 'left top'}}>
          <div style={{position: 'absolute', inset: 0, borderRadius: box.h / 2, background: big ? MINT : 'rgba(255,255,255,.08)',
            boxShadow: big ? `0 0 ${26 + 30 * pulse}px rgba(61,237,195,.4), inset 0 2px 0 rgba(255,255,255,.5)` : 'inset 0 0 0 3px rgba(255,255,255,.2)'}} />
          <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: A.gap + (B.gap - A.gap) * grow, padding: `0 ${pad}px`}}>
            <span style={{width: icon, height: icon, borderRadius: '50%', background: '#FFFFFF', display: 'grid', placeItems: 'center', flex: 'none'}}>
              {big ? <Mark name="claude" size={icon * 0.62} /> : <Mark name="openai" size={icon * 0.62} color="#101214" />}
            </span>
            <span style={{fontFamily: SANS, fontWeight: 800, fontSize: size, letterSpacing: '-0.03em', color: big ? MINT_INK : INK, whiteSpace: 'nowrap'}}>
              {big ? BIGL.label : SMALL.label}
            </span>
          </div>
          {grow > 0 && grow < 1 ? <div style={{position: 'absolute', left: box.w - 14, top: box.h - 14, width: 28, height: 28, background: '#FFFFFF', border: `4px solid ${BLUE.hex}`, boxSizing: 'border-box'}} /> : null}
        </div>
      ) : null}
    </>
  );
};
export const a7Cursor = (): {pts: Pt[]; clicks: number[]} => {
  const A = {x: SMALL.x, y: SMALL.y, w: 900, h: SMALL.h}, B = {x: BIGL.x, y: BIGL.y, w: 1080, h: BIGL.h};
  return {
    pts: [[35.6, 1340, 1500], [at(105) + 0.2, A.x + A.w, A.y + A.h], [at(107) - 0.05, A.x + A.w, A.y + A.h],
      [at(108) + 0.45, B.x + B.w, B.y + B.h], [at(113), B.x + B.w - 100, B.y + B.h + 120], [44.4, 1340, 1400]],
    clicks: [at(107)],
  };
};
