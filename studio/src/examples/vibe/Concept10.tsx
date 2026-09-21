import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {Robot3D} from './Robot';
import {LiquidCapsule} from '../../kit/LiquidCapsule';
import {Spotlight} from '../../kit/Spotlight';
import {Captions, type Page} from '../../components/Captions';
import {SpeakerCard} from '../../components/SpeakerCard';
import {elevation, GlassLayers, glassFill, textDepth} from '../../ds';
import {Headline} from './Headline';

// Ролик 22, референс монтажа «Фокус» — первые 10 секунд варианта А (19.09.2026).
// Приёмы: подмена под рукой → разворот декорации → пролёт сквозь визор → наклонный экран сайта с отрывом заголовка →
// слив капсулы → свет гаснет и загорается прожектор → ложный выбор лучом. Всё объёмное: первый, второй и третий план.
// Речь оценочная (записи нет): карточка — прошлая запись Александра без звука, слова расставлены по темпу 2,6 слова/с.
export const CONCEPT10_FPS = 30, CONCEPT10_END = 10;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const inOut = Easing.bezier(0.65, 0, 0.35, 1), easeIn = Easing.bezier(0.55, 0, 1, 0.45), out = Easing.bezier(0.16, 1, 0.3, 1);
const M = '#3DEDC3', O = '#FF7A2F', TXT = '#F2F3F5';
const iv = (t: number, a: number, b: number, from = 0, to = 1, e = inOut) => interpolate(t, [a, b], [from, to], {...clamp, easing: e});

const WORDS = [
  ['Этот', 0.0, 0.2], ['ролик', 0.2, 0.5], ['смонтировал', 0.5, 1.08], ['не', 1.1, 1.24], ['монтажёр,', 1.25, 1.78], ['а', 1.8, 1.92], ['ИИ-агент.', 1.95, 2.8],
  ['И', 3.0, 3.08], ['это', 3.1, 3.33], ['самое', 3.35, 3.63], ['простое,', 3.65, 4.08], ['что', 4.1, 4.23], ['он', 4.25, 4.38], ['умеет.', 4.4, 4.9],
  ['Тебя', 5.2, 5.43], ['заменит', 5.45, 5.83], ['не', 5.85, 5.98], ['нейросеть.', 6.0, 6.7],
  ['Тебя', 6.9, 7.13], ['заменит', 7.15, 7.53], ['коллега', 7.55, 7.93], ['с', 7.95, 8.03], ['твоим', 8.05, 8.28], ['же', 8.3, 8.43], ['опытом,', 8.45, 9.1],
  ['который', 9.2, 9.5], ['поручает', 9.5, 10.0],
].map(([text, start, end]) => ({text: text as string, start: start as number, end: end as number}));
const PAGES: Page[] = [{from: 0, to: 2.95}, {from: 2.95, to: 5.1, lines: 1}, {from: 5.1, to: 6.85, lines: 1}, {from: 6.85, to: 10.5}];

