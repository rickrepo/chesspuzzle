import { useEffect, useState } from 'react';

export function useIsDesktop(breakpoint = 900): boolean {
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const m = window.matchMedia(`(min-width: ${breakpoint}px)`);
    const update = () => setIsDesktop(m.matches);
    update();
    m.addEventListener('change', update);
    return () => m.removeEventListener('change', update);
  }, [breakpoint]);
  return isDesktop;
}