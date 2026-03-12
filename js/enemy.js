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

    // 스테이지가 올라갈수록 체력 조금씩 추가 보정
    var hp = ENEMY_TIER.hp[tier] + (st * 4);
    var spd = ENEMY_TIER.spd[tier] + Math.random() * 0.2;

    // 스테이지가 올라갈수록 적이 강해지므로 주는 경험치(xp)도 대폭 증가함 (1스테이지 1배, 2스테이지 2배...)
    var xpAmt = ENEMY_TIER.xp[tier] * Math.max(1, st);

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
 */
function spawnBoss() {
    var side = Math.floor(Math.random() * 4);
    var x, y;
    var cx = state.cam.x, cy = state.cam.y;
    // 보스는 크기가 크므로 뷰포트에서 좀 더 떨어진 곳에서 스폰
    if (side === 0) { x = cx + Math.random() * CANVAS_W; y = cy - 60; }
    else if (side === 1) { x = cx + CANVAS_W + 60; y = cy + Math.random() * CANVAS_H; }
    else if (side === 2) { x = cx + Math.random() * CANVAS_W; y = cy + CANVAS_H + 60; }
    else { x = cx - 60; y = cy + Math.random() * CANVAS_H; }

    var st = state.stage;
    var tier = st >= 3 ? 3 : st >= 2 ? 2 : 1;

    // 보스는 해당 스테이지 일반몹의 체력 베이스에 비례해 막대하게 뻥튀기
    var hpbase = ENEMY_TIER.hp[tier] + (st * 4);
    var hp = hpbase * 15 * st;
    var spd = (ENEMY_TIER.spd[tier] + Math.random() * 0.2) * 0.85;

    // 보스 경험치: 스테이지 비례 추가 뻥튀기
    var xpAmt = ENEMY_TIER.xp[tier] * 30 * st * Math.max(1, st);

    state.enemies.push({
        x: x, y: y,
        hp: hp, maxHp: hp,
        spd: spd,
        xp: xpAmt,
        color: '#ff2222', // 보스는 기본적으로 붉은색 강렬하게
        r: ENEMY_TIER.size[tier] * 2.5,
        tier: tier,
        isBoss: true
    });
}
