import React, { useState, useRef, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, View, Animated, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { HomeScreen }        from './src/screens/HomeScreen';
import { LevelSelectScreen } from './src/screens/LevelSelectScreen';
import { GameScreen }        from './src/screens/GameScreen';
import { usePlayerProgress } from './src/hooks/usePlayerProgress';
import { GAME_MAX_WIDTH, GAME_MAX_HEIGHT } from './src/constants/gameConfig';

type Screen = 'home' | 'levelSelect' | 'game';

export default function App() {
  const [screen, setScreen]         = useState<Screen>('home');
  const [activeLevel, setActiveLevel] = useState(1);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const { progress, saveLevel } = usePlayerProgress();

  const navigate = useCallback((to: Screen, level = 1) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setActiveLevel(level);
      setScreen(to);
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
  }, []);

  const handleLevelComplete = useCallback((level: number, stars: number, score: number) => {
    saveLevel(level, stars, score);
  }, [saveLevel]);

  const content = (
    <Animated.View style={[styles.fill, { opacity: fadeAnim }]}>
      {screen === 'home' && (
        <HomeScreen
          progress={progress}
          onPlay={() => navigate('game', progress.unlockedUpTo)}
          onSelectLevel={() => navigate('levelSelect')}
        />
      )}
      {screen === 'levelSelect' && (
        <LevelSelectScreen
          progress={progress}
          onSelectLevel={level => navigate('game', level)}
          onBack={() => navigate('home')}
        />
      )}
      {screen === 'game' && (
        <GameScreen
          startLevel={activeLevel}
          onHome={() => navigate('home')}
          onLevelComplete={handleLevelComplete}
        />
      )}
    </Animated.View>
  );

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        {Platform.OS === 'web' ? (
          <View style={styles.webShell}>
            <View style={styles.phoneFrame}>
              {content}
            </View>
          </View>
        ) : (
          content
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111' },
  fill: { flex: 1 },
  webShell: {
    flex: 1,
    backgroundColor: '#06060f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneFrame: {
    width: GAME_MAX_WIDTH,
    height: GAME_MAX_HEIGHT,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: '#0f0f2e',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 44,
    borderWidth: 2,
    borderColor: 'rgba(78,205,196,0.35)',
  },
});
