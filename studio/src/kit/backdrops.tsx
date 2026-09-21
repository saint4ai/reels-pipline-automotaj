import {AbsoluteFill} from 'remotion';
import {useFrame30} from './motion';

// Фоны режима «сцены». В референсе фон меняется каждые 3–7 с: чёрный → небо → чёрный → цветное свечение → белый.
// Палитра 18.09.2026: чёрный, графит, белый, мятный, оранжевый. Голубое небо референса у нас закатное.
export type BackdropKind = 'black' | 'graphite' | 'white' | 'mint' | 'ember' | 'sky';

// Цвет текста на каждом фоне: контраст ≥ 4.5:1. На светлых фонах текст тёмный.
export const ink: Record<BackdropKind, string> = {
  black: '#F2F3F5', graphite: '#F2F3F5', white: '#101214', mint: '#F2F3F5', ember: '#F2F3F5', sky: '#1A0E07',
};
// Сплошной цвет фона — им же красятся переходы «через цвет».
export const bgColor: Record<BackdropKind, string> = {
  black: '#0D0E10', graphite: '#26292D', white: '#F3F4F2', mint: '#0B3A31', ember: '#3A1A0A', sky: '#FFB07A',
};

const fills: Record<Exclude<BackdropKind, 'sky'>, string> = {
  black: 'radial-gradient(120% 70% at 50% 30%, #17191C 0%, #0D0E10 60%, #08090A 100%)',
  graphite: 'radial-gradient(110% 70% at 50% 35%, #3B3F45 0%, #2A2D32 45%, #1C1E21 100%)',
  white: 'radial-gradient(110% 70% at 50% 30%, #FFFFFF 0%, #F3F4F2 55%, #E4E6E3 100%)',
  mint: 'radial-gradient(90% 55% at 50% 42%, #3DEDC3 0%, #17A888 30%, #0B3A31 68%, #051A16 100%)',
  ember: 'radial-gradient(90% 55% at 50% 42%, #FF9A55 0%, #FF7A2F 22%, #A8431A 50%, #3A1A0A 78%, #140905 100%)',
};

// Облака рисуются градиентами, а не картинкой: вектор в разрешении вывода, медленный дрейф.
const clouds = [
  {x: 8, y: 14, w: 70, h: 16, o: 0.75}, {x: 55, y: 8, w: 60, h: 13, o: 0.6}, {x: -12, y: 40, w: 66, h: 15, o: 0.55},
  {x: 48, y: 50, w: 72, h: 17, o: 0.7}, {x: 10, y: 74, w: 80, h: 18, o: 0.65}, {x: 62, y: 84, w: 58, h: 14, o: 0.5},
];
const Sky: React.FC<{drift: number}> = ({drift}) => (
  <AbsoluteFill style={{background: 'linear-gradient(180deg, #E8622A 0%, #FF8A4C 28%, #FFB07A 58%, #FFD9B8 100%)', overflow: 'hidden'}}>
    {clouds.map((c, i) => (
      <div key={i} style={{position: 'absolute', left: `${c.x + drift * (i % 2 ? 0.6 : 1)}%`, top: `${c.y}%`, width: `${c.w}%`, height: `${c.h}%`,
        borderRadius: '50%', background: `radial-gradient(closest-side, rgba(255,246,236,${c.o}) 0%, rgba(255,240,226,${c.o * 0.5}) 55%, rgba(255,236,220,0) 100%)`,
        filter: 'blur(18px)'}} />
    ))}
  </AbsoluteFill>
);

// Фон на весь кадр. Зерно и виньетка общие для всех фонов, чтобы плоские заливки не выглядели пустыми.
export const Backdrop: React.FC<{kind: BackdropKind}> = ({kind}) => {
  const frame = useFrame30();
  return (
    <AbsoluteFill>
      {kind === 'sky' ? <Sky drift={frame * 0.03} /> : <AbsoluteFill style={{background: fills[kind]}} />}
      <AbsoluteFill style={{opacity: kind === 'white' || kind === 'sky' ? 0.05 : 0.08, mixBlendMode: 'overlay',
        backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 width=%27240%27 height=%27240%27><filter id=%27n%27><feTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27/></filter><rect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27/></svg>")'}} />
      <AbsoluteFill style={{background: kind === 'white' ? 'radial-gradient(140% 90% at 50% 40%, transparent 60%, rgba(0,0,0,.06) 100%)'
        : 'radial-gradient(140% 90% at 50% 40%, transparent 55%, rgba(0,0,0,.35) 100%)'}} />
    </AbsoluteFill>
  );
};
