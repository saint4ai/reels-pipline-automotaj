import {useMemo} from 'react';
import {Easing, interpolate} from 'remotion';
import {bubbleGeo, cableGeo, chrome, DOUBLE, funnelGeo, glass, lensGeo, megaphoneGeo, planeGeo, plugBodyGeo, rubber, tagGeo} from '../../../kit/poster';
import {slab} from '../../../kit/three';

// Стеклянные предметы ролика 20. Координаты — пиксели сцены GlassStage (центр холста, ось y вверх).
// Каждый предмет получает свою позицию [x, y] и время t; вход — подъём снизу или падение сверху с упругим «приземлением».
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const back = Easing.bezier(0.34, 1.35, 0.64, 1);
const out = Easing.bezier(0.16, 1, 0.3, 1);
type P = {t: number; x: number; y: number; at: number};

// Вход снизу: предмет поднимается на 700 px и доворачивается.
const rise = (t: number, at: number) => interpolate(t, [at, at + 0.7], [0, 1], {...cl, easing: back});

export const GlassBubble: React.FC<P & {tint?: string; from?: 'top' | 'bottom'}> = ({t, x, y, at, tint = '#C9F9EC', from = 'top'}) => {
  const geo = useMemo(() => bubbleGeo(540, 380, 116, 60, 28), []);
  const mat = useMemo(() => { const m = glass(tint); m.attenuationColor.set('#3DEDC3'); m.attenuationDistance = 520; return m; }, [tint]);
  const dot = useMemo(() => rubber(), []);
  const k = interpolate(t, [at, at + 0.65], [0, 1], {...cl, easing: back});
  const dy = (1 - k) * (from === 'top' ? 1500 : -1500);
  return (
    <group position={[x, y + dy, 240]} rotation={[0.14 + (1 - k) * 0.6, -0.3 + Math.sin(t * 0.9) * 0.06, -0.08 - (1 - k) * 0.5]}>
      <mesh geometry={geo} material={mat} castShadow />
      {[-112, 0, 112].map((dx) => <mesh key={dx} position={[dx, 22, 0]} material={dot} castShadow><sphereGeometry args={[28, 48, 32]} /></mesh>)}
    </group>
  );
};

