import { useEffect, useRef, useState } from 'react';

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  animation?: 'fadeInUp' | 'fadeInLeft' | 'fadeInRight' | 'fadeIn' | 'scaleIn';
  delay?: number;
}

export function AnimatedSection({ 
  children, 
  className = '', 
  animation = 'fadeInUp',
  delay = 0 
}: AnimatedSectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true);
          }, delay);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [delay]);

  const getAnimationClasses = () => {
    const baseClasses = 'transition-all duration-1000 ease-out';
    
    if (!isVisible) {
      switch (animation) {
        case 'fadeInUp':
          return `${baseClasses} opacity-0 translate-y-8`;
        case 'fadeInLeft':
          return `${baseClasses} opacity-0 -translate-x-8`;
        case 'fadeInRight':
          return `${baseClasses} opacity-0 translate-x-8`;
        case 'fadeIn':
          return `${baseClasses} opacity-0`;
        case 'scaleIn':
          return `${baseClasses} opacity-0 scale-95`;
        default:
          return `${baseClasses} opacity-0 translate-y-8`;
      }
    }
    
    return `${baseClasses} opacity-100 translate-y-0 translate-x-0 scale-100`;
  };

  return (
    <div ref={ref} className={`${getAnimationClasses()} ${className}`}>
      {children}
    </div>
  );
}

// Hover effect component for cards
interface HoverCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: 'lift' | 'glow' | 'scale' | 'rotate';
}

export function HoverCard({ 
  children, 
  className = '', 
  hoverEffect = 'lift' 
}: HoverCardProps) {
  const getHoverClasses = () => {
    const baseClasses = 'transition-all duration-300 ease-out cursor-pointer';
    
    switch (hoverEffect) {
      case 'lift':
        return `${baseClasses} hover:-translate-y-2 hover:shadow-xl`;
      case 'glow':
        return `${baseClasses} hover:shadow-2xl hover:shadow-blue-500/25`;
      case 'scale':
        return `${baseClasses} hover:scale-105`;
      case 'rotate':
        return `${baseClasses} hover:rotate-1`;
      default:
        return `${baseClasses} hover:-translate-y-2 hover:shadow-xl`;
    }
  };

  return (
    <div className={`${getHoverClasses()} ${className}`}>
      {children}
    </div>
  );
}

// Counter animation component
interface AnimatedCounterProps {
  end: number;
  duration?: number;
  suffix?: string;
  className?: string;
}

export function AnimatedCounter({ 
  end, 
  duration = 2000, 
  suffix = '', 
  className = '' 
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    const startValue = 0;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(startValue + (end - startValue) * easeOutQuart);
      
      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, end, duration]);

  return (
    <div ref={ref} className={className}>
      {String(count)}{suffix}
    </div>
  );
}
