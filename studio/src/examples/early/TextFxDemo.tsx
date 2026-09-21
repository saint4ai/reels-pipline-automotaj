import {AbsoluteFill} from 'remotion';
import {AccentFX, type Accent} from './compositions/AccentFX';

// Витрина эффектов текста из kit/remocn: маркер, глитч, счётчик, обводка, подчёркивание, стрелка, зачёркивание, шаги,
// подъём по буквам, маска, трекинг, блик, матрица, барабан. По 1,6 с на эффект.
const T = 1.6;
const LIST: Omit<Accent, 'at' | 'dur'>[] = [
  {kind: 'marker', text: 'агент монтирует'}, {kind: 'glitch', text: 'ошибка'}, {kind: 'number', to: 36, label: 'уроков'},
  {kind: 'scribble'}, {kind: 'underline'}, {kind: 'arrow'}, {kind: 'strike', text: 'руками'},
  {kind: 'rise', text: 'подъём по буквам'}, {kind: 'mask', text: 'из-под маски'}, {kind: 'tracking', text: 'трекинг'},
  {kind: 'shimmer', text: 'блик по слову'}, {kind: 'matrix', text: 'расшифровка'}, {kind: 'slot', from: 'маркетолог', text: 'эксперт'},
] as never;
export const TEXTFX_FRAMES = Math.round(LIST.length * T * 30);
export const TextFxDemo: React.FC = () => (
  <AbsoluteFill style={{background: 'radial-gradient(120% 80% at 50% 30%, #1A1E23, #0B0D10)'}}>
    <AccentFX accents={LIST.map((a, i) => ({...a, at: i * T, dur: T}) as Accent)} posY={0.42} />
  </AbsoluteFill>
);
