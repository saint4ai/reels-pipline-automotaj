import type {BlockData} from './blocks';
import type {SpeakerPlan, SpeakerSrc} from './Speaker';

// Демо-проект шаблона: 5 смысловых блоков на одном холсте. Замени своим: слова — из пословной расшифровки
// (scripts/new-video.sh кладёт transcript.json), блоки — по карте монтажа из DIRECTION.md проекта.
export type Word = {text: string; start: number; end: number};
export type ProjectData = {duration: number; words: Word[]; blocks: BlockData[]; speaker?: SpeakerSrc; plan?: SpeakerPlan; sfx?: boolean};

// Демо без записи: слова раскладываются по фразам равномерно, чтобы было видно субтитры.
const phrase = (start: number, text: string, step = 0.3): Word[] =>
  text.split(' ').map((w, i) => ({text: w, start: +(start + i * step).toFixed(2), end: +(start + i * step + step * 0.85).toFixed(2)}));

export const DEMO: ProjectData = {
  duration: 25,
  words: [
    ...phrase(0.2, 'Ты всё ещё монтируешь руками?'),
    ...phrase(2.2, 'Смотри, как это делает агент.'),
    ...phrase(4.2, 'Раскадровку, графику и звук он собирает сам.'),
    ...phrase(8.2, 'Двенадцать блоков на одном холсте.'),
    ...phrase(12.2, 'Запись, расшифровка, карта монтажа и рендер.'),
    ...phrase(16.2, 'Стек: Claude, GitHub, Vercel и Supabase.'),
    ...phrase(20.2, 'Хочешь так же — напиши «гоу» в комментариях.'),
  ],
  blocks: [
    {kind: 'hook', id: 'hook', label: '01 · хук', at: 0, tone: 'light', lines: ['Ты монтируешь', 'руками'], strike: 'руками', strikeAt: 2.4, object: 'scissors', kicker: 'монтаж с агентом'},
    {kind: 'list', id: 'agent', label: '02 · агент', at: 4.0, title: 'Агент делает сам', items: ['раскадровку', 'графику', 'звук'], ticks: [5.3, 5.9, 6.5]},
    {kind: 'stat', id: 'canvas', label: '03 · холст', at: 8.0, value: 12, suffix: ' блоков', caption: 'на одном холсте', countAt: 8.4},
    {kind: 'flow', id: 'flow', label: '04 · схема', at: 12.0, title: 'Как собирается ролик', nodes: [{label: 'запись'}, {label: 'расшифровка'}, {label: 'карта монтажа'}, {label: 'рендер', logo: 'claude'}]},
    {kind: 'logos', id: 'stack', label: '05 · стек', at: 16.0, title: 'Стек', logos: ['claude', 'github', 'vercel', 'supabase'], tone: 'light'},
    {kind: 'cta', id: 'cta', label: '06 · призыв', at: 20.0, note: 'Хочешь так же?', word: 'гоу', typeAt: 21.4},
  ],
  plan: [{at: 16.0, to: 'compact'}, {at: 20.0, to: 'base'}],
  sfx: true,
};
