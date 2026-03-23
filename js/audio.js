// ──────────────────────────────────────────────
// audio.js
// Web Audio API를 이용한 효과음(SFX) + BGM 시스템
// ──────────────────────────────────────────────

var audioCtx = null;
var sfxEnabled = true; // SFX 온/오프 플래그

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

// 처음 클릭/키 입력 시 AudioContext 활성화
document.addEventListener('click', initAudio, { once: true });
document.addEventListener('keydown', initAudio, { once: true });

// ──────────────────────────────────────────────
// 효과음 (SFX)
// ──────────────────────────────────────────────

/**
 * 지정된 타입의 효과음을 재생합니다.
 * @param {string} type 'shoot' | 'hit' | 'xp' | 'levelup' | 'explosion' | 'hurt'
 */
function playSound(type) {
    if (!audioCtx || !sfxEnabled) return;

    var osc     = audioCtx.createOscillator();
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
        osc.start(now); osc.stop(now + 0.1);

    } else if (type === 'hit') {
        // 적중: 짧고 둔탁한 소리
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);

    } else if (type === 'xp') {
        // 경험치 획득: 맑고 통통 튀는 소리
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.setValueAtTime(1200, now + 0.05);
        gainNode.gain.setValueAtTime(0.03, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);

    } else if (type === 'levelup') {
        // 레벨업: 아르페지오 (점차 올라가는 음)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554, now + 0.1);
        osc.frequency.setValueAtTime(659, now + 0.2);
        osc.frequency.setValueAtTime(880, now + 0.3);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.6);
        osc.start(now); osc.stop(now + 0.6);

    } else if (type === 'explosion') {
        // 폭발음: 낮게 깔리는 톱니파에 로우패스 필터 추가
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + 0.3);
        var filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.3);
        osc.disconnect();
        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);

    } else if (type === 'hurt') {
        // 플레이어 피격: 불길하고 낮은 소리
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.2);
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);

    } else if (type === 'boss') {
        // 보스 등장: 낮고 무거운 경고음 + 화음
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(55, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.8);
        gainNode.gain.setValueAtTime(0.25, now);
        gainNode.gain.linearRampToValueAtTime(0.01, now + 0.9);
        osc.start(now); osc.stop(now + 0.9);
        // 두 번째 오실레이터로 불협화음 효과
        var osc2 = audioCtx.createOscillator();
        var g2 = audioCtx.createGain();
        osc2.connect(g2); g2.connect(audioCtx.destination);
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(110, now + 0.1);
        osc2.frequency.linearRampToValueAtTime(75, now + 0.8);
        g2.gain.setValueAtTime(0.1, now + 0.1);
        g2.gain.linearRampToValueAtTime(0.01, now + 0.9);
        osc2.start(now + 0.1); osc2.stop(now + 0.9);

    } else if (type === 'stageclear') {
        // 스테이지 클리어: 상승하는 팡파르
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554, now + 0.12);
        osc.frequency.setValueAtTime(659, now + 0.24);
        osc.frequency.setValueAtTime(880, now + 0.36);
        osc.frequency.setValueAtTime(1108, now + 0.5);
        gainNode.gain.setValueAtTime(0.18, now);
        gainNode.gain.linearRampToValueAtTime(0.01, now + 0.85);
        osc.start(now); osc.stop(now + 0.85);

    } else if (type === 'click') {
        // UI 버튼 클릭: 짧고 경쾌한 틱 소리
        osc.type = 'sine';
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.06);
        gainNode.gain.setValueAtTime(0.04, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.start(now); osc.stop(now + 0.06);
    }
}

// ──────────────────────────────────────────────
// BGM 시퀀서 (직접 작곡한 판타지 전투 배경음악)
//
// ▸ BPM  : 148 (빠르고 긴장감 있는 전투 템포)
// ▸ 조성  : A 단조 (어둡고 강렬한 판타지 분위기)
// ▸ 단위  : 16분음표(1 step) 기반 루프
// ▸ 트랙  : 멜로디(square) + 베이스(sawtooth) + 드럼 3-트랙
// ──────────────────────────────────────────────

var bgmPlaying   = false;
var bgmScheduler = null;
var bgmMasterGain = null; // BGM 전체 볼륨의 마스터 노드

