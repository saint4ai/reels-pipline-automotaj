import {useMemo} from 'react';
import {Img, staticFile} from 'remotion';
import {CubicBezierCurve3, TubeGeometry, Vector3} from 'three';
import {elevation} from '../ds';
import {ObjectStage, slab} from './three';

// 3D-штекер с кабелем — «коннектор» буквально (ролик 20, 19.09.2026). Штыри смотрят влево, кабель уходит вправо и вниз.
// Корпус — глянцевый пластик с фаской, штыри — металл, кабель — матовая резина по кривой Безье.
// Логотип сервиса лежит HTML-слоем на лицевой стороне корпуса. Холст шире корпуса, чтобы кабель уходил за край кадра.
const BODY = {w: 210, h: 140}, PRONG = {len: 96, h: 18};

const PlugMesh: React.FC<{cable: number; drop: number; body: string}> = ({cable, drop, body}) => {
  const [shell, collar, prong] = useMemo(() => [slab(BODY.w, BODY.h, 34, 70, 18), slab(46, BODY.h * 0.78, 14, 60, 10), slab(PRONG.len, PRONG.h, 6, 14, 4)], []);
  const tube = useMemo(() => {
    const x0 = BODY.w / 2;
    const c = new CubicBezierCurve3(new Vector3(x0, 0, 30), new Vector3(x0 + cable * 0.35, 0, 30), new Vector3(x0 + cable * 0.55, -drop, 30), new Vector3(x0 + cable, -drop, 30));
    return new TubeGeometry(c, 96, 19, 24, false);
  }, [cable, drop]);
  return (
    <group>
      <mesh geometry={shell}><meshPhysicalMaterial color={body} roughness={0.32} clearcoat={0.7} clearcoatRoughness={0.18} /></mesh>
      <mesh geometry={collar} position={[-BODY.w / 2 - 14, 0, 5]}><meshPhysicalMaterial color="#2A2E33" roughness={0.45} clearcoat={0.3} /></mesh>
      {[-1, 1].map((k) => (
        <mesh key={k} geometry={prong} position={[-BODY.w / 2 - 36 - PRONG.len / 2, k * 30, 28]}>
          <meshPhysicalMaterial color="#D9DCE0" metalness={1} roughness={0.22} />
        </mesh>
      ))}
      <mesh geometry={tube}><meshPhysicalMaterial color="#1E2125" roughness={0.6} clearcoat={0.2} /></mesh>
    </group>
  );
};

// Размер элемента — корпус со штырями; кабель рисуется в том же холсте и выходит вправо на cable пикселей.
// Точка крепления (кончики штырей) — левый край элемента по центру высоты: parent ставит её в гнездо.
export const PLUG_TIP = {x: 0, y: BODY.h / 2};
export const Plug: React.FC<{logo?: string; logoBg?: string; cable?: number; drop?: number; body?: string; scale?: number}> =
  ({logo, logoBg = '#FFFFFF', cable = 1300, drop = 260, body = '#F2F3F5', scale = 1}) => {
    const w = PRONG.len + 36 + BODY.w, h = BODY.h;
    return (
      <div style={{position: 'relative', width: w, height: h, transform: `scale(${scale})`, transformOrigin: '0 50%'}}>
        {/* Холст смещён так, что центр корпуса совпадает с началом координат сцены three.js. */}
        <div style={{position: 'absolute', left: PRONG.len + 36, top: 0, width: BODY.w, height: h}}>
          <ObjectStage w={BODY.w} h={h} pad={cable + 200} env={0.75}>
            <PlugMesh cable={cable} drop={drop} body={body} />
          </ObjectStage>
          {logo ? (
            <div style={{position: 'absolute', left: BODY.w / 2 - 46, top: h / 2 - 46, width: 92, height: 92, borderRadius: 26, background: logoBg,
              display: 'grid', placeItems: 'center', boxShadow: `inset 0 2px 0 rgba(255,255,255,.6), ${elevation[1]}`}}>
              <Img src={staticFile(logo)} style={{width: 60, height: 60, objectFit: 'contain'}} />
            </div>
          ) : null}
        </div>
      </div>
    );
  };

// Гнездо: тёмная пластина с двумя прорезями; on 0…1 — подсветка мятным, когда штекер вставлен.
export const Socket: React.FC<{on?: number; size?: number}> = ({on = 0, size = 150}) => (
  <div style={{position: 'relative', width: size * 0.62, height: size, borderRadius: size * 0.2,
    background: 'linear-gradient(180deg, #2E3237 0%, #1A1D21 100%)', boxShadow: `inset 0 2px 0 rgba(255,255,255,.14), inset 0 -3px 0 rgba(0,0,0,.4), ${elevation[1]}, 0 0 ${on * 60}px rgba(61,237,195,${on * 0.7})`}}>
    {[-1, 1].map((k) => (
      <span key={k} style={{position: 'absolute', left: '50%', top: '50%', width: size * 0.14, height: size * 0.3, marginLeft: -size * 0.07,
        marginTop: k * size * 0.2 - size * 0.15, borderRadius: size * 0.05, background: '#07080A', boxShadow: 'inset 0 3px 6px rgba(0,0,0,.9)'}} />
    ))}
  </div>
);
