import {Img, staticFile} from 'remotion';
import {textDepth} from '../../../ds/tokens';
import {CapsuleLine} from '../../../kit/liquid/CapsuleLine';
import {GlassSurface, LiquidPanel} from '../../../kit/liquid/LiquidPanel';
import {Object25D} from '../../../kit/liquid/Object25D';
import {Chip, E, k, Logo, Mark, NUM, SANS} from '../../montage/parts';
import {BrowserWindow, FitnessApp, PhoneFrame, UI} from '../ui';
import {at} from '../words';
import {BLUE, DIM, INK, MINT, MINT_INK, ORANGE, RED, type Pt} from './canvas';
import {Hourglass} from './Hourglass';

// Листы 08–12: продукты агента (камера по плиткам), кейс обучения, подарок с роликами на орбите, две стороны, призыв.

// ——— 08 · продукты агента: карусель карточек — каждая приезжает в центр на своём слове ———
export const CARDW = 520, CARDH = 740, GAPX = 70, STEP = CARDW + GAPX;
const PROMPT = 'Собери мой продукт целиком';
const WORD = [at(125), at(126), at(127), at(130)];
export const tileCenter = (i: number) => ({x: 720, y: 980});
const Slide: React.FC<{i: number; active: number; label: string; children: React.ReactNode}> = ({i, active, label, children}) => {
  const d = i - active;                         // насколько карточка далеко от центра
  const sc = 1 - Math.min(0.22, Math.abs(d) * 0.18);
  const dim = 1 - Math.min(0.65, Math.abs(d) * 0.5);
  const near = Math.max(0, 1 - Math.abs(d) * 2);          // карточка выходит в центр: подъём и пробегающий блик
  return (
    <div style={{position: 'absolute', left: 720 - CARDW / 2 + d * STEP, top: 980 - CARDH / 2, width: CARDW, height: CARDH, borderRadius: 34, overflow: 'hidden',
      transform: `translateY(${-20 * near}px) scale(${sc + 0.03 * near})`, opacity: dim, backdropFilter: 'blur(16px) saturate(1.25)', WebkitBackdropFilter: 'blur(16px) saturate(1.25)',
      boxShadow: Math.abs(d) < 0.5 ? `0 0 0 3px rgba(${BLUE.rgb},.8), 0 0 60px rgba(${BLUE.rgb},.35), 0 30px 70px rgba(0,0,0,.5)` : '0 20px 50px rgba(0,0,0,.45)'}}>
      <GlassSurface radius={34} tone="dark" fill={0.55} moon={0.3} />
      <div style={{position: 'absolute', left: 26, top: 16, fontFamily: SANS, fontWeight: 800, fontSize: 52, letterSpacing: '-0.03em', color: INK, textShadow: textDepth, whiteSpace: 'nowrap'}}>{label}</div>
      <div style={{position: 'absolute', left: 18, right: 18, top: 96, bottom: 18, borderRadius: 22, overflow: 'hidden'}}>{children}</div>
      {near > 0.02 && near < 0.98 ? (
        <div style={{position: 'absolute', top: -30, bottom: -30, left: `${-40 + 140 * near}%`, width: '40%', transform: 'skewX(-16deg)', pointerEvents: 'none',
          opacity: Math.min(1, near * (1 - near) * 4), background: `linear-gradient(90deg, rgba(${BLUE.rgb},0), rgba(${BLUE.rgb},.35), rgba(${BLUE.rgb},0))`}} />
      ) : null}
    </div>
  );
};
export const A8Products: React.FC<{t: number}> = ({t}) => {
  const panel = k(t, 44.7, 45.15, E.out);
  const typedN = Math.round(PROMPT.length * k(t, at(121) - 0.05, at(124) + 0.25, (v) => v));
  const send = k(t, at(124) + 0.3, at(124) + 0.5) * (1 - k(t, at(124) + 0.5, at(124) + 0.85));
  // позиция карусели: едет к нужной карточке на каждом слове
  const active = WORD.reduce((a, w, i) => a + (i === 0 ? 0 : k(t, w - 0.22, w + 0.2, E.inOut)), 0);
  const shown = k(t, WORD[0] - 0.35, WORD[0] + 0.15, E.out);
  const tk = (i: number) => k(t, WORD[i] - 0.2, WORD[i] + 1.0, (v) => v);
  return (
    <>
      <div style={{position: 'absolute', inset: 0, opacity: panel, transform: `translateY(${(1 - k(t, WORD[0] - 0.35, WORD[0] + 0.05, E.inOut)) * 360}px)`}}>
        <LiquidPanel x={110} y={340} w={1220} h={170} r="pill" material="frosted" level={3} moon={0.5} sheen={k(t, at(124) + 0.2, at(124) + 0.9)} name="prompt">
          <div style={{position: 'absolute', left: 48, top: 0, bottom: 0, right: 170, display: 'flex', alignItems: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 50,
            color: typedN ? INK : 'rgba(242,241,238,.45)', whiteSpace: 'nowrap'}}>
            {typedN ? PROMPT.slice(0, typedN) : 'Спроси агента…'}
            <span style={{display: 'inline-block', width: 5, height: 58, marginLeft: 6, background: MINT, opacity: typedN < PROMPT.length && Math.floor(t * 3) % 2 === 0 ? 1 : 0.15}} />
          </div>
          <div style={{position: 'absolute', right: 30, top: 25, width: 120, height: 120, borderRadius: 60, background: MINT, display: 'grid', placeItems: 'center',
            transform: `scale(${1 - 0.12 * send})`, boxShadow: `0 0 ${16 + 46 * send}px rgba(61,237,195,${0.35 + 0.5 * send})`}}>
            <svg width={52} height={52} viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7" fill="none" stroke={MINT_INK} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        </LiquidPanel>
      </div>
      {shown > 0 ? (
        <div style={{position: 'absolute', inset: 0, opacity: shown}}>
          <Slide i={0} active={active} label="Сайт">
            {/* окно по пропорции скриншота (2560×1640) — страница видна целиком, без обрезки по бокам */}
            <div style={{position: 'absolute', left: 0, right: 0, top: 126}}>
              <BrowserWindow w={484} h={374} url="onai.academy">
                <Img src={staticFile('r22/site-hero.png')} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center'}} />
              </BrowserWindow>
            </div>
          </Slide>
          <Slide i={1} active={active} label="Приложение">
            <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(60% 80% at 50% 45%, rgba(61,237,195,.16), transparent)'}} />
            <div style={{position: 'absolute', left: 484 / 2 - 121, top: 6, width: 440, height: 906, transformOrigin: '0 0', transform: 'scale(0.55)'}}>
              <PhoneFrame w={440} light><FitnessApp k={tk(1)} food={0} act={0} /></PhoneFrame>
            </div>
          </Slide>
          <Slide i={2} active={active} label="AI-менеджер">
            <div style={{position: 'absolute', inset: 0, background: 'rgba(8,10,12,.55)', display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 18px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 10, fontFamily: SANS, fontWeight: 800, fontSize: 24, color: UI.text}}>
                <span style={{width: 36, height: 36, borderRadius: 18, background: `linear-gradient(135deg, ${MINT}, #0F6E5A)`}} />менеджер · <span style={{color: MINT}}>онлайн</span>
              </div>
              {[['l', 'Сколько стоит обучение?', 0.1], ['r', 'Расскажу! Какой у вас опыт?', 0.5], ['l', 'Веду студию, кода не знаю', 0.9],
                ['r', 'Подходит: старт с модуля 1', 1.3], ['l', 'Давайте программу', 1.7]].map(([side, txt, d], i) => {
                const o = k(t, WORD[2] + (d as number), WORD[2] + (d as number) + 0.3);
                if (o <= 0) return null;
                return (
                  <div key={i} style={{alignSelf: side === 'l' ? 'flex-start' : 'flex-end', maxWidth: '88%', padding: '10px 16px',
                    borderRadius: side === 'l' ? '8px 20px 20px 20px' : '20px 8px 20px 20px', background: side === 'l' ? 'rgba(255,255,255,.1)' : MINT,
                    color: side === 'l' ? UI.text : MINT_INK, fontFamily: SANS, fontWeight: 700, fontSize: 24, opacity: o, transform: `translateY(${(1 - o) * 10}px)`}}>{txt as string}</div>
                );
              })}
            </div>
          </Slide>
          <Slide i={3} active={active} label="Автоматизации">
            <div style={{position: 'absolute', inset: 0, background: 'rgba(8,10,12,.55)'}}>
              <svg width={484} height={626} style={{position: 'absolute', left: 0, top: 0}}>
                {[[242, 118, 242, 176], [242, 264, 242, 322], [242, 410, 242, 468]].map(([x1, y1, x2, y2], i) => {
                  const d = k(t, WORD[3] + 0.2 + i * 0.25, WORD[3] + 0.5 + i * 0.25, (v) => v);
                  return <line key={i} x1={x1} y1={y1} x2={x1} y2={y1 + (y2 - y1) * d} stroke={MINT} strokeWidth={4} strokeDasharray="10 8" strokeLinecap="round" />;
                })}
              </svg>
              {[['заявка', 34, false], ['агент', 180, true], ['CRM', 326, false], ['отчёт', 472, false]].map(([l, y, m], i) => (
                <div key={l as string} style={{position: 'absolute', left: 242 - 110, top: y as number, width: 220, height: 84, borderRadius: 18, display: 'grid', placeItems: 'center',
                  opacity: k(t, WORD[3] + i * 0.25, WORD[3] + 0.3 + i * 0.25), background: m ? MINT : 'rgba(255,255,255,.1)', color: m ? MINT_INK : UI.text,
                  boxShadow: m ? '0 0 28px rgba(61,237,195,.45)' : 'inset 0 0 0 2px rgba(255,255,255,.14)', fontFamily: SANS, fontWeight: 800, fontSize: 30}}>{l as string}</div>
              ))}
            </div>
          </Slide>
        </div>
      ) : null}
    </>
  );
};
export const a8Cursor = (): {pts: Pt[]; clicks: number[]} => ({
  pts: [[44.9, 1350, 1450], [at(121) - 0.1, 560, 430], [at(124) + 0.2, 980, 430], [at(124) + 0.45, 1290, 420],
    [WORD[0] + 0.3, 1150, 980], [WORD[1] + 0.2, 1150, 980], [WORD[2] + 0.2, 1150, 980], [WORD[3] + 0.2, 1150, 980], [52.0, 1340, 1420]],
  clicks: [at(124) + 0.42],
});

