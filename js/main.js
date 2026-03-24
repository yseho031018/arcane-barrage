// ──────────────────────────────────────────────
// main.js
// 진입점: 이벤트 리스너 등록 & 게임 루프 시작
// ──────────────────────────────────────────────

// 키보드 입력 (게임 이동용)
document.addEventListener('keydown', function (e) { keys[e.key] = true; });

// UI 버튼 클릭 시 효과음 재생
document.addEventListener('click', function(e) {
    if (e.target.tagName === 'BUTTON' && typeof playSound === 'function') {
        playSound('click');
    }
});

// 관리자 모드 플래그
var isAdmin = false;

// ── 메뉴 키보드 내비게이션 헬퍼 ──────────────
/**
 * 현재 떠 있는 오버레이 화면 안의 클릭 가능한 버튼 배열을 반환.
 */
function getActiveMenuButtons() {
    var screens = ['mainMenu', 'pauseMenu', 'gameOver', 'levelUp'];
    for (var s = 0; s < screens.length; s++) {
        var el = document.getElementById(screens[s]);
        if (el && el.style.display === 'flex') {
            var sel = screens[s] === 'levelUp' ? '.card' : '.mainBtn';
            return Array.prototype.slice.call(el.querySelectorAll(sel));
        }
    }
    return [];
}

/**
 * 오버레이가 열릴 때 첫 번째 버튼에 자동 포커스.
 */
function focusFirstMenuBtn() {
    setTimeout(function () {
        var btns = getActiveMenuButtons();
        if (btns.length > 0) btns[0].focus();
    }, 50);
}

// 게임의 화살표키(ArrowDown 등)로 스크롤 되는걸 막기위해 e.preventDefault()
document.addEventListener('keydown', function (e) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].indexOf(e.key) > -1) {
        e.preventDefault();
    }
    keys[e.key] = true;

    var btns = getActiveMenuButtons();

    // ── 오버레이 메뉴가 열려 있을 때: 방향키 & 엔터 내비게이션 ──
    if (btns.length > 0) {
        var focused = document.activeElement;
        var cur = btns.indexOf(focused);

        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
            // 포커스가 없으면 첫번째, 있으면 다음
            var nextIdx = cur === -1 ? 0 : (cur + 1) % btns.length;
            btns[nextIdx].focus();
            return;
        }
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
            // 포커스가 없으면 마지막, 있으면 이전
            var prevIdx = cur === -1 ? btns.length - 1 : (cur - 1 + btns.length) % btns.length;
            btns[prevIdx].focus();
            return;
        }
        if (e.key === 'Enter') {
            // 포커스된 버튼이 있으면 그 버튼, 없으면 첫번째 버튼 실행
            var target = cur !== -1 ? focused : btns[0];
            target.focus();
            target.click();
            return;
        }
    }

    // 레벨업 화면 단축키 처리 (1, 2, 3)
    if (state && state.paused && document.getElementById('levelUp').style.display === 'flex') {
        if (e.key === '1' || e.key === '2' || e.key === '3') {
            var idx = parseInt(e.key) - 1;
            var cards = document.querySelectorAll('#cards .card');
            if (cards[idx]) cards[idx].click();
        }
    }

    // 레벨업 화면에서 R키 = 다시 뽑기
    if (e.key === 'r' || e.key === 'R') {
        var lvlUpDiv  = document.getElementById('levelUp');
        var rerollBtn = document.getElementById('rerollBtn');
        if (lvlUpDiv && lvlUpDiv.style.display !== 'none' && rerollBtn) {
            rerollBtn.click();
            return;
        }
    }

    // 치트 단축키 (K: 모든 적 제거, U: 강제 레벨업, I: 다음 스테이지, E: 경험치 흡수) - 관리자 한정
    if (isAdmin) {
        if (e.key === 'k' || e.key === 'K') { killAllEnemies(); }
        if (e.key === 'u' || e.key === 'U') { forceLevelUp(); }
        if (e.key === 'i' || e.key === 'I') { forceNextStage(); }
        if (e.key === 'e' || e.key === 'E') { absorbAllExp(); }
        if (e.key === 'o' || e.key === 'O') { spawnBossCheat(); }
    }

    // 일시정지(메뉴) 단축키
    if (e.key === 'Escape') { toggleMenu(); }

    // BGM 켜기/끄기 단축키 (B키) — 오버레이 없을 때만
    if (e.key === 'b' || e.key === 'B') {
        if (typeof toggleBgm === 'function') { toggleBgm(); }
    }

    // SFX 켜기/끄기 단축키 (N키)
    if (e.key === 'n' || e.key === 'N') {
        if (typeof toggleSfx === 'function') { toggleSfx(); }
    }
});
document.addEventListener('keyup', function (e) { keys[e.key] = false; });

