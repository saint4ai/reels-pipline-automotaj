import {AbsoluteFill, Img, staticFile} from 'remotion';
import {textDepth} from '../../ds/tokens';
import {CapsuleLine} from '../../kit/liquid/CapsuleLine';
import {GlassEnv} from '../../kit/liquid/env';
import {GlyphText, holeBox, type GlyphJson, type GlyphPlace} from '../../kit/liquid/Glyph';
import G100K from '../../kit/liquid/glyphs/intertight-900-100K.json';
import {GlassSurface, LiquidPanel} from '../../kit/liquid/LiquidPanel';
import {Object25D} from '../../kit/liquid/Object25D';
import {NightStage, Reeded, type Spot} from '../../kit/liquid/stage';
import {B} from './timing';
import {at} from './words';
import {Bracket, C, Chip, countTo, E, k, MONO, NUM, Phone, SANS, Txt} from './parts';

// Сцены A1–A4 ролика 21 (DIRECTION.md): стена роликов → $700 и 2 месяца → доказательства на рифлёном стекле → «100K» →
// пролёт сквозь ноль → подарок под прожектором. t — секунды ролика.
const line = (size: number, y: number, family = SANS, weight = 800) => ({family, weight, size, x: 720, y, align: 'center' as const, tracking: -0.03});

// ——— A1–A2: стена роликов, $700, 2 месяца (S1 ночная сцена) ———
const wallSpots = (t: number): Spot[] => [
  {x: 150, y: -90, angle: 17 + 5 * Math.sin(t * 0.8), spread: 12, power: 0.95},
  {x: 720, y: -160, angle: 2.5 * Math.sin(t * 0.6 + 1), spread: 10, color: '214,255,245', power: 0.8},
  {x: 1290, y: -90, angle: -17 + 5 * Math.sin(t * 0.7 + 2), spread: 12, power: 0.95},
];

const SidePhone: React.FC<{x: number; y: number; w: number; src: string; rot: number; o?: number}> = ({x, y, w, src, rot, o = 1}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: 1440, height: 2560, opacity: o}}>
    <Phone x={x} y={y} w={w} src={src} glass={false} style={{transform: `perspective(1800px) rotateY(${rot}deg)`, transformOrigin: rot > 0 ? 'right center' : 'left center'}} />
  </div>
);

export const Wall: React.FC<{t: number}> = ({t}) => {
  const back = k(t, B.a2, B.a2 + 0.6, E.inOut);
  const settle = 1.05 - 0.05 * k(t, 0, 2.2);
  const head = k(t, 0.95, 1.3);
  return (
    <AbsoluteFill>
      <GlassEnv bg={() => <NightStage t={t} spots={wallSpots(t)} floor={2150} />}>
        <div style={{position: 'absolute', left: 0, top: 0, width: 1440, height: 2560, transformOrigin: '720px 1000px',
          transform: `translateY(${back * 320}px) scale(${settle * (1 - 0.24 * back)})`, opacity: 1 - 0.66 * back, filter: back > 0 ? `blur(${back * 8}px)` : undefined}}>
          <SidePhone x={-80} y={820} w={250} src="r21/covers/r20.jpg" rot={26} o={0.75} />
          <SidePhone x={1270} y={820} w={250} src="r21/covers/r13.jpg" rot={-26} o={0.75} />
          <SidePhone x={150} y={740} w={300} src="r21/covers/r4.jpg" rot={16} />
          <SidePhone x={990} y={740} w={300} src="r21/covers/r7.jpg" rot={-16} />
          <Phone x={530} y={640} w={380} src="r21/clips/r19-hook.mp4" video />
        </div>
        <Txt t={t} at={0.05} out={B.a2} x={720} y={372} size={112} align="center">Мои ролики</Txt>
        {head > 0 ? (
          <div style={{position: 'absolute', left: 0, top: 0, width: 1440, height: 2560, opacity: head * (1 - k(t, B.a2, B.a2 + 0.3)), transform: `translateY(${(1 - head) * 24}px)`}}>
            <CapsuleLine t={t} words={['с', 'ИИ‑монтажом']} stops={[{at: at(5), i: 1}]} style={line(112, 500)} textShadow={textDepth}
              capsule={{material: 'solid', tone: 'mint', moon: 0.6}} />
          </div>
        ) : null}
        {/* A2: обучение Claude — $700 — 2 месяца жизни */}
        <Chip t={t} at={at(8)} out={B.a3 - 0.35} x={720} y={372} label="обучение Claude" icon="mark:claude" glass={{material: 'frosted', moon: 0.7}} />
        <Txt t={t} at={at(12)} out={B.a3 - 0.3} x={150} y={548} size={290} family={NUM} weight={900} track={-0.045}>${countTo(t, at(12), at(13) + 0.3, 700)}</Txt>
        <Bracket t={t} at={at(13) + 0.2} x={118} y={530} w={740} h={330} />
        <Object25D src="objects/coins.webp" x={1115} y={700} size={440} t={t} at={at(13) - 0.05} out={B.a3 - 0.3} sheenAt={at(13) + 0.6} moon={0.6} />
        <Object25D src="objects/hourglass.webp" x={285} y={1035} size={330} t={t} at={at(16) - 0.1} out={B.a3 - 0.3} sheenAt={at(17) + 0.4} moon={0.6} />
        <Txt t={t} at={at(16) - 0.05} out={B.a3 - 0.3} x={470} y={935} size={180} family={NUM} weight={900} track={-0.04}>2 месяца</Txt>
        <Chip t={t} at={at(18) - 0.05} out={B.a3 - 0.3} x={880} y={1150} label="жизни" size={64} color="#1B0C05" glass={{material: 'solid', tone: 'orange'}} />
      </GlassEnv>
    </AbsoluteFill>
  );
};

