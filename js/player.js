// ──────────────────────────────────────────────
// player.js
// 플레이어 이동 & 무기(투사체, 오브, 볼트, 오라) 처리
// ──────────────────────────────────────────────

/** 키 입력 상태 (main.js 에서 이벤트로 채워짐) */
var keys = {};

// ── 투사체 발사 ──────────────────────────────

/**
 * 가장 가까운 적을 향해 투사체를 발사한다.
 */
function fireProjectiles() {
    var p = state.player;
    var target = null, minD = Infinity;

    for (var i = 0; i < state.enemies.length; i++) {
        var d = dist(p, state.enemies[i]);
        if (d < minD) { minD = d; target = state.enemies[i]; }
    }
    if (!target) return;

    var baseAng = Math.atan2(target.y - p.y, target.x - p.x);
    var spread = p.projCount > 1 ? 0.25 : 0;
    
    playSound('shoot');

    for (var j = 0; j < p.projCount; j++) {
        var ang = baseAng + (j - (p.projCount - 1) / 2) * spread;
        state.projectiles.push({
            x: p.x, y: p.y,
            vx: Math.cos(ang) * p.projSpd,
            vy: Math.sin(ang) * p.projSpd,
            dmg: 14, r: 6, life: 120,
            pierce: p.projPierce, hitEnemies: [],
        });
    }
}

// ── 플레이어 이동 ────────────────────────────

/**
 * 키 입력에 따라 플레이어를 이동시킨다.
 */
function updatePlayerMove() {
    var p = state.player;
    var dx = 0, dy = 0;

    if (keys['ArrowLeft'] || keys['a'] || keys['A']) dx -= 1;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) dx += 1;
    if (keys['ArrowUp'] || keys['w'] || keys['W']) dy -= 1;
    if (keys['ArrowDown'] || keys['s'] || keys['S']) dy += 1;

    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

    p.x += dx * p.spd;
    p.y += dy * p.spd;
}

// ── 검 ──────────────────────────────────────

/**
 * 검 회전 및 주변 적 피격 처리.
 */
function updateSword() {
    var p = state.player;
    if (!p.hasSword) return;

    p.swordAngle += 0.06;
    p.swordCd--;
    if (p.swordCd <= 0) {
        p.swordCd = 18;
        for (var i = 0; i < state.enemies.length; i++) {
            if (dist(p, state.enemies[i]) < p.swordR + state.enemies[i].r) {
                state.enemies[i].hp -= p.swordDmg;
            }
        }
    }
}

// ── 투사체 이동 & 충돌 ───────────────────────

/**
 * 투사체를 이동시키고 적과의 충돌을 처리한다.
 */
function updateProjectiles() {
    var newProj = [];
    for (var i = 0; i < state.projectiles.length; i++) {
        var b = state.projectiles[i];

        b.x += b.vx; b.y += b.vy; b.life--;

        if (b.life <= 0) continue;

        var hit = false;
        for (var j = 0; j < state.enemies.length; j++) {
            var en = state.enemies[j];
            if (b.hitEnemies.includes(en)) continue; // 이미 타격한 적 무시

            if (!hit && dist(b, en) < b.r + en.r) {
                en.hp -= b.dmg;
                b.hitEnemies.push(en);
                playSound('hit');

                if (b.pierce > 0) {
                    b.pierce--; // 관통 가능하면 횟수 감소시키고 소멸 안함
                } else {
                    hit = true; // 관통력을 다 썼으면 소멸 플래그 ON
                    break;
                }
            }
        }
        if (!hit) newProj.push(b);
    }
    state.projectiles = newProj;
}

// ── 보조 탄환 ────────────────────────────────

/**
 * 쿨타임마다 플레이어 몸에서 주황색 작은 보조 탄환을 발사한다.
 */
