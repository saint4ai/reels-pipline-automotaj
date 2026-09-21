import {useEffect, useLayoutEffect, useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {CylinderGeometry, DoubleSide, LatheGeometry, MeshPhysicalMaterial, MeshStandardMaterial, PMREMGenerator, Vector2} from 'three';
import {studio} from '../../../kit/poster';

// Песочные часы (ролик 22, заказ Александра 20.09): переворачиваются на «Тебя может заменить коллега» — твоё время уходит.
// Настоящее 3D: стеклянные колбы (пропускание), песок объёмом, чёрные лакированные крышки, хромированные стойки.
// Единицы — пиксели: ортографическая камера, zoom 1. Песок моделируется в осях самих часов: «исходная» колба — −y, «приёмная» — +y;
// до переворота песок лежит у крышки исходной колбы, после — у горловины и сыплется в приёмную.

const L = 330;          // половина высоты стекла
const R = 180, NECK = 15;
const rAt = (u: number) => {
  const a = Math.min(1, Math.max(0, u));
  const bulb = Math.sqrt(1 - Math.pow(1 - a, 2.4));
  const taper = 1 - 0.3 * Math.max(0, (a - 0.82) / 0.18) ** 2;
  return NECK + (R - NECK) * bulb * taper;
};
const inner = (y: number) => Math.max(2, rAt(Math.abs(y) / L) * 0.92 - 5);

// Тело вращения по профилю: список [r, y] от одного торца до другого (торцы закрыты через ось).
const lathe = (pts: [number, number][]) => new LatheGeometry(pts.map(([r, y]) => new Vector2(r, y)), 72);
const glassGeo = () => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 90; i++) { const y = -L + (2 * L * i) / 90; pts.push([rAt(Math.abs(y) / L), y]); }
  return lathe(pts);
};
// Песок между y0 < y1 внутри колбы; cone — горка к горловине (уходит в сторону уменьшения |y|).
const sandGeo = (y0: number, y1: number, coneAtLow: number, coneAtHigh: number) => {
  const pts: [number, number][] = [[0, y0 - coneAtLow]];
  const n = 28;
  for (let i = 0; i <= n; i++) { const y = y0 + ((y1 - y0) * i) / n; pts.push([inner(y), y]); }
  pts.push([0, y1 + coneAtHigh]);
  return lathe(pts);
};

const Env: React.FC = () => {
  const {gl, scene} = useThree();
  useLayoutEffect(() => {
    const pm = new PMREMGenerator(gl);
    const env = pm.fromScene(studio(), 0.02).texture;
    scene.environment = env;
    scene.environmentIntensity = 1.1;
    gl.toneMappingExposure = 1.05;
    return () => { env.dispose(); pm.dispose(); };
  }, [gl, scene]);
  return null;
};

