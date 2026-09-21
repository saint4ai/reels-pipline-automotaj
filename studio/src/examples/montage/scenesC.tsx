import {AbsoluteFill, Img, staticFile} from 'remotion';
import {textDepth} from '../../ds/tokens';
import {CapsuleLine} from '../../kit/liquid/CapsuleLine';
import {GlassEnv} from '../../kit/liquid/env';
import {GlassSurface, LiquidPanel} from '../../kit/liquid/LiquidPanel';
import {Object25D} from '../../kit/liquid/Object25D';
import {NightStage, Platinum, Reeded} from '../../kit/liquid/stage';
import {B} from './timing';
import {at} from './words';
import {Bracket, C, Chip, countTo, E, HAND, k, Mark, MONO, NUM, SANS, Txt} from './parts';

const line = (size: number, y: number, weight = 800) => ({family: SANS, weight, size, x: 720, y, align: 'center' as const, tracking: -0.03});
const full: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: 1440, height: 2560};
const Tick: React.FC<{size: number; color?: string}> = ({size, color = C.mintInk}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{flex: 'none'}}><path d="M4 12.5l5 5L20 6.5" fill="none" stroke={color} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" /></svg>
);

// ——— D: рендер на твоём компьютере (S1, луна) ———
const LAP = {x: 720, y: 870, s: 880};
const SCREEN = {x: 150 / 1024, y: 146 / 1024, w: 728 / 1024, h: 432 / 1024};
export const Render: React.FC<{t: number}> = ({t}) => {
  const a = k(t, B.d + 0.05, B.d + 0.6, E.pop), vis = k(t, B.d, B.d + 0.2);
  const prog = k(t, B.d + 0.3, B.e - 0.3, (v) => v);
  const sx = LAP.x - LAP.s / 2 + SCREEN.x * LAP.s, sy = LAP.y - LAP.s / 2 + SCREEN.y * LAP.s, sw = SCREEN.w * LAP.s, sh = SCREEN.h * LAP.s;
  // лунный луч падает на ноутбук (правка Александра: «луч от Луны должен идти»)
  const moon = {x: 1200, y: 215, r: 130, beam: {angle: -37, spread: 11, power: 0.95}};
  return (
    <AbsoluteFill>
      <GlassEnv bg={() => <NightStage t={t} moon={moon} floor={1420} dust={70} />}>
        <div style={{...full, opacity: k(t, B.d, B.d + 0.3)}}>
          <CapsuleLine t={t} words={['рендер', 'у', 'тебя']} stops={[{at: at(117), i: 1, j: 2}]} style={line(104, 372)} textShadow={textDepth}
            capsule={{material: 'solid', tone: 'mint', moon: 0.6}} />
        </div>
        <div style={{...full, opacity: vis, transformOrigin: `${LAP.x}px ${LAP.y}px`, transform: `scale(${0.7 + 0.3 * a})`}}>
          <div style={{position: 'absolute', left: LAP.x - LAP.s * 0.3, top: LAP.y + LAP.s * 0.38, width: LAP.s * 0.6, height: LAP.s * 0.08, borderRadius: '50%',
            background: 'radial-gradient(closest-side, rgba(0,0,0,.6), rgba(0,0,0,0))', filter: 'blur(8px)'}} />
          <Img src={staticFile('objects/laptop.webp')} style={{position: 'absolute', left: LAP.x - LAP.s / 2, top: LAP.y - LAP.s / 2, width: LAP.s, height: LAP.s}} />
          {/* экран: наш интерфейс рендера поверх чёрного экрана картинки */}
          <div style={{position: 'absolute', left: sx + 8, top: sy + 8, width: sw - 16, height: sh - 16, borderRadius: 12, overflow: 'hidden',
            background: 'linear-gradient(160deg, #10161A 0%, #0A0C0E 100%)', boxShadow: 'inset 0 0 0 2px rgba(61,237,195,.18)'}}>
            <div style={{position: 'absolute', left: 34, top: 20, fontFamily: MONO, fontWeight: 600, fontSize: 44, color: C.mint}}>рендер · 2K</div>
            <div style={{position: 'absolute', left: 34, right: 34, top: 92, height: 36, borderRadius: 20, background: 'rgba(255,255,255,.1)', overflow: 'hidden'}}>
              <div style={{width: `${prog * 100}%`, height: '100%', borderRadius: 20, background: `linear-gradient(90deg, ${C.orange}, ${C.mint})`, boxShadow: '0 0 20px rgba(61,237,195,.6)'}} />
            </div>
            <div style={{position: 'absolute', left: 34, top: 146, fontFamily: MONO, fontWeight: 500, fontSize: 44, color: C.ink}}>кадр {countTo(t, B.d + 0.3, B.e - 0.3, 4213, 1, (v) => v)} / 4213</div>
            <div style={{position: 'absolute', left: 34, top: 208, fontFamily: MONO, fontWeight: 500, fontSize: 44, color: C.dim, opacity: k(t, at(121), at(121) + 0.3)}}>≈ 5 мин на 51 с</div>
            <div style={{position: 'absolute', left: 34, top: 270, fontFamily: MONO, fontWeight: 500, fontSize: 44, color: C.dim, opacity: k(t, at(121) + 0.15, at(121) + 0.45)}}>8 ядер процессора</div>
            <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(125deg, rgba(255,255,255,.12) 0%, rgba(255,255,255,0) 35%)'}} />
          </div>
        </div>
        <Chip t={t} at={at(124) - 0.05} x={720} y={1262} label="средней мощности" size={62} glass={{material: 'solid', tone: 'mint', moon: 0.6}} />
      </GlassEnv>
    </AbsoluteFill>
  );
};