function fireSubProjectiles() {
    var p = state.player;
    if (p.subProjCount <= 0) return;

    p.subProjCd--;
    if (p.subProjCd > 0) return;
    p.subProjCd = p.subProjCdMax;

    // 가장 가까운 적 탐색
    var target = null, minD = Infinity;
    for (var i = 0; i < state.enemies.length; i++) {
        var d = dist(p, state.enemies[i]);
        if (d < minD) { minD = d; target = state.enemies[i]; }
    }
    if (!target) return;

    var baseAng = Math.atan2(target.y - p.y, target.x - p.x);
    var spread = p.subProjCount > 1 ? 0.3 : 0;

    for (var j = 0; j < p.subProjCount; j++) {
        var ang = baseAng + (j - (p.subProjCount - 1) / 2) * spread;
        // 플레이어 몸 테두리(r=16)에서 약간 바깥 지점에서 발사
        var ox = p.x + Math.cos(ang) * 18;
        var oy = p.y + Math.sin(ang) * 18;
        state.subProjectiles.push({
            x: ox, y: oy,
            vx: Math.cos(ang) * 7,
            vy: Math.sin(ang) * 7,
            dmg: 8, r: 4, life: 100,
            hitEnemies: []
        });
    }
}

/**
 * 보조 탄환 이동 및 충돌 처리
 */
function updateSubProjectiles() {
    var newProj = [];
    for (var i = 0; i < state.subProjectiles.length; i++) {
        var b = state.subProjectiles[i];
        b.x += b.vx; b.y += b.vy; b.life--;
        if (b.life <= 0) continue;

        var hit = false;
        for (var j = 0; j < state.enemies.length; j++) {
            var en = state.enemies[j];
            if (b.hitEnemies.includes(en)) continue;
            if (dist(b, en) < b.r + en.r) {
                en.hp -= b.dmg;
                hit = true;
                break;
            }
        }
        if (!hit) newProj.push(b);
    }
    state.subProjectiles = newProj;
}



/**
 * 회전하는 오브를 업데이트하고 닿은 적에게 지속 데미지.
 */
function updateOrbs() {
    var p = state.player;
    if (p.orbCount <= 0) return;

    p.orbAngle += 0.05;
    for (var i = 0; i < p.orbCount; i++) {
        var a = p.orbAngle + (Math.PI * 2 / p.orbCount) * i;
        var ox = p.x + Math.cos(a) * 60;
        var oy = p.y + Math.sin(a) * 60;

        for (var j = 0; j < state.enemies.length; j++) {
            var ex = state.enemies[j].x, ey = state.enemies[j].y;
            var er = state.enemies[j].r;
            var dx = ox - ex, dy2 = oy - ey;
            if (Math.sqrt(dx * dx + dy2 * dy2) < er + 9) {
                state.enemies[j].hp -= 0.6;
            }
        }
    }
}

// ── 번개 볼트 ────────────────────────────────

/**
 * 쿨타임마다 가장 가까운 적 n마리에게 번개를 치고 이펙트를 추가한다.
 */
function updateBolt() {
    var p = state.player;
    if (p.boltLv <= 0) return;

    p.boltCd--;
    if (p.boltCd > 0) return;

    p.boltCd = Math.max(35, 100 - p.boltLv * 15);
    var sorted = state.enemies.slice().sort(function (a, b) { return dist(p, a) - dist(p, b); });

    for (var i = 0; i < Math.min(p.boltLv, sorted.length); i++) {
        sorted[i].hp -= 25 + p.boltLv * 12;
        state.boltFx.push({ x1: p.x, y1: p.y, x2: sorted[i].x, y2: sorted[i].y, t: 10 });
    }
}

// ── 화염 오라 ────────────────────────────────

/**
 * 플레이어 주변 적에게 지속 데미지를 입힌다.
 */
function updateAura() {
    var p = state.player;
    if (p.auraLv <= 0) return;

    var range = 50 + p.auraLv * 15;
    for (var i = 0; i < state.enemies.length; i++) {
        if (dist(p, state.enemies[i]) < range) {
            state.enemies[i].hp -= p.auraLv * 0.12;
        }
    }
}

