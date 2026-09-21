// Копия робота для ролика 22 (глянцевая версия после правки 19.09.2026). Файл ролика 21 перенесён другой сессией в _rejected; ролик 22 от него не зависит.
import React, {useLayoutEffect, useMemo} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {AdditiveBlending, CanvasTexture, Color, CurvePath, LineCurve3, MeshBasicMaterial, MeshPhysicalMaterial, PMREMGenerator,
  QuadraticBezierCurve3, Vector2, Vector3, Curve} from 'three';
import {studio} from '../../kit/poster';

// Робот-агент по компоненту Robot Hero с 21st.dev (alexperezcedeno, React Three Fiber), перенесён 19.09.2026 для ролика 21.
// В оригинале голова следит за курсором, моргание — от часов браузера, текстура корпуса — Math.random. В Remotion всё от кадра:
// взгляд и наклон задаёт вызывающий (look), моргание — по кадру, текстура — детерминированная. Геометрия оригинала сохранена.
// Палитра ONai: корпус светло-серый, стекло шлема мятное #3DEDC3, кончики антенн и «сердечки» — оранжевые #FF7A2F.
// Правка Александра 19.09.2026 («выглядит игрушкой»): вместо шершавого «гранита» оригинала — гладкий белый пластик с лаком (PBR),
// тёмная студия с софтбоксами из poster.tsx, ключевой свет сверху слева, мягкая тень под роботом.

const MINT = '#3DEDC3', ORANGE = '#FF7A2F';
const rnd = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

// Контур сердца для «влюблённых» глаз.
class Heart extends Curve<Vector3> {
  constructor() { super(); }
  getPoint(t: number, v = new Vector3()) {
    t *= Math.PI * 2;
    return v.set(16 * Math.sin(t) ** 3 * 0.002, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t) + 6) * 0.002, 0);
  }
}
const HEART = new Heart();

// Глаз — две скобки (верх и низ), как у оригинала.
const eyePaths = () => {
  const w = 0.025, h = 0.035, r = 0.02, g = 0.005;
  const half = (s: 1 | -1) => {
    const p = new CurvePath<Vector3>();
    p.add(new LineCurve3(new Vector3(-w, s * g, 0), new Vector3(-w, s * (h - r), 0)));
    p.add(new QuadraticBezierCurve3(new Vector3(-w, s * (h - r), 0), new Vector3(-w, s * h, 0), new Vector3(-w + r, s * h, 0)));
    p.add(new LineCurve3(new Vector3(-w + r, s * h, 0), new Vector3(w - r, s * h, 0)));
    p.add(new QuadraticBezierCurve3(new Vector3(w - r, s * h, 0), new Vector3(w, s * h, 0), new Vector3(w, s * (h - r), 0)));
    p.add(new LineCurve3(new Vector3(w, s * (h - r), 0), new Vector3(w, s * g, 0)));
    return p;
  };
  return [half(1), half(-1)];
};

const Studio: React.FC = () => {
  const {gl, scene} = useThree();
  useLayoutEffect(() => {
    const pm = new PMREMGenerator(gl);
    const env = pm.fromScene(studio(), 0.02).texture;
    scene.environment = env;
    scene.environmentIntensity = 1;
    gl.toneMappingExposure = 1.0;
    return () => { env.dispose(); pm.dispose(); };
  }, [gl, scene]);
  return null;
};

// Мягкая тень-пятно под роботом вместо ContactShadows из drei (drei в проекте нет).
const shadowTex = () => {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d')!, g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(0,0,0,.7)'); g.addColorStop(0.45, 'rgba(0,0,0,.32)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  return new CanvasTexture(c);
};

export type RobotPose = {
  look?: [number, number]; // куда смотрит: x −1…1 (влево/вправо), y −1…1 (вниз/вверх)
  hover?: number;          // подъём над полом в единицах сцены
  heart?: boolean;         // глаза-сердечки (финал, «пришлю в директ»)
  glow?: number;           // яркость стекла шлема 0…2
};

