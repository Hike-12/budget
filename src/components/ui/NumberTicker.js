"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from "framer-motion";

const defaultTransition = {
  duration: 1.0,
  ease: "easeOut",
};

const defaultFormatter = (value) => value.toLocaleString("en-IN");

const NumberTicker = forwardRef(function NumberTicker(
  {
    from = 0,
    target = 100,
    transition = defaultTransition,
    className,
    onStart,
    onComplete,
    autoStart = true,
    formatter = defaultFormatter,
    ...props
  },
  ref,
) {
  const controlsRef = useRef(null);
  const lastValueRef = useRef(from);

  const count = useMotionValue(from);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(() =>
    formatter(Math.round(from)),
  );

  useMotionValueEvent(rounded, "change", (latest) => {
    setDisplayValue(formatter(Math.round(latest)));
  });

  const startAnimation = useCallback(() => {
    controlsRef.current?.stop();
    onStart?.();

    count.set(lastValueRef.current);

    controlsRef.current = animate(count, target, {
      ...defaultTransition,
      ...transition,
      onComplete: () => {
        lastValueRef.current = target;
        onComplete?.();
      },
    });
  }, [count, target, transition, onStart, onComplete]);

  useImperativeHandle(
    ref,
    () => ({
      startAnimation,
    }),
    [startAnimation],
  );

  useEffect(() => {
    if (autoStart) startAnimation();
    return () => controlsRef.current?.stop();
  }, [autoStart, startAnimation]);

  return (
    <motion.span className={className} {...props}>
      {displayValue}
    </motion.span>
  );
});

export default NumberTicker;
