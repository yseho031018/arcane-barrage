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

    // ── 공간 격자 구축 (매 프레임, 무기 충돌 검사보다 먼저) ──
    buildEnemyGrid();

    // ── 시각 이펙트 타이머 감소 ──────────────────────
    if (state.bossWarning > 0) state.bossWarning--;
    if (state.hurtFlash > 0) state.hurtFlash -= 2;
    if (state.stageClearFx > 0) state.stageClearFx--;

    // ── 튜토리얼 타이머 ──────────────────────────────
    if (!state.tutorialDone) {
        state.tutorialTime++;
        if (state.tutorialTime > 480) state.tutorialDone = true; // 8초 후 자동 종료
    }

    // 보스가 스폰되기 전까지만 스테이지 타이머가 흐름
    if (!state.bossSpawned) {
        state.stageTime++;
    }

    // ── 적 스폰 ─────────────────────────────
    state.spawnTimer++;

    // 난이도에 따른 스폰 주기 조정
    var diff = DIFFICULTY_SETTINGS[state.difficulty] || DIFFICULTY_SETTINGS.normal;
    var rate = Math.max(15, 120 - (state.stage * 15) + diff.spawnRateAdd);

    // 최대 적 수(MAX_ENEMIES) 이하일 때만 스폰
    if (state.spawnTimer >= rate && !state.bossSpawned && state.enemies.length < MAX_ENEMIES) {
        state.spawnTimer = 0;
        var cnt = 1 + Math.floor(state.stage / 2);
        for (var s = 0; s < cnt; s++) spawnEnemy();
    }

    // ── 보스 스폰 조건 (스테이지 시간 경과 시) ────────
    var requiredTime = 3600; // 1스테이지당 60초(3600프레임)
    if (!state.bossSpawned && state.stageTime >= requiredTime) {
        spawnBoss();
        state.bossSpawned = true;
        state.bossWarning = 200;
        state.hurtFlash = 40;
        state.bossArena = { x: p.x, y: p.y, r: 480 }; // 플레이어 중심 전투 영역
        state.bossProjectiles = [];
        playSound('boss');
    }

    // ── 플레이어 행동 ────────────────────────
    updatePlayerMove();

    // ── 보스 전투 영역 경계: 플레이어가 원 밖으로 못 나가게 ──
    if (state.bossArena) {
        var arenaD = dist(p, state.bossArena);
        var arenaLimit = state.bossArena.r - 18; // 플레이어 반지름(16) + 여유 2
        if (arenaD > arenaLimit) {
            var boundAng = Math.atan2(p.y - state.bossArena.y, p.x - state.bossArena.x);
            p.x = state.bossArena.x + Math.cos(boundAng) * arenaLimit;
            p.y = state.bossArena.y + Math.sin(boundAng) * arenaLimit;
        }
    }

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

        if (e.type === 'dasher') {
            // 대시형 적: 평소엔 천천히 접근, 쿨타임마다 순간 돌진
            e.dashCd--;
            if (e.dashCd <= 0 && !e.isDashing) {
                // 돌진 시작
                e.isDashing = true;
                e.dashTime = 22;
                e.dashVx = Math.cos(ang) * 10;
                e.dashVy = Math.sin(ang) * 10;
                e.dashCd = 120 + Math.floor(Math.random() * 60);
            }
            if (e.isDashing) {
                e.x += e.dashVx;
                e.y += e.dashVy;
                e.dashTime--;
                if (e.dashTime <= 0) e.isDashing = false;
            } else {
                e.x += Math.cos(ang) * e.spd;
                e.y += Math.sin(ang) * e.spd;
            }
        } else if (e.isBoss) {
            // ── 보스 AI ──────────────────────────────────────────────

            if (e.bossType === 'watcher') {
                // ── 감시자: 방사형 탄막 + 돌진 + 링 슬램 ──────────────

                // 패턴 1: 방사형 탄막
                e.burstCd--;
                if (e.burstCd <= 0) {
                    e.burstCd = 95;
                    var burstCount = 8;
                    e.burstAngleOffset = (e.burstAngleOffset + Math.PI / burstCount) % (Math.PI * 2);
                    for (var bi = 0; bi < burstCount; bi++) {
                        var bAng = (Math.PI * 2 / burstCount) * bi + e.burstAngleOffset;
                        state.bossProjectiles.push({
                            x: e.x, y: e.y,
                            vx: Math.cos(bAng) * 2.8, vy: Math.sin(bAng) * 2.8,
                            r: 7, dmg: 8, life: 260,
                            color: '#ff6600',
                        });
                    }
                }

                // 패턴 2: 돌진
                if (!e.isCharging) {
                    e.chargeCd--;
                    if (e.chargeCd <= 0 && e.chargeTelegraph <= 0) {
                        e.chargeTelegraph = 45;
                        e.chargeCd = 210;
                        var cAng = Math.atan2(p.y - e.y, p.x - e.x);
                        e.chargeVx = Math.cos(cAng) * 11;
                        e.chargeVy = Math.sin(cAng) * 11;
                    }
                    if (e.chargeTelegraph > 0) {
                        e.chargeTelegraph--;
                        if (e.chargeTelegraph <= 0) {
                            e.isCharging = true;
                            e.chargeTime = 30;
                            state.camShake = Math.max(state.camShake, 8);
                        }
                    }
                }
                if (e.isCharging) {
                    e.x += e.chargeVx; e.y += e.chargeVy;
                    e.chargeTime--;
                    if (e.chargeTime <= 0) e.isCharging = false;
                } else if (e.chargeTelegraph <= 0) {
                    e.x += Math.cos(ang) * e.spd;
                    e.y += Math.sin(ang) * e.spd;
                }

                // 패턴 3: 링 탄막
                e.slamCd--;
                if (e.slamCd <= 0) {
                    e.slamCd = 300;
                    var ringN = 16;
                    for (var ri = 0; ri < ringN; ri++) {
                        var rAng = (Math.PI * 2 / ringN) * ri;
                        state.bossProjectiles.push({
                            x: e.x + Math.cos(rAng) * 80,
                            y: e.y + Math.sin(rAng) * 80,
                            vx: Math.cos(rAng) * 2.8, vy: Math.sin(rAng) * 2.8,
                            r: 9, dmg: 14, life: 240,
                            color: '#cc00ff',
                        });
                    }
                    state.camShake = Math.max(state.camShake, 13);
                }

            } else if (e.bossType === 'storm') {
                // ── 폭풍술사: 3방향 조준 + 12방향 확산 + 순간이동 ──────
                e.x += Math.cos(ang) * e.spd;
                e.y += Math.sin(ang) * e.spd;

                // 패턴 1: 3방향 조준 탄막
                e.aim3Cd--;
                if (e.aim3Cd <= 0) {
                    e.aim3Cd = 65;
                    var baseAng = Math.atan2(p.y - e.y, p.x - e.x);
                    for (var ai = -1; ai <= 1; ai++) {
                        var aAng = baseAng + ai * 0.35;
                        state.bossProjectiles.push({
                            x: e.x, y: e.y,
                            vx: Math.cos(aAng) * 4.5, vy: Math.sin(aAng) * 4.5,
                            r: 6, dmg: 10, life: 220,
                            color: '#88ccff',
                        });
                    }
                }

                // 패턴 2: 12방향 확산 탄막
                e.spread12Cd--;
                if (e.spread12Cd <= 0) {
                    e.spread12Cd = 200;
                    var spreadOffset = Math.random() * Math.PI;
                    for (var si = 0; si < 12; si++) {
                        var sAng = (Math.PI * 2 / 12) * si + spreadOffset;
                        state.bossProjectiles.push({
                            x: e.x, y: e.y,
                            vx: Math.cos(sAng) * 3.5, vy: Math.sin(sAng) * 3.5,
                            r: 8, dmg: 12, life: 200,
                            color: '#4444ff',
                        });
                    }
                    state.camShake = Math.max(state.camShake, 6);
                }

                // 패턴 3: 순간이동 후 탄막 산포
                e.teleportCd--;
                if (e.teleportCd <= 0) {
                    e.teleportCd = 280;
                    var tAng = Math.random() * Math.PI * 2;
                    var tDist = 150 + Math.random() * 130;
                    e.x = p.x + Math.cos(tAng) * tDist;
                    e.y = p.y + Math.sin(tAng) * tDist;
                    e.teleportFx = 30;
                    state.camShake = Math.max(state.camShake, 10);
                    for (var ti = 0; ti < 12; ti++) {
                        var ttAng = (Math.PI * 2 / 12) * ti;
                        state.bossProjectiles.push({
                            x: e.x, y: e.y,
                            vx: Math.cos(ttAng) * 3.0, vy: Math.sin(ttAng) * 3.0,
                            r: 7, dmg: 11, life: 180,
                            color: '#2255ff',
                        });
                    }
                }
                if (e.teleportFx > 0) e.teleportFx--;

            } else {
                // ── 독술사: 5방향 독 탄막 + 나선형 + 독 링 ─────────────
                e.x += Math.cos(ang) * e.spd;
                e.y += Math.sin(ang) * e.spd;

                // 패턴 1: 5방향 독 탄막 (조준)
                e.toxicCd--;
                if (e.toxicCd <= 0) {
                    e.toxicCd = 100;
                    var toxBase = Math.atan2(p.y - e.y, p.x - e.x);
                    for (var pxi = -2; pxi <= 2; pxi++) {
                        var pxAng = toxBase + pxi * 0.28;
                        state.bossProjectiles.push({
                            x: e.x, y: e.y,
                            vx: Math.cos(pxAng) * 2.2, vy: Math.sin(pxAng) * 2.2,
                            r: 8, dmg: 9, life: 300,
                            color: '#00ff44',
                        });
                    }
                }

                // 패턴 2: 나선형 탄막 (매 6프레임마다 2발)
                e.spiralCd--;
                if (e.spiralCd <= 0) {
                    e.spiralCd = 6;
                    e.spiralAngle += 0.35;
                    for (var spk = 0; spk < 2; spk++) {
                        var spAng = e.spiralAngle + spk * Math.PI;
                        state.bossProjectiles.push({
                            x: e.x, y: e.y,
                            vx: Math.cos(spAng) * 2.0, vy: Math.sin(spAng) * 2.0,
                            r: 5, dmg: 6, life: 280,
                            color: '#88ff44',
                        });
                    }
                }

                // 패턴 3: 독 링
                e.ringCd--;
                if (e.ringCd <= 0) {
                    e.ringCd = 260;
                    var pRingN = 20;
                    for (var pri = 0; pri < pRingN; pri++) {
                        var prAng = (Math.PI * 2 / pRingN) * pri;
                        state.bossProjectiles.push({
                            x: e.x + Math.cos(prAng) * 60,
                            y: e.y + Math.sin(prAng) * 60,
                            vx: Math.cos(prAng) * 1.8, vy: Math.sin(prAng) * 1.8,
                            r: 9, dmg: 12, life: 320,
                            color: '#00cc44',
                        });
                    }
                    state.camShake = Math.max(state.camShake, 10);
                }
            }

        } else {
            e.x += Math.cos(ang) * e.spd;
            e.y += Math.sin(ang) * e.spd;
        }

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
                state.hurtFlash = 25; // 빨간 화면 플래시
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

            if (e.isBoss) {
                nextStage(); // bossArena·bossProjectiles 는 nextStage 내부에서 정리
            }
        } else {
            newEnemies.push(e);
        }
    }
    state.enemies = newEnemies;

    // ── 보스 투사체 이동 & 플레이어 충돌 ────────────────
    var newBossProj = [];
    for (var bpi = 0; bpi < state.bossProjectiles.length; bpi++) {
        var bp = state.bossProjectiles[bpi];
        bp.x += bp.vx; bp.y += bp.vy; bp.life--;
        if (bp.life <= 0) continue;
        if (p.invincible <= 0 && dist(bp, p) < bp.r + 16) {
            if (p.shield > 0 && p.shieldCd <= 0) {
                p.shieldCd = 120;
            } else {
                p.hp -= bp.dmg;
                p.invincible = 35;
                state.hurtFlash = 18;
                state.camShake = Math.max(state.camShake, 5);
                playSound('hurt');
                if (typeof addDamageText === 'function') addDamageText(p.x, p.y - 12, bp.dmg, false, '#ff4444');
            }
            continue; // 투사체 제거
        }
        newBossProj.push(bp);
    }
    state.bossProjectiles = newBossProj;

    // ── XP 젬 수집 ──────────────────────────
    var newGems = [];
    for (var i = 0; i < state.xpGems.length; i++) {
        var g = state.xpGems[i];

        // 자석 효과: 빨려들어오는 중이면 플레이어를 향해 빠르게 이동
        if (g.magnetized) {
            var ang = Math.atan2(p.y - g.y, p.x - g.x);
            g.spd = Math.min((g.spd || 5) * 1.08, 32); // 최고 속도 32px/f 캡 (관통 방지)
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
                p.rerollsLeft = 1; // 레벨업마다 리롤 1회 지급

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
        var goStageEl = document.getElementById('goStage');
        if (goStageEl) goStageEl.textContent = '도달 스테이지: ' + state.stage + ' | 레벨: ' + p.level + ' | 난이도: ' + ({ easy: '쉬움', normal: '보통', hard: '어려움' }[state.difficulty] || '보통');
        document.getElementById('gameOver').style.display = 'flex';
        state.paused = true;
    }
}

/**
 * 보스를 잡았을 때 다음 스테이지로 넘어가는 처리를 담당한다.
 */
/**
 * 관리자 치트: 보스를 즉시 소환한다.
 */
function spawnBossCheat() {
    if (!state || state.paused || state.bossSpawned) return;
    spawnBoss();
    state.bossSpawned = true;
    state.bossWarning = 200;
    state.hurtFlash = 40;
    state.bossArena = { x: state.player.x, y: state.player.y, r: 480 };
    state.bossProjectiles = [];
    playSound('boss');
}

function nextStage() {
    state.stage++;
    state.stageTime = 0;
    state.bossSpawned = false;
    state.stageClearFx = 150;
    state.bossArena = null;           // 전투 영역 제거
    state.bossProjectiles = [];       // 보스 투사체 전부 제거
    state.bossName = '';
    playSound('stageclear');

    state.player.hp = Math.min(state.player.hp + 30, state.player.maxHp);
    state.enemies = [];
}
