import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

// Время библиотеки — в кадрах 30 fps при любой частоте композиции: at={90} значит 3 с и при 30, и при 60 fps.
// Ролик в родных 60 fps получает те же скорости анимаций, только плавнее.
export const useFrame30 = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (frame * 30) / fps;
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const out = Easing.bezier(0.16, 1, 0.3, 1);
const isDarkInk = (hex: string) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return 0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255) < 128;
};

// Слова проявляются по одному из размытия, как «я запустил блог» в референсе (шаг ~2 кадра, 10 кадров на слово).
// Тень под буквами даёт глубину и на тёмном, и на светлом фоне.
export const BlurIn: React.FC<{text: string; at?: number; size: number; color: string; weight?: number; stagger?: number;
  width?: number; align?: 'center' | 'left'; style?: React.CSSProperties}> =
  ({text, at = 0, size, color, weight = 700, stagger = 2, width, align = 'center', style}) => {
    const frame = useFrame30();
    const shadow = isDarkInk(color) ? '0 2px 0 rgba(255,255,255,.6), 0 12px 28px rgba(0,0,0,.14)' : '0 2px 0 rgba(0,0,0,.4), 0 10px 24px rgba(0,0,0,.5)';
    return (
      <div style={{width, textAlign: align, fontFamily: 'Manrope', fontWeight: weight, fontSize: size, lineHeight: 1.12,
        letterSpacing: '-0.02em', color, textShadow: shadow, ...style}}>
        {text.split(' ').map((word, i) => {
          const k = interpolate(frame, [at + i * stagger, at + i * stagger + 10], [0, 1], {...clamp, easing: out});
          return (
            <span key={i} style={{display: 'inline-block', opacity: k, filter: `blur(${(1 - k) * 14}px)`, transform: `translateY(${(1 - k) * 22}px)`,
              marginRight: '0.26em'}}>{word}</span>
          );
        })}
      </div>
    );
  };

// Подъём предмета снизу на пружине с лёгким перелётом — главный вход любого объекта в референсе.
export const RiseIn: React.FC<{at?: number; from?: number; children: React.ReactNode; damping?: number; style?: React.CSSProperties}> =
  ({at = 0, from = 700, children, damping = 15, style}) => {
    const frame = useFrame30();
    const k = spring({frame: frame - at, fps: 30, config: {damping, stiffness: 120, mass: 0.9}});
    return (
      <div style={{transform: `translateY(${(1 - k) * from}px) scale(${0.9 + k * 0.1})`, opacity: interpolate(k, [0, 0.25], [0, 1], clamp), ...style}}>
        {children}
      </div>
    );
  };

// Выпрыгивание с перелётом и лёгким покачиванием: календарь в иллюминаторе, значки, наклейки.
export const Pop: React.FC<{at?: number; children: React.ReactNode; tilt?: number; style?: React.CSSProperties}> = ({at = 0, children, tilt = 6, style}) => {
  const frame = useFrame30();
  const k = spring({frame: frame - at, fps: 30, config: {damping: 9, stiffness: 160, mass: 0.8}});
  const wobble = Math.sin((frame - at) / 4) * tilt * Math.max(0, 1 - (frame - at) / 24);
  return (
    <div style={{transform: `scale(${Math.max(0, k)}) rotate(${frame >= at ? wobble : 0}deg)`, ...style}}>{children}</div>
  );
};
