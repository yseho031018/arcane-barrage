// ──────────────────────────────────────────────
// audio.js
// Web Audio API를 이용한 효과음(SFX) 시스템
// ──────────────────────────────────────────────

var audioCtx = null;

/**
 * 사용자 입력 시 AudioContext를 초기화 (브라우저 정책 우회)
 */
function initAudio() {
    if (!audioCtx) {
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            audioCtx = new AudioContext();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// 클릭이나 키 누름 시 오디오 컨텍스트 셋업
document.addEventListener('click', initAudio, { once: true });
document.addEventListener('keydown', initAudio, { once: true });

/**
 * 지정된 타입의 효과음을 재생합니다.
 * @param {string} type 'shoot', 'hit', 'xp', 'levelup', 'explosion', 'hurt'
 */
function playSound(type) {
    if (!audioCtx) return;
    
    var osc = audioCtx.createOscillator();
    var gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    var now = audioCtx.currentTime;
    
    if (type === 'shoot') {
        // 투사체 발사: 짧고 높은 소리
        osc.type = 'square';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.1);
        gainNode.gain.setValueAtTime(0.03, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        
    } else if (type === 'hit') {
        // 적중: 매우 짧고 둔탁한 소리
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        
    } else if (type === 'xp') {
        // 경험치 획득: 맑고 통통 튀는 소리
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.setValueAtTime(1200, now + 0.05);
        gainNode.gain.setValueAtTime(0.03, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        
    } else if (type === 'levelup') {
        // 레벨업: 아르페지오 (점차 올라가는 음)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554, now + 0.1); // C#
        osc.frequency.setValueAtTime(659, now + 0.2); // E
        osc.frequency.setValueAtTime(880, now + 0.3); // A
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
        
    } else if (type === 'explosion') {
        // 폭발음: 낮게 깔리는 톱니파
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + 0.3);
        // 저주파 필터로 노이즈 느낌 추가
        var filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.3);
        
        osc.disconnect();
        osc.connect(filter);
        filter.connect(gainNode);
        
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        
    } else if (type === 'hurt') {
        // 플레이어 피격: 불길하고 낮은 소리
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.2);
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    }
}