/** 음계 주파수 테이블 (A4 = 440 Hz 기준) */
var NOTE = {
    REST: 0,
    D3: 146.83, E3: 164.81, Eb3: 155.56, F3: 174.61,
    G3: 196.00, A3: 220.00, C4: 261.63,
    D4: 293.66, E4: 329.63, Eb4: 311.13,
    F4: 349.23, G4: 392.00, A4: 440.00,
    B4: 493.88, Bb4: 466.16,
    C5: 523.25, D5: 587.33, Eb5: 622.25, E5: 659.25,
};

var BPM      = 148;
var STEP_SEC = (60 / BPM) / 4; // 16분음표 1개의 길이(초)

/**
 * 멜로디 시퀀스
 * 형식: [NOTE, 지속 스텝 수]
 */
var MELODY = [
    // 마디 1 — Am 메인 테마
    [NOTE.A4, 2], [NOTE.REST, 1], [NOTE.C5, 1],
    [NOTE.B4, 1], [NOTE.A4, 1],  [NOTE.G4, 2],
    [NOTE.REST, 1],[NOTE.E4, 1], [NOTE.F4, 2],
    [NOTE.G4, 1], [NOTE.A4, 1],  [NOTE.REST, 2],

    // 마디 2 — 긴장감 상승
    [NOTE.A4, 2], [NOTE.REST, 1], [NOTE.Eb5, 1],
    [NOTE.E5, 2], [NOTE.D5, 1],   [NOTE.C5, 1],
    [NOTE.B4, 1], [NOTE.A4, 1],   [NOTE.G4, 1], [NOTE.F4, 1],
    [NOTE.E4, 4],

    // 마디 3 — 반전 진행
    [NOTE.C5, 2], [NOTE.B4, 1],  [NOTE.A4, 1],
    [NOTE.G4, 2], [NOTE.A4, 1],  [NOTE.B4, 1],
    [NOTE.C5, 2], [NOTE.REST, 1],[NOTE.D5, 1],
    [NOTE.E5, 1], [NOTE.D5, 1],  [NOTE.C5, 2],

    // 마디 4 — 해결 후 루프 준비
    [NOTE.A4, 1], [NOTE.REST, 1],[NOTE.G4, 2],
    [NOTE.F4, 1], [NOTE.G4, 1],  [NOTE.A4, 2],
    [NOTE.REST, 2],[NOTE.E4, 2],
    [NOTE.A4, 4],
];

/**
 * 베이스 시퀀스
 * Am → C → G → F 코드 진행 기반 저음 라인
 */
var BASS = [
    [NOTE.A3, 4], [NOTE.C4, 4],  [NOTE.G3, 4],  [NOTE.F3, 4],
    [NOTE.A3, 4], [NOTE.Eb3, 4], [NOTE.E3, 4],  [NOTE.A3, 4],
    [NOTE.C4, 4], [NOTE.G3, 4],  [NOTE.F3, 4],  [NOTE.E3, 4],
    [NOTE.D3, 4], [NOTE.F3, 4],  [NOTE.E3, 4],  [NOTE.A3, 4],
];

/**
 * 드럼 패턴 (16 스텝 루프)
 * K = 킥(낮고 무거운 타격)
 * S = 스네어(날카로운 중음)
 * H = 하이햇(짧고 가볍게)
 */
var DRUM_PATTERN = [
    'K','H','H','H',
    'S','H','K','H',
    'K','H','H','H',
    'S','H','K','S',
];

/** 단일 노트를 지정 시간에 예약 재생 */
function scheduleNote(freq, startTime, duration, waveType, vol) {
    if (!audioCtx || freq === 0 || !bgmMasterGain) return;
    var osc = audioCtx.createOscillator();
    var g   = audioCtx.createGain();
    osc.connect(g);
    g.connect(bgmMasterGain); // ← destination 대신 masterGain으로
    osc.type = waveType || 'square';
    osc.frequency.setValueAtTime(freq, startTime);
    g.gain.setValueAtTime(vol || 0.05, startTime);
    g.gain.linearRampToValueAtTime(0.001, startTime + duration * 0.95);
    osc.start(startTime);
    osc.stop(startTime + duration);
}

