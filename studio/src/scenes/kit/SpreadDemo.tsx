import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {spaceCoderCards, StackSpread} from '../../kit/StackSpread';
import {BlurIn} from '../../kit';
import {GlassLayers, glassFill, elevation, textDepth} from '../../ds';
import {SpeakerCard} from '../../components/SpeakerCard';

// Демо фона «карточки разлетаются»: 0,5 с стопка, 0,5–2,5 с разлёт, дальше дрейф. Для ролика 21 (кодер + космос).
// muted — разлёт работает фоном: приглушён, поверх стеклянная плашка и карточка спикера, как в кадре ролика.
export const SPREAD_DEMO_FRAMES = 150;
export const SpreadDemo: React.FC<{muted?: boolean}> = ({muted = false}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  const p = interpolate(t, [0.5, 2.5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.65, 0, 0.35, 1)});
  return (
    <AbsoluteFill style={{background: '#0A0B0D'}}>
      <StackSpread cards={spaceCoderCards()} progress={p} t={t} w={width} h={height} mute={muted ? 0.6 : 0} />
      {muted && (
        <>
          <div style={{position: 'absolute', left: 120, top: 760, width: 1200, padding: '56px 64px', borderRadius: 56, boxSizing: 'border-box',
            ...glassFill('clear', '14,18,20'), boxShadow: elevation[2]}}>
            <GlassLayers radius={56} />
            <BlurIn text="Я отдаю свой пайплайн монтажа" at={20} size={104} weight={800} color="#F2F3F5" width={1072} style={{textShadow: textDepth}} />
          </div>
          <SpeakerCard plan={[]} start="base" placeholder />
        </>
      )}
    </AbsoluteFill>
  );
};