// ── 자연 회복 ────────────────────────────────

/**
 * 일정 주기마다 HP를 회복한다.
 */
function updateRegen() {
    var p = state.player;
    if (p.regen <= 0) return;

    p.regenCd--;
    if (p.regenCd <= 0) {
        p.regenCd = 180;
        p.hp = Math.min(p.maxHp, p.hp + p.regen);
    }
}

// ── 미사일 ───────────────────────────────────

/**
 * 적을 추적하는 미사일을 발사하여 폭발 광역 데미지를 줍니다.
 */
function updateMissiles() {
    var p = state.player;

    // 미사일 발사 타이머
    if (p.missileLv > 0) {
        p.missileCd--;
        if (p.missileCd <= 0) {
            // 레벨이 오를수록 쿨타임 감소 (최소 60프레임 = 1초)
            p.missileCd = Math.max(60, 200 - p.missileLv * 20);
            playSound('shoot');
            
            // 발사 개수 증가
            var count = 1 + Math.floor((p.missileLv - 1) / 2);
            for(var i=0; i<count; i++) {
                var ang = Math.random() * Math.PI * 2;
                state.missiles.push({
                    x: p.x, y: p.y,
                    vx: Math.cos(ang) * 2,
                    vy: Math.sin(ang) * 2,
                    target: null,
                    life: 300,
                    dmg: 45 + p.missileLv * 20,
                    splash: 60 + p.missileLv * 15
                });
            }
        }
    }

    // 미사일 이동 및 충돌
    var newMissiles = [];
    for(var i=0; i<state.missiles.length; i++) {
        var m = state.missiles[i];
        m.life--;
        if (m.life <= 0) continue;

        // 새로운 타겟 서치 (기존 타겟이 없거나 죽은 경우)
        if (!m.target || m.target.hp <= 0) {
            var minD = Infinity, closest = null;
            for (var j = 0; j < state.enemies.length; j++) {
                var e = state.enemies[j];
                var d = dist(m, e);
                if (d < minD) { minD = d; closest = e; }
            }
            m.target = closest;
        }

        // 가속
        var spd = Math.sqrt(m.vx*m.vx + m.vy*m.vy);
        if (spd < 11) spd += 0.3; // 최고 속도 11까지 부드럽게 가속
        
        // 유도 성능 적용
        if (m.target) {
            var desiredAng = Math.atan2(m.target.y - m.y, m.target.x - m.x);
            var currentAng = Math.atan2(m.vy, m.vx);
            var diff = desiredAng - currentAng;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            
            var newAng = currentAng + diff * 0.12; // 유도 반응성
            m.vx = Math.cos(newAng) * spd;
            m.vy = Math.sin(newAng) * spd;
        } else {
            // 타겟이 없으면 그냥 직진
            var currentAng = Math.atan2(m.vy, m.vx);
            m.vx = Math.cos(currentAng) * spd;
            m.vy = Math.sin(currentAng) * spd;
        }

        m.x += m.vx; m.y += m.vy;

        // 충돌 범위 체크 (미사일 크기 10)
        var hit = false;
        for (var j = 0; j < state.enemies.length; j++) {
            var e = state.enemies[j];
            if (dist(m, e) < 10 + e.r) {
                hit = true;
                break;
            }
        }

        // 맞았으면 폭발 데미지
        if (hit) {
            playSound('explosion');
            for (var k = 0; k < state.enemies.length; k++) {
                var e = state.enemies[k];
                if (dist(m, e) < m.splash) {
                    e.hp -= m.dmg;
                }
            }
            // 이펙트 추가
            state.missileFx.push({x: m.x, y: m.y, r: m.splash, t: 20});
        } else {
            newMissiles.push(m);
        }
    }
    state.missiles = newMissiles;
}
