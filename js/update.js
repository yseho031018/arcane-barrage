// ──────────────────────────────────────────────
// update.js
// 메인 게임 업데이트 루프
// ──────────────────────────────────────────────

/**
 * 숫자 n을 2자리 문자열로 패딩한다.
 * @param {number} n
 * @returns {string}
 */
function pad(n) { return n < 10 ? '0' + n : '' + n; }

/**
 * 매 프레임 호출되는 업데이트 함수.
 * 일시정지 상태이면 즉시 반환한다.
 */
function update() {
    if (!state || state.paused) return;
    var p = state.player;
    state.time++;

    // 보스가 스폰되기 전까지만 스테이지 타이머가 흐름
    if (!state.bossSpawned) {
        state.stageTime++;
    }

    // ── 적 스폰 ─────────────────────────────
    state.spawnTimer++;

    // 스테이지가 올라갈수록 한 번에 스폰되는 수가 늘어나고, 스폰 주기가 짧아짐
    var rate = Math.max(30, 120 - (state.stage * 15));
    if (state.spawnTimer >= rate && !state.bossSpawned) {
        state.spawnTimer = 0;
        var cnt = 1 + Math.floor(state.stage / 2);
        for (var s = 0; s < cnt; s++) spawnEnemy();
    }

    // ── 보스 스폰 조건 (스테이지 시간 경과 시) ────────
    var requiredTime = 3600; // 1스테이지당 60초(3600프레임)
    if (!state.bossSpawned && state.stageTime >= requiredTime) {
        spawnBoss();
        state.bossSpawned = true;
        // 보스가 스폰되면 더이상 잔몹 스폰을 잠시 멈추게 하거나 유지할 수 있는데
        // 뱀파이어 서바이벌 묘미를 위해 잔몹 스폰은 유지.
    }

    // ── 플레이어 행동 ────────────────────────
    updatePlayerMove();

    // ── 화면 흔들림 & 데미지 텍스트 ────────────────
    if (state.camShake > 0) state.camShake *= 0.85;
    if (state.camShake < 0.5) state.camShake = 0;

    var newDt = [];
    if (state.damageTexts) {
        for (var i = 0; i < state.damageTexts.length; i++) {
            var dt = state.damageTexts[i];
            dt.t--;
            dt.y -= 0.6; // 위로 통통 튀어오르는 연출
            if (dt.t > 0) newDt.push(dt);
        }
        state.damageTexts = newDt;
    }

    // ── 카메라 추종 ──────────────────────────
    state.cam.x = p.x - HALF_W;
    state.cam.y = p.y - HALF_H;

    updateSword();

    p.projCd--;
    if (p.projCd <= 0) { p.projCd = p.projCdMax; fireProjectiles(); }

    updateProjectiles();
    fireSubProjectiles();
    updateSubProjectiles();
    updateOrbs();
    updateBolt();
    updateAura();
    updateRegen();
    updateMissiles();

    // ── 번개 이펙트 감쇠 ────────────────────
    var newFx = [];
    for (var i = 0; i < state.boltFx.length; i++) {
        state.boltFx[i].t--;
        if (state.boltFx[i].t > 0) newFx.push(state.boltFx[i]);
    }
    state.boltFx = newFx;

    // ── 미사일 폭발 이펙트 감쇠 ───────────────
    var newMissileFx = [];
    for (var i = 0; i < state.missileFx.length; i++) {
        state.missileFx[i].t--;
        if (state.missileFx[i].t > 0) newMissileFx.push(state.missileFx[i]);
    }
    state.missileFx = newMissileFx;

    // ── 적 이동 & 플레이어 피격 ─────────────
    if (p.invincible > 0) p.invincible--;
    if (p.shieldCd > 0) p.shieldCd--;

    for (var i = 0; i < state.enemies.length; i++) {
        var e = state.enemies[i];
        var ang = Math.atan2(p.y - e.y, p.x - e.x);
        e.x += Math.cos(ang) * e.spd;
        e.y += Math.sin(ang) * e.spd;

        if (dist(p, e) < 16 + e.r && p.invincible <= 0) {
            if (p.thornsLv > 0) {
                e.hp -= p.thornsLv * 15;
                if (typeof addDamageText === 'function') addDamageText(e.x, e.y, p.thornsLv * 15, false, '#aaaaaa');
            }

            if (p.shield > 0 && p.shieldCd <= 0) {
                p.shieldCd = 120;
            } else {
                p.hp -= ENEMY_TIER.dmg[e.tier];
                p.invincible = 50;
                state.camShake = 8;
                playSound('hurt');
                if (typeof addDamageText === 'function') addDamageText(p.x, p.y - 12, ENEMY_TIER.dmg[e.tier], false, '#ff4444');
            }
        }
    }

    // ── 죽은 적 제거 & XP 젬 드롭 & 스테이지 체크 ───
    var newEnemies = [];
    for (var i = 0; i < state.enemies.length; i++) {
        var e = state.enemies[i];
        if (e.hp <= 0) {
            state.kills++;
            if (p.vampire > 0 && Math.random() < p.vampire * 0.05) {
                p.hp = Math.min(p.maxHp, p.hp + 2);
            }
            // 드롭하는 경험치 양이 15 이상이면 대형 경험치 구슬(isLarge: true)로 취급
            state.xpGems.push({ x: e.x, y: e.y, val: e.xp, isLarge: e.xp >= 15 });

            // 보스인지 일반몹인지 구별하여 처리
            if (e.isBoss) {
                // 보스 처치 = 스테이지 클리어
                nextStage();
            }
        } else {
            newEnemies.push(e);
        }
    }
    state.enemies = newEnemies;

    // ── XP 젬 수집 ──────────────────────────
    var newGems = [];
    for (var i = 0; i < state.xpGems.length; i++) {
        var g = state.xpGems[i];

        // 자석 효과: 빨려들어오는 중이면 플레이어를 향해 빠르게 이동
        if (g.magnetized) {
            var ang = Math.atan2(p.y - g.y, p.x - g.x);
            g.spd = (g.spd || 5) * 1.08; // 갈수록 더 빠르게
            g.x += Math.cos(ang) * g.spd;
            g.y += Math.sin(ang) * g.spd;
        }

        // 수집 거리: 빨려올 때 속도가 너무 빠르면 그냥 관통할 수 있으므로 속도만큼 수집 반경을 넉넉히 늘려줌
        var collectDist = g.magnetized ? Math.max(15, g.spd + 5) : 40;

        if (dist(p, g) < collectDist) {
            playSound('xp');
            p.xp += g.val;
            while (p.xp >= p.xpMax) {
                p.xp -= p.xpMax;
                p.level++;
                p.xpMax = Math.floor(p.xpMax * 1.35);
                p.pendingLevelUps++;

                // 레벨업 순간, 맵에 남은 모든 구슬들을 '빨려들어오는' 상태로 변경
                for (var j = 0; j < state.xpGems.length; j++) {
                    state.xpGems[j].magnetized = true;
                }
            }
        } else {
            newGems.push(g);
        }
    }
    state.xpGems = newGems;

    // ── 레벨업 대기열 처리 ────────────────────
    // 대기 중인 레벨업이 있고, 화면에 아직 날아오는 중인 보석이 하나도 없다면 팝업 표시
    if (p.pendingLevelUps > 0) {
        var hasMagnetized = false;
        for (var k = 0; k < state.xpGems.length; k++) {
            if (state.xpGems[k].magnetized) {
                hasMagnetized = true; break;
            }
        }
        if (!hasMagnetized) {
            p.pendingLevelUps--;
            showLevelUp();
        }
    }

    // ── 게임 오버 판정 ───────────────────────
    if (p.hp <= 0) {
        var sec = Math.floor(state.time / 60);
        
        // 최고 기록 통신 및 저장
        var bestTime = parseInt(localStorage.getItem('arcane_best_time') || 0);
        var bestKills = parseInt(localStorage.getItem('arcane_best_kills') || 0);
        
        if (state.time > bestTime) localStorage.setItem('arcane_best_time', state.time);
        if (state.kills > bestKills) localStorage.setItem('arcane_best_kills', state.kills);
        
        var maxTime = Math.max(bestTime, state.time);
        var maxSec = Math.floor(maxTime / 60);

        var curTimeStr = pad(Math.floor(sec / 60)) + ':' + pad(sec % 60);
        var bestTimeStr = pad(Math.floor(maxSec / 60)) + ':' + pad(maxSec % 60);

        document.getElementById('goTime').textContent = '버틴 시간: ' + curTimeStr + ' (최고: ' + bestTimeStr + ')';
        document.getElementById('goKills').textContent = '처치 수: ' + state.kills + ' (최고: ' + Math.max(bestKills, state.kills) + ')';
        document.getElementById('gameOver').style.display = 'flex';
        state.paused = true;
    }
}

/**
 * 보스를 잡았을 때 다음 스테이지로 넘어가는 처리를 담당한다.
 */
function nextStage() {
    state.stage++;
    state.stageTime = 0;
    state.bossSpawned = false;

    // 플레이어 체력 조금 회복 및, 필드 위에 남은 잔몹들 즉시 제거(경험치는 안줌)해 깔끔하게 시작
    state.player.hp = Math.min(state.player.hp + 30, state.player.maxHp);

    // 다음 스테이지로 넘어갈 때 잔몹 초기화
    state.enemies = [];
}
