// ──────────────────────────────────────────────
// constants.js
// 게임에서 사용하는 고정 상수 및 스킬 목록 정의
// ──────────────────────────────────────────────

/** 뷰포트(캔버스) 크기 - 풀스크린 동적 설정 */
var CANVAS_W = window.innerWidth;
var CANVAS_H = window.innerHeight;

/** 뷰포트 절반 — 카메라 중심 연산에 사용 */
var HALF_W = CANVAS_W / 2;
var HALF_H = CANVAS_H / 2;

/** 모바일 기기 감지 */
var IS_MOBILE = ('ontouchstart' in window) || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

/**
 * 캔버스 크기를 현재 window 크기에 맞게 갱신.
 * 모바일 세로 화면: 9:16 고정 비율 게임 영역 + 하단 조이스틱 존
 * 데스크탑 / 가로 화면: 풀스크린
 */
function updateCanvasSize() {
    var c = document.getElementById('gameCanvas');
    var ui = document.getElementById('ui');
    var mobileZone = document.getElementById('mobileZone');
    if (!c) return;

    var sw = window.innerWidth;
    var sh = window.innerHeight;

    if (IS_MOBILE && sh > sw) {
        // ── 모바일 세로: 9:16 게임 영역 ──────────────────────────
        var gameW = sw;
        var gameH = Math.floor(gameW * 16 / 9);
        if (gameH > sh) {
            // 드물게 화면이 9:16보다 짧을 때 (필러박스)
            gameH = sh;
            gameW = Math.floor(sh * 9 / 16);
        }
        var offsetX = Math.floor((sw - gameW) / 2);
        var zoneH   = sh - gameH;

        CANVAS_W = gameW;
        CANVAS_H = gameH;
        c.width  = gameW;
        c.height = gameH;
        c.style.left   = offsetX + 'px';
        c.style.top    = '0px';
        c.style.width  = gameW + 'px';
        c.style.height = gameH + 'px';

        if (ui) {
            ui.style.left   = offsetX + 'px';
            ui.style.top    = '0px';
            ui.style.width  = gameW + 'px';
            ui.style.height = gameH + 'px';
        }
        if (mobileZone) {
            if (zoneH > 10) {
                mobileZone.style.display = 'flex';
                mobileZone.style.left    = offsetX + 'px';
                mobileZone.style.top     = gameH + 'px';
                mobileZone.style.width   = gameW + 'px';
                mobileZone.style.height  = zoneH + 'px';
            } else {
                mobileZone.style.display = 'none';
            }
        }
    } else {
        // ── PC / 가로 모드: 풀스크린 ──────────────────────────────
        CANVAS_W = sw;
        CANVAS_H = sh;
        c.width  = sw;
        c.height = sh;
        c.style.left   = '0px';
        c.style.top    = '0px';
        c.style.width  = sw + 'px';
        c.style.height = sh + 'px';

        if (ui) {
            ui.style.left   = '0px';
            ui.style.top    = '0px';
            ui.style.width  = sw + 'px';
            ui.style.height = sh + 'px';
        }
        if (mobileZone) mobileZone.style.display = 'none';
    }

    HALF_W = CANVAS_W / 2;
    HALF_H = CANVAS_H / 2;
}

/** 적 최대 동시 존재 수 (메모리 누수 방지) */
var MAX_ENEMIES = 200;

/** 공간 격자 충돌 최적화용 셀 크기 (px) */
var GRID_CELL_SIZE = 80;

/** 난이도별 배율 설정 */
var DIFFICULTY_SETTINGS = {
    easy:   { hpMult: 0.60, spdMult: 0.80, spawnRateAdd: 30 },
    normal: { hpMult: 1.00, spdMult: 1.00, spawnRateAdd: 0  },
    hard:   { hpMult: 1.50, spdMult: 1.20, spawnRateAdd: -20 },
};

