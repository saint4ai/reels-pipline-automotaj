import type {Meta, StoryObj} from '@storybook/react-vite';
import {Player} from '@remotion/player';
import {FORMATS, type FormatId} from '../formats';
import {reelOf, STYLES} from '../styles';
import {DEMO} from '../template/demo';

// Витрина стилей 5–12: весь демо-ролик с перемоткой в каждом стиле и формате.
const View: React.FC<{style: string; format: FormatId}> = ({style, format}) => {
  const f = FORMATS[format], def = STYLES.find((s) => s.id === style)!.def, C = reelOf(def);
  const k = format === 'reels' ? 0.3 : 0.32;
  return <Player component={C} inputProps={{format, project: DEMO}} durationInFrames={Math.round(DEMO.duration * f.fps)} fps={f.fps}
    compositionWidth={f.w} compositionHeight={f.h} style={{width: f.w * k, height: f.h * k}} controls loop autoPlay />;
};
const meta: Meta<typeof View> = {title: 'Стили/5–12 на Remotion', component: View, parameters: {noPlayer: true},
  argTypes: {style: {control: 'select', options: STYLES.map((s) => s.id)}, format: {control: 'inline-radio', options: ['reels', 'youtube']}}};
export default meta;
type S = StoryObj<typeof View>;
export const PRISM: S = {args: {style: 'PRISM', format: 'reels'}};
export const ORBIT: S = {args: {style: 'ORBIT', format: 'reels'}};
export const TRACE: S = {args: {style: 'TRACE', format: 'reels'}};
export const PULSE: S = {args: {style: 'PULSE', format: 'reels'}};
export const GLASS: S = {name: 'Экспертное стекло', args: {style: 'GLASS', format: 'reels'}};
export const PORTRAIT: S = {name: 'Портрет-квадрат', args: {style: 'PORTRAIT', format: 'reels'}};
export const APPLE: S = {name: 'Apple depth', args: {style: 'APPLE', format: 'reels'}};
export const PODCAST: S = {name: 'Подкаст', args: {style: 'PODCAST', format: 'reels'}};
export const YouTube: S = {name: 'Любой стиль — YouTube', args: {style: 'ORBIT', format: 'youtube'}};
