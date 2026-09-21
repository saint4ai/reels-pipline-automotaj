import type {Meta, StoryObj} from '@storybook/react-vite';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import {Backdrop, bgColor, bloom, blurThrough, BlurIn, ChatThread, Cursor, DmHeader, ink, lift, PhoneMock, Pop, Porthole, portal, portholeWindow,
  RiseIn, shrinkTo, Sticker, Toast, Toggle, toggleKnob, whip, type BackdropKind} from '../kit';
import {type} from '../ds';

// Библиотека режима «сцены» (разбор референса Пронина 18.09.2026). Каждый блок — отдельно, в движении.
const meta: Meta = {title: 'Сцены', parameters: {layout: 'centered'}};
export default meta;
type S = StoryObj;

const KINDS: BackdropKind[] = ['black', 'graphite', 'white', 'mint', 'ember', 'sky'];
export const Фоны: S = {
  render: () => (
    <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 360px)', gap: 30}}>
      {KINDS.map((k) => (
        <div key={k} style={{position: 'relative', width: 360, height: 640, borderRadius: 24, overflow: 'hidden'}}>
          <Backdrop kind={k} />
          <div style={{position: 'absolute', left: 0, right: 0, top: 280, textAlign: 'center', fontFamily: 'Manrope', fontWeight: 800, fontSize: 48, color: ink[k]}}>{k}</div>
        </div>
      ))}
    </div>
  ),
  parameters: {frameW: 1220, frameH: 1450, frames: 90},
};

export const Иллюминатор: S = {
  render: () => (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <RiseIn at={4} from={600}>
        <Porthole w={560} h={780}>
          <Backdrop kind="sky" />
          <Pop at={16} style={{position: 'absolute', left: 73, top: 150, width: 260}}>
            <Sticker head="в месяц" value="$7" w={260} />
          </Pop>
        </Porthole>
      </RiseIn>
    </AbsoluteFill>
  ),
  parameters: {frameW: 900, frameH: 1100, frames: 60, pad: 0},
};

const ToggleDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const on = interpolate(frame, [40, 50], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const press = interpolate(frame, [34, 38, 42], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cy = 300 + 74;
  return (
    <AbsoluteFill>
      <Backdrop kind="white" />
      <div style={{position: 'absolute', top: 300, left: 0}}><Toggle on={on} press={press} left="вручную" right="автомат" width={1200} /></div>
      <Cursor clicks={[36]} moves={[
        {from: [1000, 600], to: [600 + toggleKnob(0).dx + 10, cy + 12], start: 8, end: 34},
        {from: [600 + toggleKnob(0).dx + 10, cy + 12], to: [600 + toggleKnob(1).dx + 10, cy + 12], start: 40, end: 50, bend: 0},
      ]} />
    </AbsoluteFill>
  );
};
export const Тогл_и_курсор: S = {render: () => <ToggleDemo />, parameters: {frameW: 1200, frameH: 700, frames: 80, pad: 0}};

export const Телефон_и_чат: S = {
  render: () => (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <Backdrop kind="ember" />
      <PhoneMock w={760} h={1300}>
        <DmHeader name="Марат" status="в сети" w={760} />
        <ChatThread w={718} h={900} msgs={[
          {from: 'in', at: 10, text: 'Сколько стоит обучение?'},
          {from: 'out', at: 36, typing: 14, text: 'Расскажу! А какой у вас опыт с ИИ?'},
          {from: 'in', at: 58, voice: '0:07'},
          {from: 'out', at: 84, typing: 12, text: 'Понял вас. Оставить заявку на разбор?'},
        ]} />
      </PhoneMock>
    </AbsoluteFill>
  ),
  parameters: {frameW: 1000, frameH: 1500, frames: 120, pad: 0, scale: 0.45},
};

export const Уведомление: S = {
  render: () => (
    <AbsoluteFill style={{alignItems: 'center', paddingTop: 80}}>
      <Backdrop kind="graphite" />
      <Toast at={6} icon="brand/telegram.svg" title="Новая заявка" body="Марат, базовый курс" w={1000} />
    </AbsoluteFill>
  ),
  parameters: {frameW: 1200, frameH: 500, frames: 45, pad: 0},
};

// Переходы: две простые сцены и стык между ними. Длина стыка та же, что в демо.
const Plain: React.FC<{kind: BackdropKind; text: string}> = ({kind, text}) => (
  <AbsoluteFill><Backdrop kind={kind} /><div style={{position: 'absolute', top: 1000, width: '100%'}}><BlurIn text={text} size={type.label * 1.6} color={ink[kind]} weight={800} /></div></AbsoluteFill>
);
const Pair: React.FC<{p: never; len: number; a: BackdropKind; b: BackdropKind; A?: React.ReactNode}> = ({p, len, a, b, A}) => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={40}>{A ?? <Plain kind={a} text="сцена A" />}</TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={p} timing={linearTiming({durationInFrames: len})} />
    <TransitionSeries.Sequence durationInFrames={40}><Plain kind={b} text="сцена B" /></TransitionSeries.Sequence>
  </TransitionSeries>
);
const pairParams = (len: number) => ({frameW: 1440, frameH: 2560, frames: 80 - len, pad: 0, scale: 0.25});
const WIN = portholeWindow(440, 900, 560, 780);
export const Переход_портал: S = {render: () => (
  <Pair p={portal(WIN) as never} len={10} a="black" b="sky" A={<AbsoluteFill><Backdrop kind="black" />
    <div style={{position: 'absolute', left: 440, top: 900}}><Porthole w={560} h={780}><Backdrop kind="sky" /></Porthole></div></AbsoluteFill>} />
), parameters: pairParams(10)};
export const Переход_размытие_через_цвет: S = {render: () => <Pair p={blurThrough({color: bgColor.white}) as never} len={12} a="black" b="white" />, parameters: pairParams(12)};
export const Переход_вспышка_цвета: S = {render: () => <Pair p={bloom({color: '#3DEDC3'}) as never} len={14} a="graphite" b="mint" />, parameters: pairParams(14)};
export const Переход_рывок: S = {render: () => <Pair p={whip({dir: 'right'}) as never} len={12} a="sky" b="graphite" />, parameters: pairParams(12)};
export const Переход_в_узел: S = {render: () => <Pair p={shrinkTo({x: 720, y: 400}) as never} len={14} a="mint" b="black" />, parameters: pairParams(14)};
export const Переход_вверх_в_тёмное: S = {render: () => <Pair p={lift() as never} len={12} a="white" b="black" />, parameters: pairParams(12)};
