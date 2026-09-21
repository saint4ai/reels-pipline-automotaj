import {Easing, interpolate} from 'remotion';
import {useFrame30} from './motion';
import {color} from '../ds';

// Нарисованный курсор macOS: у автора ни одной записи экрана, по макетам ездит этот курсор.
// Движение — дугой (квадратичная кривая) с разгоном и торможением, щелчок — сжатие и мятное кольцо.
export type Move = {from: [number, number]; to: [number, number]; start: number; end: number; bend?: number};

const ease = Easing.bezier(0.45, 0, 0.2, 1);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Точка курсора в кадре frame: активный отрезок или конец последнего завершённого.
export const cursorAt = (moves: Move[], frame: number): [number, number] => {
  let m = moves[0];
  for (const mv of moves) if (frame >= mv.start) m = mv;
  const t = ease(interpolate(frame, [m.start, m.end], [0, 1], clamp));
  const [x0, y0] = m.from, [x1, y1] = m.to;
  const len = Math.hypot(x1 - x0, y1 - y0) || 1;
  const bend = m.bend ?? 0.18;
  // Контрольная точка сдвинута перпендикулярно отрезку — рука ведёт мышь дугой, а не по линейке.
  const cx = (x0 + x1) / 2 + (-(y1 - y0) / len) * len * bend, cy = (y0 + y1) / 2 + ((x1 - x0) / len) * len * bend;
  return [(1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t ** 2 * x1, (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t ** 2 * y1];
};

export const Cursor: React.FC<{moves: Move[]; clicks?: number[]; appear?: number; size?: number}> = ({moves, clicks = [], appear, size = 84}) => {
  const frame = useFrame30();
  const [x, y] = cursorAt(moves, frame);
  const start = appear ?? moves[0].start;
  const opacity = interpolate(frame, [start - 4, start + 2], [0, 1], clamp);
  const last = clicks.filter((c) => frame >= c).pop();
  const since = last === undefined ? 99 : frame - last;
  const press = since < 8 ? Math.sin((since / 8) * Math.PI) : 0;
  const ring = interpolate(since, [0, 14], [0, 1], clamp);
  return (
    <div style={{position: 'absolute', left: x, top: y, opacity, pointerEvents: 'none'}}>
      {since < 14 ? (
        <div style={{position: 'absolute', left: -size * 0.6 * ring, top: -size * 0.6 * ring, width: size * 1.2 * ring, height: size * 1.2 * ring,
          borderRadius: '50%', border: `${size * 0.06}px solid ${color.mint}`, opacity: 1 - ring}} />
      ) : null}
      <svg width={size} height={size * 1.3} viewBox="0 0 24 31" style={{position: 'absolute', left: -size * 0.12, top: -size * 0.06,
        transform: `scale(${1 - press * 0.14})`, transformOrigin: '10% 5%', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,.35))', overflow: 'visible'}}>
        <path d="M2 1.5 L2 24.5 L7.6 19.3 L11.3 28 L15.2 26.4 L11.6 17.9 L19.2 17.9 Z" fill="#FFFFFF" stroke="#0B0C0E" strokeWidth={1.7} strokeLinejoin="round" />
      </svg>
    </div>
  );
};