export const GlassPlug: React.FC<P> = ({t, x, y, at}) => {
  const body = useMemo(() => plugBodyGeo(300, 230, 56, 150, 30), []);
  const cable = useMemo(() => cableGeo([[170, 0, 0], [330, -10, 0], [520, -110, 30], [760, -300, 0], [1060, -380, -30]], 32), []);
  const g = useMemo(() => glass(), []);
  const metal = useMemo(() => chrome(), []);
  const k = interpolate(t, [at - 0.35, at], [0, 1], {...cl, easing: Easing.bezier(0.3, 0, 0.2, 1)});
  const bump = Math.sin(Math.PI * interpolate(t, [at, at + 0.2], [0, 1], cl)) * 14;
  return (
    <group position={[x + (1 - k) * 1200 + bump, y, 240]} rotation={[0.24, -0.32 + Math.sin(t * 0.7) * 0.03, 0.04]}>
      <mesh geometry={body} material={g} castShadow />
      {[-55, 55].map((py) => <mesh key={py} position={[-215, py, 0]} material={metal} castShadow><boxGeometry args={[150, 30, 30]} /></mesh>)}
      <mesh position={[172, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={g} castShadow><cylinderGeometry args={[62, 70, 60, 48]} /></mesh>
      <mesh geometry={cable} material={g} castShadow />
    </group>
  );
};

// Линза с ручкой; x, y — уже в координатах сцены с учётом перспективы (считает вызывающий).
export const GlassLens: React.FC<{t: number; x: number; y: number}> = ({t, x, y}) => {
  const lens = useMemo(() => lensGeo(180, 80, 18), []);
  const g = useMemo(() => glass('#FFFFFF', 0.02), []);
  const rim = useMemo(() => rubber('#141618'), []);
  const metal = useMemo(() => chrome(), []);
  return (
    <group position={[x, y, 220]} rotation={[0.16, -0.2, Math.sin(t * 1.3) * 0.04]}>
      <mesh geometry={lens} material={g} rotation={[Math.PI / 2, 0, 0]} castShadow />
      <mesh material={rim} castShadow><torusGeometry args={[190, 16, 32, 128]} /></mesh>
      <group rotation={[0, 0, Math.PI / 4]}>
        <mesh position={[0, -238, 0]} material={metal}><cylinderGeometry args={[26, 26, 70, 40]} /></mesh>
        <mesh position={[0, -420, 0]} material={rim} castShadow><cylinderGeometry args={[32, 27, 300, 40]} /></mesh>
      </group>
    </group>
  );
};

export const GlassPlane: React.FC<{t: number; from: [number, number]; to: [number, number]; at: number; dur?: number}> = ({t, from, to, at, dur = 0.75}) => {
  const geo = useMemo(() => planeGeo(520, 380, 130), []);
  const g = useMemo(() => { const m = glass('#E4FBF5'); m.side = DOUBLE; m.thickness = 24; return m; }, []);
  const k = interpolate(t, [at, at + dur], [0, 1], {...cl, easing: out});
  return (
    <group position={[from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k + Math.sin(t * 2) * 8, 300]} rotation={[0.55 - k * 0.2, 0.35, 0.4]}>
      <mesh geometry={geo} material={g} castShadow />
    </group>
  );
};

// Рупор — реклама. Раструб вправо, хромовое кольцо на стыке, чёрная рукоять.
export const GlassMegaphone: React.FC<P> = ({t, x, y, at}) => {
  const {bell, body} = useMemo(() => megaphoneGeo(), []);
  const g = useMemo(() => glass('#FFF1E8'), []);
  const metal = useMemo(() => chrome(), []);
  const grip = useMemo(() => rubber(), []);
  const k = rise(t, at);
  return (
    <group position={[x, y - (1 - k) * 900, 260]} rotation={[0.2, -0.45 + Math.sin(t * 0.8) * 0.06, -0.12 + (1 - k) * 0.6]}>
      <group rotation={[0, 0, -Math.PI / 2]}>
        <mesh geometry={bell} material={g} castShadow />
        <mesh geometry={body} material={g} castShadow />
        <mesh position={[0, 2, 0]} rotation={[Math.PI / 2, 0, 0]} material={metal}><torusGeometry args={[70, 10, 24, 96]} /></mesh>
      </group>
      <mesh position={[-60, -120, 0]} rotation={[0, 0, 0.25]} material={grip} castShadow><boxGeometry args={[56, 170, 60]} /></mesh>
    </group>
  );
};

// Воронка продаж — сделки. Наклонена к зрителю, чтобы видеть горловину; хромовый обод.
export const GlassFunnel: React.FC<P> = ({t, x, y, at}) => {
  const geo = useMemo(() => funnelGeo(), []);
  const g = useMemo(() => { const m = glass('#F4FFFC'); m.side = DOUBLE; m.thickness = 30; return m; }, []);
  const metal = useMemo(() => chrome(), []);
  const k = rise(t, at);
  return (
    <group position={[x, y - (1 - k) * 900, 240]} rotation={[0.42, Math.sin(t * 0.7) * 0.2, 0.12 - (1 - k) * 0.5]}>
      <mesh geometry={geo} material={g} castShadow />
      <mesh position={[0, 190, 0]} rotation={[Math.PI / 2, 0, 0]} material={metal}><torusGeometry args={[242, 11, 24, 128]} /></mesh>
    </group>
  );
};

// Столбики отчёта — деньги/Metabase: три стеклянных столбика растут по очереди на хромовом основании.
export const GlassBars: React.FC<P> = ({t, x, y, at}) => {
  const hs = [190, 310, 450];
  const geos = useMemo(() => hs.map((h) => slab(120, h, 26, 90, 20)), []);
  const g = useMemo(() => glass('#EFFFFA'), []);
  const tip = useMemo(() => { const m = glass('#9FF3DD'); m.attenuationColor.set('#3DEDC3'); m.attenuationDistance = 300; return m; }, []);
  const metal = useMemo(() => chrome(), []);
  const k = rise(t, at);
  return (
    <group position={[x, y - (1 - k) * 900, 240]} rotation={[0.22, -0.5 + Math.sin(t * 0.7) * 0.08, 0.04]}>
      {hs.map((h, i) => {
        const gk = interpolate(t, [at + 0.4 + i * 0.15, at + 0.9 + i * 0.15], [0.05, 1], {...cl, easing: out});
        return (
          <mesh key={h} geometry={geos[i]} material={i === 2 ? tip : g} position={[(i - 1) * 170, -250 + (h * gk) / 2, 0]} scale={[1, gk, 1]} castShadow />
        );
      })}
      <mesh position={[0, -262, 45]} material={metal} castShadow><boxGeometry args={[560, 24, 150]} /></mesh>
    </group>
  );
};

// Ценник — «бесплатно»: висит на нитке и покачивается над «$0».
export const GlassTag: React.FC<P> = ({t, x, y, at}) => {
  const geo = useMemo(() => tagGeo(), []);
  const g = useMemo(() => glass('#F2FFFB'), []);
  const metal = useMemo(() => chrome(), []);
  const k = interpolate(t, [at, at + 0.7], [0, 1], {...cl, easing: back});
  const swing = Math.sin((t - at) * 2.4) * 0.12 * Math.exp(-Math.max(0, t - at) * 0.6);
  return (
    <group position={[x, y + (1 - k) * 1300, 260]} rotation={[0.15, -0.35 + Math.sin(t * 0.6) * 0.05, -0.22 + swing]}>
      <mesh geometry={geo} material={g} castShadow />
      <mesh position={[0, 142, 0]} material={metal}><torusGeometry args={[34, 7, 16, 64]} /></mesh>
    </group>
  );
};
