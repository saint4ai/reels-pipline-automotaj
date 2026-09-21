import {AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig, type CalculateMetadataFunction} from 'remotion';
import {Audio} from '@remotion/media';
import {Captions} from '../montage/Captions';
import {E, k} from '../montage/parts';
import {FORMATS, type FormatId} from '../formats';
import {BlockView, cursorOf} from './blocks';
import {AgentCursor, camAt, FormatProvider, pressAt, toScreen, track, worldStyle, type CamKey} from './canvas';
import {cardRect, center, CardSpark, Connector, Desk, layoutPages, linkOf, linkPoint, PageLabel, Sheet} from './desk';
import {DEMO, type ProjectData} from './demo';
import {Speaker} from './Speaker';

// Шаблон «сценарный канвас»: смысловые блоки — карточки на одном столе, камера едет от карточки к карточке по пунктиру,
// который тянет курсор агента; приехавшая карточка вспыхивает неоном, по кромке бежит комета.
// Формат — props.format: 'reels' (1440×2560) или 'youtube' (2560×1440). Данные ролика — props.project.
export type TemplateProps = {format: FormatId; project?: ProjectData; qa?: boolean};

const TRAVEL = 0.65;          // длина переезда камеры, с
const SFX_GAIN = 0.37;        // громкость эффектов относительно исходных нарезок (утверждено владельцем)

export const calcTemplate: CalculateMetadataFunction<TemplateProps> = ({props}) => {
  const f = FORMATS[props.format];
  const p = props.project ?? DEMO;
  return {width: f.w, height: f.h, fps: f.fps, durationInFrames: Math.round(p.duration * f.fps)};
};

export const Template: React.FC<TemplateProps> = ({format, project = DEMO}) => {
  const f = FORMATS[format];
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const blocks = project.blocks;
  const pages = layoutPages(f, blocks);
  const links = pages.slice(1).map((p, i) => linkOf(f, pages[i], p));

  // Камера: стоит на карточке, за TRAVEL секунд до следующего блока — рывок к следующей.
  const keys: CamKey[] = [[0, center(f, pages[0]).cx, center(f, pages[0]).cy, 1]];
  pages.slice(1).forEach((p, i) => {
    const prev = center(f, pages[i]), c = center(f, p);
    keys.push([p.at - TRAVEL, prev.cx, prev.cy, 1], [p.at, c.cx, c.cy, 1]);
  });
  const cam = camAt(t, keys);
  const cur = Math.max(0, pages.findIndex((p, i) => t < (pages[i + 1]?.at ?? 1e9)));
  const hot = (p: (typeof pages)[number]) => {
    const flash = k(t, p.at - 0.15, p.at + 0.25) * (1 - k(t, p.at + 0.8, p.at + 1.8, E.inOut));
    return Math.max(flash, p.id === pages[cur].id ? 0.3 : 0);
  };

  // Курсор: внутри блока — по своему пути, на переезде — едет на острие пунктира.
  let cursor: {x: number; y: number; clicks: number[]};
  const travel = pages.findIndex((p, i) => i > 0 && t >= p.at - TRAVEL && t < p.at);
  if (travel > 0) {
    const [x, y] = linkPoint(links[travel - 1], k(t, pages[travel].at - TRAVEL, pages[travel].at, (v) => v));
    cursor = {x, y, clicks: []};
  } else {
    const p = pages[cur], c = cursorOf(blocks[cur], cardRect(f, p));
    const pt = track(t, c.pts);
    cursor = {x: p.x + pt.x, y: p.y + pt.y, clicks: c.clicks};
  }
  const sp = toScreen(f, cam, cursor.x, cursor.y);
  // пока курсор щёлкает пункты списка, метка «Claude» прячется — иначе закрывает текст пунктов
  const cb = blocks[cur];
  const busy = travel <= 0 && cb.kind === 'list' && t > cb.ticks[0] - 0.35 && t < cb.ticks[cb.ticks.length - 1] + 0.25;

  const sfx: [number, string, number][] = project.sfx === false ? [] : [
    ...pages.slice(1).flatMap((p): [number, string, number][] => [[p.at - TRAVEL, 'rev-whoosh', 0.24], [p.at - 0.05, 'sub-hit', 0.22]]),
    ...blocks.flatMap((b): [number, string, number][] => {
      switch (b.kind) {
        case 'hook': return b.strikeAt !== undefined ? [[b.strikeAt, 'snap', 0.26]] : [];
        case 'list': return b.ticks.map((tc): [number, string, number] => [tc, 'tick-soft', 0.2]);
        case 'stat': return [[b.countAt, 'counter', 0.18]];
        case 'logos': return b.logos.map((_, i): [number, string, number] => [b.at + 0.3 + i * 0.16, 'pop-warm', 0.16]);
        case 'cta': return [[b.typeAt, 'typing', 0.16], [b.typeAt + 0.8, 'ui-glass', 0.24]];
      }
    }),
  ];

  return (
    <FormatProvider value={f}>
      <AbsoluteFill style={{background: '#0B0D10', overflow: 'hidden'}}>
        <div style={worldStyle(f, cam)}>
          <Desk pages={pages} cx={cam.cx} cy={cam.cy} s={cam.s} hot={hot} />
          {links.map((l, i) => {
            const at = pages[i + 1].at;
            return <Connector key={i} l={l} draw={k(t, at - TRAVEL, at, (v) => v)} ghost={t < at - TRAVEL ? 0.6 : 0} />;
          })}
          {pages.map((p, i) => (Math.abs(i - cur) <= 1 ? (
            <Sheet key={p.id} pages={pages} p={p} hot={hot}>
              <BlockView t={t} b={blocks[i]} r={cardRect(f, p)} light={p.tone === 'light'} />
            </Sheet>
          ) : null))}
          {pages.map((p) => <PageLabel key={`l${p.id}`} p={p} />)}
          {pages.map((p) => <CardSpark key={`s${p.id}`} p={p} g={t > p.at - 0.1 && t < p.at + 0.9 ? 1 - k(t, p.at - 0.1, p.at + 0.9, (v) => v) : 0} />)}
        </div>
        <AgentCursor x={sp.x} y={sp.y} press={pressAt(t, cursor.clicks)} ripple={cursor.clicks} t={t} edge={f.w - 320} tag={!busy} />
        <Captions t={t} words={project.words} cx={f.captions.cx} cy={f.captions.cy} maxW={f.captions.maxW} size={f.captions.size} frameW={f.w} frameH={f.h} />
        <Speaker t={t} plan={project.plan} video={project.speaker} />
        {sfx.map(([at, name, v], i) => (
          <Sequence key={i} from={Math.max(0, Math.round(at * fps))} durationInFrames={Math.round(2.5 * fps)} layout="none">
            <Audio src={staticFile(`sfx/${name}.wav`)} volume={v * SFX_GAIN} />
          </Sequence>
        ))}
      </AbsoluteFill>
    </FormatProvider>
  );
};