// ---------- S1: дорожки монтажа собираются сами, «монтажёр» падает, «ИИ-агент» на его месте; экран откидывается ----------
const Clip: React.FC<{w: number; kind: 'video' | 'text' | 'gfx' | 'sound'; at: number; t: number}> = ({w, kind, at, t}) => {
  const k = spring({frame: Math.round((t - at) * 30), fps: 30, config: {damping: 14, stiffness: 170, mass: 0.7}});
  const bg = {video: 'linear-gradient(180deg,#3A3F46,#1C1F23)', text: 'linear-gradient(180deg,#FFFFFF,#DADDE0)', gfx: `linear-gradient(180deg,#FFB07A,${O})`, sound: `linear-gradient(180deg,#9FFFE6,${M})`}[kind];
  return (
    <div style={{position: 'relative', width: w, height: 92, borderRadius: 46, background: bg, flex: 'none', transform: `translateX(${(1 - k) * 900}px)`, opacity: t < at - 0.05 ? 0 : 1,
      boxShadow: `inset 0 2px 0 rgba(255,255,255,.5), inset 0 -4px 0 rgba(0,0,0,.25), ${elevation[1]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
      {kind === 'video' && <svg width={40} height={40} viewBox="0 0 40 40"><path d="M13 9 L32 20 L13 31 Z" fill="#FFFFFF" /></svg>}
      {kind === 'text' && <span style={{fontFamily: 'Manrope', fontWeight: 800, fontSize: 48, color: '#15171A'}}>Aa</span>}
      {kind === 'sound' && <svg width={w - 40} height={50}>{Array.from({length: Math.floor((w - 40) / 14)}, (_, i) => { const hh = 10 + Math.abs(Math.sin(i * 1.7)) * 36; return <rect key={i} x={i * 14} y={25 - hh / 2} width={7} height={hh} rx={3.5} fill="#05231D" />; })}</svg>}
    </div>
  );
};
const TRACKS: {label: string; clips: [number, 'video' | 'text' | 'gfx' | 'sound', number][]}[] = [
  {label: 'Видео', clips: [[330, 'video', -0.4], [250, 'video', 0.35], [200, 'video', 1.0]]},
  {label: 'Титры', clips: [[180, 'text', -0.3], [240, 'text', 0.55], [160, 'text', 1.25]]},
  {label: 'Графика', clips: [[220, 'gfx', 0.15], [300, 'gfx', 0.85]]},
  {label: 'Звук', clips: [[520, 'sound', 0.45], [240, 'sound', 1.4]]},
];
const Timeline: React.FC<{t: number}> = ({t}) => (
  <div style={{position: 'relative', width: 1240, height: 800, borderRadius: 56, padding: '46px 40px', boxSizing: 'border-box', ...glassFill('clear', '16,18,20'), boxShadow: elevation[3]}}>
    <GlassLayers radius={56} />
    {TRACKS.map((tr, i) => (
      <div key={tr.label} style={{position: 'relative', display: 'flex', alignItems: 'center', gap: 22, height: 150, borderBottom: i < 3 ? '2px solid rgba(255,255,255,.08)' : undefined}}>
        <span style={{width: 250, flex: 'none', fontFamily: 'Manrope', fontWeight: 700, fontSize: 60, color: TXT, textShadow: textDepth}}>{tr.label}</span>
        {tr.clips.map(([w, kind, at], k) => <Clip key={k} w={w} kind={kind} at={at} t={t} />)}
      </div>
    ))}
    {/* плейхед идёт сам — монтаж «играет» */}
    <div style={{position: 'absolute', top: 30, bottom: 30, left: 330 + ((t * 260) % 820), width: 6, borderRadius: 3, background: O, boxShadow: `0 0 18px ${O}`}} />
  </div>
);

const StrikePill: React.FC<{t: number}> = ({t}) => {
  const k = spring({frame: Math.round((t - 1.05) * 30), fps: 30, config: {damping: 12, stiffness: 180}});
  const strike = iv(t, 1.25, 1.45);
  const fall = iv(t, 1.55, 2.05, 0, 1, easeIn);
  if (t < 1.0) return null;
  return (
    <div style={{position: 'relative', display: 'inline-flex', padding: '20px 54px', borderRadius: 999, ...glassFill('clear', '16,18,20'), boxShadow: elevation[2],
      transform: `scale(${k}) translate(${fall * 180}px, ${fall * 1300}px) rotate(${fall * 38}deg)`, opacity: 1 - iv(t, 1.9, 2.05)}}>
      <GlassLayers radius={999} />
      <span style={{position: 'relative', fontFamily: 'Manrope', fontWeight: 800, fontSize: 92, color: TXT, textShadow: textDepth}}>монтажёр</span>
      <span style={{position: 'absolute', left: 40, top: '52%', height: 12, width: `calc((100% - 80px) * ${strike})`, borderRadius: 6, background: O, boxShadow: `0 0 20px ${O}`}} />
    </div>
  );
};

// Робот: визор — окно в следующую сцену. Центр визора в кадре при размере 760: (x + 380, y + 269), радиус ≈ 124.
const R = {x: 340, y: 380, size: 760};
const VISOR = {x: R.x + 380, y: R.y + 0.354 * R.size, r: 0.163 * R.size};

const SceneDesk: React.FC<{t: number}> = ({t}) => {
  const reveal = iv(t, 1.95, 2.65);
  const rise = spring({frame: Math.round((t - 2.25) * 30), fps: 30, config: {damping: 15, stiffness: 120, mass: 0.9}});
  const orbit = Math.sin(Math.max(0, t - 2.6) * 1.2) * 3 * reveal;
  const headK = spring({frame: Math.round((t - 1.95) * 30), fps: 30, config: {damping: 11, stiffness: 170}});
  const headOut = iv(t, 2.15, 2.45);
  return (
    <AbsoluteFill style={{background: 'radial-gradient(90% 60% at 30% 20%, #26292D 0%, #121416 55%, #07080A 100%)'}}>
      {/* верхний план: заголовок «Этот ролик смонтировал …», на месте падающего «монтажёр» — «ИИ-агент» */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
        transform: `translateY(${-headOut * 260}px)`, opacity: 1 - headOut, filter: `blur(${headOut * 12}px)`}}>
        <Headline text="Этот ролик смонтировал" at={-0.4} size={96} width={1300} />
        <div style={{height: 150, position: 'relative', display: 'flex', justifyContent: 'center', width: 1300}}>
          <div style={{position: 'absolute'}}><StrikePill t={t} /></div>
          {t >= 1.9 && (
            <div style={{position: 'absolute', transform: `scale(${headK})`, padding: '20px 54px', borderRadius: 999, background: M,
              boxShadow: `inset 0 3px 0 rgba(255,255,255,.6), inset 0 -5px 0 rgba(0,0,0,.2), 0 0 60px ${M}88, ${elevation[2]}`,
              fontFamily: 'Manrope', fontWeight: 800, fontSize: 92, color: '#05231D'}}>ИИ-агент</div>
          )}
        </div>
      </div>
      {/* второй план: робот поднимается из-за откинутого экрана */}
      <div style={{position: 'absolute', left: R.x, top: R.y, transform: `translateY(${(1 - rise) * 700}px)`, opacity: t < 2.25 ? 0 : 1}}>
        <Robot3D size={R.size} look={[t > 2.7 ? 0 : 0.25 * Math.sin(t * 2), t > 2.7 ? 0 : 0.1]} hover={0.02} />
      </div>
      {/* плоскость монтажа: сначала плоский экран, на «ИИ-агент» откидывается назад на петле нижнего края */}
      <div style={{position: 'absolute', inset: 0, perspective: 1600, perspectiveOrigin: '720px 380px'}}>
        <div style={{position: 'absolute', left: 100, top: 560, transformOrigin: '50% 100%',
          transform: `translateY(${reveal * 150}px) rotateX(${reveal * 60}deg) rotateY(${orbit}deg) translateZ(${-reveal * 60}px)`}}>
          <Timeline t={t} />
        </div>
      </div>
      {/* первый план: капсулы у самой камеры, в расфокусе */}
      {reveal > 0 && (
        <>
          <div style={{position: 'absolute', left: -60, top: 1180 - reveal * 60, transform: `rotate(-12deg) scale(1.3)`, filter: 'blur(3.5px)', opacity: reveal}}>
            <LiquidCapsule w={420} h={120} level={0.62} t={t} tone="orange" />
          </div>
          <div style={{position: 'absolute', left: 1130, top: 330 + reveal * 40, transform: `rotate(18deg) scale(1.15)`, filter: 'blur(3px)', opacity: reveal}}>
            <LiquidCapsule w={360} h={110} level={0.5} t={t + 1} tone="mint" />
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};

// ---------- S2: лунный свет, наклонный экран сайта, заголовок отрывается от страницы; капсулы на трёх планах ----------
const Moonlight: React.FC = () => (
  <AbsoluteFill style={{background: '#050607'}}>
    <AbsoluteFill style={{background: 'radial-gradient(1500px 1100px at 180px -120px, rgba(235,255,250,.22) 0%, rgba(235,255,250,.06) 45%, transparent 70%)'}} />
    <div style={{position: 'absolute', left: -300, top: -200, width: 900, height: 3400, transform: 'rotate(-28deg)', transformOrigin: '0 0',
      background: 'linear-gradient(90deg, transparent, rgba(240,255,251,.07), transparent)', filter: 'blur(30px)'}} />
    <AbsoluteFill style={{background: 'radial-gradient(1200px 700px at 720px 2300px, rgba(61,237,195,.10) 0%, transparent 70%)'}} />
  </AbsoluteFill>
);
const SITE = {w: 1300, h: 833};
const SceneSite: React.FC<{t: number}> = ({t}) => {
  const glide = iv(t, 3.4, 5.2, 0, 1, Easing.linear);
  const away = iv(t, 4.95, 5.4, 0, 1, easeIn);
  const pop = iv(t, 4.05, 4.6, 0, 1, out);
  const small = spring({frame: Math.round((t - 3.4) * 30), fps: 30, config: {damping: 12, stiffness: 150}});
  const ring = iv(t, 3.55, 4.1, 0, 1, out);
  const fly = iv(t, 3.5, 5.1, 0, 1, Easing.bezier(0.4, 0, 0.9, 0.6));
  const moon = iv(t, 3.85, 4.8, 0, 1, inOut);
  const mx = 720 + (1180 - 720) * moon, my = 649 + (250 - 649) * moon, mr = 118 - 48 * moon;
  return (
    <AbsoluteFill>
      <Moonlight />
      {/* луна: сначала ровно в визоре робота (окно в эту сцену), потом уплывает в угол и светит сцене */}
      <div style={{position: 'absolute', left: mx - mr * 3, top: my - mr * 3, width: mr * 6, height: mr * 6, borderRadius: '50%',
        background: 'radial-gradient(closest-side, rgba(240,255,251,.35), rgba(240,255,251,0))'}} />
      <div style={{position: 'absolute', left: mx - mr, top: my - mr, width: mr * 2, height: mr * 2, borderRadius: '50%',
        background: 'radial-gradient(circle at 36% 32%, #FFFFFF 0%, #EAF7F3 45%, #B9CCC6 100%)', boxShadow: '0 0 80px rgba(240,255,251,.6), inset -18px -14px 30px rgba(0,0,0,.18)'}} />
      {/* третий план: маленькая капсула «монтаж» — «самое простое», кольцо на слове */}
      <div style={{position: 'absolute', left: 900, top: 360 - away * 400, transform: `scale(${small * (1 - away)})`, opacity: 1 - away}}>
        <div style={{position: 'absolute', left: -30, top: -30, right: -30, bottom: -30, borderRadius: 999, border: `5px solid ${M}`, opacity: (1 - ring) * (ring > 0 ? 1 : 0), transform: `scale(${1 + ring * 0.5})`}} />
        <LiquidCapsule w={340} h={104} level={0.3} t={t} tone="mint" label="монтаж" labelSize={60} />
      </div>
      {/* второй план: капсула «база данных» */}
      <div style={{position: 'absolute', left: 90, top: 520 - glide * 60 - away * 600, opacity: 1 - away}}>
        <LiquidCapsule w={560} h={150} level={0.72} t={t} slosh={0.2} tone="orange" label="база данных" labelSize={62} />
      </div>
      {/* наклонный экран: первый экран сайта лежит наискось, камера скользит над ним */}
      <div style={{position: 'absolute', inset: 0, perspective: 1300, perspectiveOrigin: '720px 200px'}}>
        <div style={{position: 'absolute', left: 720 - SITE.w / 2 + 60, top: 640 + (1 - glide) * 140 + away * 1400, width: SITE.w, height: SITE.h, transformStyle: 'preserve-3d',
          transform: `rotateX(${54 - glide * 8}deg) rotateZ(${-5 + glide * 3}deg) scale(${0.92 + glide * 0.06})`}}>
          <Img src={staticFile('reels/vibe/site-hero.png')} style={{position: 'absolute', inset: 0, width: SITE.w, height: SITE.h, borderRadius: 30, boxShadow: '0 60px 120px rgba(0,0,0,.6), 0 0 0 3px rgba(255,255,255,.2)'}} />
          {/* заголовок сайта отрывается от страницы и встаёт к зрителю */}
          <div style={{position: 'absolute', left: 32, top: 244, width: 580, height: 205, borderRadius: 16,
            backgroundImage: `url(${staticFile('reels/vibe/site-hero.png')})`, backgroundSize: `${SITE.w}px ${SITE.h}px`, backgroundPosition: '-32px -244px',
            transform: `translateZ(${pop * 150}px) rotateX(${-pop * 34}deg) scale(${1 + pop * 0.1})`, transformOrigin: '50% 100%',
            boxShadow: `0 ${pop * 50}px ${pop * 90}px rgba(0,0,0,${0.5 * pop})`}} />
        </div>
      </div>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, transparent 0%, transparent 50%, rgba(5,6,7,.92) 57%, #050607 64%)'}} />
      {/* первый план: капсула «приём оплаты» пролетает у самой камеры — выше полосы субтитров */}
      <div style={{position: 'absolute', left: 760 + fly * 760, top: 1000 + fly * 150, transform: `scale(${1.05 + fly * 1.1}) rotate(${-8 + fly * 10}deg)`, filter: `blur(${1.5 + fly * 9}px)`}}>
        <LiquidCapsule w={620} h={170} level={0.8} t={t} slosh={0.4} tone="mint" label="приём оплаты" labelSize={64} />
      </div>
    </AbsoluteFill>
  );
};

// ---------- S3: капсула «нейросеть» прилетает из глубины и сливается на «не» ----------
const ChatIcon: React.FC<{s: number}> = ({s}) => (
  <svg width={s} height={s} viewBox="0 0 40 40"><path d="M6 8 H34 A4 4 0 0 1 38 12 V26 A4 4 0 0 1 34 30 H18 L10 36 V30 H6 A4 4 0 0 1 2 26 V12 A4 4 0 0 1 6 8 Z" fill="#FFFFFF" /></svg>
);
const SceneDrain: React.FC<{t: number}> = ({t}) => {
  const come = iv(t, 4.95, 5.5, 0, 1, out);
  const level = interpolate(t, [5.85, 6.45], [0.88, 0.04], {...clamp, easing: Easing.bezier(0.5, 0, 0.6, 1)});
  const slosh = interpolate(t, [5.8, 6.1, 6.6, 6.9], [0.1, 1, 0.5, 0.2], clamp);
  const dim = iv(t, 6.4, 6.8);
  // струя: появляется со сливом, сначала толстая, к концу тонкая; капли летят вниз
  const pour = interpolate(t, [5.85, 5.95, 6.35, 6.55], [0, 1, 0.6, 0], clamp);
  const len = iv(t, 5.85, 6.1, 0, 1, easeIn) * 430;
  return (
    <AbsoluteFill>
      <Moonlight />
      <div style={{position: 'absolute', left: 1080, top: 380, transform: 'rotate(14deg)', filter: 'blur(4px)', opacity: 0.8}}>
        <LiquidCapsule w={300} h={90} level={0.55} t={t + 2} tone="orange" />
      </div>
      <div style={{position: 'absolute', left: 90, top: 1150, transform: 'rotate(-10deg)', filter: 'blur(5px)', opacity: 0.7}}>
        <LiquidCapsule w={340} h={96} level={0.4} t={t + 4} tone="white" />
      </div>
      {pour > 0 && (
        <div style={{position: 'absolute', left: 720, top: 945, width: 0, height: 0}}>
          <div style={{position: 'absolute', left: -14 * pour, width: 28 * pour, height: len, borderRadius: 14,
            background: `linear-gradient(180deg, ${M} 0%, rgba(61,237,195,.75) 60%, rgba(61,237,195,0) 100%)`, boxShadow: `0 0 30px ${M}66`}} />
          {Array.from({length: 10}, (_, i) => {
            const ph = ((t - 5.85) * 2.2 + i / 10) % 1;
            return <span key={i} style={{position: 'absolute', left: -6 + Math.sin(i * 2.1) * 30, top: 60 + ph * 420, width: 12, height: 18, borderRadius: '50%',
              background: M, opacity: pour * (1 - ph)}} />;
          })}
        </div>
      )}
      <div style={{position: 'absolute', left: 720, top: 820, width: 0, height: 0}}>
        <div style={{position: 'absolute', transform: `translate(-50%, -50%) translateY(${(1 - come) * -380}px) scale(${0.2 + come * 0.8})`, opacity: come}}>
          <LiquidCapsule w={1000} h={280} level={level} t={t} slosh={slosh} tone="mint" label="нейросеть" labelSize={104} icon={<ChatIcon s={92} />} dim={dim} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- S4: свет гаснет, загорается прожектор: сначала «ты», потом луч уходит на коллегу ----------
const Person: React.FC = () => (
  <svg width={200} height={200} viewBox="0 0 100 100"><circle cx={50} cy={34} r={18} fill="rgba(255,255,255,.9)" /><path d="M16 92 C16 66 32 58 50 58 C68 58 84 66 84 92 Z" fill="rgba(255,255,255,.9)" /></svg>
);
const ExpertCard: React.FC<{t: number; lit: number; agent: number; pulse: number}> = ({t, lit, agent, pulse}) => {
  const flick = lit > 0 && lit < 1 ? (Math.sin(t * 90) > 0 ? 1 : 0.45) : lit;
  return (
    <div style={{position: 'relative', width: 460, height: 650, borderRadius: 52, padding: '44px 40px', boxSizing: 'border-box', ...glassFill('clear', '16,18,20'),
      boxShadow: `${elevation[3]}, 0 0 ${60 * flick}px ${M}${Math.round(flick * 140).toString(16).padStart(2, '0')}`, border: `4px solid ${flick > 0.5 ? M : 'rgba(255,255,255,.14)'}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22}}>
      <GlassLayers radius={52} />
      <Person />
      <span style={{position: 'relative', fontFamily: 'Manrope', fontWeight: 800, fontSize: 64, color: TXT, textShadow: textDepth}}>эксперт</span>
      <div style={{position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', gap: 16, marginTop: 10}}>
        {[1, 0.8, 0.9].map((k, i) => (
          <div key={i} style={{height: 22, borderRadius: 11, background: 'rgba(255,255,255,.12)', overflow: 'hidden'}}>
            <div style={{width: `${k * 100}%`, height: '100%', borderRadius: 11, background: pulse > 0 ? M : 'rgba(255,255,255,.55)', opacity: 0.6 + pulse * 0.4}} />
          </div>
        ))}
      </div>
      {agent > 0 && (
        <div style={{position: 'absolute', top: -70, left: '50%', transform: `translateX(-50%) scale(${agent})`, padding: '16px 40px', borderRadius: 999, background: M, whiteSpace: 'nowrap',
          boxShadow: `inset 0 3px 0 rgba(255,255,255,.6), 0 0 50px ${M}AA`, fontFamily: 'Manrope', fontWeight: 800, fontSize: 62, color: '#05231D'}}>+ ИИ-агент</div>
      )}
    </div>
  );
};
const SceneSpot: React.FC<{t: number}> = ({t}) => {
  const on = t < 7.0 ? 0 : t < 7.18 ? (Math.floor(t * 40) % 2 ? 1 : 0.2) : 1;
  const sweep = spring({frame: Math.round((t - 7.4) * 30), fps: 30, config: {damping: 11, stiffness: 120, mass: 0.9}});
  const x = 420 + (1020 - 420) * sweep;
  const lit = iv(t, 7.62, 7.95, 0, 1, Easing.linear);
  const agent = spring({frame: Math.round((t - 9.2) * 30), fps: 30, config: {damping: 10, stiffness: 170}});
  const pulse = t > 8.05 && t < 9.1 ? 0.5 + 0.5 * Math.sin((t - 8.05) * 12) : 0;
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #07080A 0%, #0B0C0E 55%, #16181B 70%, #0A0B0D 100%)'}}>
      <div style={{position: 'absolute', inset: 0, perspective: 1500, perspectiveOrigin: '720px 700px'}}>
        <div style={{position: 'absolute', left: 190, top: 560, transform: 'rotateY(18deg)'}}><ExpertCard t={t} lit={0} agent={0} pulse={pulse * 0.6} /></div>
        <div style={{position: 'absolute', left: 790, top: 560, transform: 'rotateY(-18deg)'}}><ExpertCard t={t} lit={lit} agent={agent} pulse={pulse} /></div>
      </div>
      {/* отражение карточек в глянцевом полу */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, transparent 0%, transparent 47%, rgba(255,255,255,.04) 52%, transparent 62%)'}} />
      <Spotlight w={1440} h={2560} src={[720, -160]} x={x} y={885} r={330} on={on} t={t} floorY={1240} />
      {/* неоновая надпись над выбранной карточкой: киберпанк-мерцание */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 300, display: 'flex', justifyContent: 'center', opacity: lit > 0 ? (lit < 1 ? (Math.sin(t * 70) > 0 ? 1 : 0.3) : 1) : 0}}>
        <span style={{fontFamily: 'Manrope', fontWeight: 800, fontSize: 104, color: '#EFFFFA', letterSpacing: '-0.02em',
          textShadow: `0 0 12px ${M}, 0 0 40px ${M}, 0 0 90px ${M}`}}>коллега</span>
      </div>
    </AbsoluteFill>
  );
};

