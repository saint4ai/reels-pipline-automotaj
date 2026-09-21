import {useMemo} from 'react';
import {useFrame30} from './motion';
import {ObjectStage, ring} from './three';

// Иллюминатор самолёта — настоящий 3D-объект (three.js): пластиковая рама с мягкой фаской, утопленное кольцо,
// отражения студийного окружения. Плоская CSS-версия отклонена 18.09.2026 («плохого качества»).
// Окно — HTML-слой под рамой: в нём фон следующей сцены, поэтому portal() склеивается без скачка цвета.
// Единицы геометрии — CSS-пиксели (ортографическая камера, zoom 1), при рендере в 4K всё считается заново, без растяжения.
export type Rect = {x: number; y: number; w: number; h: number; r: number};

const RING = 0.1, WIN = 0.155;
// Окно иллюминатора в координатах кадра: его отдают в portal(), чтобы маска совпала с окном.
export const portholeWindow = (x: number, y: number, w: number, h: number): Rect => {
  const r = w * 0.46, i = w * WIN;
  return {x: x + i, y: y + i, w: w - i * 2, h: h - i * 2, r: r - i};
};

const Frame: React.FC<{w: number; h: number; tiltX: number; tiltY: number}> = ({w, h, tiltX, tiltY}) => {
  const r = w * 0.46, ring1 = w * RING, win = w * WIN;
  const outer = useMemo(() => ring(w, h, r, w - ring1 * 2, h - ring1 * 2, r - ring1, 22, 26), [w, h, r, ring1]);
  const lip = useMemo(() => ring(w - ring1 * 2 + 20, h - ring1 * 2 + 20, r - ring1 + 10, w - win * 2, h - win * 2, r - win, 12, 14), [w, h, r, ring1, win]);
  return (
    <group rotation={[tiltX, tiltY, 0]}>
      <mesh geometry={outer} position={[0, 0, 0]}>
        <meshPhysicalMaterial color="#C9CED5" roughness={0.42} clearcoat={0.45} clearcoatRoughness={0.28} />
      </mesh>
      <mesh geometry={lip} position={[0, 0, -26]}>
        <meshPhysicalMaterial color="#858C95" roughness={0.55} clearcoat={0.15} />
      </mesh>
    </group>
  );
};

// float — лёгкое покачивание рамы от кадра (градусы), чтобы блики по фаске жили; 0 — неподвижно.
export const Porthole: React.FC<{w: number; h: number; children?: React.ReactNode; float?: number}> = ({w, h, children, float = 2}) => {
  const frame = useFrame30();
  const r = w * 0.46, win = w * WIN;
  const rad = Math.PI / 180;
  const tiltX = Math.sin(frame / 38) * float * rad, tiltY = Math.cos(frame / 47) * float * rad;
  return (
    <div style={{position: 'relative', width: w, height: h}}>
      {/* Тень под рамой — в HTML, мягкая и широкая, как у предмета над поверхностью. */}
      <div style={{position: 'absolute', inset: 10, borderRadius: r, boxShadow: '0 30px 60px rgba(0,0,0,.45), 0 80px 140px rgba(0,0,0,.35)'}} />
      {/* Окно чуть шире отверстия: край прячется под губой рамы и при покачивании не открывает щель. */}
      <div style={{position: 'absolute', left: win - 10, top: win - 10, width: w - win * 2 + 20, height: h - win * 2 + 20, borderRadius: r - win + 10,
        overflow: 'hidden', background: '#FFB07A'}}>
        {children}
        <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', boxShadow: 'inset 0 22px 44px rgba(0,0,0,.38)',
          background: 'linear-gradient(118deg, rgba(255,255,255,.30) 0%, rgba(255,255,255,.06) 28%, rgba(255,255,255,0) 42%)'}} />
      </div>
      <ObjectStage w={w} h={h}>
        <Frame w={w} h={h} tiltX={tiltX} tiltY={tiltY} />
      </ObjectStage>
    </div>
  );
};
