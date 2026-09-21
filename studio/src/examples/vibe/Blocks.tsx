import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {Captions, type Page} from '../../components/Captions';
import {SpeakerCard} from '../../components/SpeakerCard';
import {REWIND_DUR, RewindScene} from './blocks/Rewind';
import {MIRROR_DUR, MirrorScene} from './blocks/Mirror';
import {DECK_DUR, DeckScene} from './blocks/Deck';
import {SLOT_DUR, SlotScene} from './blocks/SlotLevel';
import {HOOK_DUR, HookScene} from './blocks/Hook';
import {POUR_DUR, PourScene} from './blocks/Pour';
import {EXPLODE_DUR, ExplodeScene} from './blocks/Explode';
import {GIFT_DUR, GiftScene} from './blocks/Gift';
import {TEAR_DUR, TearScene} from './blocks/Tear';
import {CTA_DUR, CtaScene} from './blocks/Cta';
import {XRAY_DUR, XRayScene} from './blocks/XRay';
import {useSec} from './blocks/common';
import {blockPages, blockWords, TIMING, warp} from './timing';

// Блоки ролика 22 по финальному тексту — каждый отдельно, полным кадром: субтитры по фразам и карточка спикера.
// Речь оценочная (записи ещё нет): слова раскладываются по фразе равномерно.
// Блоки ролика 22 на настоящей записи (IMG_7806): каждый блок — свой отрезок записи с голосом и губами,
// субтитры — слова расшифровки, время сцены подогнано под слова опорными точками (timing.ts).
// Для разбора в Storybook: Александр смотрит блоки по одному, правки — до рендера (решение 20.09.2026).
export const BLOCKS = {
  hook: {design: HOOK_DUR, Scene: HookScene},
  rewind: {design: REWIND_DUR, Scene: RewindScene},
  mirror: {design: MIRROR_DUR, Scene: MirrorScene},
  deck: {design: DECK_DUR, Scene: DeckScene},
  xray: {design: XRAY_DUR, Scene: XRayScene},
  slot: {design: SLOT_DUR, Scene: SlotScene},
  pour: {design: POUR_DUR, Scene: PourScene},
  explode: {design: EXPLODE_DUR, Scene: ExplodeScene},
  gift: {design: GIFT_DUR, Scene: GiftScene},
  tear: {design: TEAR_DUR, Scene: TearScene},
  cta: {design: CTA_DUR, Scene: CtaScene},
};
export type BlockId = keyof typeof BLOCKS;
export const blockDur = (id: BlockId) => TIMING[id].end - TIMING[id].start;

export const BlockPreview: React.FC<{id: BlockId}> = ({id}) => {
  const t = useSec();
  const b = BLOCKS[id], tm = TIMING[id];
  const ws = blockWords(tm);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <b.Scene t={warp(tm, t)} />
      <Captions words={ws} pages={blockPages(ws, blockDur(id))} />
      <Sequence from={-Math.round(tm.start * 30)} layout="none">
        <SpeakerCard plan={[]} start={id === 'deck' || id === 'pour' ? 'compact' : 'base'} src="reels/vibe/speaker.mp4" headY={920} />
      </Sequence>
    </AbsoluteFill>
  );
};
