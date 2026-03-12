// ──────────────────────────────────────────────
// state.js
// 게임 상태(state) 초기화 및 재시작 처리
// ──────────────────────────────────────────────

/** 전역 게임 상태 객체 */
var state = null;

/**
 * 새 게임을 시작한다.
 * UI의 Game Over / Level Up 화면을 숨기고 state를 초기화한다.
 * @param {boolean} isAdminLogin 관리자 로그인 여부 (true면 치트 활성화)
 */
function startGame(isAdminLogin) {
    // 만약 인자로 전달 안 되었으면 방어 처리 (하지만 보통 명시됨)
    if (typeof isAdminLogin === 'boolean') {
        if (typeof window !== 'undefined' && window.isAdmin !== undefined) {
            window.isAdmin = isAdminLogin;
        }
    }

    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('levelUp').style.display = 'none';
    document.getElementById('pauseMenu').style.display = 'none';
    document.getElementById('mainMenu').style.display = 'none';

    // 치트 패널 토글
    document.getElementById('devTools').style.display = typeof window !== 'undefined' && window.isAdmin ? 'flex' : 'none';

    // BGM 사운드 시작 (이전 BGM 중지 후 다시 시작)
    if (typeof stopBgm === 'function') stopBgm();
    if (typeof startBgm === 'function') {
        // initAudio 완료 후 시작
        setTimeout(startBgm, 100);
    }

    state = {
        paused: false,
        time: 0,
        kills: 0,

        // 스테이지 정보
        stage: 1,
        stageTime: 0,
        bossSpawned: false,

        // 카메라: 화면 좌상단의 월드 좌표
        cam: { x: -HALF_W, y: -HALF_H },

        // 마우스 좌표 (캔버스 상의 좌표)
        mouse: { x: CANVAS_W / 2, y: CANVAS_H / 2 },

        player: {
            x: 0,  // 무한 월드에서의 시작 좌표
            y: 0,

            // 플레이어가 마지막으로 이동(바라본)한 방향 (기본 우측)
            facingX: 1,
            facingY: 0,

            // 체력
            hp: 120, maxHp: 120,

            // 이동
            spd: 2.5,

            // 경험치 / 레벨
            xp: 0, xpMax: 15, level: 1,
            pendingLevelUps: 0,

            // 무적
            invincible: 0,

            // 검
            swordAngle: 0, swordR: 0, swordDmg: 10, swordCd: 0, hasSword: false,

            // 투사체
            projCount: 1, projSpd: 6, projCd: 0, projCdMax: 50, projPierce: 0,

            // 보조 탄환
            subProjCount: 0, subProjCd: 0, subProjCdMax: 35,

            // 마법 구슬
            orbCount: 0, orbAngle: 0,

            // 번개 볼트
            boltLv: 0, boltCd: 0,

            // 자연 회복
            regen: 0, regenCd: 0,

            // 방어막
            shield: 0, shieldCd: 0,

            // 화염 오라
            auraLv: 0,

            // 신규 추가 스킬
            missileLv: 0, missileCd: 0,
            thornsLv: 0,
            vampire: 0,
        },

        enemies: [],
        projectiles: [],
        subProjectiles: [],
        missiles: [],
        boltFx: [],
        missileFx: [],
        xpGems: [],
        spawnTimer: 0,
    };
}

/**
 * 게임을 즉시 종료하고 메인 화면으로 돌아간다.
 */
function goToMainMenu() {
    if (state) state.paused = true;
    document.getElementById('pauseMenu').style.display = 'none';
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('levelUp').style.display = 'none';
    document.getElementById('mainMenu').style.display = 'flex';
    // 메인 화면이 뜨면 첫 번째 버튼에 자동 포커스 (엔터/방향키 즉시 동작)
    if (typeof focusFirstMenuBtn === 'function') focusFirstMenuBtn();

    // 메인화면으로 돌아갈 때 BGM 정지
    if (typeof stopBgm === 'function') stopBgm();
}
