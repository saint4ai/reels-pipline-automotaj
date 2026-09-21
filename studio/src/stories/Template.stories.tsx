import type {Meta, StoryObj} from '@storybook/react-vite';
import {Player} from '@remotion/player';
import {FORMATS, type FormatId} from '../formats';
import type {BlockData} from '../template/blocks';
import {DEMO, type ProjectData} from '../template/demo';
import {Template} from '../template/Template';

// Витрина шаблона: весь ролик с перемоткой в двух форматах и каждый смысловой блок отдельно.
// Правило: блок сначала принимается здесь, потом идёт в ролик.
const shift = (b: BlockData, dt: number): BlockData => {
  const base = {...b, at: b.at - dt};
  switch (b.kind) {
    case 'hook': return {...b, ...base, strikeAt: b.strikeAt !== undefined ? b.strikeAt - dt : undefined} as BlockData;
    case 'list': return {...b, ...base, ticks: b.ticks.map((v) => v - dt)} as BlockData;
    case 'stat': return {...b, ...base, countAt: b.countAt - dt} as BlockData;
    case 'cta': return {...b, ...base, typeAt: b.typeAt - dt} as BlockData;
    default: return base as BlockData;
  }
};
const one = (id: string): ProjectData => {
  const b = DEMO.blocks.find((x) => x.id === id)!;
  return {duration: 4.5, words: [], blocks: [shift(b, b.at)], sfx: false};
};

const Reel: React.FC<{format: FormatId; project?: ProjectData; scale?: number}> = ({format, project = DEMO, scale}) => {
  const f = FORMATS[format];
  const k = scale ?? (format === 'reels' ? 0.3 : 0.32);
  return <Player component={Template} inputProps={{format, project}} durationInFrames={Math.round(project.duration * f.fps)} fps={f.fps}
    compositionWidth={f.w} compositionHeight={f.h} style={{width: f.w * k, height: f.h * k}} controls loop autoPlay />;
};

const meta: Meta<typeof Reel> = {title: 'Шаблон/Сценарный канвас', component: Reel, parameters: {noPlayer: true}};
export default meta;
type S = StoryObj<typeof Reel>;

export const РоликРилс: S = {name: 'Ролик — рилс 9:16', args: {format: 'reels'}};
export const РоликYouTube: S = {name: 'Ролик — YouTube 16:9', args: {format: 'youtube'}};
export const Хук: S = {name: 'Блок: хук', args: {format: 'reels', project: one('hook')}};
export const Список: S = {name: 'Блок: список с галочками', args: {format: 'reels', project: one('agent')}};
export const Цифра: S = {name: 'Блок: цифра', args: {format: 'reels', project: one('canvas')}};
export const Логотипы: S = {name: 'Блок: логотипы сервисов', args: {format: 'reels', project: one('stack')}};
export const Призыв: S = {name: 'Блок: призыв', args: {format: 'reels', project: one('cta')}};
export const СписокYouTube: S = {name: 'Блок: список — YouTube', args: {format: 'youtube', project: one('agent')}};
