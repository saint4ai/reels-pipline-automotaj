import {evolvePath} from '@remotion/paths';
import {C} from '../theme';

// Пунктир карты: рисуется по ходу через маску, сам остаётся пунктиром.
export const DashedPath: React.FC<{id: string; d: string; progress: number; w: number; h: number; x?: number; y?: number}> = ({id, d, progress, w, h, x = 0, y = 0}) => {
  const {strokeDasharray, strokeDashoffset} = evolvePath(Math.max(0.0001, progress), d);
  return (
    <svg width={w} height={h} style={{position: 'absolute', left: x, top: y, overflow: 'visible'}}>
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x={-4000} y={-4000} width={10000} height={10000}>
          <path d={d} stroke="white" strokeWidth={14} fill="none" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} />
        </mask>
      </defs>
      <path d={d} stroke={C.dash} strokeWidth={6} fill="none" strokeDasharray="22 18" strokeLinecap="round" mask={`url(#${id})`} />
    </svg>
  );
};