/** 드럼 1타를 지정 시간에 예약 재생 */
function scheduleDrum(type, startTime) {
    if (!audioCtx || !bgmMasterGain) return;
    var osc = audioCtx.createOscillator();
    var g   = audioCtx.createGain();
    osc.connect(g);
    g.connect(bgmMasterGain); // ← masterGain으로

    if (type === 'K') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, startTime);
        osc.frequency.exponentialRampToValueAtTime(40, startTime + 0.12);
        g.gain.setValueAtTime(0.28, startTime);
        g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);
        osc.start(startTime); osc.stop(startTime + 0.15);
    } else if (type === 'S') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250, startTime);
        osc.frequency.linearRampToValueAtTime(100, startTime + 0.08);
        g.gain.setValueAtTime(0.13, startTime);
        g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);
        osc.start(startTime); osc.stop(startTime + 0.1);
    } else if (type === 'H') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(1200, startTime);
        g.gain.setValueAtTime(0.012, startTime);
        g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.04);
        osc.start(startTime); osc.stop(startTime + 0.04);
    }
}

/** BGM 전체 사이클을 예약하고, 끝나면 자동 재귀 반복 */
function scheduleBgmLoop(startTime) {
    if (!bgmPlaying) return;

    // 멜로디 트랙
    var t = startTime;
    for (var i = 0; i < MELODY.length; i++) {
        var d = MELODY[i][1] * STEP_SEC;
        scheduleNote(MELODY[i][0], t, d * 0.88, 'square', 0.048);
        t += d;
    }
    var loopDur = t - startTime;

    // 베이스 트랙
    var tb = startTime;
    for (var j = 0; j < BASS.length; j++) {
        var bd = BASS[j][1] * STEP_SEC;
        scheduleNote(BASS[j][0], tb, bd * 0.85, 'sawtooth', 0.055);
        tb += bd;
    }

    // 드럼 트랙 (루프 전체 길이만큼 반복)
    var totalSteps = Math.round(loopDur / STEP_SEC);
    for (var k = 0; k < totalSteps; k++) {
        scheduleDrum(DRUM_PATTERN[k % DRUM_PATTERN.length], startTime + k * STEP_SEC);
    }

    // 루프 종료 0.1초 전에 다음 사이클 예약
    bgmScheduler = setTimeout(function() {
        scheduleBgmLoop(startTime + loopDur);
    }, (loopDur - 0.1) * 1000);
}

/** BGM 재생 시작 */
function startBgm() {
    if (bgmPlaying || !audioCtx) return;

    // 마스터 게인 노드 생성 (없으면 새로 만듦, 있으면 볼륨 복원)
    if (!bgmMasterGain) {
        bgmMasterGain = audioCtx.createGain();
        bgmMasterGain.connect(audioCtx.destination);
    }
    bgmMasterGain.gain.cancelScheduledValues(audioCtx.currentTime);
    bgmMasterGain.gain.setValueAtTime(1, audioCtx.currentTime);

    bgmPlaying = true;
    scheduleBgmLoop(audioCtx.currentTime + 0.05);
}

/** BGM 정지 — 예약된 음표까지 즉시 무음체 */
function stopBgm() {
    bgmPlaying = false;
    if (bgmScheduler) {
        clearTimeout(bgmScheduler);
        bgmScheduler = null;
    }
    // 마스터 게인을 즉시 0으로 → 이미 예약된 음표도 바로 묵음
    if (bgmMasterGain && audioCtx) {
        bgmMasterGain.gain.cancelScheduledValues(audioCtx.currentTime);
        bgmMasterGain.gain.setValueAtTime(0, audioCtx.currentTime);
    }
}

/** BGM 켜기/끄기 토글 — 버튼 텍스트도 함께 변경 */
function toggleBgm() {
    var btn = document.getElementById('bgmBtn');
    if (bgmPlaying) {
        stopBgm();
        if (btn) btn.textContent = '🔇 BGM OFF (B)';
    } else {
        startBgm();
        if (btn) btn.textContent = '🎵 BGM ON (B)';
    }
}

/** SFX 켜기/끄기 토글 — 버튼 텍스트도 함께 변경 */
function toggleSfx() {
    sfxEnabled = !sfxEnabled;
    var btn = document.getElementById('sfxBtn');
    if (btn) btn.textContent = sfxEnabled ? '🔊 SFX ON (N)' : '🔇 SFX OFF (N)';
}
