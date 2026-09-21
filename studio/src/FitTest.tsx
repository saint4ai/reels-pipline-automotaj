import {AbsoluteFill} from 'remotion';
import {useFit} from './ds';
// Отрицательный тест проверки: контейнер без полей и с переполнением обязан дать [fit].
export const FitTest: React.FC = () => {
  const a = useFit('test:no-padding');
  const b = useFit('test:overflow');
  return <AbsoluteFill style={{background: '#111', color: '#fff', padding: 40, gap: 40}}>
    <span ref={a as never} style={{display: 'inline-block', padding: 0, fontSize: 60, width: 'fit-content'}}>Без полей</span>
    <div ref={b as never} style={{width: 200, overflow: 'hidden', whiteSpace: 'nowrap', fontSize: 60, padding: '0 40px'}}>Слишком длинный текст</div>
  </AbsoluteFill>;
};