// ——— E: подписку не сожжёт; весь проект → только нужное; ×25 (S3 рифлёное стекло) ———
const SLABS = 10;
const Slab: React.FC<{x: number; y: number; w: number; h: number; mint?: number; o?: number}> = ({x, y, w, h, mint = 0, o = 1}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: Math.min(22, h / 2), overflow: 'hidden', opacity: o,
    boxShadow: `0 10px 24px rgba(0,0,0,.35)${mint ? `, 0 0 ${30 * mint}px rgba(61,237,195,${0.6 * mint})` : ''}`}}>
    <GlassSurface radius={Math.min(22, h / 2)} tone={mint > 0.5 ? 'mint' : 'light'} fill={mint > 0.5 ? 0.85 : 0.2} />
    {h > 30 ? [0.34, 0.62].map((f, i) => (
      <div key={i} style={{position: 'absolute', left: 26, top: h * f - 4, width: w * (i ? 0.46 : 0.72), height: 8, borderRadius: 4, background: mint > 0.5 ? 'rgba(5,35,29,.45)' : 'rgba(255,255,255,.55)'}} />
    )) : null}
  </div>
);
export const Context: React.FC<{t: number}> = ({t}) => {
  const pick = k(t, at(133), at(133) + 0.5, E.inOut);
  const center = k(t, B.e2 - 0.1, B.e2 + 0.3, E.inOut);
  const press = k(t, 53.3, 53.78, E.acc);
  const quality = k(t, at(144), at(144) + 0.5);
  const stackX = 160 + 300 * center, stackTop = 520 + 280 * center;
  const H0 = 740 - 200 * center, hh = H0 * (1 - press * (1 - 1 / 25));
  const cardIn = k(t, B.e, B.e + 0.4, E.pop), cardOut = k(t, at(129) - 0.2, at(129) + 0.1);
  return (
    <AbsoluteFill>
      <GlassEnv bg={() => <Reeded t={t} mix={0.1 + 0.8 * quality} />}>
        {/* «Подписку не сожжёт»: лимит подписки почти полный */}
        {cardOut < 1 ? (
          <div style={{...full, opacity: Math.min(1, cardIn * 2) * (1 - cardOut), transformOrigin: '720px 700px', transform: `scale(${0.85 + 0.15 * cardIn}) translateY(${-cardOut * 120}px)`}}>
            <LiquidPanel x={170} y={520} w={1100} h={330} r={56} material="frosted" level={3} moon={0.5}>
              <div style={{position: 'absolute', left: 50, top: 44, display: 'flex', alignItems: 'center', gap: 24}}>
                <Mark name="claude" size={80} />
                <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 64, color: C.ink, textShadow: textDepth}}>лимит подписки</span>
              </div>
              <div style={{position: 'absolute', left: 50, right: 50, top: 190, height: 60, borderRadius: 30, background: 'rgba(255,255,255,.1)', overflow: 'hidden'}}>
                <div style={{width: `${92 - 4 * k(t, B.e + 0.3, at(129))}%`, height: '100%', borderRadius: 30, background: `linear-gradient(90deg, ${C.mint}, #9FF7E2)`, boxShadow: '0 0 22px rgba(61,237,195,.55)'}} />
              </div>
            </LiquidPanel>
            <Chip t={t} at={at(127) - 0.05} x={720} y={900} label="не сожжёт" size={64} glass={{material: 'solid', tone: 'mint', moon: 0.5}}><Tick size={54} /></Chip>
          </div>
        ) : null}
        {/* весь проект — стопка стекла; нужное — одна пластина выезжает */}
        {t > at(129) - 0.3 ? (
          <div style={{...full, opacity: k(t, at(129) - 0.3, at(129) + 0.1)}}>
            {Array.from({length: SLABS}, (_, i) => {
              const isPick = i === 5;
              const y0 = stackTop + (i * H0) / SLABS;
              const y = stackTop + H0 - hh + (i * hh) / SLABS;
              const sy = press > 0 ? y : y0;
              const px = isPick ? pick * (1 - center) * 640 : 0;
              return <Slab key={i} x={stackX + px} y={sy} w={520} h={Math.max(4, (press > 0 ? hh : H0) / SLABS - 12 * (1 - press))} mint={isPick ? pick * (1 - center) : press > 0.9 ? quality : 0}
                o={isPick ? 1 : 1 - 0.55 * k(t, at(135) - 0.2, at(135) + 0.2) * (1 - center)} />;
            })}
            <div style={{position: 'absolute', left: stackX - 20, top: stackTop + (H0 - hh) - 96, width: 560, height: 90, opacity: press > 0 ? 1 : 0}}>
              <div style={{position: 'absolute', inset: 0, borderRadius: 26, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,.5)'}}>
                <GlassSurface radius={26} tone="orange" fill={0.8} />
              </div>
            </div>
            <Txt t={t} at={at(130)} out={B.e2 - 0.3} x={740} y={560} size={64}>весь проект</Txt>
            <Txt t={t} at={at(130) + 0.1} out={B.e2 - 0.3} x={740} y={650} size={52} family={MONO} weight={500} color={C.dim} track={0}>60 195 байт</Txt>
            <Txt t={t} at={at(134)} out={B.e2 - 0.3} x={820} y={990} size={64} color={C.mint}>нужное</Txt>
            <Txt t={t} at={at(134) + 0.1} out={B.e2 - 0.3} x={820} y={1080} size={52} family={MONO} weight={500} color={C.dim} track={0}>2 403 байта</Txt>
          </div>
        ) : null}
        {/* ×25 и пресс */}
        <Txt t={t} at={at(137) - 0.1} x={720} y={372} size={320} family={NUM} weight={900} align="center" track={-0.05}>×25</Txt>
        <Bracket t={t} at={at(138)} x={340} y={362} w={760} h={362} color={C.orange} />
        <Chip t={t} at={at(141) - 0.05} out={at(144) - 0.1} x={720} y={960} label="ужал контекст" size={62} color="#1B0C05" glass={{material: 'solid', tone: 'orange'}} />
        <Chip t={t} at={at(144)} x={720} y={960} label="качество сохранено" size={62} glass={{material: 'solid', tone: 'mint', moon: 0.5}}><Tick size={54} /></Chip>
      </GlassEnv>
    </AbsoluteFill>
  );
};

