import {AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig, type CalculateMetadataFunction} from 'remotion';
import {Audio} from '@remotion/media';
import {linearTiming, TransitionSeries, type TransitionPresentation} from '@remotion/transitions';
import {Captions} from '../montage/Captions';
import {FORMATS, type Box, type Format, type FormatId} from '../formats';
import {FormatProvider} from '../template/canvas';
import type {BlockData} from '../template/blocks';
import {DEMO, type ProjectData} from '../template/demo';
import {SpeakerLayer, type SpeakerMode} from './speaker';

// Движок стилей режима «сцены». Данные ролика те же, что у шаблона КАНВАС (project.blocks), а стиль задаёт, как каждый
// блок выглядит и движется, какой фон у сцены, каким переходом сцены сменяются и где стоит спикер.
// Сцена i идёт с секунды blocks[i].at; переход съедает TRANS секунд в начале новой сцены, поэтому смена фона попадает
// ровно на фразу. Спикер, субтитры и звук лежат поверх сцен — переходы их не задевают.
export const TRANS = 0.5;
const SFX_GAIN = 0.37;

export type SceneProps = {t: number; b: BlockData; i: number; f: Format; zone: Box; project: ProjectData};
export type CaptionSpec = {cx: number; cy: number; maxW: number; size: number; light?: boolean};
export type StyleDef = {
  id: string;
  speaker: SpeakerMode;
  zone: (f: Format, i: number) => Box;
  captions: (f: Format) => CaptionSpec;
  Background: React.FC<{t: number; i: number; b: BlockData; f: Format; project: ProjectData}>;
  Scene: React.FC<SceneProps>;
  transition: (i: number, f: Format) => TransitionPresentation<Record<string, unknown>>;
  sfx: {move: string; pop: string; tick: string; count: string};
  Overlay?: React.FC<{t: number; f: Format}>;   // слой поверх спикера: шов, затемнение, рамка
};
export type StyleProps = {format: FormatId; project?: ProjectData};

export const calcStyle: CalculateMetadataFunction<StyleProps> = ({props}) => {
  const f = FORMATS[props.format];
  const p = props.project ?? DEMO;
  return {width: f.w, height: f.h, fps: f.fps, durationInFrames: Math.round(p.duration * f.fps)};
};

const SceneShell: React.FC<{style: StyleDef; b: BlockData; i: number; f: Format; start: number; project: ProjectData}> = ({style, b, i, f, start, project}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = start + frame / fps;
  const {Background, Scene} = style;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Background t={t} i={i} b={b} f={f} project={project} />
      <Scene t={t} b={b} i={i} f={f} zone={style.zone(f, i)} project={project} />
    </AbsoluteFill>
  );
};

const sfxOf = (style: StyleDef, blocks: BlockData[]): [number, string, number][] => [
  ...blocks.slice(1).map((b): [number, string, number] => [b.at - 0.05, style.sfx.move, 0.24]),
  ...blocks.flatMap((b): [number, string, number][] => {
    switch (b.kind) {
      case 'hook': return b.strikeAt !== undefined ? [[b.strikeAt, 'snap', 0.24]] : [[b.at + 0.3, style.sfx.pop, 0.18]];
      case 'list': return b.ticks.map((tc): [number, string, number] => [tc, style.sfx.tick, 0.2]);
      case 'stat': return [[b.countAt, style.sfx.count, 0.18]];
      case 'logos': return b.logos.map((_, i): [number, string, number] => [b.at + 0.3 + i * 0.16, style.sfx.pop, 0.15]);
      case 'flow': return b.nodes.map((_, i): [number, string, number] => [b.at + 0.35 + i * 0.55, style.sfx.pop, 0.15]);
      case 'cta': return [[b.typeAt, 'typing', 0.16], [b.typeAt + 0.8, 'ui-glass', 0.22]];
    }
  }),
];

export const StyleReel: React.FC<StyleProps & {style: StyleDef}> = ({style, format, project = DEMO}) => {
  const f = FORMATS[format];
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const blocks = project.blocks;
  const T = Math.round(TRANS * fps);
  const cap = style.captions(f);
  const cur = Math.max(0, blocks.findIndex((b, i) => t < (blocks[i + 1]?.at ?? 1e9)));
  return (
    <FormatProvider value={f}>
      <AbsoluteFill style={{background: '#0B0D10'}}>
        <TransitionSeries>
          {blocks.flatMap((b, i) => {
            const start = i === 0 ? 0 : b.at;
            const end = i < blocks.length - 1 ? blocks[i + 1].at + TRANS : project.duration;
            const seq = (
              <TransitionSeries.Sequence key={`s${b.id}`} durationInFrames={Math.max(T + 1, Math.round((end - start) * fps))}>
                <SceneShell style={style} b={b} i={i} f={f} start={start} project={project} />
              </TransitionSeries.Sequence>
            );
            return i === 0 ? [seq] : [<TransitionSeries.Transition key={`t${b.id}`} presentation={style.transition(i, f)} timing={linearTiming({durationInFrames: T})} />, seq];
          })}
        </TransitionSeries>
        <SpeakerLayer mode={style.speaker} t={t} f={f} i={cur} blocks={blocks} project={project} />
        {style.Overlay ? <style.Overlay t={t} f={f} /> : null}
        <Captions t={t} words={project.words} cx={cap.cx} cy={cap.cy} maxW={cap.maxW} size={cap.size} frameW={f.w} frameH={f.h} light={cap.light} />
        {project.sfx === false ? null : sfxOf(style, blocks).map(([at, name, v], i) => (
          <Sequence key={i} from={Math.max(0, Math.round(at * fps))} durationInFrames={Math.round(2.5 * fps)} layout="none">
            <Audio src={staticFile(`sfx/${name}.wav`)} volume={v * SFX_GAIN} />
          </Sequence>
        ))}
      </AbsoluteFill>
    </FormatProvider>
  );
};