const Body: React.FC<RobotPose & {t: number}> = ({t, look = [0, 0], hover = 0, heart = false, glow = 1.6}) => {
  const [top, bottom] = useMemo(eyePaths, []);
  const shadow = useMemo(shadowTex, []);
  // белый лак: плотный пластик + прозрачный слой лака сверху (блики софтбоксов по кромке)
  const lacquer = (c: string, rough = 0.3) => new MeshPhysicalMaterial({color: c, roughness: rough, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05,
    sheen: 0.2, sheenColor: new Color('#FFFFFF'), envMapIntensity: 1.1});
  const mats = useMemo(() => ({
    shell: lacquer('#F1F2F3', 0.32),
    head: new MeshPhysicalMaterial({color: '#08090A', roughness: 0.12, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.6}),
    eye: new MeshBasicMaterial({color: new Color(2, 2, 2), toneMapped: false}),
    heartM: new MeshBasicMaterial({color: ORANGE, toneMapped: false}),
    earBase: lacquer('#EDEEEF', 0.3),
    earRing: lacquer('#FFFFFF', 0.2),
    earCenter: lacquer('#C9CDD1', 0.45),
    antBase: new MeshPhysicalMaterial({color: '#C9CED4', roughness: 0.15, metalness: 1, envMapIntensity: 1.6}),
    antStick: new MeshPhysicalMaterial({color: '#E4E7EA', roughness: 0.12, metalness: 1, envMapIntensity: 1.8}),
    antTip: new MeshBasicMaterial({color: ORANGE, toneMapped: false}),
  }), []);
  const neck = useMemo(() => [
    [0.1, -0.05], [0.215, -0.05], [0.28, 0.02], [0.295, 0.045], [0.27, 0.055], [0.1, 0.055], [0.1, 0.055],
  ].map(([x, y]) => new Vector2(x, y)), []);

  // Поза как у оригинала, но без запаздывания: плавность задаёт вызывающий, интерполируя look по кадрам.
  const [tx, ty] = look;
  const bodyRot: [number, number, number] = [-ty * 0.25, -tx * 0.95 * 0.6, -tx * 0.15];
  const headRot: [number, number, number] = [-ty * 0.3, tx * 1.1, 0];
  // Моргание раз в 3 с, 0,45 с; дыхание — лёгкое покачивание вверх-вниз.
  const cyc = t % 3, blink = cyc < 0.45 && !heart ? Math.max(0.05, 1 - Math.sin((cyc / 0.45) * Math.PI)) : 1;
  const bob = Math.sin(t * 1.6) * 0.012 + hover;

  const Eye: React.FC<{x: number; ry: number}> = ({x, ry}) => (
    <group position={[x, 0, 0]} rotation={[0, ry, 0]} scale={[1.1, 1.1 * blink, 1.1]}>
      {heart ? <mesh material={mats.heartM}><tubeGeometry args={[HEART, 64, 0.0035, 8, true]} /></mesh> : (
        <>
          <mesh material={mats.eye}><tubeGeometry args={[top, 20, 0.0035, 8, false]} /></mesh>
          <mesh material={mats.eye}><tubeGeometry args={[bottom, 20, 0.0035, 8, false]} /></mesh>
        </>
      )}
    </group>
  );
  const Ear: React.FC<{x: number; dir: 1 | -1}> = ({x, dir}) => (
    <group position={[x, 0, 0]} scale={1.3}>
      <mesh rotation={[0, 0, Math.PI / 2]} material={mats.earBase}><cylinderGeometry args={[0.04, 0.04, 0.025, 32]} /></mesh>
      <mesh position={[dir * 0.012, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.earRing}><torusGeometry args={[0.032, 0.008, 16, 32]} /></mesh>
      <mesh position={[dir * 0.012, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.earCenter}><cylinderGeometry args={[0.03, 0.03, 0.005, 32]} /></mesh>
      <group position={[dir * 0.015, 0.035, 0]} rotation={[-0.4, 0, 0]}>
        <mesh position={[0, 0.01, 0]} material={mats.antBase}><cylinderGeometry args={[0.006, 0.008, 0.02, 16]} /></mesh>
        <mesh position={[0, 0.06, 0]} material={mats.antStick}><cylinderGeometry args={[0.003, 0.003, 0.1, 8]} /></mesh>
        <mesh position={[0, 0.11, 0]} material={mats.antTip}><sphereGeometry args={[0.009, 16, 16]} /></mesh>
      </group>
    </group>
  );

  return (
    <group>
      <mesh position={[0, -0.74, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.6, 1.6]} />
        <meshBasicMaterial map={shadow} transparent depthWrite={false} opacity={Math.max(0.25, 1 - hover * 2)} />
      </mesh>
      <group position={[0, -0.3 + bob, 0]} rotation={bodyRot}>
        <mesh material={mats.shell}><sphereGeometry args={[0.43, 64, 64, 0, Math.PI * 2, Math.PI * 0.15, Math.PI * 0.85]} /></mesh>
        <mesh position={[0, 0.34, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.shell}><torusGeometry args={[0.235, 0.025, 32, 64]} /></mesh>
        <mesh position={[0, 0.38, 0]} material={mats.shell}><latheGeometry args={[neck, 64]} /></mesh>
        <group position={[0, 0.6, 0]} rotation={headRot}>
          <mesh material={mats.head}><sphereGeometry args={[0.28, 64, 64, 0, Math.PI * 2, 0, Math.PI]} /></mesh>
          {/* мятное стекло шлема: свечение по краю (френель), как у оригинала */}
          <mesh>
            <sphereGeometry args={[0.3, 64, 64, 0, Math.PI * 2, 0, Math.PI]} />
            <shaderMaterial transparent depthWrite={false} blending={AdditiveBlending}
              uniforms={{color: {value: new Color(MINT)}, power: {value: 3.8}, intensity: {value: glow}}}
              vertexShader={'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vV = -mv.xyz; vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*mv; }'}
              fragmentShader={'uniform vec3 color; uniform float power; uniform float intensity; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - max(dot(normalize(vV), normalize(vN)), 0.0), power); gl_FragColor = vec4(color, f*intensity); }'} />
          </mesh>
          <group position={[0, -0.02, 0.29]}>
            <Eye x={-0.07} ry={-0.2} />
            <Eye x={0.07} ry={0.2} />
          </group>
          <Ear x={-0.29} dir={-1} />
          <Ear x={0.29} dir={1} />
        </group>
      </group>
    </group>
  );
};

// Сцена робота на прозрачном холсте: кладётся поверх любого фона Backdrop. Свет сверху слева, как у всех предметов ONai.
// size — высота холста в пикселях кадра; робот с антеннами занимает примерно 85% высоты.
export const Robot3D: React.FC<RobotPose & {size: number; width?: number}> = ({size, width, ...pose}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <ThreeCanvas width={width ?? size} height={size} camera={{fov: 30, position: [0, 0.05, 3.2]}} gl={{alpha: true, antialias: true, preserveDrawingBuffer: true}}>
      <Studio />
      <ambientLight intensity={0.18} />
      <directionalLight position={[-3, 4, 3]} intensity={2.6} />
      <directionalLight position={[3.5, 1.5, -2]} intensity={1.2} />
      <directionalLight position={[2, -2, 2]} intensity={0.35} color="#FFB98A" />
      <Body t={frame / fps} {...pose} />
    </ThreeCanvas>
  );
};
