import {useLayoutEffect} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {ExtrudeGeometry, PMREMGenerator, Path, Shape} from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';

// Общая основа 3D-предметов (решение 18.09.2026: предметы — настоящее 3D, не CSS-имитация).
// Приём: 3D-корпус с отверстием лежит поверх HTML-слоя, в отверстии живёт обычный DOM (небо, экран, чат).
// Единицы — CSS-пиксели: ортографическая камера, zoom 1. Рендер со scale 1.5 пересчитывает всё в 4K.

export const rounded = <T extends Shape | Path>(p: T, w: number, h: number, r: number): T => {
  const x = -w / 2, y = -h / 2;
  p.moveTo(x + r, y);
  p.lineTo(x + w - r, y);
  p.quadraticCurveTo(x + w, y, x + w, y + r);
  p.lineTo(x + w, y + h - r);
  p.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  p.lineTo(x + r, y + h);
  p.quadraticCurveTo(x, y + h, x, y + h - r);
  p.lineTo(x, y + r);
  p.quadraticCurveTo(x, y, x + r, y);
  return p;
};

// Кольцо: внешний контур с дыркой. Фаска растёт наружу от контура, поэтому контуры заранее ужаты на её размер.
// Фаска ограничена шириной кольца: если две фаски шире кольца, контур с отверстием выворачивается и заливает окно.
export const ring = (ow: number, oh: number, or: number, iw: number, ih: number, ir: number, depth: number, want: number) => {
  const bevel = Math.min(want, (Math.min(ow - iw, oh - ih) / 2) * 0.46);
  const s = rounded(new Shape(), ow - bevel * 2, oh - bevel * 2, Math.max(1, or - bevel));
  s.holes.push(rounded(new Path(), iw + bevel * 2, ih + bevel * 2, ir + bevel));
  return new ExtrudeGeometry(s, {depth, bevelEnabled: true, bevelThickness: bevel * 1.2, bevelSize: bevel, bevelSegments: 14, curveSegments: 64});
};

// Сплошная плашка со скруглёнными углами и фаской: кнопки, ножки, накладки.
export const slab = (w: number, h: number, r: number, depth: number, bevel: number) =>
  new ExtrudeGeometry(rounded(new Shape(), w - bevel * 2, h - bevel * 2, Math.max(0.5, r - bevel)),
    {depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 8, curveSegments: 24});

// Студийное окружение для отражений: без него пластик и металл выглядят плоской заливкой.
const Studio: React.FC<{intensity: number}> = ({intensity}) => {
  const {gl, scene} = useThree();
  useLayoutEffect(() => {
    const pm = new PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = intensity;
    gl.toneMappingExposure = 0.95;
    return () => { env.dispose(); pm.dispose(); };
  }, [gl, scene, intensity]);
  return null;
};

// Сцена для предмета: прозрачный холст на pad больше предмета (под фаску, тень и покачивание),
// студийный свет сверху слева, тёплая подсветка снизу справа. Холст кладётся поверх HTML-содержимого.
export const ObjectStage: React.FC<{w: number; h: number; pad?: number; env?: number; children: React.ReactNode}> = ({w, h, pad = 70, env = 0.55, children}) => (
  <div style={{position: 'absolute', left: -pad, top: -pad, pointerEvents: 'none'}}>
    <ThreeCanvas width={w + pad * 2} height={h + pad * 2} orthographic camera={{zoom: 1, position: [0, 0, 1600], near: 1, far: 5000}}
      gl={{alpha: true, antialias: true, preserveDrawingBuffer: true}}>
      <Studio intensity={env} />
      <directionalLight position={[-800, 900, 420]} intensity={2.4} />
      <directionalLight position={[700, -600, 300]} intensity={0.5} color="#FFB98A" />
      <ambientLight intensity={0.12} />
      {children}
    </ThreeCanvas>
  </div>
);
