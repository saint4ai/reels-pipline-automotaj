import type {StyleDef, StyleProps} from './engine';
import {StyleReel} from './engine';
import {PRISM} from './prism';
import {ORBIT} from './orbit';
import {TRACE} from './trace';
import {PULSE} from './pulse';
import {GLASS} from './glass';
import {PORTRAIT} from './portrait';
import {APPLE} from './apple';
import {PODCAST} from './podcast';

// Реестр стилей режима «сцены» (паттерны 5–12 каталога patterns/README.md, перенесённые на Remotion).
export const STYLES: {id: string; def: StyleDef}[] = [
  {id: 'PRISM', def: PRISM},
  {id: 'ORBIT', def: ORBIT},
  {id: 'TRACE', def: TRACE},
  {id: 'PULSE', def: PULSE},
  {id: 'GLASS', def: GLASS},
  {id: 'PORTRAIT', def: PORTRAIT},
  {id: 'APPLE', def: APPLE},
  {id: 'PODCAST', def: PODCAST},
];
export const reelOf = (def: StyleDef): React.FC<StyleProps> => (p) => <StyleReel {...p} style={def} />;