// 마우스 움직임 추적 (풀스크린 = canvas가 (0,0)에 위치하므로 clientX/Y 직접 사용)
document.addEventListener('mousemove', function (e) {
    if (!state) return;
    state.mouse.x = e.clientX;
    state.mouse.y = e.clientY;
});

// ── 모바일 터치 조이스틱 ────────────────────
var joystick = { active: false, sx: 0, sy: 0, cx: 0, cy: 0, dx: 0, dy: 0, touchId: null };
// CANVAS_W / CANVAS_H는 constants.js에서 동적으로 관리됨

/**
 * 터치 좌표를 캔버스 내부 좌표로 변환 (풀스크린이므로 1:1 대응)
 */
function getTouchCanvasPos(touch) {
    return { x: touch.clientX, y: touch.clientY };
}

document.addEventListener('touchstart', function(e) {
    if (!state || state.paused) return;
    // UI 버튼 터치면 무시
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;

    for(var i=0; i<e.changedTouches.length; i++){
        var t = e.changedTouches[i];
        // 모바일 세로 모드: 캔버스 아래(하단 조이스틱 존) 터치는 별도 핸들러에서 처리
        if (IS_MOBILE && window.innerHeight > window.innerWidth && t.clientY > CANVAS_H) continue;
        var pos = getTouchCanvasPos(t);
        joystick.active = true;
        joystick.sx = pos.x;
        joystick.sy = pos.y;
        joystick.cx = pos.x;
        joystick.cy = pos.y;
        joystick.touchId = t.identifier;
        break;
    }
}, {passive: false});

document.addEventListener('touchmove', function(e) {
    if (!joystick.active || !state || state.paused) return;
    for(var i=0; i<e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        if (t.identifier === joystick.touchId) {
            if (e.cancelable) e.preventDefault();
            var pos = getTouchCanvasPos(t);
            var nx = pos.x;
            var ny = pos.y;
            
            var dx = nx - joystick.sx;
            var dy = ny - joystick.sy;
            var maxDist = 60;
            var limitDist = Math.sqrt(dx*dx + dy*dy);
            
            if (limitDist > maxDist) {
                dx = (dx / limitDist) * maxDist;
                dy = (dy / limitDist) * maxDist;
                nx = joystick.sx + dx;
                ny = joystick.sy + dy;
            }
            joystick.cx = nx;
            joystick.cy = ny;
            joystick.dx = dx / maxDist;
            joystick.dy = dy / maxDist;
        }
    }
}, {passive: false});

document.addEventListener('touchend', function(e) {
    for(var i=0; i<e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === joystick.touchId) {
            joystick.active = false;
            joystick.dx = 0;
            joystick.dy = 0;
            joystick.touchId = null;
        }
    }
});

// ── 모바일 하단 조이스틱 존 전용 핸들러 ────────────────
(function() {
    var mzEl = document.getElementById('mobileZone');
    var vjB  = document.getElementById('vjBase');
    var vjS  = document.getElementById('vjStick');
    var vjH  = document.getElementById('vjHint');
    if (!mzEl) return;

    function vjReset() {
        joystick.active  = false;
        joystick.dx      = 0;
        joystick.dy      = 0;
        joystick.touchId = null;
        if (vjB) vjB.style.display = 'none';
        if (vjS) { vjS.style.left = '34px'; vjS.style.top = '34px'; }
        if (vjH) vjH.style.display = '';
    }

    mzEl.addEventListener('touchstart', function(e) {
        if (!state || state.paused) return;
        e.preventDefault();
        e.stopPropagation();
        var t    = e.changedTouches[0];
        var rect = mzEl.getBoundingClientRect();

        joystick.active  = true;
        joystick.sx      = t.clientX;
        joystick.sy      = t.clientY;
        joystick.cx      = t.clientX;
        joystick.cy      = t.clientY;
        joystick.dx      = 0;
        joystick.dy      = 0;
        joystick.touchId = t.identifier;

        if (vjB) {
            vjB.style.display = 'block';
            vjB.style.left    = (t.clientX - rect.left - 60) + 'px';
            vjB.style.top     = (t.clientY - rect.top  - 60) + 'px';
        }
        if (vjS) { vjS.style.left = '34px'; vjS.style.top = '34px'; }
        if (vjH) vjH.style.display = 'none';
    }, {passive: false});

    mzEl.addEventListener('touchmove', function(e) {
        if (!joystick.active) return;
        e.preventDefault();
        for (var i = 0; i < e.changedTouches.length; i++) {
            var t = e.changedTouches[i];
            if (t.identifier !== joystick.touchId) continue;
            var dx  = t.clientX - joystick.sx;
            var dy  = t.clientY - joystick.sy;
            var maxDist = 55;
            var d   = Math.sqrt(dx * dx + dy * dy);
            if (d > maxDist) { dx = dx / d * maxDist; dy = dy / d * maxDist; }
            joystick.cx = joystick.sx + dx;
            joystick.cy = joystick.sy + dy;
            joystick.dx = dx / maxDist;
            joystick.dy = dy / maxDist;
            // HTML 스틱 시각 업데이트 (±26px 범위로 클램핑)
            if (vjS) {
                var vx = Math.max(-26, Math.min(26, dx * 26 / maxDist));
                var vy = Math.max(-26, Math.min(26, dy * 26 / maxDist));
                vjS.style.left = (34 + vx) + 'px';
                vjS.style.top  = (34 + vy) + 'px';
            }
        }
    }, {passive: false});

    mzEl.addEventListener('touchend',    function(e) {
        for (var i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === joystick.touchId) vjReset();
        }
    });
    mzEl.addEventListener('touchcancel', vjReset);
})();

