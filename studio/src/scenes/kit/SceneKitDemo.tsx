import {AbsoluteFill, Sequence, staticFile} from 'remotion';
import {Audio} from '@remotion/media';
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import {bgColor, bloom, blurThrough, lift, portal, shrinkTo, whip} from '../../kit';
import {SpeakerCard} from '../../components/SpeakerCard';
import {FPS} from '../../theme';
import {PORTHOLE_WINDOW, SCHEME_FIRST, SceneBuilder, SceneCta, SceneDirect, SceneHook, ScenePrice, SceneScheme, SceneToggle} from './Scenes';

// Демо режима «сцены»: фон меняется каждые 2,5–5 с, между сценами — шесть переходов референса.
// Схема (узлы и пунктир) идёт в режиме «холст», остальное — сменой фонов.
const S = [
  {C: SceneHook, len: 78},
  {C: SceneDirect, len: 126},
  {C: ScenePrice, len: 78},
  {C: SceneBuilder, len: 78},
  {C: SceneScheme, len: 150},
  {C: SceneToggle, len: 110},
  {C: SceneCta, len: 96},
];
// Переход после сцены i: презентация, длина в кадрах, звук из пака.
const X = [
  {p: portal(PORTHOLE_WINDOW), len: 10, sfx: 'transform', vol: 0.4},
  {p: whip({dir: 'right'}), len: 12, sfx: 'whoosh', vol: 0.3},
  {p: bloom({color: '#3DEDC3'}), len: 14, sfx: 'whoosh', vol: 0.22},
  {p: shrinkTo(SCHEME_FIRST), len: 14, sfx: 'blur', vol: 0.35},
  {p: blurThrough({color: bgColor.white}), len: 12, sfx: 'blur', vol: 0.35},
  {p: lift(), len: 12, sfx: 'whoosh', vol: 0.3},
];
// Начало каждой сцены на общей шкале: переход съедает свою длину из стыка.
const starts = S.map((_, i) => S.slice(0, i).reduce((a, s, j) => a + s.len - X[j].len, 0));
export const KIT_DURATION = starts[S.length - 1] + S[S.length - 1].len;
const sec = (f: number) => f / FPS;

export const SceneKitDemo: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <TransitionSeries>
      {S.map(({C, len}, i) => [
        <TransitionSeries.Sequence key={`s${i}`} durationInFrames={len}><C /></TransitionSeries.Sequence>,
        i < X.length ? <TransitionSeries.Transition key={`t${i}`} presentation={X[i].p as never} timing={linearTiming({durationInFrames: X[i].len})} /> : null,
      ])}
    </TransitionSeries>
    {/* Карточка спикера поверх всех сцен: на схеме компактная (много объектов), потом снова базовая. */}
    <SpeakerCard placeholder plan={[{at: sec(starts[4]), to: 'compact'}, {at: sec(starts[5]), to: 'base'}]} />
    {X.map((x, i) => (
      <Sequence key={i} from={starts[i + 1] - x.len}><Audio src={staticFile(`sfx/${x.sfx}.wav`)} volume={x.vol} /></Sequence>
    ))}
    <Sequence from={starts[0] + 8}><Audio src={staticFile('sfx/rubber.wav')} volume={0.35} /></Sequence>
    <Sequence from={starts[5] + 48}><Audio src={staticFile('sfx/switch.wav')} volume={0.4} /></Sequence>
    <Sequence from={starts[6] + 46}><Audio src={staticFile('sfx/counter.wav')} volume={0.3} /></Sequence>
  </AbsoluteFill>
);
