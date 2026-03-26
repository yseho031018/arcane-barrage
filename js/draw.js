// ──────────────────────────────────────────────
// draw.js
// 캔버스 렌더링 로직
// ──────────────────────────────────────────────

var canvas = document.getElementById('gameCanvas');
var ctx = canvas.getContext('2d');

// ── 배경 별 파티클 (화면 공간 패럴랙스, 초기화 1회) ─
var bgStars = (function () {
    var arr = [];
    for (var i = 0; i < 100; i++) {
        arr.push({
            fx:    Math.random(),             // 0~1 비율 위치 (캔버스 너비)
            fy:    Math.random(),             // 0~1 비율 위치 (캔버스 높이)
            r:     Math.random() * 1.3 + 0.3, // 반지름
            alpha: Math.random() * 0.45 + 0.15,
            speed: Math.random() * 0.08 + 0.02, // 카메라 대비 이동 배율 (패럴랙스)
            phase: Math.random() * Math.PI * 2, // 반짝임 위상
        });
    }
    return arr;
}());

// ── 헬퍼: 스파이크 형 다각형 (tier 1 적) ──────────
function drawSpiky(x, y, r, spikes, innerRatio) {
    var ir = r * innerRatio;
    ctx.beginPath();
    for (var si = 0; si < spikes * 2; si++) {
        var a   = (si * Math.PI / spikes) - Math.PI / 2;
        var rad = si % 2 === 0 ? r : ir;
        if (si === 0) ctx.moveTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
        else          ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
    }
    ctx.closePath();
    ctx.fill();
}