// ── 개발자용 치트 기능 ─────────────────────
function killAllEnemies() {
    if (!state || state.paused) return;
    for (var i = 0; i < state.enemies.length; i++) {
        state.enemies[i].hp = 0;
    }
}

function forceLevelUp() {
    if (!state || state.paused) return;
    var p = state.player;
    p.level++;
    p.xpMax = Math.floor(p.xpMax * 1.35);
    showLevelUp();
}

function forceNextStage() {
    if (!state || state.paused) return;
    nextStage();
}

function absorbAllExp() {
    if (!state || state.paused) return;
    for (var j = 0; j < state.xpGems.length; j++) {
        state.xpGems[j].magnetized = true;
    }
}

/**
 * 관리자 로그인 시도
 */
function tryAdminLogin() {
    var id = document.getElementById('adminId').value;
    var pw = document.getElementById('adminPw').value;
    var msg = document.getElementById('loginMsg');

    if (id === 'admin' && pw === '1234') {
        isAdmin = true;
        // 바로 관리자 권한으로 게임 시작
        startGame(true);
        // 필드 초기화
        document.getElementById('adminId').value = '';
        document.getElementById('adminPw').value = '';
        msg.textContent = '';
    } else {
        msg.textContent = '아이디 또는 비밀번호가 틀렸습니다.';
    }
}

/**
 * 일시정지 메뉴 토글
 */
function toggleMenu() {
    if (document.getElementById('mainMenu').style.display === 'flex' ||
        document.getElementById('gameOver').style.display === 'flex') {
        return;
    }

    var menu = document.getElementById('pauseMenu');
    if (menu.style.display === 'none' || menu.style.display === '') {
        state.paused = true;
        menu.style.display = 'flex';
        focusFirstMenuBtn();
    } else {
        state.paused = false;
        menu.style.display = 'none';
    }
}

/**
 * 메인 게임 루프 — 고정 타임스텝(Fixed Timestep) 방식
 *
 * update()는 항상 60fps(16.67ms) 기준으로 실행된다.
 * 120Hz 모바일 등 고주사율 기기에서도 게임 속도가 일정하게 유지된다.
 * draw()는 실제 디스플레이 주사율에 맞춰 호출되어 부드러운 렌더링을 유지한다.
 */
var _loopLastTime = 0;
var _loopAccum = 0;
var _LOOP_STEP = 1000 / 60; // 16.667ms

function loop(timestamp) {
    var elapsed = timestamp - _loopLastTime;
    _loopLastTime = timestamp;

    // 탭 전환 등으로 오래 멈췄다가 재개될 때 큰 dt가 들어오는 것을 방지
    if (elapsed > 200) elapsed = 200;

    _loopAccum += elapsed;

    // 누적 시간이 한 스텝(16.67ms) 이상이면 update()를 그만큼 실행
    while (_loopAccum >= _LOOP_STEP) {
        update();
        _loopAccum -= _LOOP_STEP;
    }

    draw();
    requestAnimationFrame(loop);
}

// ── 게임 시작 ───────────────────────────────
// 캔버스 크기를 화면에 맞게 초기화
updateCanvasSize();

// 화면 크기가 바뀔 때 (가로/세로 전환 등) 캔버스 리사이즈
window.addEventListener('resize', function() {
    updateCanvasSize();
});

goToMainMenu();
requestAnimationFrame(function(ts) {
    _loopLastTime = ts;
    requestAnimationFrame(loop);
});
