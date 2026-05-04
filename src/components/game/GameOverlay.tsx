import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SCREEN_WIDTH as width } from '../../constants/gameConfig';

type OverlayType = 'gameOver' | 'levelComplete' | 'pause';

interface GameOverlayProps {
  type: OverlayType;
  score: number;
  level: number;
  starsEarned: number;   // 0-3 for this level
  highScore: number;
  onRestart: () => void;
  onNextLevel: () => void;
  onHome: () => void;
  onResume?: () => void;
}

// Each star animates in with a bounce + glow
const AnimatedStar: React.FC<{ lit: boolean; index: number }> = ({ lit, index }) => {
  const scale   = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const glow    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (lit) {
      Animated.sequence([
        Animated.delay(300 + index * 200),
        Animated.parallel([
          Animated.spring(scale,   { toValue: 1.4, tension: 250, friction: 5,  useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
          Animated.timing(glow,    { toValue: 1, duration: 150, useNativeDriver: true }),
        ]),
        Animated.spring(scale, { toValue: 1, tension: 150, friction: 8, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scale,   { toValue: 1,    duration: 400 + index*100, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.25, duration: 300,             useNativeDriver: true }),
      ]).start();
    }
  }, [lit, index]);

  return (
    <Animated.View style={{ transform:[{scale}], opacity }}>
      <Text style={[styles.starChar, lit && styles.starLit]}>
        {lit ? '⭐' : '☆'}
      </Text>
    </Animated.View>
  );
};

const CONFETTI = ['🎊','⭐','✨','🎉','💫','🌟','🎈','🥳','🎀','🎁','🎆','🏆'];

export const GameOverlay: React.FC<GameOverlayProps> = ({
  type, score, level, starsEarned, highScore,
  onRestart, onNextLevel, onHome, onResume,
}) => {
  const cardScale = useRef(new Animated.Value(0.7)).current;
  const cardOp    = useRef(new Animated.Value(0)).current;
  const confetti  = useRef(
    Array.from({ length: 12 }, () => ({
      x:  new Animated.Value(0),
      y:  new Animated.Value(0),
      op: new Animated.Value(1),
      r:  new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(cardScale, { toValue:1, tension:60, friction:8, useNativeDriver:true }),
      Animated.timing(cardOp,    { toValue:1, duration:300, useNativeDriver:true }),
    ]).start();

    if (type === 'levelComplete') {
      confetti.forEach((a, i) => {
        const angle = (i / 12) * 2 * Math.PI;
        Animated.parallel([
          Animated.timing(a.x,  { toValue: Math.cos(angle)*130, duration:900, useNativeDriver:true }),
          Animated.timing(a.y,  { toValue: Math.sin(angle)*110 - 70, duration:900, useNativeDriver:true }),
          Animated.sequence([
            Animated.delay(450),
            Animated.timing(a.op, { toValue:0, duration:450, useNativeDriver:true }),
          ]),
          Animated.timing(a.r,  { toValue:360, duration:900, useNativeDriver:true }),
        ]).start();
      });
    }
  }, [type]);

  const isComplete = type === 'levelComplete';
  const isPause    = type === 'pause';
  const isOver     = type === 'gameOver';
  const isNewBest  = !isPause && score > 0 && score >= highScore;

  const cfg = {
    gameOver:      { emoji:'😢', title:'Game Over!',   sub:'Better luck next time!', grad:['#2C3E50','#4a0e0e'] as [string,string] },
    levelComplete: { emoji:'🎉', title:`Level ${level}`, sub:'COMPLETE!',           grad:['#0f3460','#533483'] as [string,string] },
    pause:         { emoji:'⏸', title:'Paused',        sub:'Take a breather!',      grad:['#1a1a3e','#2C3E50'] as [string,string] },
  }[type];

  return (
    <Animated.View style={[styles.backdrop, { opacity: cardOp }]}>
      <View style={StyleSheet.absoluteFillObject}>
        <LinearGradient colors={['rgba(0,0,0,0.82)','rgba(0,0,0,0.96)']} style={StyleSheet.absoluteFill} />
      </View>

      <Animated.View style={[styles.card, { transform:[{scale:cardScale}] }]}>
        <LinearGradient colors={cfg.grad} style={styles.cardInner} start={{x:0,y:0}} end={{x:1,y:1}}>

          {/* Confetti burst */}
          {isComplete && confetti.map((a, i) => (
            <Animated.Text
              key={i}
              style={{
                position:'absolute', fontSize:16, top:'42%', left:'50%',
                transform:[
                  { translateX: a.x },
                  { translateY: a.y },
                  { rotate: a.r.interpolate({ inputRange:[0,360], outputRange:['0deg','360deg'] }) },
                ],
                opacity: a.op,
              }}
            >{CONFETTI[i]}</Animated.Text>
          ))}

          {/* Header */}
          <Text style={styles.emoji}>{cfg.emoji}</Text>
          <Text style={styles.title}>{cfg.title}</Text>
          <Text style={styles.subtitle}>{cfg.sub}</Text>

          {/* Stars row — only on level complete */}
          {isComplete && (
            <View style={styles.starsBlock}>
              <Text style={styles.starsLabel}>STARS EARNED</Text>
              <View style={styles.starsRow}>
                {[0,1,2].map(i => (
                  <AnimatedStar key={i} lit={i < starsEarned} index={i} />
                ))}
              </View>
            </View>
          )}

          {/* Score block */}
          {!isPause && (
            <View style={styles.scoreBlock}>
              <Text style={styles.scoreLabel}>SCORE</Text>
              <Text style={styles.scoreValue}>{score.toLocaleString()}</Text>
              {isNewBest && <Text style={styles.newBest}>🏆 NEW BEST!</Text>}
            </View>
          )}

          {/* Buttons */}
          <View style={styles.btns}>
            {isPause && (
              <TouchableOpacity style={styles.btnPrimary} onPress={onResume}>
                <LinearGradient colors={['#2F86EB','#0f3460']} style={styles.btnGrad}>
                  <Text style={styles.btnTxt}>▶  Resume</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {isComplete && (
              <TouchableOpacity style={styles.btnPrimary} onPress={onNextLevel}>
                <LinearGradient colors={['#FFD700','#FF6B35']} style={styles.btnGrad} start={{x:0,y:0}} end={{x:1,y:0}}>
                  <Text style={styles.btnTxt}>Next Level  →</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {isOver && (
              <TouchableOpacity style={styles.btnPrimary} onPress={onRestart}>
                <LinearGradient colors={['#FF6B35','#FF4757']} style={styles.btnGrad} start={{x:0,y:0}} end={{x:1,y:0}}>
                  <Text style={styles.btnTxt}>↩  Try Again</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.btnSecondary} onPress={onHome}>
              <Text style={styles.btnSecTxt}>🏠  Home</Text>
            </TouchableOpacity>
          </View>

        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  card: {
    width: width * 0.84,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width:0, height:20 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 20,
  },
  cardInner: {
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 28,
  },
  emoji:    { fontSize: 52, marginBottom: 6 },
  title:    { color:'#fff', fontSize:28, fontWeight:'900', letterSpacing:1 },
  subtitle: { color:'#FFD700', fontSize:18, fontWeight:'800', marginBottom:14 },

  // Stars
  starsBlock: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    width: '100%',
    marginBottom: 12,
  },
  starsLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starChar: {
    fontSize: 38,
    color: 'rgba(255,255,255,0.3)',
  },
  starLit: {
    color: '#FFD700',
    textShadowColor: '#FFD700',
    textShadowOffset: { width:0, height:0 },
    textShadowRadius: 12,
  },

  // Score
  scoreBlock: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 14,
    padding: 14,
    width: '100%',
    marginBottom: 18,
  },
  scoreLabel: { color:'rgba(255,255,255,0.6)', fontSize:11, fontWeight:'700', letterSpacing:2 },
  scoreValue: { color:'#fff', fontSize:38, fontWeight:'900' },
  newBest:    { color:'#FFD700', fontSize:14, fontWeight:'900', marginTop:4 },

  // Buttons
  btns: { width:'100%', gap:10 },
  btnPrimary: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset:{width:0,height:4},
    shadowOpacity:0.4,
    shadowRadius:10,
    elevation:6,
  },
  btnGrad: { paddingVertical:14, alignItems:'center' },
  btnTxt:  { color:'#fff', fontSize:17, fontWeight:'900', letterSpacing:0.5 },
  btnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  btnSecTxt: { color:'rgba(255,255,255,0.85)', fontSize:15, fontWeight:'700' },
});