// ── 헬퍼: 정다각형 (tier 2 적) ──────────────────
function drawPolygon(x, y, r, sides, angleOffset) {
    var ao = angleOffset || -Math.PI / 2;
    ctx.beginPath();
    for (var si = 0; si < sides; si++) {
        var a = ao + (si / sides) * Math.PI * 2;
        if (si === 0) ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
        else          ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
}

/**
 * 매 프레임 캔버스를 그린다.
 */
function draw() {
    var W = CANVAS_W, H = CANVAS_H;

    // ── 배경 채우기 ─────────────────────────────
    ctx.fillStyle = '#07070e';
    ctx.fillRect(0, 0, W, H);

    if (!state) return;
    var p  = state.player;
    var cx = state.cam.x;
    var cy = state.cam.y;

    // 화면 흔들림 (Screen Shake)
    if (state.camShake > 0) {
        cx += (Math.random() - 0.5) * state.camShake;
        cy += (Math.random() - 0.5) * state.camShake;
    }

    // ── 배경 별 파티클 ───────────────────────────
    ctx.fillStyle = '#c8c8ff';
    for (var si = 0; si < bgStars.length; si++) {
        var star   = bgStars[si];
        var twink  = 0.6 + Math.sin(state.time * 0.03 + star.phase) * 0.4;
        var starX  = ((star.fx * W - cx * star.speed) % W + W * 100) % W;
        var starY  = ((star.fy * H - cy * star.speed) % H + H * 100) % H;
        ctx.globalAlpha = star.alpha * twink;
        ctx.beginPath();
        ctx.arc(starX, starY, star.r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ── 무한 배경 그리드 (80px) ──────────────────
    var grid = 80;
    var gox  = -(cx % grid + grid) % grid;
    var goy  = -(cy % grid + grid) % grid;
    ctx.strokeStyle = '#14142a';
    ctx.lineWidth   = 1;
    for (var gx = gox; gx < W + grid; gx += grid) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    }
    for (var gy = goy; gy < H + grid; gy += grid) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }
    // 교차점 점
    ctx.fillStyle = '#20204a';
    for (var gx = gox; gx < W + grid; gx += grid) {
        for (var gy = goy; gy < H + grid; gy += grid) {
            ctx.beginPath(); ctx.arc(gx, gy, 1.5, 0, Math.PI * 2); ctx.fill();
        }
    }

    // ── 항상 켜진 화면 가장자리 비네트 ─────────────
    var vigGrad = ctx.createRadialGradient(W * 0.5, H * 0.5, H * 0.28, W * 0.5, H * 0.5, H * 0.88);
    vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
    vigGrad.addColorStop(1, 'rgba(0,0,12,0.5)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, W, H);

    // ── 월드 좌표계 시작 ─────────────────────────
    ctx.save();
    ctx.translate(-cx, -cy);

    // ── 보스 전투 영역 ───────────────────────────
    if (state.bossArena) {
        var ba    = state.bossArena;
        var pulse = 0.55 + Math.sin(state.time * 0.04) * 0.15;

        var arenaGrad = ctx.createRadialGradient(ba.x, ba.y, ba.r * 0.4, ba.x, ba.y, ba.r);
        arenaGrad.addColorStop(0, 'rgba(80,0,0,0)');
        arenaGrad.addColorStop(1, 'rgba(160,0,0,0.18)');
        ctx.fillStyle = arenaGrad;
        ctx.beginPath(); ctx.arc(ba.x, ba.y, ba.r, 0, Math.PI * 2); ctx.fill();

        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.strokeStyle = '#ff2233';
        ctx.lineWidth   = 2.5;
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur  = 14;
        ctx.setLineDash([22, 12]);
        ctx.beginPath(); ctx.arc(ba.x, ba.y, ba.r, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;

        for (var qi = 0; qi < 8; qi++) {
            var qa = (Math.PI / 4) * qi;
            var qx = ba.x + Math.cos(qa) * ba.r;
            var qy = ba.y + Math.sin(qa) * ba.r;
            ctx.save();
            ctx.translate(qx, qy);
            ctx.rotate(qa + Math.PI / 2);
            ctx.globalAlpha = pulse * 0.9;
            ctx.fillStyle   = '#ff3344';
            ctx.beginPath();
            ctx.moveTo(0, -11); ctx.lineTo(7, 7); ctx.lineTo(-7, 7);
            ctx.closePath(); ctx.fill();
            ctx.restore();
        }
        ctx.restore();

        var pArenaDist = Math.sqrt((p.x - ba.x) * (p.x - ba.x) + (p.y - ba.y) * (p.y - ba.y));
        var warnZone   = ba.r - 100;
        if (pArenaDist > warnZone) {
            var warnRatio = (pArenaDist - warnZone) / 100;
            var warnBlink = Math.floor(state.time / 5) % 2 === 0 ? 1 : 0.2;
            ctx.save();
            ctx.globalAlpha = warnRatio * warnBlink * 0.9;
            ctx.strokeStyle = '#ff2222';
            ctx.lineWidth   = 5;
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur  = 22;
            ctx.beginPath(); ctx.arc(ba.x, ba.y, ba.r, 0, Math.PI * 2); ctx.stroke();
            ctx.shadowBlur  = 0;
            var backAng = Math.atan2(ba.y - p.y, ba.x - p.x);
            ctx.strokeStyle = '#ffcc00';
            ctx.lineWidth   = 3;
            ctx.shadowColor = '#ffaa00';
            ctx.shadowBlur  = 8;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + Math.cos(backAng) * 28, p.y + Math.sin(backAng) * 28);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(p.x + Math.cos(backAng) * 28, p.y + Math.sin(backAng) * 28);
            ctx.lineTo(p.x + Math.cos(backAng + 2.4) * 12, p.y + Math.sin(backAng + 2.4) * 12);
            ctx.moveTo(p.x + Math.cos(backAng) * 28, p.y + Math.sin(backAng) * 28);
            ctx.lineTo(p.x + Math.cos(backAng - 2.4) * 12, p.y + Math.sin(backAng - 2.4) * 12);
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.restore();
        }
    }

    // ── XP 젬 (회전 다이아몬드) ─────────────────
    for (var i = 0; i < state.xpGems.length; i++) {
        var g  = state.xpGems[i];
        var gs = g.isLarge ? 9 : 5;
        ctx.save();
        ctx.translate(g.x, g.y);
        ctx.rotate(state.time * 0.04);
        ctx.shadowColor = g.isLarge ? '#ff3388' : '#00ffcc';
        ctx.shadowBlur  = g.isLarge ? 14 : 8;
        ctx.fillStyle   = g.isLarge ? '#ff77bb' : '#00ffcc';
        ctx.beginPath();
        ctx.moveTo(0, -gs);
        ctx.lineTo(gs * 0.62, 0);
        ctx.lineTo(0,  gs);
        ctx.lineTo(-gs * 0.62, 0);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle  = 'rgba(255,255,255,0.72)';
        ctx.beginPath(); ctx.arc(-gs * 0.22, -gs * 0.28, gs * 0.22, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    // ── 번개 이펙트 ──────────────────────────────
    for (var i = 0; i < state.boltFx.length; i++) {
        var f = state.boltFx[i];
        ctx.strokeStyle = 'rgba(255,255,80,' + (f.t / 10) + ')';
        ctx.lineWidth   = 3;
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur  = 14;
        ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x2, f.y2); ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // ── 미사일 폭발 이펙트 ───────────────────────
    for (var i = 0; i < state.missileFx.length; i++) {
        var mfx = state.missileFx[i];
        ctx.shadowColor = '#ff3300';
        ctx.shadowBlur  = 20;
        ctx.fillStyle   = 'rgba(255,120,20,' + (mfx.t / 20 * 0.55) + ')';
        ctx.beginPath(); ctx.arc(mfx.x, mfx.y, mfx.r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,60,0,' + (mfx.t / 20 * 0.85) + ')';
        ctx.lineWidth   = 3;
        ctx.beginPath(); ctx.arc(mfx.x, mfx.y, mfx.r, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle   = 'rgba(255,240,180,' + (mfx.t / 20 * 0.4) + ')';
        ctx.beginPath(); ctx.arc(mfx.x, mfx.y, mfx.r * 0.4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;

    // ── 미사일 본체 ──────────────────────────────
    for (var i = 0; i < state.missiles.length; i++) {
        var m   = state.missiles[i];
        var ang = Math.atan2(m.vy, m.vx);
        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.rotate(ang);
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur  = 12;
        // 꼬리 불꽃
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.moveTo(-10, -4);
        ctx.lineTo(-18 - Math.random() * 8, 0);
        ctx.lineTo(-10, 4);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,200,0,0.5)';
        ctx.beginPath();
        ctx.moveTo(-10, -2.5);
        ctx.lineTo(-13 - Math.random() * 5, 0);
        ctx.lineTo(-10, 2.5);
        ctx.fill();
        // 몸체
        ctx.fillStyle = '#e0e8ff';
        ctx.fillRect(-10, -3, 14, 6);
        // 머리
        ctx.fillStyle   = '#ff2222';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur  = 8;
        ctx.beginPath();
        ctx.moveTo(4, -3); ctx.lineTo(10, 0); ctx.lineTo(4, 3);
        ctx.fill();
        ctx.restore();
    }
    ctx.shadowBlur = 0;

    // ── 보스 투사체 ──────────────────────────────
    for (var bpi = 0; bpi < state.bossProjectiles.length; bpi++) {
        var bp      = state.bossProjectiles[bpi];
        var bpPulse = 0.7 + Math.sin(state.time * 0.15 + bpi) * 0.3;
        ctx.shadowColor = bp.color;
        ctx.shadowBlur  = 18;
        ctx.fillStyle   = bp.color;
        ctx.beginPath(); ctx.arc(bp.x, bp.y, bp.r, 0, Math.PI * 2); ctx.fill();
        // 외곽 펄스 링
        ctx.globalAlpha = bpPulse * 0.5;
        ctx.strokeStyle = bp.color;
        ctx.lineWidth   = 2;
        ctx.shadowBlur  = 6;
        ctx.beginPath(); ctx.arc(bp.x, bp.y, bp.r + 4, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.shadowBlur  = 0;
        // 흰 코어
        ctx.fillStyle = 'rgba(255,255,255,0.72)';
        ctx.beginPath(); ctx.arc(bp.x, bp.y, bp.r * 0.38, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;

    // ── 플레이어 투사체 (물방울/테어드롭) ───────────
    for (var i = 0; i < state.projectiles.length; i++) {
        var b = state.projectiles[i];
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(Math.atan2(b.vy, b.vx));
        ctx.shadowColor = '#44aaff';
        ctx.shadowBlur  = 14;
        var pGrad = ctx.createRadialGradient(b.r * 0.9, 0, 0, 0, 0, b.r * 1.9);
        pGrad.addColorStop(0, '#ffffff');
        pGrad.addColorStop(0.3, '#88ccff');
        pGrad.addColorStop(1,   'rgba(50,120,255,0)');
        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, b.r * 1.85, b.r, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    ctx.shadowBlur = 0;

    // ── 보조 탄환 (주황 다이아몬드) ─────────────────
    for (var i = 0; i < state.subProjectiles.length; i++) {
        var sb = state.subProjectiles[i];
        ctx.save();
        ctx.translate(sb.x, sb.y);
        ctx.rotate(Math.atan2(sb.vy, sb.vx));
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur  = 10;
        ctx.fillStyle   = '#ff9944';
        ctx.beginPath();
        ctx.moveTo(sb.r * 1.6,  0);
        ctx.lineTo(0,  sb.r);
        ctx.lineTo(-sb.r * 1.6, 0);
        ctx.lineTo(0, -sb.r);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
    ctx.shadowBlur = 0;

    // ── 화염 오라 ────────────────────────────────
    if (p.auraLv > 0) {
        var auraR  = 50 + p.auraLv * 15;
        var auraGr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, auraR);
        auraGr.addColorStop(0,   'rgba(255,120,0,0.28)');
        auraGr.addColorStop(0.6, 'rgba(255,60,0,0.12)');
        auraGr.addColorStop(1,   'rgba(255,30,0,0)');
        ctx.fillStyle = auraGr;
        ctx.beginPath(); ctx.arc(p.x, p.y, auraR, 0, Math.PI * 2); ctx.fill();
        // 외곽 회전 점선
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(state.time * 0.03);
        ctx.strokeStyle = 'rgba(255,120,0,0.35)';
        ctx.lineWidth   = 1.5;
        ctx.setLineDash([6, 10]);
        ctx.beginPath(); ctx.arc(0, 0, auraR, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    }

    // ── 마법 구슬 ────────────────────────────────
    if (p.orbCount > 0) {
        for (var i = 0; i < p.orbCount; i++) {
            var oa       = p.orbAngle + (Math.PI * 2 / p.orbCount) * i;
            var ox       = p.x + Math.cos(oa) * 60;
            var oy       = p.y + Math.sin(oa) * 60;
            var orbPulse = 0.8 + Math.sin(state.time * 0.12 + i * 2.1) * 0.2;
            // 글로우 헤일로
            ctx.shadowColor = '#aa44ff';
            ctx.shadowBlur  = 20;
            ctx.fillStyle   = 'rgba(180,80,255,0.2)';
            ctx.beginPath(); ctx.arc(ox, oy, 14 * orbPulse, 0, Math.PI * 2); ctx.fill();
            // 구슬 본체
            var oGrad = ctx.createRadialGradient(ox - 2, oy - 2, 0, ox, oy, 9);
            oGrad.addColorStop(0, '#ffffff');
            oGrad.addColorStop(0.4, '#cc88ff');
            oGrad.addColorStop(1,   '#660099');
            ctx.fillStyle = oGrad;
            ctx.shadowBlur = 12;
            ctx.beginPath(); ctx.arc(ox, oy, 9, 0, Math.PI * 2); ctx.fill();
        }
        ctx.shadowBlur = 0;
    }

    // ── 검 호 ────────────────────────────────────
    if (p.hasSword) {
        ctx.strokeStyle = 'rgba(200,120,255,0.7)';
        ctx.lineWidth   = 3;
        ctx.shadowColor = '#cc66ff';
        ctx.shadowBlur  = 12;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.swordR, p.swordAngle, p.swordAngle + Math.PI * 0.9);
        ctx.stroke();
        ctx.shadowBlur = 0;
        var sx    = p.x + Math.cos(p.swordAngle) * p.swordR;
        var sy    = p.y + Math.sin(p.swordAngle) * p.swordR;
        var sGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, 8);
        sGrad.addColorStop(0, '#ffffff');
        sGrad.addColorStop(1, '#aa44ff');
        ctx.fillStyle   = sGrad;
        ctx.shadowColor = '#aa44ff';
        ctx.shadowBlur  = 16;
        ctx.beginPath(); ctx.arc(sx, sy, 6, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
    }

    // ── 적 ───────────────────────────────────────
    for (var i = 0; i < state.enemies.length; i++) {
        var e      = state.enemies[i];
        var ePulse = 0.65 + Math.sin(state.time * 0.07 + i * 0.85) * 0.18;
        ctx.fillStyle   = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur  = e.isBoss ? 28 : 10;

        if (e.type === 'dasher') {
            // ── 대시형: 다이아몬드 ──
            ctx.save();
            ctx.translate(e.x, e.y);
            if (e.isDashing) {
                var dashAng = Math.atan2(e.dashVy, e.dashVx);
                ctx.rotate(dashAng + Math.PI / 4);
                ctx.shadowColor = '#ffff00';
                ctx.shadowBlur  = 20;
            }
            ctx.beginPath();
            ctx.moveTo(0, -e.r); ctx.lineTo(e.r * 1.1, 0);
            ctx.lineTo(0,  e.r); ctx.lineTo(-e.r * 1.1, 0);
            ctx.closePath();
            ctx.fill();
            if (e.isDashing) {
                ctx.strokeStyle = '#ffee00';
                ctx.lineWidth   = 2;
                ctx.stroke();
            }
            ctx.restore();

        } else if (e.isBoss) {
            // ── 보스: 회전 링 + 그라데이션 바디 ──

            // 회전 외곽 링
            ctx.save();
            ctx.translate(e.x, e.y);
            var spinSpd = e.bossType === 'storm' ? 0.045 : 0.018;
            ctx.rotate(state.time * spinSpd);
            ctx.strokeStyle = e.color;
            ctx.lineWidth   = 2.5;
            ctx.shadowBlur  = 16;
            ctx.setLineDash([16, 10]);
            ctx.beginPath(); ctx.arc(0, 0, e.r + 14, 0, Math.PI * 2); ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();

            // 보스 바디 그라데이션
            var bGrad = ctx.createRadialGradient(
                e.x - e.r * 0.3, e.y - e.r * 0.3, 1,
                e.x, e.y, e.r
            );
            bGrad.addColorStop(0,   '#ffffff');
            bGrad.addColorStop(0.3, e.color);
            bGrad.addColorStop(1,   'rgba(0,0,0,0.85)');
            ctx.fillStyle  = bGrad;
            ctx.shadowBlur = 22;
            ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fill();

            // 내부 펄스 링
            ctx.save();
            ctx.globalAlpha = ePulse * 0.65;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth   = 2;
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur  = 8;
            ctx.beginPath(); ctx.arc(e.x, e.y, e.r * 0.58, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();

            // 흰 외곽선
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth   = 2.5;
            ctx.shadowBlur  = 0;
            ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.stroke();

            // 폭풍술사 순간이동 이펙트
            if (e.bossType === 'storm' && e.teleportFx > 0) {
                var tfR = e.teleportFx / 30;
                ctx.save();
                ctx.globalAlpha = tfR * 0.8;
                ctx.strokeStyle = '#88ccff';
                ctx.lineWidth   = 3;
                ctx.shadowColor = '#4488ff';
                ctx.shadowBlur  = 22;
                ctx.beginPath(); ctx.arc(e.x, e.y, e.r + (1 - tfR) * 80, 0, Math.PI * 2); ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.restore();
            }

            // 돌진 예고 (감시자)
            if (e.bossType === 'watcher' && e.chargeTelegraph > 0) {
                var tRatio = e.chargeTelegraph / 45;
                var blink  = Math.floor(state.time / 4) % 2 === 0 ? 1 : 0.35;
                ctx.save();
                ctx.globalAlpha = tRatio * blink;
                ctx.strokeStyle = '#ffff00';
                ctx.lineWidth   = 4;
                ctx.shadowColor = '#ffff00';
                ctx.shadowBlur  = 22;
                ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 12, 0, Math.PI * 2); ctx.stroke();
                ctx.shadowBlur = 0;
                var arrAng = Math.atan2(e.chargeVy, e.chargeVx);
                var tipX   = e.x + Math.cos(arrAng) * (e.r + 90);
                var tipY   = e.y + Math.sin(arrAng) * (e.r + 90);
                ctx.strokeStyle = '#ff4444';
                ctx.lineWidth   = 3;
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur  = 12;
                ctx.beginPath();
                ctx.moveTo(e.x + Math.cos(arrAng) * e.r, e.y + Math.sin(arrAng) * e.r);
                ctx.lineTo(tipX, tipY);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(tipX, tipY);
                ctx.lineTo(tipX + Math.cos(arrAng + 2.5) * 18, tipY + Math.sin(arrAng + 2.5) * 18);
                ctx.moveTo(tipX, tipY);
                ctx.lineTo(tipX + Math.cos(arrAng - 2.5) * 18, tipY + Math.sin(arrAng - 2.5) * 18);
                ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.restore();
            }

        } else {
            // ── 일반 적 — 티어별 형태 ──
            if (e.tier === 1) {
                // 티어1: 4스파이크 별 형태
                drawSpiky(e.x, e.y, e.r, 4, 0.54);
            } else if (e.tier === 2) {
                // 티어2: 회전 육각형
                drawPolygon(e.x, e.y, e.r, 6, -Math.PI / 2 + state.time * 0.012 + i * 1.2);
            } else {
                // 티어3: 링 (원 + 내부 구멍 + 발광 코어)
                ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fill();
                ctx.shadowBlur  = 0;
                ctx.fillStyle   = '#07070e';
                ctx.beginPath(); ctx.arc(e.x, e.y, e.r * 0.44, 0, Math.PI * 2); ctx.fill();
                ctx.shadowColor = e.color;
                ctx.shadowBlur  = 12;
                ctx.globalAlpha = ePulse;
                ctx.fillStyle   = '#ffffff';
                ctx.beginPath(); ctx.arc(e.x, e.y, e.r * 0.18, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 1;
            }
        }
        ctx.shadowBlur = 0;

        // ── HP 바 ────────────────────────────────
        var hpExtraW = e.isBoss ? 4 : 0;
        var hpW      = e.r * 2 + hpExtraW;
        var hpH      = e.isBoss ? 7 : 3;
        var hpY      = e.y - e.r - (e.isBoss ? 14 : 8);
        var hpRt     = Math.max(0, Math.min(1, e.hp / e.maxHp));

        ctx.fillStyle = '#111118';
        ctx.fillRect(e.x - e.r - hpExtraW / 2, hpY, hpW, hpH);

        if (e.isBoss) {
            ctx.shadowColor = e.color;
            ctx.shadowBlur  = 6;
            ctx.fillStyle   = e.color;
        } else {
            ctx.fillStyle = hpRt > 0.55 ? '#44cc44' : hpRt > 0.3 ? '#ffaa22' : '#ff3333';
        }
        ctx.fillRect(e.x - e.r - hpExtraW / 2, hpY, hpW * hpRt, hpH);
        ctx.shadowBlur = 0;

        // 보스 이름 태그
        if (e.isBoss && state.bossName) {
            ctx.save();
            ctx.font       = 'bold 13px Arial';
            ctx.textAlign  = 'center';
            ctx.fillStyle  = '#ffffff';
            ctx.shadowColor = e.color;
            ctx.shadowBlur  = 10;
            ctx.fillText(state.bossName, e.x, hpY - 6);
            ctx.shadowBlur = 0;
            ctx.restore();
        }
    }

    // ── 플레이어 ─────────────────────────────────
    var flash = p.invincible > 0 && Math.floor(p.invincible / 5) % 2 === 0;
    if (!flash) {
        ctx.save();
        ctx.translate(p.x, p.y);

        // 외곽 회전 점선 링
        ctx.save();
        ctx.rotate(state.time * 0.025);
        ctx.strokeStyle = 'rgba(160,70,255,0.5)';
        ctx.lineWidth   = 2;
        ctx.shadowColor = '#aa44ff';
        ctx.shadowBlur  = 8;
        ctx.setLineDash([10, 7]);
        ctx.beginPath(); ctx.arc(0, 0, 23, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;
        ctx.restore();

        // 바디 그라데이션
        var bdGrad = ctx.createRadialGradient(-3, -3, 1, 0, 0, 16);
        bdGrad.addColorStop(0,   '#ffffff');
        bdGrad.addColorStop(0.42, '#ddbbff');
        bdGrad.addColorStop(1,   '#7711cc');
        ctx.shadowColor = '#aa44ff';
        ctx.shadowBlur  = 22;
        ctx.fillStyle   = bdGrad;
        ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

        // 마우스 방향 화살표
        var faceAng = Math.atan2(state.mouse.y - HALF_H, state.mouse.x - HALF_W);
        ctx.save();
        ctx.rotate(faceAng);
        ctx.fillStyle   = '#ffffff';
        ctx.shadowColor = '#cc88ff';
        ctx.shadowBlur  = 8;
        ctx.beginPath();
        ctx.moveTo(21, 0);
        ctx.lineTo(14, -5.5);
        ctx.lineTo(14,  5.5);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();

        // 중심 코어
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, Math.PI * 2); ctx.fill();

        ctx.restore();
    }

    // ── 방어막 (회전 육각형 링) ──────────────────
    if (p.shield > 0) {
        var shReady = p.shieldCd <= 0;
        ctx.strokeStyle = shReady ? 'rgba(100,200,255,0.88)' : 'rgba(80,80,200,0.32)';
        ctx.lineWidth   = shReady ? 2.5 : 1.8;
        ctx.shadowColor = shReady ? '#88ddff' : '#4444ff';
        ctx.shadowBlur  = shReady ? 14 : 4;
        ctx.beginPath();
        for (var hi = 0; hi < 6; hi++) {
            var ha = (hi / 6) * Math.PI * 2 - Math.PI / 6 + state.time * 0.008;
            if (hi === 0) ctx.moveTo(p.x + Math.cos(ha) * 24, p.y + Math.sin(ha) * 24);
            else          ctx.lineTo(p.x + Math.cos(ha) * 24, p.y + Math.sin(ha) * 24);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    // ── 플레이어 HP 바 ────────────────────────────
    var pHpRatio = Math.max(0, Math.min(1, p.hp / p.maxHp));
    var pHpColor = pHpRatio > 0.55 ? '#44dd44' : pHpRatio > 0.28 ? '#ffaa22' : '#ff3333';
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(p.x - 51, p.y + 22, 102, 7);
    ctx.fillStyle   = pHpColor;
    ctx.shadowColor = pHpColor;
    ctx.shadowBlur  = 6;
    ctx.fillRect(p.x - 50, p.y + 23, 100 * pHpRatio, 5);
    ctx.shadowBlur = 0;

    // ── 데미지 텍스트 ─────────────────────────────
    if (state.damageTexts) {
        ctx.textAlign = 'center';
        for (var dtIdx = 0; dtIdx < state.damageTexts.length; dtIdx++) {
            var dt = state.damageTexts[dtIdx];
            if (dt.isCrit) {
                ctx.font        = 'bold 22px Arial';
                ctx.shadowColor = '#ffffaa';
                ctx.shadowBlur  = 8;
            } else {
                ctx.font        = 'bold 15px Arial';
                ctx.shadowColor = '#000000';
                ctx.shadowBlur  = 3;
            }
            ctx.fillStyle   = dt.color;
            ctx.globalAlpha = Math.max(0, dt.t / 40);
            ctx.fillText(dt.val, dt.x, dt.y);
            ctx.globalAlpha = 1;
        }
    }
    ctx.shadowBlur = 0;

    ctx.restore(); // ── 월드 좌표계 종료 ──────────

    // ── 피격 빨간 플래시 비네트 ──────────────────
    if (state.hurtFlash > 0) {
        var hAlpha = Math.min(0.28, state.hurtFlash / 25 * 0.28);
        var hGrad  = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.9);
        hGrad.addColorStop(0, 'rgba(200,0,0,0)');
        hGrad.addColorStop(1, 'rgba(220,0,0,' + hAlpha + ')');
        ctx.fillStyle = hGrad;
        ctx.fillRect(0, 0, W, H);
    }

    // ── 보스 등장 경고 오버레이 ──────────────────
    if (state.bossWarning > 0) {
        var bAlpha  = Math.min(1, state.bossWarning / 40);
        ctx.save();
        ctx.globalAlpha = bAlpha;
        ctx.fillStyle   = 'rgba(100,0,0,0.55)';
        ctx.fillRect(0, H / 2 - 68, W, 136);
        var bPulseW = 1 + Math.sin(state.time * 0.25) * 0.06;
        ctx.save();
        ctx.translate(W / 2, H / 2 - 16);
        ctx.scale(bPulseW, bPulseW);
        ctx.font       = 'bold 52px Arial';
        ctx.fillStyle  = '#ff2222';
        ctx.textAlign  = 'center';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur  = 24;
        ctx.fillText('⚠ BOSS ⚠', 0, 0);
        ctx.restore();
        ctx.font        = 'bold 22px Arial';
        ctx.fillStyle   = '#ffaa44';
        ctx.textAlign   = 'center';
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur  = 10;
        ctx.fillText('강력한 보스가 나타났다!', W / 2, H / 2 + 38);
        if (state.bossName) {
            ctx.font        = 'bold 28px Arial';
            ctx.fillStyle   = '#ffffff';
            ctx.shadowColor = '#ff2222';
            ctx.shadowBlur  = 16;
            ctx.fillText('【 ' + state.bossName + ' 】', W / 2, H / 2 + 75);
        }
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    // ── 스테이지 클리어 ───────────────────────────
    if (state.stageClearFx > 0) {
        var cAlpha = Math.min(1, state.stageClearFx / 30) * Math.min(1, state.stageClearFx / 150 * 5);
        ctx.save();
        ctx.globalAlpha = cAlpha;
        var cScale = 1 + (1 - Math.min(1, state.stageClearFx / 120)) * 0.15;
        ctx.translate(W / 2, H / 2);
        ctx.scale(cScale, cScale);
        ctx.font        = 'bold 56px Arial';
        ctx.fillStyle   = '#ffdd00';
        ctx.textAlign   = 'center';
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur  = 30;
        ctx.fillText('✨ STAGE CLEAR! ✨', 0, 0);
        ctx.font        = '24px Arial';
        ctx.fillStyle   = '#aaffaa';
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur  = 12;
        ctx.fillText('→  Stage ' + (state.stage) + '  진입', 0, 42);
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    // ── 튜토리얼 힌트 ────────────────────────────
    if (!state.tutorialDone) {
        var tAlpha = Math.min(1, (480 - state.tutorialTime) / 60) * 0.88;
        if (tAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = tAlpha;
            ctx.fillStyle   = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, H - 62, W, 62);
            ctx.font       = '16px Arial';
            ctx.fillStyle  = '#ccccff';
            ctx.textAlign  = 'center';
            ctx.fillText('🕹 이동: WASD / 방향키  |  자동 공격  |  B: BGM  |  N: SFX  |  ESC: 메뉴', W / 2, H - 34);
            ctx.font      = '13px Arial';
            ctx.fillStyle = '#9999cc';
            ctx.fillText('레벨업 시 스킬 3개 중 하나를 선택하세요. 보스를 처치하면 다음 스테이지로 진입합니다.', W / 2, H - 14);
            ctx.restore();
        }
    }

    // ── 가상 조이스틱 (터치 UI) ──────────────────
    if (typeof joystick !== 'undefined' && joystick.active) {
        ctx.save();
        ctx.globalAlpha = 0.52;
        // 베이스 링
        ctx.beginPath();
        ctx.arc(joystick.sx, joystick.sy, 50, 0, Math.PI * 2);
        ctx.fillStyle   = 'rgba(60,20,120,0.6)';
        ctx.fill();
        ctx.strokeStyle = '#8844cc';
        ctx.lineWidth   = 2;
        ctx.stroke();
        // 스틱
        ctx.beginPath();
        ctx.arc(joystick.cx, joystick.cy, 25, 0, Math.PI * 2);
        var stickGrad = ctx.createRadialGradient(
            joystick.cx - 5, joystick.cy - 5, 2,
            joystick.cx, joystick.cy, 25
        );
        stickGrad.addColorStop(0, '#ccaaff');
        stickGrad.addColorStop(1, '#7733cc');
        ctx.fillStyle = stickGrad;
        ctx.fill();
        ctx.restore();
    }

    // ── UI 텍스트 업데이트 ────────────────────────
    var sec          = Math.floor(state.time / 60);
    var reqFrames    = 3600;
    var remainFrames = Math.max(0, reqFrames - state.stageTime);
    var remainSec    = Math.floor(remainFrames / 60);
    var remainStr    = pad(Math.floor(remainSec / 60)) + ':' + pad(remainSec % 60);
    var stageText    = state.bossSpawned ? '👑 BOSS' : ('⏳ ' + remainStr);

    document.getElementById('stageDisplay').textContent = '🚩 Stage ' + state.stage + ' (' + stageText + ')';
    document.getElementById('timeDisplay').textContent  = '⏱ ' + pad(Math.floor(sec / 60)) + ':' + pad(sec % 60);
    document.getElementById('levelDisplay').textContent = 'Lv.' + p.level;
    document.getElementById('killDisplay').textContent  = '💀 ' + state.kills;

    var xpRatio = Math.max(0, Math.min(1, p.xp / p.xpMax));
    document.getElementById('xpFill').style.width = (xpRatio * 100) + '%';

    drawSkillPanel(p);
}

/**
 * 화면 좌측 하단에 보유 스킬 패널을 그린다.
 *   - 상단 : 액티브 스킬 (큰 아이콘 + 쿨타임 게이지 바)
 *   - 하단 : 패시브 스킬 (작은 아이콘 + Lv 배지)
 */
function drawSkillPanel(p) {
    var PANEL_X      = 10;
    var PANEL_BOTTOM = CANVAS_H - 10;
    var PAD          = 6;

    // ── 스킬 분류 ──────────────────────────────────────
    var passives = [], actives = [];
    for (var s = 0; s < SKILLS.length; s++) {
        var sk = SKILLS[s];
        var lv = sk.getLevel ? sk.getLevel(p) : 0;
        if (lv <= 0) continue;
        if (sk.active) actives.push({ sk: sk, lv: lv });
        else           passives.push({ sk: sk, lv: lv });
    }

    // ── 1. 패시브 패널 (하단) ──────────────────────────
    var P_SIZE = 34, P_GAP = 6, P_COLS = 7;
    var curBottom = PANEL_BOTTOM;

    if (passives.length > 0) {
        var pRows   = Math.ceil(passives.length / P_COLS);
        var pCellW  = P_SIZE + P_GAP;
        var pCellH  = P_SIZE + P_GAP;
        var pTotalW = Math.min(passives.length, P_COLS) * pCellW - P_GAP + PAD * 2;
        var pTotalH = pRows * pCellH - P_GAP + PAD * 2;
        var pPanelY = curBottom - pTotalH;

        ctx.save();
        ctx.globalAlpha = 0.70;
        ctx.fillStyle   = '#0a0a1a';
        ctx.beginPath(); ctx.roundRect(PANEL_X - PAD, pPanelY - PAD, pTotalW, pTotalH + PAD * 2, 8); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.font        = 'bold 9px Arial';
        ctx.fillStyle   = '#8877cc';
        ctx.textAlign   = 'left';
        ctx.fillText('PASSIVE', PANEL_X, pPanelY - PAD - 3);
        ctx.strokeStyle = '#3311aa';
        ctx.lineWidth   = 1.2;
        ctx.beginPath(); ctx.roundRect(PANEL_X - PAD, pPanelY - PAD, pTotalW, pTotalH + PAD * 2, 8); ctx.stroke();

        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        for (var i = 0; i < passives.length; i++) {
            var col = i % P_COLS;
            var row = Math.floor(i / P_COLS);
            var bx  = PANEL_X + col * pCellW;
            var by  = pPanelY + row * pCellH;
            var sk  = passives[i].sk;
            var lv  = passives[i].lv;
            ctx.globalAlpha = 0.88;
            ctx.fillStyle   = '#180830';
            ctx.beginPath(); ctx.roundRect(bx, by, P_SIZE, P_SIZE, 5); ctx.fill();
            ctx.globalAlpha = 1;
            ctx.font      = '17px serif';
            ctx.fillText(sk.icon, bx + P_SIZE / 2, by + P_SIZE / 2 - 4);
            ctx.font      = 'bold 9px Arial';
            ctx.fillStyle = '#ffdd55';
            ctx.fillText('Lv.' + lv, bx + P_SIZE / 2, by + P_SIZE - 6);
        }
        ctx.textBaseline = 'alphabetic';
        ctx.restore();

        curBottom = pPanelY - PAD - 26;
    }

    // ── 2. 액티브 패널 (패시브 위) ────────────────────────
    var A_SIZE   = 44;
    var A_BAR_H  = 6;
    var A_CELL_H = A_SIZE + A_BAR_H + 4 + PAD;
    var A_CELL_W = A_SIZE + PAD;
    var A_GAP    = 2;

    if (actives.length > 0) {
        var aTotalW = actives.length * A_CELL_W - PAD + PAD * 2;
        var aTotalH = A_CELL_H - PAD + PAD * 2;
        var aPanelY = curBottom - aTotalH;

        ctx.save();
        ctx.globalAlpha = 0.75;
        ctx.fillStyle   = '#0d0a22';
        ctx.beginPath(); ctx.roundRect(PANEL_X - PAD, aPanelY - PAD, aTotalW, aTotalH + PAD * 2, 8); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.font        = 'bold 9px Arial';
        ctx.fillStyle   = '#ffcc44';
        ctx.textAlign   = 'left';
        ctx.fillText('ACTIVE', PANEL_X, aPanelY - PAD - 3);
        ctx.strokeStyle = '#aaaa22';
        ctx.lineWidth   = 1.2;
        ctx.beginPath(); ctx.roundRect(PANEL_X - PAD, aPanelY - PAD, aTotalW, aTotalH + PAD * 2, 8); ctx.stroke();

        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';

        for (var i = 0; i < actives.length; i++) {
            var bx    = PANEL_X + i * A_CELL_W;
            var by    = aPanelY;
            var sk    = actives[i].sk;
            var lv    = actives[i].lv;
            var maxCd = sk.getMaxCd ? sk.getMaxCd(p) : 1;
            var curCd = sk.getCurCd ? sk.getCurCd(p) : 0;
            var ready     = curCd <= 0;
            var fillRatio = ready ? 1 : 1 - (curCd / maxCd);

            ctx.globalAlpha = 0.9;
            ctx.fillStyle   = ready ? '#1a140a' : '#100818';
            ctx.beginPath(); ctx.roundRect(bx, by, A_SIZE, A_SIZE, 7); ctx.fill();
            ctx.strokeStyle = ready ? '#ffcc44' : '#553388';
            ctx.lineWidth   = ready ? 1.8 : 1;
            ctx.beginPath(); ctx.roundRect(bx, by, A_SIZE, A_SIZE, 7); ctx.stroke();
            ctx.globalAlpha = 1;

            // 쿨타임 오버레이
            if (!ready) {
                ctx.globalAlpha = 0.45;
                ctx.fillStyle   = '#000022';
                var cdH = A_SIZE * (1 - fillRatio);
                ctx.fillRect(bx, by, A_SIZE, cdH);
                ctx.globalAlpha = 1;
            }

            // 아이콘
            ctx.font      = '22px serif';
            ctx.fillStyle = ready ? '#ffffff' : '#aaaacc';
            ctx.fillText(sk.icon, bx + A_SIZE / 2, by + A_SIZE / 2 - 2);

            // Lv 배지
            ctx.font      = 'bold 9px Arial';
            ctx.fillStyle = '#ffdd55';
            ctx.fillText('Lv.' + lv, bx + A_SIZE / 2, by + A_SIZE - 6);

            // 쿨타임 바
            var barY = by + A_SIZE + 2;
            ctx.fillStyle = '#111118';
            ctx.fillRect(bx, barY, A_SIZE, A_BAR_H);
            ctx.fillStyle = ready ? '#ffcc44' : '#886622';
            if (ready) {
                ctx.shadowColor = '#ffcc44';
                ctx.shadowBlur  = 6;
            }
            ctx.fillRect(bx, barY, A_SIZE * fillRatio, A_BAR_H);
            ctx.shadowBlur = 0;
        }
        ctx.textBaseline = 'alphabetic';
        ctx.restore();
    }
}