// ——— F: правки словами → правила → твой стиль (S5 платиновая студия) ———
const TYPED = 'субтитры крупнее';
export const GROW = [57.95, 58.9] as const; // субтитры ролика вырастают по команде из чата
export const Style: React.FC<{t: number}> = ({t}) => {
  const typed = Math.round(TYPED.length * k(t, at(147), at(150) + 0.1, (v) => v));
  const chatOut = k(t, 60.55, 60.9, E.inOut);
  const hand = k(t, at(155), at(157) + 0.2, (v) => v);
  const CAPS = [{l: 'шрифт', at: 61.0}, {l: 'цвет', at: 61.18}, {l: 'переходы', at: 61.36}];
  return (
    <AbsoluteFill>
      <GlassEnv bg={() => <Platinum t={t} />}>
        {chatOut < 1 ? (
          <div style={{...full, opacity: k(t, B.f, B.f + 0.3) * (1 - chatOut), transform: `translateY(${-chatOut * 160}px)`}}>
            <LiquidPanel x={170} y={420} w={1100} h={360} r={56} material="milk" tone="light" level={2}>
              <div style={{position: 'absolute', left: 44, top: 36, display: 'flex', alignItems: 'center', gap: 20}}>
                <Mark name="claude" size={66} />
                <span style={{fontFamily: SANS, fontWeight: 700, fontSize: 52, color: '#3A3F45'}}>правки словами</span>
              </div>
              <div style={{position: 'absolute', right: 44, top: 150, padding: '28px 40px', borderRadius: '40px 40px 12px 40px', background: '#101214',
                fontFamily: SANS, fontWeight: 700, fontSize: 60, color: '#F7F7F5', whiteSpace: 'nowrap', boxShadow: '0 12px 30px rgba(0,0,0,.25)', opacity: k(t, at(146), at(146) + 0.2)}}>
                {TYPED.slice(0, typed)}<span style={{opacity: typed < TYPED.length && Math.floor(t * 4) % 2 === 0 ? 1 : 0, color: C.mint}}>|</span>
              </div>
            </LiquidPanel>
          </div>
        ) : null}
        <div style={{...full, opacity: k(t, 60.8, 61.1)}}>
          <CapsuleLine t={t} words={['учится', 'твоему', 'стилю']} stops={[{at: at(162), i: 2}]} style={line(100, 400)} color={C.dark}
            textShadow="0 2px 0 rgba(255,255,255,.7)" capsule={{material: 'solid', tone: 'mint'}} />
        </div>
        <Object25D src="objects/book.webp" x={330} y={1080} size={380} t={t} at={at(152) - 0.1} sheenAt={at(155)} moon={0.3} />
        <div style={{...full, opacity: k(t, at(152), at(152) + 0.3), transform: `translateX(${(1 - k(t, at(152), at(152) + 0.45)) * 120}px)`}}>
          <LiquidPanel x={560} y={860} w={740} h={420} r={48} material="milk" tone="light" level={2} sheen={k(t, 61.9, 62.4)}>
            <div style={{position: 'absolute', left: 44, top: 34, fontFamily: SANS, fontWeight: 800, fontSize: 60, color: C.dark}}>правила</div>
            <div style={{position: 'absolute', left: 44, top: 120, fontFamily: HAND, fontWeight: 600, fontSize: 80, color: '#0F6E5A', whiteSpace: 'nowrap',
              clipPath: `inset(0 ${100 - hand * 100}% 0 0)`}}>субтитры крупнее ✓</div>
            <div style={{position: 'absolute', left: 44, right: 44, top: 262, display: 'flex', gap: 16}}>
              {CAPS.map((c, i) => {
                const p = k(t, c.at, c.at + 0.45, E.pop);
                return (
                  <div key={i} style={{padding: '12px 26px', borderRadius: 40, background: C.mint, flex: 'none', transform: `translateY(${(1 - p) * -500}px)`,
                    fontFamily: SANS, fontWeight: 800, fontSize: 46, color: C.mintInk, opacity: Math.min(1, p * 2), boxShadow: '0 8px 20px rgba(0,0,0,.18)'}}>{c.l}</div>
                );
              })}
            </div>
          </LiquidPanel>
        </div>
      </GlassEnv>
    </AbsoluteFill>
  );
};

