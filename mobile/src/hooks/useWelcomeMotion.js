import { useCallback, useRef } from 'react';
import { AccessibilityInfo, Animated, AppState, Easing } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

export default function useWelcomeMotion() {
  const phase = useRef(new Animated.Value(0.55)).current;

  useFocusEffect(useCallback(() => {
    let mounted = true;
    let reducedMotion = true;
    let preferenceChanged = false;
    let animation;

    const update = () => {
      animation?.stop();
      animation = null;
      phase.setValue(0.55);
      if (reducedMotion || AppState.currentState !== 'active') return;

      phase.setValue(0);
      animation = Animated.loop(Animated.timing(phase, {
        toValue: 1,
        duration: 6400,
        easing: Easing.linear,
        useNativeDriver: true,
        isInteraction: false,
      }));
      animation.start();
    };

    const motionSubscription = AccessibilityInfo.addEventListener('reduceMotionChanged', value => {
      preferenceChanged = true;
      reducedMotion = value;
      update();
    });
    const appSubscription = AppState.addEventListener('change', update);
    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (!mounted || preferenceChanged) return;
      reducedMotion = value;
      update();
    }).catch(() => {});

    return () => {
      mounted = false;
      animation?.stop();
      motionSubscription.remove();
      appSubscription.remove();
    };
  }, [phase]));

  return phase;
}
