// ──────────────────────────────────────────────
// constants.js
// 게임에서 사용하는 고정 상수 및 스킬 목록 정의
// ──────────────────────────────────────────────

/** 뷰포트(캔버스) 크기 */
var CANVAS_W = 1000;
var CANVAS_H = 600;

/** 뷰포트 절반 — 카메라 중심 연산에 사용 */
var HALF_W = CANVAS_W / 2;
var HALF_H = CANVAS_H / 2;

/** 스킬 풀 - 레벨업 시 랜덤으로 3개 제시됨 */
var SKILLS = [
  { id: 'orb',       name: '마법 구슬',   icon: '🔮', desc: '회전하는 마법 구슬 추가',                  apply: function (p) { p.orbCount  += 1; },          getLevel: function (p) { return p.orbCount;    } },
  { id: 'proj',      name: '투사체 강화', icon: '🔵', desc: '투사체 수+1, 속도 증가',                  apply: function (p) { p.projCount += 1; p.projSpd += 1; }, getLevel: function (p) { return p.projCount - 1; } },
  { id: 'pierce',    name: '관통 공격',   icon: '🏹', desc: '투사체가 적을 관통 (+1)',                  apply: function (p) { p.projPierce += 1; },         getLevel: function (p) { return p.projPierce;  } },
  { id: 'subBullet', name: '보조 탄환',   icon: '🟠', desc: '몸에서 주황색 보조 탄환 발사 (+1)',        apply: function (p) { p.subProjCount += 1; },       getLevel: function (p) { return p.subProjCount; } },
  { id: 'speed',     name: '이동속도',    icon: '👟', desc: '이동속도 20% 증가',                       apply: function (p) { p.spd *= 1.2; },              getLevel: function (p) { return 0; /* 누적치 */ }  },
  { id: 'hp',        name: '최대 HP',     icon: '❤️', desc: '최대 HP +40',                            apply: function (p) { p.maxHp += 40; p.hp = Math.min(p.hp + 40, p.maxHp); }, getLevel: function (p) { return 0; } },
  { id: 'bolt',      name: '번개 볼트',   icon: '⚡', desc: '가장 가까운 적에게 번개',                  apply: function (p) { p.boltLv += 1; },             getLevel: function (p) { return p.boltLv;      } },
  { id: 'regen',     name: '자연 회복',   icon: '💚', desc: '3초마다 HP 회복',                        apply: function (p) { p.regen  += 3; },             getLevel: function (p) { return p.regen / 3;   } },
  { id: 'shield',    name: '방어막',      icon: '🛡️', desc: '피격 쿨타임 방어',                       apply: function (p) { p.shield += 1; },             getLevel: function (p) { return p.shield;      } },
  { id: 'aura',      name: '화염 오라',   icon: '🔥', desc: '주변 지속 데미지',                        apply: function (p) { p.auraLv += 1; },             getLevel: function (p) { return p.auraLv;      } },
  { id: 'missile',   name: '미사일',      icon: '🚀', desc: '적을 추적해 폭발하는 미사일 발사',         apply: function (p) { p.missileLv += 1; },          getLevel: function (p) { return p.missileLv;   } },
  { id: 'thorns',    name: '가시 갑옷',   icon: '🦔', desc: '피격 시 적에게 데미지 반사',               apply: function (p) { p.thornsLv += 1; },           getLevel: function (p) { return p.thornsLv;    } },
  { id: 'vampire',   name: '흡혈',        icon: '🦇', desc: '적 처치 시 확률적으로 HP 회복',            apply: function (p) { p.vampire  += 1; },           getLevel: function (p) { return p.vampire;     } },
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
