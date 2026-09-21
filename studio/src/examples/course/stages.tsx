import {AbsoluteFill} from 'remotion';
import {Beam, Dust, Grain, type Spot} from '../../kit/liquid/stage';
import {H, W} from '../../theme';

// Фоны ролика 22 «Премьера»: свет и воздух вместо «тупо чёрного». Всё — функции времени t.

// Театр: тёплый графит, мягкий прожектор сверху, дымка, пятно света на полу.
export const Theatre: React.FC<{t: number; tint?: number}> = ({t, tint = 0}) => {
  const warm = `rgba(255,${190 + 40 * tint},${140 + 80 * tint},`;
  const spots: Spot[] = [{x: 720, y: -260, angle: 1.5 * Math.sin(t * 0.4), spread: 13, power: 0.8, color: tint > 0.5 ? '214,255,245' : '255,236,214'}];
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: `radial-gradient(110% 70% at 50% 35%, ${tint > 0.5 ? '#12201D' : '#211A15'} 0%, #0E0C0B 60%, #070606 100%)`}}>
      <div style={{position: 'absolute', left: -300, top: 200, width: W + 600, height: 1600, borderRadius: '50%', filter: 'blur(40px)',
        background: `radial-gradient(closest-side, ${warm}.10), ${warm}0))`, transform: `translateX(${Math.sin(t * 0.3) * 60}px)`}} />
      {spots.map((s, i) => <Beam key={i} s={s} />)}
      <div style={{position: 'absolute', left: W / 2 - 520, top: 1520, width: 1040, height: 220, borderRadius: '50%', mixBlendMode: 'screen',
        background: `radial-gradient(closest-side, ${warm}.35), ${warm}0))`}} />
      <Dust t={t} spots={spots} n={60} />
      <AbsoluteFill style={{background: 'radial-gradient(140% 90% at 50% 40%, transparent 55%, rgba(0,0,0,.55) 100%)'}} />
      <Grain o={0.06} />
    </AbsoluteFill>
  );
};

// Два света: тёплый слева («ты»), мятный справа («коллега с агентом»). grey — левая половина уходит в серость (блок «на какой ты стороне»).
export const TwoLights: React.FC<{t: number; grey?: number; split?: number}> = ({t, grey = 0, split = 0.5}) => (
  <AbsoluteFill style={{overflow: 'hidden', background: '#0B0C0E'}}>
    <div style={{position: 'absolute', left: -500, top: 300 + 40 * Math.sin(t * 0.5), width: 1500, height: 1500, borderRadius: '50%', filter: `blur(30px) saturate(${1 - grey})`,
      background: `radial-gradient(closest-side, rgba(255,122,47,${0.55 - 0.3 * grey}), rgba(255,122,47,0))`}} />
    <div style={{position: 'absolute', left: 440, top: 260 + 40 * Math.cos(t * 0.45), width: 1500, height: 1500, borderRadius: '50%', filter: 'blur(30px)',
      background: 'radial-gradient(closest-side, rgba(61,237,195,.5), rgba(61,237,195,0))'}} />
    <div style={{position: 'absolute', left: W * split - 1, top: 0, width: 2, height: H, background: 'linear-gradient(180deg, transparent, rgba(255,255,255,.18), transparent)'}} />
    <AbsoluteFill style={{background: 'radial-gradient(140% 90% at 50% 40%, transparent 50%, rgba(0,0,0,.55) 100%)'}} />
    <Grain o={0.06} />
  </AbsoluteFill>
);