// ——— G: референсы на Pinterest → остальное в репозитории (S5, доска пинов) ———
const PINS = ['f0', 'p5', 'f2', 'p7', 'f1', 'p6', 'f3', 'p9', 'f4', 'p8'];
const COLS = [150, 530, 910];
const PIN_H = [430, 520, 380, 470, 400, 560, 450, 390, 500, 420];
export const Pins: React.FC<{t: number}> = ({t}) => {
  const col = [560, 560, 560];
  const toRepo = (i: number) => k(t, at(168) + i * 0.05, at(168) + i * 0.05 + 0.5, E.inOut);
  const repo = k(t, at(168) - 0.05, at(168) + 0.3, E.pop);
  const pulse = k(t, at(171), at(171) + 0.2) * (1 - k(t, at(171) + 0.3, at(171) + 0.7));
  return (
    <AbsoluteFill>
      <GlassEnv bg={() => <Platinum t={t} warm={0.6} />}>
        <Txt t={t} at={B.g + 0.02} x={720} y={372} size={100} align="center" color={C.dark}>референсы</Txt>
        <div style={{position: 'absolute', left: 0, top: 620, width: 1440, height: 790, overflow: 'hidden'}}>
          {PINS.map((p, i) => {
            const c = i % 3, y = col[c], h = PIN_H[i];
            col[c] += h + 26;
            const a0 = 62.45 + i * 0.09;
            const fall = k(t, a0, a0 + 0.5, E.out);
            const g = toRepo(i);
            const tx = (720 - (COLS[c] + 180)) * g, ty = (900 - 620 - (y - 560 + h / 2)) * g;
            return (
              <div key={i} style={{position: 'absolute', left: COLS[c], top: y - 560, width: 360, height: h, borderRadius: 28, overflow: 'hidden',
                opacity: k(t, a0, a0 + 0.15) * (1 - k(t, at(168) + i * 0.05 + 0.35, at(168) + i * 0.05 + 0.5)),
                transform: `translate(${tx}px, ${(1 - fall) * -700 + ty}px) scale(${1 - 0.85 * g})`, boxShadow: '0 14px 34px rgba(0,0,0,.18)'}}>
                <Img src={staticFile(`r21/pins/${p}.jpg`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
              </div>
            );
          })}
        </div>
        <Chip t={t} at={at(167) - 0.1} x={720} y={488} label="Pinterest" size={62} icon="mark:pinterest" glass={{material: 'milk', tone: 'light'}} />
        {repo > 0 ? (
          <div style={{...full, opacity: Math.min(1, repo * 2), transformOrigin: '720px 900px', transform: `scale(${(0.7 + 0.3 * repo) * (1 + 0.04 * pulse)})`}}>
            <LiquidPanel x={170} y={780} w={1100} h={260} r={52} material="milk" tone="light" level={3}
              style={{boxShadow: `0 0 0 ${3 + 5 * pulse}px rgba(61,237,195,${0.3 + 0.6 * pulse}), 0 30px 70px rgba(0,0,0,.2)`}}>
              <div style={{position: 'absolute', left: 50, top: 40, display: 'flex', alignItems: 'center', gap: 22}}>
                <Mark name="github-dark" size={70} />
                <span style={{fontFamily: MONO, fontWeight: 600, fontSize: 44, color: C.dark, whiteSpace: 'nowrap'}}>saint4ai/reels-pipline-automotaj</span>
              </div>
              <div style={{position: 'absolute', left: 50, top: 148, fontFamily: SANS, fontWeight: 700, fontSize: 56, color: '#3A3F45'}}>правила · приёмы · проверки</div>
            </LiquidPanel>
          </div>
        ) : null}
      </GlassEnv>
    </AbsoluteFill>
  );
};

// ——— H: напиши «монтаж» (S1, луна, прожектор находит комментарий) ———
const STEPS3 = ['отдай ссылку Claude', 'кинь запись', 'правь словами'];
export const Cta: React.FC<{t: number}> = ({t}) => {
  const find = k(t, B.h, B.h + 0.7, E.inOut);
  const typed = Math.round(6 * k(t, at(175) - 0.15, at(175) + 0.35, (v) => v));
  const dm = k(t, at(176) - 0.1, at(176) + 0.4, E.out);
  // лунный луч ищет и находит капсулу комментария
  const moon = {x: 1215, y: 200, r: 130, beam: {angle: -18 - 25 * find, spread: 10, power: 1}};
  return (
    <AbsoluteFill>
      <GlassEnv bg={() => <NightStage t={t} moon={moon} floor={1500} dust={70} />}>
        <div style={{...full, opacity: k(t, B.h + 0.2, B.h + 0.5), transformOrigin: '720px 720px', transform: `scale(${0.9 + 0.1 * k(t, B.h + 0.2, B.h + 0.6, E.pop)})`}}>
          <LiquidPanel x={170} y={660} w={1100} h={160} r="pill" material="frosted" level={3} moon={0.7} sheen={k(t, 67.9, 68.6)}>
            <div style={{display: 'flex', alignItems: 'center', gap: 26, height: '100%', padding: '0 34px'}}>
              <Mark name="instagram" size={80} />
              <span style={{fontFamily: SANS, fontWeight: typed ? 800 : 600, fontSize: typed ? 66 : 52, color: typed ? C.ink : C.dim, textShadow: typed ? textDepth : 'none', flex: 1}}>
                {typed ? `«${'монтаж'.slice(0, typed)}${typed >= 6 ? '»' : ''}` : 'Добавьте комментарий…'}
              </span>
              <div style={{width: 96, height: 96, borderRadius: '50%', display: 'grid', placeItems: 'center', background: typed >= 6 ? C.mint : 'rgba(255,255,255,.14)',
                boxShadow: typed >= 6 ? '0 0 26px rgba(61,237,195,.7)' : 'none'}}>
                <svg width={48} height={48} viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7" fill="none" stroke={typed >= 6 ? C.mintInk : '#fff'} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            </div>
          </LiquidPanel>
        </div>
        {dm > 0 ? (
          <div style={{...full, opacity: Math.min(1, dm * 2), transform: `translateY(${(1 - dm) * -260}px)`}}>
            <LiquidPanel x={170} y={380} w={1100} h={230} r={52} material="frosted" level={3} moon={0.7}>
              <div style={{position: 'absolute', left: 40, top: 36, display: 'flex', alignItems: 'center', gap: 22}}>
                <Mark name="instagram" size={70} />
                <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 52, color: C.ink, textShadow: textDepth}}>Директ</span>
              </div>
              <div style={{position: 'absolute', left: 40, top: 128, display: 'flex', alignItems: 'center', gap: 18}}>
                <Mark name="github" size={52} />
                <span style={{fontFamily: SANS, fontWeight: 700, fontSize: 48, color: C.ink}}>ссылка + пошаговая инструкция</span>
              </div>
            </LiquidPanel>
          </div>
        ) : null}
        {STEPS3.map((s, i) => {
          const a0 = at(179) + i * 0.2;
          const p = k(t, a0, a0 + 0.4, E.pop);
          return p > 0 ? (
            <div key={i} style={{...full, opacity: Math.min(1, p * 2), transform: `translateX(${(1 - p) * 80}px)`}}>
              <div style={{position: 'absolute', left: 230, top: 900 + i * 130, display: 'flex', alignItems: 'center', gap: 28}}>
                <div style={{width: 84, height: 84, borderRadius: '50%', background: C.mint, display: 'grid', placeItems: 'center', fontFamily: NUM, fontWeight: 900, fontSize: 50, color: C.mintInk,
                  boxShadow: '0 0 20px rgba(61,237,195,.5)'}}>{i + 1}</div>
                <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 60, color: C.ink, textShadow: textDepth}}>{s}</span>
              </div>
            </div>
          ) : null;
        })}
        <Object25D src="objects/heart.webp" x={1215} y={960} size={170} t={t} at={B.h + 0.5} moon={0.5} opacity={0.9} />
        <Object25D src="objects/comment.webp" x={1215} y={1170} size={170} t={t} at={B.h + 0.65} moon={0.5} opacity={0.9} />
      </GlassEnv>
    </AbsoluteFill>
  );
};