// ——— 09 · внутри обучения: стеклянная книга, из неё поднимаются материалы, ниже стек ———
const DOCS = [{label: 'Гайды', x: 120, rot: -8, c: MINT}, {label: 'Промпты', x: 440, rot: -3, c: '#FFB27E'},
  {label: 'Шаблоны', x: 760, rot: 3, c: ORANGE}, {label: 'Видеоурок', x: 1080, rot: 8, c: BLUE.hex, video: true}];
const STACK = ['claude', 'github', 'supabase', 'vercel'];
export const A9Inside: React.FC<{t: number}> = ({t}) => (
  <>
    {DOCS.map((d, i) => {
      const t0 = at(134) - 0.15 + i * 0.12;
      const r = k(t, t0, t0 + 0.6, E.pop);
      if (r <= 0) return null;
      const play = k(t, at(136) + 0.2, at(136) + 3.2, (v) => v);
      const land = k(t, t0 + 0.42, t0 + 1.02, E.inOut);                       // блик пробегает по карточке при посадке
      const kick = k(t, t0 + 0.35, t0 + 0.5) * (1 - k(t, t0 + 0.5, t0 + 0.95, E.out));  // мягкий отскок
      return (
        <div key={d.label} style={{position: 'absolute', left: d.x, top: 476 + (1 - r) * 420 - 26 * kick, width: 250, height: 330, borderRadius: 24, opacity: Math.min(1, r * 3),
          transform: `rotate(${d.rot * r}deg) scale(${1 + 0.05 * kick})`, background: d.video ? '#12161A' : 'linear-gradient(180deg, #FFFFFF, #EEF0EE)',
          boxShadow: d.video ? `0 0 0 3px rgba(${BLUE.rgb},.8), 0 30px 60px rgba(0,0,0,.5)` : '0 30px 60px rgba(0,0,0,.45)', overflow: 'hidden'}}>
          {d.video ? (
            <>
              {/* карточка «видеоурок»: кадр урока, кнопка и дорожка проигрывания */}
              <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 196, background: 'linear-gradient(160deg, #1B2A36, #101A22)'}}>
                <div style={{position: 'absolute', left: 18, top: 18, width: 120, height: 12, borderRadius: 6, background: 'rgba(255,255,255,.22)'}} />
                <div style={{position: 'absolute', left: 18, top: 40, width: 80, height: 12, borderRadius: 6, background: 'rgba(255,255,255,.14)'}} />
                <div style={{position: 'absolute', left: 125 - 34, top: 98 - 34, width: 68, height: 68, borderRadius: 34, background: BLUE.hex, display: 'grid', placeItems: 'center',
                  boxShadow: `0 0 26px rgba(${BLUE.rgb},.7)`}}>
                  <svg width={26} height={26} viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="#0B1116" /></svg>
                </div>
              </div>
              <div style={{position: 'absolute', left: 18, right: 18, top: 212, height: 8, borderRadius: 4, background: 'rgba(255,255,255,.16)'}}>
                <div style={{width: `${play * 100}%`, height: '100%', borderRadius: 4, background: BLUE.hex}} />
              </div>
              <div style={{position: 'absolute', left: 18, top: 244, fontFamily: SANS, fontWeight: 800, fontSize: 40, letterSpacing: '-0.03em', color: INK}}>Видеоурок</div>
            </>
          ) : (
            <>
              <div style={{position: 'absolute', left: 22, top: 22, width: 56, height: 56, borderRadius: 16, background: d.c, boxShadow: `0 8px 20px ${d.c}66`}} />
              <div style={{position: 'absolute', left: 22, top: 100, fontFamily: SANS, fontWeight: 800, fontSize: 46, letterSpacing: '-0.03em', color: '#101214'}}>{d.label}</div>
              {[0, 1, 2].map((j) => <div key={j} style={{position: 'absolute', left: 22, top: 180 + j * 26, width: `${70 - j * 14}%`, height: 11, borderRadius: 6, background: '#D5D9DC'}} />)}
            </>
          )}
          {land > 0 && land < 1 ? (
            <div style={{position: 'absolute', top: -20, bottom: -20, left: `${-40 + 150 * land}%`, width: '45%', transform: 'skewX(-16deg)', pointerEvents: 'none',
              background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.45), rgba(255,255,255,0))'}} />
          ) : null}
        </div>
      );
    })}
    <Object25D src="objects/book.webp" x={720} y={1030} size={580} t={t} at={52.5} sheenAt={53.9} moon={0.5} float={10} />
    <div style={{position: 'absolute', left: 0, right: 0, top: 1230, display: 'flex', justifyContent: 'center', gap: 40}}>
      {STACK.map((n, i) => {
        const a = k(t, at(136) - 0.1 + i * 0.1, at(136) + 0.3 + i * 0.1, E.pop);
        if (a <= 0) return null;
        return (
          <div key={n} style={{width: 140, height: 140, borderRadius: 38, display: 'grid', placeItems: 'center', opacity: a, transform: `scale(${0.6 + 0.4 * a})`,
            background: '#F4F5F2', boxShadow: 'inset 0 2px 0 rgba(255,255,255,.5), 0 14px 30px rgba(0,0,0,.35)'}}>
            {n === 'claude' ? <Mark name="claude" size={86} /> : n === 'supabase' ? <Logo name="supabase" size={86} /> : <Mark name={n === 'github' ? 'github-dark' : n} size={78} color="#101214" />}
          </div>
        );
      })}
    </div>
    <Chip t={t} at={at(138) - 0.1} x={720} y={382} label="4 года опыта" size={60} glass={{material: 'solid', tone: 'mint', moon: 0.6}} />
  </>
);
export const a9Cursor = (): {pts: Pt[]; clicks: number[]} => ({
  pts: [[52.4, 1350, 1450], [at(134), 720, 900], [at(136) + 0.3, 720, 1300], [55.6, 1330, 1400]], clicks: [at(134) - 0.1],
});