// Галерея работ: тёплая тёмная стена во всю ширину мира, над каждым экспонатом — луч и световая ниша, пол с отражением.
export const Gallery: React.FC<{t: number; w: number; xs: number[]}> = ({t, w, xs}) => {
  const spots: Spot[] = xs.map((x) => ({x, y: -240, angle: 0, spread: 12, power: 0.75, color: '255,238,220'}));
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: w, height: H, overflow: 'hidden',
      background: 'linear-gradient(180deg, #1A1614 0%, #15120F 58%, #0C0B0A 58.1%, #070606 100%)'}}>
      {xs.map((x, i) => (
        <div key={i} style={{position: 'absolute', left: x - 560, top: 240, width: 1120, height: 1260, borderRadius: 40,
          background: 'radial-gradient(70% 60% at 50% 30%, rgba(255,228,200,.10), rgba(255,228,200,0) 70%)', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,.03)'}} />
      ))}
      {spots.map((s, i) => <BeamWide key={i} s={s} w={w} />)}
      {xs.map((x, i) => (
        <div key={`p${i}`} style={{position: 'absolute', left: x - 480, top: 1480, width: 960, height: 180, borderRadius: '50%', mixBlendMode: 'screen',
          background: 'radial-gradient(closest-side, rgba(255,236,214,.28), rgba(255,236,214,0))'}} />
      ))}
      <div style={{position: 'absolute', left: 0, top: 0, width: w, height: H, background: `linear-gradient(90deg, rgba(0,0,0,.25), transparent 20%, transparent 80%, rgba(0,0,0,.25))`}} />
    </div>
  );
};
// Луч в мире шире кадра (Beam рисует SVG размером кадра; тут — размером мира).
const BeamWide: React.FC<{s: Spot; w: number}> = ({s, w}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: w, height: H}}>
    <div style={{position: 'absolute', left: s.x - 720, top: 0, width: 1440, height: H}}><Beam s={{...s, x: 720}} /></div>
  </div>
);

// Мятная аврора: глубокий тёмно-мятный фон, медленные полосы света.
export const Aurora: React.FC<{t: number}> = ({t}) => (
  <AbsoluteFill style={{overflow: 'hidden', background: 'radial-gradient(120% 80% at 50% 20%, #0F3A31 0%, #07201B 45%, #040C0B 100%)'}}>
    {[0, 1, 2].map((i) => (
      <div key={i} style={{position: 'absolute', left: -400 + i * 200, top: 300 + i * 380 + 60 * Math.sin(t * 0.5 + i), width: 2300, height: 380, borderRadius: '50%', filter: 'blur(50px)',
        transform: `rotate(${-14 + i * 9 + 3 * Math.sin(t * 0.3 + i)}deg)`, opacity: 0.55 - i * 0.12,
        background: `linear-gradient(90deg, rgba(61,237,195,0), rgba(${i === 1 ? '230,255,248' : '61,237,195'},.55), rgba(61,237,195,0))`}} />
    ))}
    <AbsoluteFill style={{background: 'radial-gradient(140% 90% at 50% 45%, transparent 50%, rgba(0,0,0,.5) 100%)'}} />
    <Grain o={0.06} />
  </AbsoluteFill>
);

// Графит с мятным ключевым светом сверху слева и тёплым контровым снизу справа.
export const GraphiteMint: React.FC<{t: number}> = ({t}) => (
  <AbsoluteFill style={{overflow: 'hidden', background: 'linear-gradient(170deg, #1B1F23 0%, #111316 55%, #0A0B0D 100%)'}}>
    <div style={{position: 'absolute', left: -400, top: -300, width: 1700, height: 1500, borderRadius: '50%', filter: 'blur(20px)',
      background: 'radial-gradient(closest-side, rgba(61,237,195,.28), rgba(61,237,195,0))', transform: `translate(${Math.sin(t * 0.4) * 40}px, 0)`}} />
    <div style={{position: 'absolute', left: 700, top: 1300, width: 1300, height: 1100, borderRadius: '50%', filter: 'blur(20px)',
      background: 'radial-gradient(closest-side, rgba(255,122,47,.22), rgba(255,122,47,0))'}} />
    <AbsoluteFill style={{backgroundImage: 'linear-gradient(rgba(255,255,255,.035) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,.035) 2px, transparent 2px)', backgroundSize: '120px 120px',
      maskImage: 'radial-gradient(70% 55% at 50% 42%, #000, transparent)', WebkitMaskImage: 'radial-gradient(70% 55% at 50% 42%, #000, transparent)'}} />
    <Grain o={0.06} />
  </AbsoluteFill>
);