export type HourglassProps = {
  w: number; h: number;         // размер холста
  x: number; y: number;         // центр часов на холсте (пиксели от левого верхнего угла)
  scale?: number;
  flip: number;                 // 0…1 — переворот
  flow: number;                 // 0…1 — сколько песка пересыпалось
  spin?: number;                // поворот вокруг своей оси (параллакс стоек)
};
export const Hourglass: React.FC<HourglassProps> = ({w, h, x, y, scale = 1, flip, flow, spin = 0}) => {
  const mats = useMemo(() => ({
    // стекло без пропускания: на прозрачном холсте transmission видит пустоту и белеет, поэтому — тонкая прозрачная оболочка с отражениями студии
    glass: new MeshPhysicalMaterial({color: '#FFFFFF', metalness: 0, roughness: 0.03, transparent: true, opacity: 0.16, clearcoat: 1, clearcoatRoughness: 0.02,
      side: DoubleSide, envMapIntensity: 2.4, specularIntensity: 1, depthWrite: false}),
    sand: new MeshStandardMaterial({color: '#EFE4CF', roughness: 0.95, metalness: 0}),
    lacquer: new MeshPhysicalMaterial({color: '#0F1012', roughness: 0.26, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.2}),
    chrome: new MeshPhysicalMaterial({color: '#DDE1E4', metalness: 1, roughness: 0.14, envMapIntensity: 2}),
  }), []);
  const glass = useMemo(glassGeo, []);
  const cap = useMemo(() => new CylinderGeometry(222, 230, 44, 96), []);
  const lip = useMemo(() => new CylinderGeometry(196, 196, 14, 96), []);
  const pillar = useMemo(() => new CylinderGeometry(10, 10, 2 * L + 20, 32), []);

  // песок: объём исходной колбы уходит, в приёмной растёт горка
  const full = 0.6 * L;
  const f = Math.min(1, Math.max(0, flip));
  const slide = Math.min(1, Math.max(0, (f - 0.45) / 0.55));
  const src = full * Math.pow(1 - flow, 0.85);
  const srcLow = -L + 8 + (L - 8 - full - 4) * slide - 0; // до переворота у крышки (−L), после — у горловины
  const srcA = slide < 1 ? srcLow : -src - 4;
  const srcB = slide < 1 ? srcLow + full : -4;
  const pile = full * 0.82 * Math.pow(flow, 0.92);
  const cone = 46 * Math.min(1, flow * 5) * (1 - 0.4 * flow);
  // геометрия песка пересобирается только при сдвиге уровня на полпикселя и освобождается за собой (иначе память растёт за тысячи кадров)
  const q = (v: number) => Math.round(v * 2) / 2;
  const [a0, b0, p0, c0] = [q(srcA), q(srcB), q(pile), q(cone)];
  const sandSrc = useMemo(() => (src > 1 && b0 - a0 > 1 ? sandGeo(a0, b0, 0, 0) : null), [a0, b0, src > 1]);
  const sandPile = useMemo(() => (p0 > 1 ? sandGeo(L - 8 - p0, L - 8, c0, 0) : null), [p0, c0]);
  useEffect(() => () => sandSrc?.dispose(), [sandSrc]);
  useEffect(() => () => sandPile?.dispose(), [sandPile]);
  const falling = f >= 1 && flow > 0 && flow < 0.995;
  const streamTop = 0, streamBot = L - 8 - pile - cone;

  const ang = Math.PI * flip; // без обрезки: лёгкий перелёт за 180° и возврат
  const lift = Math.sin(Math.PI * f) * 70;
  return (
    <ThreeCanvas width={w} height={h} orthographic camera={{zoom: 1, position: [0, 0, 1600], near: 1, far: 5000}}
      gl={{alpha: true, antialias: true, preserveDrawingBuffer: true}}>
      <Env />
      <directionalLight position={[-800, 900, 700]} intensity={2.2} />
      <directionalLight position={[700, -400, 500]} intensity={0.55} color="#FFC9A3" />
      <ambientLight intensity={0.25} />
      <group position={[x - w / 2, h / 2 - y + lift, 0]} scale={scale}>
        <group rotation={[0.16, 0, 0]}>
          <group rotation={[0, 0, ang]}>
            <group rotation={[0, spin, 0]}>
              {sandSrc ? <mesh geometry={sandSrc} material={mats.sand} /> : null}
              {sandPile ? <mesh geometry={sandPile} material={mats.sand} /> : null}
              {falling ? (
                <mesh position={[0, (streamTop + streamBot) / 2, 0]} material={mats.sand}>
                  <cylinderGeometry args={[3.2, 3.2, Math.max(1, streamBot - streamTop), 12]} />
                </mesh>
              ) : null}
              <mesh geometry={glass} material={mats.glass} renderOrder={2} />
              {[-1, 1].map((sd) => (
                <group key={sd}>
                  <mesh geometry={cap} material={mats.lacquer} position={[0, sd * (L + 30), 0]} />
                  <mesh geometry={lip} material={mats.chrome} position={[0, sd * (L + 4), 0]} />
                </group>
              ))}
              {[90, 210, 330].map((a) => (
                <mesh key={a} geometry={pillar} material={mats.chrome}
                  position={[Math.cos((a * Math.PI) / 180) * 204, 0, Math.sin((a * Math.PI) / 180) * 204]} />
              ))}
            </group>
          </group>
        </group>
      </group>
    </ThreeCanvas>
  );
};
