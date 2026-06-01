// src/hooks/useVeePhysics.ts
import {
  useCallback,
  useRef,
  useState,
  useEffect,
  RefObject,
  MutableRefObject,
  PointerEvent as ReactPointerEvent,
} from 'react';

// 1. Interface Ketat untuk Return Value
export interface VeePhysicsReturn {
  veeRef: RefObject<HTMLDivElement | null>;
  eyePosition: { x: number; y: number };
  isMouseDown: boolean;
  isVeeBooped: boolean;
  isVeeTickled: boolean;
  veeHandlers: {
    onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void;
    onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => void;
    onPointerUp: (e: ReactPointerEvent<HTMLDivElement>) => void;
    onPointerCancel: (e: ReactPointerEvent<HTMLDivElement>) => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onClick: () => void;
  };
  isSleeping: boolean;
  isDizzy: boolean;
}

export default function useVeePhysics(): VeePhysicsReturn {
  const veeRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0); // requestAnimationFrame returns number
  const shadowRef = useRef<HTMLDivElement | null>(null);

  // State Interaksi & Easter Eggs
  const [eyePosition, setEyePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isVeeBooped, setIsVeeBooped] = useState<boolean>(false);
  const [isVeeTickled, setIsVeeTickled] = useState<boolean>(false);
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
  const [isSleeping, setIsSleeping] = useState<boolean>(false);
  const [isDizzy, setIsDizzy] = useState<boolean>(false);

  // State Fisika
  const isDragging = useRef<boolean>(false);
  const isHovered = useRef<boolean>(false);
  const hasInteracted = useRef<boolean>(false);
  const isMagnetized = useRef<boolean>(false);
  const initY = useRef<number>(0);
  const veePos = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 });
  const veeVel = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const veeDir = useRef<number>(1);
  const veeRot = useRef<number>(0);
  const lastMouse = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Timer Refs
  const petCounter = useRef<number>(0);
  const petTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boopCount = useRef<number>(0);
  const boopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boopAnimationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dizzyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback((timerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>) => {
    if (!timerRef.current) return;
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const resetIdleTimer = useCallback(() => {
    setIsSleeping(false);
    clearTimer(idleTimer);
    idleTimer.current = setTimeout(() => {
      setIsSleeping(true);
    }, 15000);
  }, [clearTimer]);

  useEffect(() => {
    return () => {
      clearTimer(petTimeoutRef);
      clearTimer(idleTimer);
      clearTimer(boopTimer);
      clearTimer(boopAnimationTimer);
      clearTimer(dizzyTimer);
    };
  }, [clearTimer]);

  useEffect(() => {
    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('keydown', resetIdleTimer);
    const startTimer = setTimeout(resetIdleTimer, 0);
    return () => {
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
      clearTimeout(startTimer);
      clearTimer(idleTimer);
    };
  }, [clearTimer, resetIdleTimer]);

  useEffect(() => {
    const handleMouseLeaveWindow = () => {
      setEyePosition({ x: 0, y: 12 });
    };
    document.addEventListener('mouseleave', handleMouseLeaveWindow);
    return () => document.removeEventListener('mouseleave', handleMouseLeaveWindow);
  }, []);

  // ENGINE FISIKA UTAMA
  useEffect(() => {
    const isDesktopNow = window.innerWidth > 768;
    const vWidth = isDesktopNow ? 240 : 160;
    initY.current = window.innerHeight * (isDesktopNow ? 0.15 : 0.1);

    veePos.current = {
      x: isDesktopNow ? window.innerWidth - vWidth - 64 : window.innerWidth - vWidth - 16,
      y: initY.current
    };
    veeDir.current = -1;

    shadowRef.current = veeRef.current?.querySelector<HTMLDivElement>('.absolute.-bottom-1.h-3') ?? null;

    const updatePhysics = () => {
      if (!veeRef.current) return;
      const vW = window.innerWidth > 768 ? 240 : 160;
      const vH = window.innerWidth > 768 ? 240 : 160;
      const maxX = window.innerWidth - vW;
      const maxY = window.innerHeight - vH;

      const scrollContainer = document.getElementById('landing-scroll-container');
      const currentScroll = scrollContainer ? scrollContainer.scrollTop : 0;
      const isScrolled = currentScroll > window.innerHeight * 0.6;

      let currentGravity = 0.5;
      if (isScrolled) {
        if (veePos.current.y > maxY * 0.5) currentGravity = 0.5;
        else currentGravity = -0.6;
      }

      let dynamicScaleX = veeDir.current;
      let dynamicScaleY = 1;
      let dynamicTranslateY = 0;

      const magnetEl = document.getElementById('vee-magnet-zone');
      if (magnetEl && !isDragging.current) {
        const rect = magnetEl.getBoundingClientRect();
        const mx = rect.left + rect.width / 2;
        const my = rect.top + rect.height / 2;
        const vcx = veePos.current.x + vW / 2;
        const vcy = veePos.current.y + vH / 2;
        const dist = Math.hypot(mx - vcx, my - vcy);

        isMagnetized.current = !hasInteracted.current || dist < 350;
      } else {
        isMagnetized.current = false;
      }

      const targetRot = (currentGravity < 0 && !isDragging.current && !isMagnetized.current) ? 180 : 0;
      veeRot.current += (targetRot - veeRot.current) * 0.1;

      const shadowEl = shadowRef.current;
      if (shadowEl) {
        const altitude = Math.max(0, maxY - veePos.current.y);
        const isAtCeiling = currentGravity < 0;
        const sScale = isAtCeiling ? 0 : Math.max(0.2, 1 - (altitude / 300));
        const sOpac = isAtCeiling ? 0 : Math.max(0, 0.4 - (altitude / 500));
        shadowEl.style.transform = `scaleX(${sScale})`;
        shadowEl.style.opacity = sOpac.toString();
      }

      if (isMagnetized.current && magnetEl && !isDragging.current) {
        const rect = magnetEl.getBoundingClientRect();
        const mx = rect.left + rect.width / 2;
        const my = rect.top + rect.height / 2;

        if (!hasInteracted.current) {
          veePos.current.x = mx - vW / 2;
          veePos.current.y = my - vH / 2 + Math.sin(Date.now() / 400) * 10;
        } else {
          veePos.current.x += (mx - vW / 2 - veePos.current.x) * 0.15;
          veePos.current.y += (my - vH / 2 - veePos.current.y) * 0.15;
        }
        veeVel.current = { x: 0, y: 0 };

      } else if (!isDragging.current && !isSleeping) {
        veeVel.current.y += currentGravity;
        veeVel.current.x *= 0.98;
        veeVel.current.y *= 0.99;

        veePos.current.x += veeVel.current.x;
        veePos.current.y += veeVel.current.y;

        let onFloor = false;
        let onCeiling = false;

        if (veePos.current.y > maxY) {
          veePos.current.y = maxY;
          if (Math.abs(veeVel.current.y) < 1.5) veeVel.current.y = 0;
          else veeVel.current.y *= -0.55;
          veeVel.current.x *= 0.85;
          onFloor = true;
        }

        const ceilingLimit = -vH * 0.35;
        if (currentGravity < 0 && veePos.current.y < ceilingLimit) {
          veePos.current.y = ceilingLimit;
          if (Math.abs(veeVel.current.y) < 1.5) veeVel.current.y = 0;
          else veeVel.current.y *= -0.55;
          veeVel.current.x *= 0.85;
          onCeiling = true;
        }

        if (veePos.current.y < ceilingLimit) {
          veePos.current.y = ceilingLimit;
          veeVel.current.y *= -0.5;
        }

        if (veePos.current.x > maxX) { veePos.current.x = maxX; veeVel.current.x *= -0.6; veeDir.current = -1; }
        if (veePos.current.x < 0) { veePos.current.x = 0; veeVel.current.x *= -0.6; veeDir.current = 1; }

        if (onFloor && Math.abs(veeVel.current.x) < 1.5 && !isHovered.current) {
          const cycle = (Date.now() % 1500) / 1500;
          if (cycle < 0.4) {
            const p = cycle / 0.4;
            dynamicScaleX = veeDir.current * (1 + 0.15 * Math.sin(p * Math.PI));
            dynamicScaleY = 1 - 0.15 * Math.sin(p * Math.PI);
          } else if (cycle < 0.6) {
            const p = (cycle - 0.4) / 0.2;
            veePos.current.x += 4 * veeDir.current * (isScrolled ? -1 : 1);
            dynamicScaleX = veeDir.current * 0.9;
            dynamicScaleY = 1.1;
            dynamicTranslateY = -20 * Math.sin(p * Math.PI);
          } else {
            const p = (cycle - 0.6) / 0.4;
            dynamicScaleX = veeDir.current * (1 + 0.05 * Math.sin(p * Math.PI));
            dynamicScaleY = 1 - 0.05 * Math.sin(p * Math.PI);
          }
        } else if (onCeiling && Math.abs(veeVel.current.x) < 1.5 && !isHovered.current) {
          const cycle = (Date.now() % 3000) / 3000;
          dynamicScaleX = veeDir.current * (1 + 0.03 * Math.sin(cycle * Math.PI * 2));
          dynamicScaleY = 1 - 0.03 * Math.sin(cycle * Math.PI * 2);
        } else if (Math.abs(veeVel.current.x) > 2) {
          veeDir.current = veeVel.current.x > 0 ? 1 : -1;
        }
      }

      if (veeRef.current) {
        veeRef.current.style.transition = 'none';
        veeRef.current.style.transform = `translate3d(${veePos.current.x}px, ${veePos.current.y + dynamicTranslateY}px, 0) scaleX(${dynamicScaleX}) scaleY(${dynamicScaleY}) rotate(${veeRot.current}deg)`;
      }
      animRef.current = requestAnimationFrame(updatePhysics);
    };

    animRef.current = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(animRef.current);
  }, [isSleeping]);

  useEffect(() => {
    const handleEyeMove = (e: MouseEvent) => {
      if (isSleeping || isDizzy) return;
      let x = (e.clientX / window.innerWidth - 0.5) * 12;
      let y = (e.clientY / window.innerHeight - 0.5) * 12;
      x = x * veeDir.current;
      if (veeRot.current > 90) { x = -x; y = -y; }
      setEyePosition({ x, y });
    };

    window.addEventListener('mousemove', handleEyeMove);
    return () => window.removeEventListener('mousemove', handleEyeMove);
  }, [isSleeping, isDizzy]);

  const veeHandlers = {
    onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => {
      hasInteracted.current = true;
      isDragging.current = true;
      isHovered.current = true;
      setIsMouseDown(true);
      isMagnetized.current = false;
      e.currentTarget.setPointerCapture(e.pointerId);
      lastMouse.current = { x: e.clientX, y: e.clientY };
      veeVel.current = { x: 0, y: 0 };
      resetIdleTimer();
    },
    onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => {
      if (isDragging.current) {
        const dx = e.clientX - lastMouse.current.x;
        const dy = e.clientY - lastMouse.current.y;
        veePos.current.x += dx;
        veePos.current.y += dy;
        veeVel.current.x = dx;
        veeVel.current.y = dy;
        lastMouse.current = { x: e.clientX, y: e.clientY };
      }

      if (e.pointerType === 'mouse' && !isMouseDown) return;
      petCounter.current += 1;
      if (petCounter.current > 8) {
        if (!isVeeTickled) setIsVeeTickled(true);
        clearTimer(petTimeoutRef);
        petTimeoutRef.current = setTimeout(() => {
          setIsVeeTickled(false);
          petCounter.current = 0;
        }, 400);
      }
    },
    onPointerUp: (e: ReactPointerEvent<HTMLDivElement>) => {
      isDragging.current = false;
      setIsMouseDown(false);
      e.currentTarget.releasePointerCapture(e.pointerId);
    },
    onPointerCancel: (e: ReactPointerEvent<HTMLDivElement>) => {
      isDragging.current = false;
      setIsMouseDown(false);
      e.currentTarget.releasePointerCapture(e.pointerId);
    },
    onMouseEnter: () => { isHovered.current = true; },
    onMouseLeave: () => {
      isHovered.current = false;
      setIsMouseDown(false);
      setIsVeeTickled(false);
      petCounter.current = 0;
      clearTimer(petTimeoutRef);
    },
    onClick: () => {
      boopCount.current += 1;
      clearTimer(boopTimer);

      boopTimer.current = setTimeout(() => { boopCount.current = 0; }, 1000);
      if (boopCount.current > 7) {
        setIsDizzy(true);
        clearTimer(dizzyTimer);
        dizzyTimer.current = setTimeout(() => {
          setIsDizzy(false);
          boopCount.current = 0;
        }, 4000);
      } else {
        setIsVeeBooped(true);
        clearTimer(boopAnimationTimer);
        boopAnimationTimer.current = setTimeout(() => setIsVeeBooped(false), 300);
      }
    }
  };

  return { veeRef, eyePosition, isMouseDown, isVeeBooped, isVeeTickled, veeHandlers, isSleeping, isDizzy };
}
