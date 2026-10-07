import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

interface AnimatedCounterProps {
  target: number;
  prefix?: string;
  symbol?: string;
  duration?: number;
  delay?: number;
  sx?: SxProps<Theme>;
}

// Cubic ease-out for luxurious, smooth acceleration and deceleration
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  target,
  prefix = '',
  symbol = '',
  duration = 2000,
  delay = 0,
  sx,
}) => {
  const [currentValue, setCurrentValue] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasAnimatedRef = useRef<boolean>(false);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    // Reset when target value changes
    hasAnimatedRef.current = false;
    setCurrentValue(0);

    const startCounting = () => {
      if (hasAnimatedRef.current) return;
      hasAnimatedRef.current = true;

      const startTime = performance.now() + delay;

      const animate = (currentTime: number) => {
        if (currentTime < startTime) {
          animationFrameRef.current = requestAnimationFrame(animate);
          return;
        }

        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutCubic(progress);

        const nextVal = Math.round(easedProgress * target);
        setCurrentValue(nextVal);

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          setCurrentValue(target);
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Use IntersectionObserver to start animation only when scrolled into view
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          startCounting();
          observer.disconnect();
        }
      },
      {
        threshold: 0.25,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [target, duration, delay]);

  return (
    <Box
      ref={containerRef}
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'baseline',
        justifyContent: 'center',
        ...sx,
      }}
      aria-label={`${prefix}${target}${symbol}`}
    >
      {prefix && (
        <Typography
          component="span"
          sx={{
            fontFamily: 'inherit',
            fontSize: 'inherit',
            fontWeight: 'inherit',
            color: 'inherit',
            lineHeight: 'inherit',
            mr: '1px',
            userSelect: 'none',
          }}
        >
          {prefix}
        </Typography>
      )}
      <Typography
        component="span"
        sx={{
          fontFamily: 'inherit',
          fontSize: 'inherit',
          fontWeight: 'inherit',
          color: 'inherit',
          lineHeight: 'inherit',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {currentValue}
      </Typography>
      {symbol && (
        <Typography
          component="span"
          sx={{
            fontFamily: 'inherit',
            fontSize: 'inherit',
            fontWeight: 'inherit',
            color: 'inherit',
            lineHeight: 'inherit',
            ml: '1px',
            userSelect: 'none',
          }}
        >
          {symbol}
        </Typography>
      )}
    </Box>
  );
};

export default AnimatedCounter;