// ——— A3: доказательства на рифлёном стекле, «от 5K до 100K», герой «100K» ———
export const G = G100K as GlyphJson;
const HS = 520;
export const HERO: GlyphPlace = {x: (1440 - (G.width * HS) / G.upm) / 2, y: 1085, size: HS};
export const HOLE = holeBox(G, 1, HERO); // отверстие первого нуля — окно пролёта в сцену подарка
export const HOLE_C = {x: (HOLE.x0 + HOLE.x1) / 2, y: (HOLE.y0 + HOLE.y1) / 2};

// Скриншоты просмотров от Александра (профиль Instagram, 19.09.2026) — настоящие счётчики на самих карточках.
// Веер по росту слева направо: 6 264 → 98,4 тыс.; у «лимитов» счётчик на скрине не виден — число не дописываем.
const SHOTS = [
  {src: 'r21/shots/IMG_7801.png', ar: 746 / 430},  // 6 264
  {src: 'r21/shots/IMG_7802.png', ar: 751 / 405},  // 9 358
  {src: 'r21/shots/IMG_7803.png', ar: 684 / 420},  // «Смонтировано с AI», без счётчика
  {src: 'r21/shots/IMG_7804.png', ar: 739 / 427},  // 10,1 тыс.
  {src: 'r21/shots/IMG_7805.png', ar: 767 / 426},  // 63,8 тыс.
  {src: 'r21/shots/IMG_7800.png', ar: 765 / 431, hot: true},  // 98,4 тыс.
];
const FAN = {w: 300, cx0: 225, step: 198, y0: 600, rot: [-13, -8, -3, 3, 8, 13], at0: 9.72, gap: 0.14};

const ShotCard: React.FC<{t: number; i: number; out: number}> = ({t, i, out}) => {
  const c = SHOTS[i];
  const at = FAN.at0 + i * FAN.gap;
  const a = k(t, at, at + 0.55, E.pop), o = k(t, at, at + 0.15);
  const drop = k(t, out, out + 0.35, E.acc);
  if (o <= 0 || drop >= 1) return null;
  const s = c.hot ? 1.14 : 1;
  const w = FAN.w, h = w * c.ar;
  const cx = FAN.cx0 + i * FAN.step, x = cx - w / 2;
  const y = FAN.y0 + Math.pow(Math.abs(i - 2.5), 2) * 10 - (c.hot ? 30 : 0);
  const rot = FAN.rot[i];
  const sheen = k(t, at + 0.35, at + 1.1);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1440, height: 2560, opacity: o * (1 - drop), transformOrigin: `${cx}px ${y + h / 2}px`,
      transform: `translateY(${(1 - a) * 820 + drop * 900}px) rotate(${rot * (0.5 + 0.5 * a) + drop * rot * 2}deg) scale(${s})`}}>
      <div style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 34, overflow: 'hidden', background: '#0B0C0E',
        boxShadow: c.hot ? '0 0 0 4px rgba(61,237,195,.9), 0 0 70px rgba(61,237,195,.45), 0 40px 90px rgba(0,0,0,.55)' : '0 30px 70px rgba(0,0,0,.55), 0 6px 14px rgba(0,0,0,.4)'}}>
        <Img src={staticFile(c.src)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'bottom'}} />
        <GlassSurface radius={34} tone="dark" fill={0} sheen={sheen < 1 ? sheen : undefined} moon={0.5} />
      </div>
    </div>
  );
};

