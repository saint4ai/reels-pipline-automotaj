import {AbsoluteFill, Sequence, staticFile} from 'remotion';
import {Audio} from '@remotion/media';
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import {bgColor, bloom, blurThrough, lift, portal, shrinkTo, whip} from '../../kit';
import {SpeakerCard} from '../../components/SpeakerCard';
import {Captions, type Page} from '../../components/Captions';
import {WORDS} from './words';
import {CUT_FRAMES, FPS, SCENE_FRAMES, STARTS} from './timing';
import {PORTHOLE_WINDOW, SceneCompare, SceneCta, SceneHook, SceneMoney, ScenePhone, SceneSteps, SceneToggle, STEP1_SCREEN} from './Scenes';
import {SceneScheme} from './Scheme';

// Ролик «ИИ-ассистент в директе за $7» — сборка. План: videos/reels-19-direct-assistant/DIRECTION.md.
const SCENES = [SceneHook, SceneCompare, ScenePhone, SceneMoney, SceneSteps, SceneScheme, SceneCta, SceneToggle];
const PRESENT = [
  portal(PORTHOLE_WINDOW), whip({dir: 'right'}), bloom({color: '#3DEDC3'}), blurThrough({color: bgColor.white}),
  shrinkTo(STEP1_SCREEN), lift(), blurThrough({color: bgColor.white}),
];

// Страницы субтитров по фразам речи; dark — тёмный текст на белых сценах, lines — одна или две строки.
const PAGES: Page[] = [
  {from: 0, to: 2.4, lines: 2}, {from: 2.4, to: 4.52, lines: 1}, {from: 4.52, to: 6.38, lines: 1}, {from: 6.38, to: 7.85, lines: 1},
  {from: 7.85, to: 11.16, lines: 2}, {from: 11.16, to: 14.62, lines: 2}, {from: 14.62, to: 16.55, lines: 1, dark: true},
  {from: 16.55, to: 20.06, lines: 2}, {from: 20.06, to: 22.74, lines: 2}, {from: 22.74, to: 26.1, lines: 2}, {from: 26.1, to: 27.75, lines: 1},
  {from: 27.75, to: 28.73, lines: 1}, {from: 28.73, to: 32.06, lines: 2}, {from: 32.06, to: 34.4, lines: 2}, {from: 34.4, to: 36.26, lines: 1},
  {from: 36.26, to: 38.61, lines: 1}, {from: 38.61, to: 40.18, lines: 1}, {from: 40.18, to: 43.73, lines: 2}, {from: 43.73, to: 47.15, lines: 2},
  {from: 47.15, to: 49.18, lines: 1}, {from: 49.18, to: 51.0, lines: 1}, {from: 51.0, to: 52.66, lines: 1, dark: true}, {from: 52.66, to: 57, lines: 1, dark: true},
];

// Звуки только из пака onai-apple-pack: секунда, файл, громкость (под голосом).
const SFX: [number, string, number][] = [
  [0.45, 'rubber', 0.25], [2.2, 'whoosh-long', 0.22], [3.12, 'rubber', 0.3], [4.38, 'zoom', 0.4], [5.6, 'switch', 0.3],
  [6.2, 'woosh-air', 0.3], [7.8, 'blur', 0.3], [11.0, 'flash', 0.35], [12.4, 'counter', 0.35], [14.45, 'blur', 0.3],
  [15.69, 'rubber', 0.25], [16.55, 'transform', 0.35], [17.6, 'whoosh-long', 0.2], [26.2, 'whoosh', 0.25], [27.7, 'woosh-air', 0.25],
  [30.26, 'switch', 0.3], [31.2, 'counter', 0.3], [33.34, 'switch', 0.3], [33.55, 'typing', 0.3], [34.7, 'whoosh', 0.25],
  [36.2, 'woosh-air', 0.25], [38.9, 'rubber', 0.3], [40.7, 'transform', 0.35], [42.6, 'whoosh-long', 0.22], [43.2, 'flash', 0.3],
  [45.7, 'rubber', 0.25], [47.15, 'whoosh', 0.25], [48.6, 'typing', 0.25], [49.25, 'rubber', 0.25], [51.0, 'blur', 0.3], [53.7, 'switch', 0.4],
];

export const DirectReel: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <TransitionSeries>
      {SCENES.map((Scene, i) => [
        <TransitionSeries.Sequence key={`s${i}`} durationInFrames={SCENE_FRAMES[i]}><Scene t0={STARTS[i]} /></TransitionSeries.Sequence>,
        i < PRESENT.length ? <TransitionSeries.Transition key={`t${i}`} presentation={PRESENT[i] as never} timing={linearTiming({durationInFrames: CUT_FRAMES[i]})} /> : null,
      ])}
    </TransitionSeries>
    {/* Карточка спикера: на схеме компактная (много объектов), в остальном базовая. Голос — из этой записи. */}
    <SpeakerCard src="reels/direct/speaker.mp4" headY={840} plan={[{at: 16.55, to: 'compact'}, {at: 47.15, to: 'base'}]} />
    <Captions words={WORDS} pages={PAGES} width={1120} />
    {SFX.map(([sec, file, vol], i) => (
      <Sequence key={i} from={Math.round(sec * FPS)}><Audio src={staticFile(`sfx/${file}.wav`)} volume={vol} /></Sequence>
    ))}
  </AbsoluteFill>
);