// ——— 10 · подарок: коробка, вокруг по орбите его ролики, на «этот ролик» вперёд выходит кадр ———
const COVERS = ['r19', 'r20', 'r7', 'r13', 'r14', 'r16', 'r21'];
const ORB = {cx: 720, cy: 1000, rx: 495, ry: 145};
const SELF = at(151);
export const A10Gift: React.FC<{t: number}> = ({t}) => {
  const ring = k(t, at(143) - 0.1, at(143) + 0.9, E.out);
  const self = k(t, SELF - 0.15, SELF + 0.45, E.out);
  const open = t >= SELF - 0.2;
  const items = COVERS.map((c, i) => {
    const a = (i / COVERS.length) * Math.PI * 2 + t * 0.5;
    const z = Math.sin(a);
    return {c, x: ORB.cx + Math.cos(a) * ORB.rx * (0.6 + 0.4 * ring), y: ORB.cy + z * ORB.ry, z, s: 0.72 + 0.28 * (z + 1) / 2};
  });
  const cover = (it: typeof items[number]) => {
    const w = 205 * it.s, h = 364 * it.s;
    return (
      <div key={it.c} style={{position: 'absolute', left: it.x - w / 2, top: it.y - h / 2 - 80, width: w, height: h, borderRadius: 20 * it.s, overflow: 'hidden',
        opacity: ring * (0.65 + 0.35 * (it.z + 1) / 2) * (1 - 0.5 * self), filter: `brightness(${0.7 + 0.35 * (it.z + 1) / 2})`,
        boxShadow: '0 0 0 3px rgba(255,255,255,.3), 0 20px 40px rgba(0,0,0,.5)'}}>
        <Img src={staticFile(`r22/orbit/${it.c}.jpg`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </div>
    );
  };
  return (
    <>
      {items.filter((i) => i.z < 0).map(cover)}
      <Object25D src={open ? 'objects/gift-open.webp' : 'objects/gift-box.webp'} x={720} y={960} size={680} t={t} at={56.5} sheenAt={57.4} moon={0.6} float={12} />
      {items.filter((i) => i.z >= 0).map(cover)}
      {self > 0 ? (
        <div style={{position: 'absolute', left: 720 - 170, top: 520 + (1 - self) * 380, width: 340, height: 604, borderRadius: 36, overflow: 'hidden',
          transformOrigin: '50% 100%', transform: `scale(${0.35 + 0.65 * self})`, opacity: Math.min(1, self * 2),
          boxShadow: `0 0 0 5px ${MINT}, 0 0 70px rgba(61,237,195,.55), 0 40px 80px rgba(0,0,0,.6)`}}>
          <Img src={staticFile('r22/orbit/r22-self.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        </div>
      ) : null}
      <Chip t={t} at={at(145) - 0.1} out={SELF - 0.3} x={720} y={372} label="система монтажа — в подарок" size={59} glass={{material: 'frosted', moon: 0.6}} />
      <Chip t={t} at={SELF + 0.1} x={720} y={1220} label="этот ролик" size={64} glass={{material: 'solid', tone: 'mint', moon: 0.6}} />
    </>
  );
};

// ——— 11 · стороны: «руками» тревожно мигает красным с грустным смайликом, «с агентом» горит синим неоном ———
export const A11Sides: React.FC<{t: number}> = ({t}) => {
  const l = k(t, 60.3, 60.8, E.out), r = k(t, 60.55, 61.05, E.out);
  const pick = k(t, at(159) - 0.05, at(160) + 0.3, E.inOut);
  const blink = 0.55 + 0.45 * Math.abs(Math.sin(t * 3.4)); // тревожное мигание левой стороны
  return (
    <>
      <div style={{position: 'absolute', left: 300, top: 368}}>
        <Hourglass w={840} h={700} x={420} y={350} scale={0.55} flip={1} flow={0.97} spin={0.3 + t * 0.1} />
      </div>
      <div style={{position: 'absolute', inset: 0, opacity: l, transform: `translateX(${-(1 - l) * 160}px)`}}>
        <LiquidPanel x={80} y={720} w={600} h={520} r={52} material="frosted" level={3} moon={0.2} name="hands"
          style={{boxShadow: `0 0 0 ${3 + 3 * blink}px rgba(${RED.rgb},${0.45 + 0.5 * blink * (0.4 + 0.6 * pick)}), 0 0 ${40 + 70 * blink * pick}px rgba(${RED.rgb},${0.2 + 0.4 * pick}), 0 40px 90px rgba(0,0,0,.5)`}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: 40, height: 260}}>
            <Object25D src="objects/sad-face.webp" x={300} y={150} size={260} t={t} at={60.4} float={8} tilt={3} shadow={false} />
          </div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 330, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 92, letterSpacing: '-0.03em',
            color: pick > 0.4 ? RED.hex : '#C9CDD0', textShadow: textDepth}}>руками</div>
        </LiquidPanel>
      </div>
      <div style={{position: 'absolute', inset: 0, opacity: r, transform: `translateX(${(1 - r) * 160}px) scale(${1 + 0.04 * pick})`, transformOrigin: '1060px 980px'}}>
        <LiquidPanel x={760} y={720} w={600} h={520} r={52} material="frosted" level={3} moon={0.8} name="agent"
          style={{boxShadow: `0 0 0 4px rgba(${BLUE.rgb},${0.5 + 0.45 * pick}), 0 0 ${40 + 70 * pick}px rgba(${BLUE.rgb},${0.25 + 0.35 * pick}), 0 40px 90px rgba(0,0,0,.5)`}}>
          <div style={{position: 'absolute', left: 300 - 95, top: 70, width: 190, height: 190, borderRadius: '50%', display: 'grid', placeItems: 'center',
            background: 'radial-gradient(circle at 35% 30%, rgba(214,255,245,.95), rgba(61,237,195,.9) 45%, rgba(15,110,90,.95) 100%)', boxShadow: '0 0 50px rgba(61,237,195,.6)'}}>
            <Mark name="claude" size={110} color="#FFFFFF" />
          </div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 330, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 92, letterSpacing: '-0.03em', color: INK, textShadow: textDepth}}>с агентом</div>
        </LiquidPanel>
      </div>
      <div style={{position: 'absolute', inset: 0, opacity: k(t, at(157) - 0.1, at(157) + 0.2)}}>
        <CapsuleLine t={t} words={['На', 'какой', 'ты', 'стороне?']} stops={[{at: at(159), i: 1, j: 3}]}
          style={{family: SANS, weight: 800, size: 88, x: 720, y: 1300, align: 'center', tracking: -0.02}} textShadow={textDepth}
          capsule={{material: 'solid', tone: 'mint', moon: 0.5}} />
      </div>
    </>
  );
};
export const a11Cursor = (): {pts: Pt[]; clicks: number[]} => ({
  pts: [[60.4, 300, 1500], [at(159) - 0.1, 1060, 980], [at(160) + 0.4, 1060, 980], [63.2, 1340, 1420]], clicks: [at(159) + 0.05],
});

