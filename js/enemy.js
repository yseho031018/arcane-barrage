// ──────────────────────────────────────────────
// enemy.js
// 적 스폰 및 유틸 함수
// ──────────────────────────────────────────────

/**
 * 두 오브젝트 사이의 거리를 반환한다.
 * @param {{x:number,y:number}} a
 * @param {{x:number,y:number}} b
 * @returns {number}
 */
function dist(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

// ── 공간 격자 (Spatial Grid) ─────────────────
// 매 프레임 적 위치로 격자를 구축하고, 충돌 검사 시 주변 셀만 탐색해
// O(n²) → O(n) 수준으로 성능을 개선한다.

/**
 * 현재 state.enemies 기준으로 공간 격자를 구축한다.
 * update.js 의 update() 초반에 호출되어야 한다.
 */
function buildEnemyGrid() {
    state.enemyGrid = {};
    for (var i = 0; i < state.enemies.length; i++) {
        var e = state.enemies[i];
        var cx = Math.floor(e.x / GRID_CELL_SIZE);
        var cy = Math.floor(e.y / GRID_CELL_SIZE);
        var key = cx + ',' + cy;
        if (!state.enemyGrid[key]) state.enemyGrid[key] = [];
        state.enemyGrid[key].push(e);
    }
}

/**
 * 특정 좌표 주변 radius 범위 내의 적 배열을 반환한다.
 * @param {number} x
 * @param {number} y
 * @param {number} radius  탐색 반경 (px)
 * @returns {Array}
 */
function getEnemiesNear(x, y, radius) {
    if (!state.enemyGrid) return state.enemies;
    var result = [];
    var minCx = Math.floor((x - radius) / GRID_CELL_SIZE);
    var maxCx = Math.floor((x + radius) / GRID_CELL_SIZE);
    var minCy = Math.floor((y - radius) / GRID_CELL_SIZE);
    var maxCy = Math.floor((y + radius) / GRID_CELL_SIZE);
    for (var cx = minCx; cx <= maxCx; cx++) {
        for (var cy = minCy; cy <= maxCy; cy++) {
            var cell = state.enemyGrid[cx + ',' + cy];
            if (cell) {
                for (var k = 0; k < cell.length; k++) result.push(cell[k]);
            }
        }
    }
    return result;
}

/**
 * 화면 바깥 랜덤 위치에 적을 하나 스폰한다.
 * 현재 게임 시간에 따라 티어와 스탯이 올라간다.
 */
function spawnEnemy() {
    var side = Math.floor(Math.random() * 4);
    var x, y;
    var cx = state.cam.x, cy = state.cam.y;
    if (side === 0) { x = cx + Math.random() * CANVAS_W; y = cy - 20; }
    else if (side === 1) { x = cx + CANVAS_W + 20; y = cy + Math.random() * CANVAS_H; }
    else if (side === 2) { x = cx + Math.random() * CANVAS_W; y = cy + CANVAS_H + 20; }
    else { x = cx - 20; y = cy + Math.random() * CANVAS_H; }

    // 시간(t) 대신 스테이지(st)에 따라 난이도를 고정시킴
    var st = state.stage;
    // 1스테이지: tier 1, 2스테이지: tier 2, 3스테이지 이상: tier 3
    var tier = st >= 3 ? 3 : st >= 2 ? 2 : 1;

    // 난이도 배율 적용
    var diff = DIFFICULTY_SETTINGS[state.difficulty] || DIFFICULTY_SETTINGS.normal;

    // 스테이지가 올라갈수록 체력 조금씩 추가 보정
    var hp = Math.floor((ENEMY_TIER.hp[tier] + (st * 4)) * diff.hpMult);
    var spd = (ENEMY_TIER.spd[tier] + Math.random() * 0.2) * diff.spdMult;

    // 스테이지가 올라갈수록 적이 강해지므로 주는 경험치(xp)도 대폭 증가함 (1스테이지 1배, 2스테이지 2배...)
    var xpAmt = ENEMY_TIER.xp[tier] * Math.max(1, st);

    // 2스테이지 이상: 20% 확률로 대시형 적(Dasher) 스폰
    if (st >= 2 && Math.random() < 0.20) {
        var dashHp = Math.floor(hp * 0.7);
        state.enemies.push({
            x: x, y: y,
            hp: dashHp, maxHp: dashHp,
            spd: spd * 0.55,       // 평소엔 느리게 접근
            xp: Math.floor(xpAmt * 1.2),
            color: '#ff8800',      // 주황색 — 기존 티어 색과 구별
            r: ENEMY_TIER.size[tier] * 0.85,
            tier: tier,
            type: 'dasher',
            dashCd: 90 + Math.floor(Math.random() * 60), // 1.5~2.5초
            dashTime: 0,
            dashVx: 0, dashVy: 0,
            isDashing: false,
        });
        return;
    }

    state.enemies.push({
        x: x, y: y,
        hp: hp, maxHp: hp,
        spd: spd,
        xp: xpAmt,
        color: ENEMY_TIER.color[tier],
        r: ENEMY_TIER.size[tier],
        tier: tier,
    });
}

/**
 * 일정 시간마다 등장하는 보스를 스폰한다.
 * 보스는 영역 안에서 플레이어 근처에 스폰되며, 3종류 중 랜덤으로 선택된다.
 */
function spawnBoss() {
    var p = state.player;

    // 영역 안에서 플레이어로부터 220~350px 랜덤 위치에 스폰
    var spawnAng = Math.random() * Math.PI * 2;
    var spawnDist = 220 + Math.random() * 130;
    var x = p.x + Math.cos(spawnAng) * spawnDist;
    var y = p.y + Math.sin(spawnAng) * spawnDist;

    var st = state.stage;
    var tier = st >= 3 ? 3 : st >= 2 ? 2 : 1;
    var diff = DIFFICULTY_SETTINGS[state.difficulty] || DIFFICULTY_SETTINGS.normal;
    var hpbase = ENEMY_TIER.hp[tier] + (st * 4);
    var hp = Math.floor(hpbase * 15 * st * diff.hpMult);
    var spd = (ENEMY_TIER.spd[tier] + Math.random() * 0.2) * 0.85 * diff.spdMult;
    var xpAmt = ENEMY_TIER.xp[tier] * 30 * st * Math.max(1, st);

    // 보스 타입 랜덤 선택 (watcher / storm / poison)
    var bossTypes = ['watcher', 'storm', 'poison'];
    var bossType = bossTypes[Math.floor(Math.random() * bossTypes.length)];

    var boss = {
        x: x, y: y,
        hp: hp, maxHp: hp,
        spd: spd,
        xp: xpAmt,
        r: ENEMY_TIER.size[tier] * 2.5,
        tier: tier,
        isBoss: true,
        bossType: bossType,
    };

    if (bossType === 'watcher') {
        // 감시자: 방사형 탄막 + 돌진 + 링 슬램
        state.bossName = '👁 감시자';
        boss.color = '#ff2222';
        boss.burstCd = 80;
        boss.burstAngleOffset = 0;
        boss.chargeCd = 210;
        boss.chargeTelegraph = 0;
        boss.isCharging = false;
        boss.chargeTime = 0;
        boss.chargeVx = 0; boss.chargeVy = 0;
        boss.slamCd = 300;

    } else if (bossType === 'storm') {
        // 폭풍술사: 3방향 조준 + 12방향 확산 + 순간이동
        state.bossName = '⚡ 폭풍술사';
        boss.color = '#4488ff';
        boss.aim3Cd = 60;
        boss.spread12Cd = 180;
        boss.teleportCd = 260;
        boss.teleportFx = 0;

    } else {
        // 독술사: 5방향 독 탄막 + 나선형 + 독 링
        state.bossName = '☠ 독술사';
        boss.color = '#44cc44';
        boss.spd *= 0.70;
        boss.toxicCd = 90;
        boss.spiralCd = 0;
        boss.spiralAngle = 0;
        boss.ringCd = 240;
    }

    state.enemies.push(boss);
}
