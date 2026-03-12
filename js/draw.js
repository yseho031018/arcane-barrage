// ──────────────────────────────────────────────
// draw.js
// 캔버스 렌더링 로직
// ──────────────────────────────────────────────

var canvas = document.getElementById('gameCanvas');
var ctx = canvas.getContext('2d');

/**
 * 매 프레임 캔버스를 그린다.
 */
function draw() {
    var W = CANVAS_W, H = CANVAS_H;

    // ── 배경 그리기 ────────────────────────
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, W, H);

    if (!state) return;
    var p = state.player;
    var cx = state.cam.x;
    var cy = state.cam.y;

    // ── 무한 배경 그리드 ────────────────────
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 1;
    var startX = -(cx % 40);
    var startY = -(cy % 40);
    for (var x = startX; x < W + 40; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (var y = startY; y < H + 40; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    ctx.save();
    ctx.translate(-cx, -cy);

    // ── XP 젬 ──────────────────────────────
    for (var i = 0; i < state.xpGems.length; i++) {
        var g = state.xpGems[i];
        if (g.isLarge) {
            ctx.shadowColor = '#ff3388';
            ctx.shadowBlur = 12;
            ctx.fillStyle = '#ff66aa';
            ctx.beginPath(); ctx.arc(g.x, g.y, 8, 0, Math.PI * 2); ctx.fill();
        } else {
            ctx.shadowColor = '#00ffcc';
            ctx.shadowBlur = 6;
            ctx.fillStyle = '#00ffcc';
            ctx.beginPath(); ctx.arc(g.x, g.y, 5, 0, Math.PI * 2); ctx.fill();
        }
    }
    ctx.shadowBlur = 0;

    // ── 번개 이펙트 ────────────────────────
    for (var i = 0; i < state.boltFx.length; i++) {
        var f = state.boltFx[i];
        ctx.strokeStyle = 'rgba(255,255,80,' + (f.t / 10) + ')';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x2, f.y2); ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // ── 미사일 폭발 이펙트 ─────────────────────
    for (var i = 0; i < state.missileFx.length; i++) {
        var mfx = state.missileFx[i];
        ctx.shadowColor = '#ff3300';
        ctx.shadowBlur = 15;
        // 내부 채우기
        ctx.fillStyle = 'rgba(255, 100, 20, ' + (mfx.t / 20 * 0.5) + ')';
        ctx.beginPath(); ctx.arc(mfx.x, mfx.y, mfx.r, 0, Math.PI * 2); ctx.fill();
        // 외곽선
        ctx.strokeStyle = 'rgba(255, 50, 0, ' + (mfx.t / 20 * 0.8) + ')';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(mfx.x, mfx.y, mfx.r, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // ── 미사일 본체 ────────────────────────────
    for (var i = 0; i < state.missiles.length; i++) {
        var m = state.missiles[i];
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 8;
        
        var ang = Math.atan2(m.vy, m.vx);
        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.rotate(ang);
        
        // 미사일 꼬리 불꽃
        ctx.fillStyle = '#ff3300';
        ctx.beginPath();
        ctx.moveTo(-10, -4);
        ctx.lineTo(-18 - Math.random() * 8, 0); // 흔들리는 불꽃
        ctx.lineTo(-10, 4);
        ctx.fill();

        // 미사일 몸체
        ctx.fillStyle = '#dddddd';
        ctx.fillRect(-10, -3, 14, 6);
        
        // 머리 (빨간색)
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.moveTo(4, -3);
        ctx.lineTo(10, 0);
        ctx.lineTo(4, 3);
        ctx.fill();
        
        ctx.restore();
    }
    ctx.shadowBlur = 0;

    // ── 투사체 ─────────────────────────────
    ctx.shadowColor = '#44aaff';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#66ccff';
    for (var i = 0; i < state.projectiles.length; i++) {
        var b = state.projectiles[i];
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;

    // ── 보조 탄환 (주황색 소형) ──────────────
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ff8833';
    for (var i = 0; i < state.subProjectiles.length; i++) {
        var sb = state.subProjectiles[i];
        ctx.beginPath(); ctx.arc(sb.x, sb.y, sb.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;

    // ── 화염 오라 ──────────────────────────
    if (p.auraLv > 0) {
        var radius = 50 + p.auraLv * 15;
        var gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
        gr.addColorStop(0, 'rgba(255,80,0,0.25)');
        gr.addColorStop(1, 'rgba(255,80,0,0)');
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, Math.PI * 2); ctx.fill();
    }

    // ── 마법 구슬 ──────────────────────────
    if (p.orbCount > 0) {
        ctx.shadowColor = '#aa44ff';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#cc88ff';
        for (var i = 0; i < p.orbCount; i++) {
            var a = p.orbAngle + (Math.PI * 2 / p.orbCount) * i;
            var ox = p.x + Math.cos(a) * 60;
            var oy = p.y + Math.sin(a) * 60;
            ctx.beginPath(); ctx.arc(ox, oy, 9, 0, Math.PI * 2); ctx.fill();
        }
        ctx.shadowBlur = 0;
    }

    // ── 검 호 ──────────────────────────────
    if (p.hasSword) {
        ctx.strokeStyle = 'rgba(180,100,255,0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.swordR, p.swordAngle, p.swordAngle + Math.PI * 0.9);
        ctx.stroke();

        var sx = p.x + Math.cos(p.swordAngle) * p.swordR;
        var sy = p.y + Math.sin(p.swordAngle) * p.swordR;
        ctx.fillStyle = '#cc88ff';
        ctx.shadowColor = '#aa44ff';
        ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(sx, sy, 6, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
    }

    // ── 적 ─────────────────────────────────
    for (var i = 0; i < state.enemies.length; i++) {
        var e = state.enemies[i];
        ctx.fillStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = e.isBoss ? 20 : 6;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

        if (e.isBoss) { // 보스 테두리 표시
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // HP 바
        var hpW = e.r * 2;
        var hpH = e.isBoss ? 6 : 3;
        var hpY = e.y - e.r - (e.isBoss ? 12 : 7);
        var eHpRatio = Math.max(0, Math.min(1, e.hp / e.maxHp));

        ctx.fillStyle = '#333';
        ctx.fillRect(e.x - e.r, hpY, hpW, hpH);
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(e.x - e.r, hpY, hpW * eHpRatio, hpH);
    }

    // ── 플레이어 ───────────────────────────
    var flash = p.invincible > 0 && Math.floor(p.invincible / 5) % 2 === 0;
    if (!flash) {
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#aa44ff';
        ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.arc(p.x, p.y, 16, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#aa44ff';
        ctx.fillRect(p.x - 5, p.y - 3, 4, 6);
        ctx.fillRect(p.x + 1, p.y - 3, 4, 6);
    }

    // ── 방어막 링 ──────────────────────────
    if (p.shield > 0) {
        ctx.strokeStyle = p.shieldCd > 0 ? 'rgba(100,100,255,0.3)' : 'rgba(100,200,255,0.85)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(p.x, p.y, 22, 0, Math.PI * 2); ctx.stroke();
    }

    // ── 플레이어 HP 바 ─────────────────────
    var pHpRatio = Math.max(0, Math.min(1, p.hp / p.maxHp));
    ctx.fillStyle = '#330000';
    ctx.fillRect(p.x - 50, p.y + 22, 100, 6);
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(p.x - 50, p.y + 22, 100 * pHpRatio, 6);

    ctx.restore(); // 카메라 변환 종료

    // ── UI 텍스트 업데이트 ─────────────────
    var sec = Math.floor(state.time / 60);

    // 스테이지 남은 시간 계산 (60초 - 현재 진행된 시간초)
    var reqFrames = 3600;
    var remainFrames = Math.max(0, reqFrames - state.stageTime);
    var remainSec = Math.floor(remainFrames / 60);
    var remainStr = pad(Math.floor(remainSec / 60)) + ':' + pad(remainSec % 60);
    var stageText = state.bossSpawned ? '👑 BOSS' : ('⏳ ' + remainStr);

    document.getElementById('stageDisplay').textContent = '🚩 Stage ' + state.stage + ' (' + stageText + ')';
    document.getElementById('timeDisplay').textContent = '⏱ ' + pad(Math.floor(sec / 60)) + ':' + pad(sec % 60);
    document.getElementById('levelDisplay').textContent = 'Lv.' + p.level;
    document.getElementById('killDisplay').textContent = '💀 ' + state.kills;

    var xpRatio = Math.max(0, Math.min(1, p.xp / p.xpMax));
    document.getElementById('xpFill').style.width = (xpRatio * 100) + '%';
}