export const Proof: React.FC<{t: number}> = ({t}) => {
  const heroIn = k(t, 12.3, 12.95, E.out);
  return (
    <AbsoluteFill>
      <GlassEnv bg={() => <Reeded t={t} mix={k(t, 9.6, 12.6, E.inOut)} />}>
        <div style={{position: 'absolute', left: 0, top: 0, width: 1440, height: 2560, opacity: k(t, B.a3 - 0.05, B.a3 + 0.3) * (1 - k(t, 11.15, 11.4))}}>
          <CapsuleLine t={t} words={['Монтирует', 'всё']} stops={[{at: at(22), i: 1}]} style={line(112, 372)} textShadow={textDepth}
            capsule={{material: 'solid', tone: 'mint'}} />
        </div>
        {/* «от субтитров» — капсула субтитра с подчёркиванием; «до топовых анимаций» — секунда перехода из ролика «агент» */}
        {t < 10.2 ? (
          <div style={{position: 'absolute', left: 0, top: 0, width: 1440, height: 2560, opacity: k(t, at(23) - 0.1, at(23) + 0.2) * (1 - k(t, 9.55, 9.85)),
            transform: `scale(${1 - 0.08 * k(t, 9.55, 9.85)})`, transformOrigin: '720px 900px'}}>
            <LiquidPanel x={270} y={590} w={900} h={150} r="pill" material="frosted" moon={0.5}>
              <div style={{position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 72, color: C.ink, textShadow: textDepth}}>
                <span style={{position: 'relative'}}>
                  субтитры
                  <span style={{position: 'absolute', left: 0, right: 0, bottom: -8, height: 8, borderRadius: 4, background: C.mint, boxShadow: '0 0 14px rgba(61,237,195,.7)',
                    transform: `scaleX(${k(t, at(24), at(24) + 0.45, E.inOut)})`, transformOrigin: 'left center'}} />
                </span>
              </div>
            </LiquidPanel>
            {t > at(26) - 0.3 ? (
              <div style={{position: 'absolute', left: 0, top: 0, width: 1440, height: 2560, opacity: k(t, at(26) - 0.3, at(26)), transform: `translateY(${(1 - k(t, at(26) - 0.3, at(26) + 0.2)) * 80}px)`}}>
                <Phone x={570} y={800} w={300} src="r21/clips/r19-portal.mp4" video />
              </div>
            ) : null}
          </div>
        ) : null}
        {SHOTS.map((_, i) => <ShotCard key={i} t={t} i={i} out={12.0 + i * 0.03} />)}
        {/* «от 5 тысяч до 100 тысяч» — капсула перетекает с 5K на 100K */}
        <div style={{position: 'absolute', left: 0, top: 0, width: 1440, height: 2560, opacity: k(t, 11.2, 11.45) * (1 - k(t, 12.45, 12.75))}}>
          <CapsuleLine t={t} words={['от', '5K', 'до', '100K']} stops={[{at: at(32), i: 1}, {at: at(35), i: 3}]} style={line(150, 360, NUM, 900)} textShadow={textDepth}
            capsule={{material: 'solid', tone: 'mint'}} />
        </div>
        {heroIn > 0 ? (
          <div style={{position: 'absolute', left: 0, top: 0, width: 1440, height: 2560, opacity: heroIn, transformOrigin: `720px ${HERO.y - 190}px`, transform: `scale(${0.55 + 0.45 * heroIn})`,
            filter: heroIn < 1 ? `blur(${(1 - heroIn) * 10}px)` : undefined}}>
            <GlyphText g={G} p={HERO} fill={(i) => (i === 3 ? ['#FFB27E', C.orange] : ['#FFFFFF', '#C9CED4'])} />
          </div>
        ) : null}
        <Txt t={t} at={at(37) - 0.05} x={720} y={1145} size={72} weight={700} align="center" color={C.ink}>просмотров</Txt>
      </GlassEnv>
    </AbsoluteFill>
  );
};

