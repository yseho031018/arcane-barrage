// ──────────────────────────────────────────────
// main.js
// 진입점: 이벤트 리스너 등록 & 게임 루프 시작
// ──────────────────────────────────────────────

// 키보드 입력 (게임 이동용)
document.addEventListener('keydown', function (e) { keys[e.key] = true; });

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

    // 치트 단축키 (R: 모든 적 제거, U: 강제 레벨업, I: 다음 스테이지, E: 경험치 흡수) - 관리자 한정
    if (isAdmin) {
        if (e.key === 'r' || e.key === 'R') { killAllEnemies(); }
        if (e.key === 'u' || e.key === 'U') { forceLevelUp(); }
        if (e.key === 'i' || e.key === 'I') { forceNextStage(); }
        if (e.key === 'e' || e.key === 'E') { absorbAllExp(); }
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

// 마우스 움직임 추적
document.addEventListener('mousemove', function (e) {
    if (!state) return;
    var rect = document.getElementById('gameCanvas').getBoundingClientRect();
    state.mouse.x = e.clientX - rect.left;
    state.mouse.y = e.clientY - rect.top;
});

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
 * 메인 게임 루프 (requestAnimationFrame 기반)
 */
function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// ── 게임 시작 ───────────────────────────────
goToMainMenu();
loop();