const SFX: [number, string, number][] = [
  [1.25, 'rubber', 0.5], [1.95, 'whoosh', 0.5], [3.45, 'zoom', 0.55], [4.05, 'transform', 0.45], [5.85, 'blur', 0.5], [7.0, 'switch', 0.6], [7.45, 'whoosh-long', 0.35], [9.2, 'flash', 0.45],
];

export const Concept10: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  // пролёт сквозь визор: сцена растёт вокруг визора, круглое окно с новой сценой растёт вместе с ним
  const k = t < 3.0 ? 1 : t < 3.45 ? interpolate(t, [3.0, 3.45], [1, 1.45], {...clamp, easing: inOut}) : interpolate(t, [3.45, 3.9], [1.45, 14], {...clamp, easing: easeIn});
  const windowOpen = iv(t, 2.7, 2.95);
  const maskR = VISOR.r * 0.97 * k;
  // затемнение между капсулой и прожектором: свет гаснет — это и есть склейка
  const lightsOut = interpolate(t, [6.55, 6.85, 6.95, 7.0], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {t < 3.95 && (
        <AbsoluteFill style={{transformOrigin: `${VISOR.x}px ${VISOR.y}px`, transform: `scale(${k})`, filter: k > 2 ? `blur(${Math.min(14, (k - 2) * 1.5)}px)` : undefined}}>
          <SceneDesk t={t} />
        </AbsoluteFill>
      )}
      {t >= 2.7 && t < 5.5 && (
        <AbsoluteFill style={{clipPath: t < 3.9 ? `circle(${maskR}px at ${VISOR.x}px ${VISOR.y}px)` : undefined, opacity: t < 3.0 ? windowOpen : 1}}>
          <SceneSite t={t} />
        </AbsoluteFill>
      )}
      {t >= 4.9 && t < 6.95 && <AbsoluteFill style={{opacity: iv(t, 4.9, 5.2)}}><SceneDrain t={t} /></AbsoluteFill>}
      {t >= 6.9 && <SceneSpot t={t} />}
      <AbsoluteFill style={{background: '#000', opacity: lightsOut}} />
      <Captions words={WORDS} pages={PAGES} />
      <SpeakerCard plan={[]} start="base" placeholder src="reels/money/speaker.mp4" headY={886} />
      {SFX.map(([s, f, v], i) => <Sequence key={i} from={Math.round(s * fps)}><Audio src={staticFile(`sfx/${f}.wav`)} volume={v} /></Sequence>)}
    </AbsoluteFill>
  );
};