// ——— A4: подарок под прожектором (S1, один прожектор, луна) ———
const Pedestal: React.FC<{x: number; y: number; w: number}> = ({x, y, w}) => (
  <>
    <div style={{position: 'absolute', left: x - w / 2, top: y, width: w, height: 110, borderRadius: '0 0 50% 50% / 0 0 100% 100%',
      background: 'linear-gradient(180deg, rgba(120,140,140,.35), rgba(20,24,26,.85))', boxShadow: 'inset 0 -6px 18px rgba(0,0,0,.5), 0 40px 80px rgba(0,0,0,.6)'}} />
    <div style={{position: 'absolute', left: x - w / 2, top: y - w * 0.1, width: w, height: w * 0.2, borderRadius: '50%',
      background: 'radial-gradient(closest-side, rgba(214,255,245,.35), rgba(61,237,195,.12) 60%, rgba(255,255,255,.06))',
      boxShadow: 'inset 0 2px 0 rgba(255,255,255,.55), inset 0 -4px 10px rgba(0,0,0,.4)', border: '2px solid rgba(255,255,255,.35)'}} />
  </>
);

// Иконки «лайк, репост, комментарий» появляются на своих словах и в конце влетают в коробку — «оплата» подарка.
const PAY = [
  {src: 'objects/heart.webp', x: 250, y: 1010, size: 250, word: 45},
  {src: 'objects/repost.webp', x: 1190, y: 850, size: 230, word: 46},
  {src: 'objects/comment.webp', x: 1185, y: 1135, size: 240, word: 48},
];
export const BOX = {x: 720, y: 900, size: 560};

export const Gift: React.FC<{t: number}> = ({t}) => {
  const on = k(t, 13.95, 14.35, E.inOut);
  const drop = k(t, 14.0, 14.55, E.pop);
  const into = k(t, 17.1, 17.55, E.acc);
  const open = k(t, 17.5, 17.62);
  const spots: Spot[] = [{x: 720, y: -160, angle: 0, spread: 10.5, power: on, color: '255,247,236'}];
  return (
    <AbsoluteFill>
      <GlassEnv bg={() => <NightStage t={t} spots={spots} floor={1230} dust={70} />}>
        <div style={{position: 'absolute', left: 0, top: 0, width: 1440, height: 2560, opacity: k(t, 14.15, 14.45)}}>
          <CapsuleLine t={t} words={['отдаю', 'вам', 'бесплатно']} stops={[{at: at(43), i: 2}]} style={line(104, 368)} textShadow={textDepth}
            capsule={{material: 'solid', tone: 'mint', moon: 0.6}} />
        </div>
        <Chip t={t} at={at(41)} x={720} y={505} label="saint4ai/reels-pipline-automotaj" size={46} weight={600} family={MONO} icon="mark:github" iconSize={62}
          glass={{material: 'frosted', moon: 0.6}} />
        <Pedestal x={720} y={1150} w={620} />
        <div style={{position: 'absolute', left: 0, top: 0, width: 1440, height: 2560, transform: `translateY(${(1 - drop) * -520}px)`, opacity: k(t, 14.0, 14.15)}}>
          <Object25D src="objects/gift-box.webp" x={BOX.x} y={BOX.y} size={BOX.size} t={t} at={14.0} float={8} tilt={2.5} sheenAt={at(43)} moon={0.7} opacity={1 - open} />
          {open > 0 ? <Object25D src="objects/gift-open.webp" x={BOX.x} y={BOX.y - 30} size={BOX.size + 60} t={t} at={17.5} float={0} tilt={0} moon={0.7} opacity={open} shadow={false} /> : null}
        </div>
        {PAY.map((p, i) => {
          const f = k(t, 17.1 + i * 0.06, 17.5 + i * 0.06, E.acc);
          return (
            <div key={i} style={{position: 'absolute', left: 0, top: 0, width: 1440, height: 2560, transformOrigin: `${p.x}px ${p.y}px`,
              transform: `translate(${(BOX.x - p.x) * f}px, ${(BOX.y - 120 - p.y) * f}px) scale(${1 - 0.8 * f})`, opacity: 1 - k(t, 17.45 + i * 0.06, 17.6 + i * 0.06)}}>
              <Object25D src={p.src} x={p.x} y={p.y} size={p.size} t={t} at={at(p.word) - 0.05} sheenAt={at(p.word) + 0.3} moon={0.6} />
            </div>
          );
        })}
        {/* вспышка из открытой коробки */}
        {open > 0 ? <div style={{position: 'absolute', left: BOX.x - 700, top: BOX.y - 1100, width: 1400, height: 1400, borderRadius: '50%', mixBlendMode: 'screen', opacity: open * (0.6 + 0.4 * into),
          background: 'radial-gradient(closest-side, rgba(220,255,246,.9), rgba(61,237,195,.35) 40%, rgba(61,237,195,0) 100%)'}} /> : null}
      </GlassEnv>
    </AbsoluteFill>
  );
};