// ——— 12 · гоу: мок Reels — курсор жмёт «комментарии», снизу выезжает лист комментариев, в поле набирается «гоу» ———
const GO = at(162);
const SHEET = {x: 240, w: 960, top: 700, bottom: 1450};
export const A12Cta: React.FC<{t: number}> = ({t}) => {
  const open = k(t, GO - 0.55, GO - 0.15, E.out);        // лист комментариев выезжает
  const typed = Math.round(3 * k(t, GO - 0.05, GO + 0.35, (v) => v));
  const send = k(t, GO + 0.55, GO + 0.75) * (1 - k(t, GO + 0.75, GO + 1.0));
  const posted = k(t, GO + 0.7, GO + 1.0, E.pop);
  const dmIn = k(t, at(165) - 0.2, at(165) + 0.35, E.out);
  const fin = k(t, at(175) - 0.25, at(175) + 0.3, E.inOut);
  const doc = k(t, at(166) - 0.1, at(166) + 0.35, E.pop);
  const typing = k(t, at(169) - 0.1, at(169) + 0.1) * (1 - k(t, at(170) + 0.2, at(170) + 0.3));
  const reply = k(t, at(170) + 0.25, at(170) + 0.6, E.out);
  const icon = (y: number, d: string, label: string, hot: boolean) => (
    <div style={{position: 'absolute', left: 1080, top: y, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
      <svg width={74} height={74} viewBox="0 0 24 24" style={{filter: hot ? `drop-shadow(0 0 16px rgba(${BLUE.rgb},.9))` : 'none'}}>
        <path d={d} fill="none" stroke={hot ? BLUE.hex : INK} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span style={{fontFamily: SANS, fontWeight: 700, fontSize: 30, color: hot ? BLUE.hex : DIM}}>{label}</span>
    </div>
  );
  return (
    <>
      {dmIn < 1 ? (
        <div style={{position: 'absolute', inset: 0, opacity: 1 - dmIn, transform: `translateY(${-dmIn * 200}px)`}}>
          {/* мок ленты: подпись ролика и колонка кнопок справа */}
          <div style={{position: 'absolute', left: 250, top: 452, fontFamily: SANS, fontWeight: 800, fontSize: 56, color: INK, textShadow: textDepth}}>onai.academy</div>
          <div style={{position: 'absolute', left: 250, top: 532, fontFamily: SANS, fontWeight: 700, fontSize: 40, color: DIM}}>обучение вайбкодингу · 10 модулей</div>
          {icon(510, 'M12 21s-7-4.5-9-9a5 5 0 019-3 5 5 0 019 3c-2 4.5-9 9-9 9z', '128', false)}
          {icon(660, 'M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z', 'коммент', open > 0.05)}
          {icon(850, 'M4 12l16-8-6 16-2-6-8-2z', 'делиться', false)}
          {/* лист комментариев */}
          <div style={{position: 'absolute', left: SHEET.x, top: SHEET.top + (1 - open) * 900, width: SHEET.w, height: SHEET.bottom - SHEET.top, borderRadius: 44,
            background: 'linear-gradient(180deg, #FFFFFF, #F2F0EA)', opacity: open, boxShadow: '0 -20px 60px rgba(0,0,0,.45)', overflow: 'hidden'}}>
            <div style={{position: 'absolute', left: '50%', top: 18, width: 120, height: 8, marginLeft: -60, borderRadius: 4, background: '#CFCBC2'}} />
            <div style={{position: 'absolute', left: 0, right: 0, top: 46, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 44, color: '#15181B'}}>Комментарии</div>
            {/* чужие комментарии — лист не пустой */}
            {[['maria.kz', 'а с нуля реально?', 130], ['it.rustam', 'жду программу', 250]].map(([n, c, y]) => (
              <div key={n as string} style={{position: 'absolute', left: 40, top: (y as number) + (posted > 0 ? 170 : 0), right: 40, display: 'flex', gap: 18, alignItems: 'center', opacity: 0.55}}>
                <span style={{width: 70, height: 70, borderRadius: 35, flex: 'none', background: '#D9D5CC'}} />
                <span>
                  <span style={{display: 'block', fontFamily: SANS, fontWeight: 700, fontSize: 28, color: '#8A8F95'}}>{n as string}</span>
                  <span style={{display: 'block', fontFamily: SANS, fontWeight: 700, fontSize: 40, color: '#3C4045'}}>{c as string}</span>
                </span>
              </div>
            ))}
            {posted > 0 ? (
              <div style={{position: 'absolute', left: 40, top: 130, right: 40, display: 'flex', gap: 20, alignItems: 'center', opacity: posted, transform: `translateY(${(1 - posted) * 20}px)`}}>
                <span style={{width: 84, height: 84, borderRadius: 42, flex: 'none', background: 'linear-gradient(135deg, #FDF497, #FD5949 50%, #D6249F)'}} />
                <span>
                  <span style={{display: 'block', fontFamily: SANS, fontWeight: 700, fontSize: 32, color: '#6C7176'}}>ты · сейчас</span>
                  <span style={{display: 'block', fontFamily: SANS, fontWeight: 800, fontSize: 52, color: '#15181B'}}>гоу</span>
                </span>
              </div>
            ) : null}
            {/* поле ввода с курсором набора */}
            <div style={{position: 'absolute', left: 40, right: 40, bottom: 40, height: 140, borderRadius: 70, background: '#FFFFFF', border: '3px solid #DCD8D0',
              display: 'flex', alignItems: 'center', padding: '0 28px', gap: 22, boxShadow: '0 10px 30px rgba(0,0,0,.08)'}}>
              <span style={{width: 92, height: 92, borderRadius: 46, flex: 'none', background: 'linear-gradient(135deg, #FDF497, #FD5949 50%, #D6249F)'}} />
              <span style={{flex: 1, fontFamily: SANS, fontWeight: 800, fontSize: 56, color: typed ? '#15181B' : '#A7A39B', display: 'flex', alignItems: 'center'}}>
                {typed ? 'гоу'.slice(0, typed) : 'Добавить комментарий…'}
                <span style={{display: 'inline-block', width: 5, height: 60, marginLeft: 6, background: BLUE.hex, opacity: typed < 3 && Math.floor(t * 3) % 2 === 0 ? 1 : 0.12}} />
              </span>
              <span style={{width: 110, height: 92, borderRadius: 46, flex: 'none', display: 'grid', placeItems: 'center', background: typed === 3 ? BLUE.hex : '#E7E3DB',
                transform: `scale(${1 - 0.1 * send})`, boxShadow: typed === 3 ? `0 0 ${18 + 40 * send}px rgba(${BLUE.rgb},.55)` : 'none'}}>
                <svg width={46} height={46} viewBox="0 0 24 24"><path d="M4 12l16-8-6 16-2-6-8-2z" fill={typed === 3 ? '#0B1116' : '#B3AFA7'} /></svg>
              </span>
            </div>
          </div>
        </div>
      ) : null}
      {dmIn > 0 && fin < 1 ? (
        <div style={{position: 'absolute', inset: 0, opacity: dmIn * (1 - fin), transform: `translateY(${(1 - dmIn) * 120 - fin * 160}px)`}}>
          <LiquidPanel x={230} y={400} w={980} h={900} r={60} material="frosted" level={3} moon={0.7} name="dm">
            <div style={{position: 'absolute', left: 50, top: 40, right: 50, height: 110, display: 'flex', alignItems: 'center', gap: 22, borderBottom: '2px solid rgba(255,255,255,.1)',
              fontFamily: SANS, fontWeight: 800, fontSize: 59, color: INK}}>
              <Mark name="instagram" size={64} />Директ
            </div>
            <div style={{position: 'absolute', left: 46, top: 190, width: 700, borderRadius: '14px 44px 44px 44px', padding: '32px 36px', background: 'rgba(255,255,255,.1)',
              opacity: doc, transform: `translateY(${(1 - doc) * 30}px) scale(${0.9 + 0.1 * doc})`, transformOrigin: '0 0', display: 'flex', gap: 30, alignItems: 'center'}}>
              <div style={{width: 130, height: 160, borderRadius: 20, background: 'linear-gradient(160deg, #FFB27E, #FF7A2F)', display: 'grid', placeItems: 'center',
                fontFamily: NUM, fontWeight: 900, fontSize: 40, color: '#2A1206', boxShadow: '0 14px 30px rgba(255,122,47,.4)'}}>PDF</div>
              <div>
                <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 50, color: INK, lineHeight: 1.1}}>Программа обучения</div>
                <div style={{marginTop: 12, fontFamily: NUM, fontWeight: 700, fontSize: 42, color: MINT}}>10 модулей · 36 уроков</div>
              </div>
            </div>
            {typing > 0 ? (
              <div style={{position: 'absolute', left: 50, top: 470, padding: '28px 36px', borderRadius: '14px 44px 44px 44px', background: 'rgba(61,237,195,.18)', display: 'flex', gap: 14, opacity: typing}}>
                {[0, 1, 2].map((i) => <span key={i} style={{width: 22, height: 22, borderRadius: 11, background: MINT, opacity: 0.35 + 0.65 * Math.abs(Math.sin(t * 6 + i))}} />)}
              </div>
            ) : null}
            {reply > 0 ? (
              <div style={{position: 'absolute', left: 46, top: 470, width: 760, padding: '26px 32px', borderRadius: '14px 44px 44px 44px', background: MINT, opacity: reply,
                transform: `translateY(${(1 - reply) * 24}px)`, display: 'flex', alignItems: 'center', gap: 24}}>
                <span style={{width: 76, height: 76, flex: 'none', borderRadius: 38, background: MINT_INK, display: 'grid', placeItems: 'center', fontFamily: NUM, fontWeight: 900, fontSize: 30, color: MINT}}>AI</span>
                <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 48, color: MINT_INK, lineHeight: 1.15}}>Отвечу на все твои вопросы</span>
              </div>
            ) : null}
          </LiquidPanel>
        </div>
      ) : null}
      {fin > 0 ? (
        <div style={{position: 'absolute', inset: 0, opacity: fin, transform: `translateY(${(1 - fin) * 70}px)`}}>
          {/* заголовок впечатывается словами: штамп с перелётом и размытием */}
          <div style={{position: 'absolute', left: 0, right: 0, top: 480, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 62, color: DIM, textShadow: textDepth,
            opacity: k(t, at(175), at(175) + 0.25), transform: `scale(${1 + 0.18 * (1 - k(t, at(175), at(175) + 0.3, E.out))})`,
            filter: `blur(${(1 - k(t, at(175), at(175) + 0.22)) * 10}px)`}}>Добро пожаловать</div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 580, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 100, letterSpacing: '-0.04em', color: INK, textShadow: textDepth,
            display: 'flex', justifyContent: 'center', gap: 22}}>
            {['на', 'старт', 'обучения'].map((w, i) => {
              const a = k(t, at(177) + i * 0.16, at(177) + 0.32 + i * 0.16, E.out);
              return <span key={w} style={{opacity: a, transform: `scale(${1 + 0.3 * (1 - a)}) translateY(${(1 - a) * 16}px)`, filter: a < 1 ? `blur(${(1 - a) * 14}px)` : undefined}}>{w}</span>;
            })}
          </div>
          <div style={{position: 'absolute', inset: 0, opacity: k(t, at(180) - 0.12, at(180) + 0.18),
            transform: `scale(${1 + 0.12 * (1 - k(t, at(180) - 0.12, at(180) + 0.25, E.out))})`, transformOrigin: '720px 810px'}}>
            <CapsuleLine t={t} words={['по', 'вайбкодингу']} stops={[{at: at(181) - 0.05, i: 1}]}
              style={{family: SANS, weight: 800, size: 100, x: 720, y: 742, align: 'center', tracking: -0.04}} textShadow={textDepth}
              capsule={{material: 'solid', tone: 'mint', moon: 0.6}} />
          </div>
        </div>
      ) : null}
      {/* «гоу» закреплён с момента публикации комментария и до конца ролика */}
      <Chip t={t} at={GO + 1.0} x={720} y={332} label="напиши «гоу» в комментариях" icon="mark:instagram" size={50} glass={{material: 'frosted', moon: 0.6}} />
    </>
  );
};
export const a12Cursor = (): {pts: Pt[]; clicks: number[]} => ({
  pts: [[63.7, 1340, 1500], [GO - 0.6, 1117, 700], [GO - 0.25, 1247, 700], [GO - 0.05, 640, 1370], [GO + 0.4, 760, 1370],
    [GO + 0.65, 1120, 1370], [66.5, 900, 700], [69.0, 1330, 1400]],
  clicks: [GO - 0.5, GO + 0.6],
});