/** 스킬 풀 - 레벨업 시 랜덤으로 3개 제시됨 */
var SKILLS = [
  // ── 패시브 스킬 ──────────────────────────────────────────────
  { id: 'orb',       active: false, name: '마법 구슬',   icon: '🔮', desc: '회전하는 마법 구슬 추가',            apply: function (p) { p.orbCount    += 1; },          getLevel: function (p) { return p.orbCount;     } },
  { id: 'proj',      active: false, name: '투사체 강화', icon: '🔵', desc: '투사체 수+1, 속도 증가',             apply: function (p) { p.projCount   += 1; p.projSpd += 1; }, getLevel: function (p) { return p.projCount - 1; } },
  { id: 'pierce',    active: false, name: '관통 공격',   icon: '🏹', desc: '투사체가 적을 관통 (+1)',            apply: function (p) { p.projPierce  += 1; },          getLevel: function (p) { return p.projPierce;   } },
  { id: 'subBullet', active: false, name: '보조 탄환',   icon: '🟠', desc: '몸에서 주황색 보조 탄환 발사 (+1)', apply: function (p) { p.subProjCount += 1; },          getLevel: function (p) { return p.subProjCount; } },
  { id: 'speed',     active: false, name: '이동속도',    icon: '👟', desc: '이동속도 20% 증가',                 apply: function (p) { p.spd         *= 1.2; },         getLevel: function (p) { return 0; }              },
  { id: 'hp',        active: false, name: '최대 HP',     icon: '❤️', desc: '최대 HP +40',                      apply: function (p) { p.maxHp += 40; p.hp = Math.min(p.hp + 40, p.maxHp); }, getLevel: function (p) { return 0; } },
  { id: 'regen',     active: false, name: '자연 회복',   icon: '💚', desc: '3초마다 HP 회복',                   apply: function (p) { p.regen        += 3; },          getLevel: function (p) { return p.regen / 3;    } },
  { id: 'shield',    active: false, name: '방어막',      icon: '🛡️', desc: '피격 쿨타임 방어',                  apply: function (p) { p.shield        += 1; },          getLevel: function (p) { return p.shield;        } },
  { id: 'aura',      active: false, name: '화염 오라',   icon: '🔥', desc: '주변 지속 데미지',                  apply: function (p) { p.auraLv        += 1; },          getLevel: function (p) { return p.auraLv;       } },
  { id: 'thorns',    active: false, name: '가시 갑옷',   icon: '🦔', desc: '피격 시 적에게 데미지 반사',        apply: function (p) { p.thornsLv      += 1; },          getLevel: function (p) { return p.thornsLv;     } },
  { id: 'vampire',   active: false, name: '흡혈',        icon: '🦇', desc: '적 처치 시 확률로 HP 회복',         apply: function (p) { p.vampire        += 1; },          getLevel: function (p) { return p.vampire;       } },

  // ── 액티브 스킬 (자동 쿨타임 발동 — UI에 게이지 표시) ──────────
  {
    id: 'bolt', active: true, name: '번개 볼트', icon: '⚡',
    desc: '가장 가까운 적에게 번개',
    apply:    function (p) { p.boltLv += 1; },
    getLevel: function (p) { return p.boltLv; },
    getMaxCd: function (p) { return Math.max(35, 100 - p.boltLv * 15); },
    getCurCd: function (p) { return Math.max(0, p.boltCd); },
  },
  {
    id: 'missile', active: true, name: '미사일', icon: '🚀',
    desc: '적을 추적해 폭발하는 미사일 발사',
    apply:    function (p) { p.missileLv += 1; },
    getLevel: function (p) { return p.missileLv; },
    getMaxCd: function (p) { return Math.max(60, 200 - p.missileLv * 20); },
    getCurCd: function (p) { return Math.max(0, p.missileCd); },
  },
];


/** 적 티어별 설정 테이블 */
var ENEMY_TIER = {
  hp: [0, 25, 55, 110],
  spd: [0, 0.65, 0.88, 1.1],
  xp: [0, 3, 6, 12],
  color: ['', '#cc4444', '#4444cc', '#cc44cc'],
  size: [0, 13, 17, 21],
  dmg: [0, 4, 8, 15],
};
