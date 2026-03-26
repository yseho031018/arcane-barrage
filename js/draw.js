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

    // 화면 흔들림 (Screen Shake)
    if (state.camShake > 0) {
        cx += (Math.random() - 0.5) * state.camShake;
        cy += (Math.random() - 0.5) * state.camShake;
    }

    // ── 무한 배경 그리드 ────────────────────
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 1;
    var startX = -(cx % 40);
    var startY = -(cy % 40);
    for (var x = startX; x < W + 40; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (var y = startY; y < H + 40; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    ctx.save();
    ctx.translate(-cx, -cy);

    // ── 보스 전투 영역 ──────────────────────
    if (state.bossArena) {
        var ba = state.bossArena;
        var pulse = 0.55 + Math.sin(state.time * 0.04) * 0.15;

        // 내부 방사형 그라데이션 (중심→가장자리로 붉게)
        var arenaGrad = ctx.createRadialGradient(ba.x, ba.y, ba.r * 0.4, ba.x, ba.y, ba.r);
        arenaGrad.addColorStop(0, 'rgba(80,0,0,0)');
        arenaGrad.addColorStop(1, 'rgba(160,0,0,0.18)');
        ctx.fillStyle = arenaGrad;
        ctx.beginPath(); ctx.arc(ba.x, ba.y, ba.r, 0, Math.PI * 2); ctx.fill();

        // 점선 외곽 테두리
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.strokeStyle = '#ff2233';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 14;
        ctx.setLineDash([22, 12]);
        ctx.beginPath(); ctx.arc(ba.x, ba.y, ba.r, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;

        // 8방향 경고 마커
        for (var qi = 0; qi < 8; qi++) {
            var qa = (Math.PI / 4) * qi;
            var qx = ba.x + Math.cos(qa) * ba.r;
            var qy = ba.y + Math.sin(qa) * ba.r;
            ctx.save();
            ctx.translate(qx, qy);
            ctx.rotate(qa + Math.PI / 2);
            ctx.globalAlpha = pulse * 0.9;
            ctx.fillStyle = '#ff3344';
            ctx.beginPath();
            ctx.moveTo(0, -11); ctx.lineTo(7, 7); ctx.lineTo(-7, 7);
            ctx.closePath(); ctx.fill();
            ctx.restore();
        }
        ctx.restore();

        // 경계 근접 경고: 플레이어가 가장자리 100px 이내일 때 테두리 강조 + 안쪽 화살표
        var pArenaDist = Math.sqrt((p.x - ba.x) * (p.x - ba.x) + (p.y - ba.y) * (p.y - ba.y));
        var warnZone = ba.r - 100;
        if (pArenaDist > warnZone) {
            var warnRatio = (pArenaDist - warnZone) / 100; // 0~1
            var warnBlink = Math.floor(state.time / 5) % 2 === 0 ? 1 : 0.2;
            // 밝게 채워지는 외곽선
            ctx.save();
            ctx.globalAlpha = warnRatio * warnBlink * 0.9;
            ctx.strokeStyle = '#ff2222';
            ctx.lineWidth = 5;
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 22;
            ctx.beginPath(); ctx.arc(ba.x, ba.y, ba.r, 0, Math.PI * 2); ctx.stroke();
            ctx.shadowBlur = 0;
            // 플레이어 위치에서 영역 중심 방향 화살표 (되돌아가라)
            var backAng = Math.atan2(ba.y - p.y, ba.x - p.x);
            var arrowBase = 28;
            ctx.strokeStyle = '#ffcc00';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#ffaa00';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + Math.cos(backAng) * arrowBase, p.y + Math.sin(backAng) * arrowBase);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(p.x + Math.cos(backAng) * arrowBase, p.y + Math.sin(backAng) * arrowBase);
            ctx.lineTo(p.x + Math.cos(backAng + 2.4) * 12, p.y + Math.sin(backAng + 2.4) * 12);
            ctx.moveTo(p.x + Math.cos(backAng) * arrowBase, p.y + Math.sin(backAng) * arrowBase);
            ctx.lineTo(p.x + Math.cos(backAng - 2.4) * 12, p.y + Math.sin(backAng - 2.4) * 12);
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.restore();
        }
    }

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

    // ── 보스 투사체 ────────────────────────
    for (var bpi = 0; bpi < state.bossProjectiles.length; bpi++) {
        var bp = state.bossProjectiles[bpi];
        ctx.shadowColor = bp.color;
        ctx.shadowBlur = 14;
        ctx.fillStyle = bp.color;
        ctx.beginPath(); ctx.arc(bp.x, bp.y, bp.r, 0, Math.PI * 2); ctx.fill();
        // 흰 코어
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        ctx.beginPath(); ctx.arc(bp.x, bp.y, bp.r * 0.38, 0, Math.PI * 2); ctx.fill();
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

        if (e.type === 'dasher') {
            // 대시형 적: 다이아몬드 모양
            ctx.save();
            ctx.translate(e.x, e.y);
            if (e.isDashing) {
                // 돌진 중: 방향으로 회전 + 노란 테두리 강조
                var dashAng = Math.atan2(e.dashVy, e.dashVx);
                ctx.rotate(dashAng + Math.PI / 4);
                ctx.shadowColor = '#ffff00';
                ctx.shadowBlur = 16;
            }
            ctx.beginPath();
            ctx.moveTo(0, -e.r);
            ctx.lineTo(e.r, 0);
            ctx.lineTo(0, e.r);
            ctx.lineTo(-e.r, 0);
            ctx.closePath();
            ctx.fill();
            if (e.isDashing) {
                ctx.strokeStyle = '#ffee00';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            ctx.restore();
        } else {
            ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fill();
        }
        ctx.shadowBlur = 0;

        if (e.isBoss) {
            // 보스 흰 테두리
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
            ctx.stroke();

            // 폭풍술사 순간이동 이펙트: 링 파문
            if (e.bossType === 'storm' && e.teleportFx > 0) {
                var tfRatio = e.teleportFx / 30;
                ctx.save();
                ctx.globalAlpha = tfRatio * 0.8;
                ctx.strokeStyle = '#88ccff';
                ctx.lineWidth = 3;
                ctx.shadowColor = '#4488ff';
                ctx.shadowBlur = 20;
                ctx.beginPath(); ctx.arc(e.x, e.y, e.r + (1 - tfRatio) * 80, 0, Math.PI * 2); ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.restore();
            }

            // 돌진 예고: 깜빡이는 노란 링 + 방향 화살표 (감시자 전용)
            if (e.bossType === 'watcher' && e.chargeTelegraph > 0) {
                var tRatio = e.chargeTelegraph / 45;
                var blink = Math.floor(state.time / 4) % 2 === 0 ? 1 : 0.35;
                ctx.save();
                ctx.globalAlpha = tRatio * blink;
                ctx.strokeStyle = '#ffff00';
                ctx.lineWidth = 4;
                ctx.shadowColor = '#ffff00';
                ctx.shadowBlur = 20;
                ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 12, 0, Math.PI * 2); ctx.stroke();
                ctx.shadowBlur = 0;
                var arrAng = Math.atan2(e.chargeVy, e.chargeVx);
                var tipX = e.x + Math.cos(arrAng) * (e.r + 90);
                var tipY = e.y + Math.sin(arrAng) * (e.r + 90);
                ctx.strokeStyle = '#ff4444';
                ctx.lineWidth = 3;
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 10;
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
        }

        // HP 바
        var hpW = e.r * 2;
        var hpH = e.isBoss ? 6 : 3;
        var hpY = e.y - e.r - (e.isBoss ? 12 : 7);
        var eHpRatio = Math.max(0, Math.min(1, e.hp / e.maxHp));

        ctx.fillStyle = '#333';
        ctx.fillRect(e.x - e.r, hpY, hpW, hpH);
        ctx.fillStyle = e.isBoss ? e.color : '#ff4444';
        ctx.fillRect(e.x - e.r, hpY, hpW * eHpRatio, hpH);

        // 보스 이름 태그
        if (e.isBoss && state.bossName) {
            ctx.save();
            ctx.font = 'bold 13px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fff';
            ctx.shadowColor = e.color;
            ctx.shadowBlur = 8;
            ctx.fillText(state.bossName, e.x, hpY - 6);
            ctx.shadowBlur = 0;
            ctx.restore();
        }
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

    // ── 데미지 텍스트 ──────────────────────
    if (state.damageTexts) {
        ctx.textAlign = 'center';
        for (var dtIdx = 0; dtIdx < state.damageTexts.length; dtIdx++) {
            var dt = state.damageTexts[dtIdx];
            if (dt.isCrit) {
                ctx.font = 'bold 22px Arial';
                ctx.shadowColor = '#fff';
            } else {
                ctx.font = 'bold 16px Arial';
                ctx.shadowColor = '#000';
            }
            ctx.shadowBlur = 4;
            ctx.fillStyle = dt.color;
            ctx.globalAlpha = Math.max(0, dt.t / 40);
            ctx.fillText(dt.val, dt.x, dt.y);
            ctx.globalAlpha = 1.0; // 복구
        }
    }
    ctx.shadowBlur = 0;

    ctx.restore(); // 카메라 변환 종료

    // ── 피격 빨간 플래시 (화면 테두리 비네트) ──────
    if (state.hurtFlash > 0) {
        var hAlpha = Math.min(0.28, state.hurtFlash / 25 * 0.28);
        var hGrad = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.9);
        hGrad.addColorStop(0, 'rgba(200,0,0,0)');
        hGrad.addColorStop(1, 'rgba(220,0,0,' + hAlpha + ')');
        ctx.fillStyle = hGrad;
        ctx.fillRect(0, 0, W, H);
    }

    // ── 보스 등장 경고 오버레이 ─────────────────
    if (state.bossWarning > 0) {
        var bAlpha = Math.min(1, state.bossWarning / 40);
        ctx.save();
        ctx.globalAlpha = bAlpha;
        // 텍스트 배경 띠
        ctx.fillStyle = 'rgba(100, 0, 0, 0.55)';
        ctx.fillRect(0, H / 2 - 68, W, 136);
        // ⚠ BOSS 텍스트 (펄스 스케일)
        var pulse = 1 + Math.sin(state.time * 0.25) * 0.06;
        ctx.save();
        ctx.translate(W / 2, H / 2 - 16);
        ctx.scale(pulse, pulse);
        ctx.font = 'bold 52px Arial';
        ctx.fillStyle = '#ff2222';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 24;
        ctx.fillText('⚠ BOSS ⚠', 0, 0);
        ctx.restore();
        ctx.font = 'bold 22px Arial';
        ctx.fillStyle = '#ffaa44';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 10;
        ctx.fillText('강력한 보스가 나타났다!', W / 2, H / 2 + 38);
        if (state.bossName) {
            ctx.font = 'bold 28px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#ff2222';
            ctx.shadowBlur = 16;
            ctx.fillText('【 ' + state.bossName + ' 】', W / 2, H / 2 + 75);
        }
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    // ── 스테이지 클리어 텍스트 ─────────────────
    if (state.stageClearFx > 0) {
        var cAlpha = Math.min(1, state.stageClearFx / 30) * Math.min(1, state.stageClearFx / 150 * 5);
        ctx.save();
        ctx.globalAlpha = cAlpha;
        var cScale = 1 + (1 - Math.min(1, state.stageClearFx / 120)) * 0.15;
        ctx.translate(W / 2, H / 2);
        ctx.scale(cScale, cScale);
        ctx.font = 'bold 56px Arial';
        ctx.fillStyle = '#ffdd00';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 30;
        ctx.fillText('✨ STAGE CLEAR! ✨', 0, 0);
        ctx.font = '24px Arial';
        ctx.fillStyle = '#aaffaa';
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 12;
        ctx.fillText('→  Stage ' + (state.stage) + '  진입', 0, 42);
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    // ── 튜토리얼 힌트 (게임 시작 후 8초) ────────
    if (!state.tutorialDone) {
        var tAlpha = Math.min(1, (480 - state.tutorialTime) / 60) * 0.88;
        if (tAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = tAlpha;
            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            ctx.fillRect(0, H - 62, W, 62);
            ctx.font = '16px Arial';
            ctx.fillStyle = '#ccccff';
            ctx.textAlign = 'center';
            ctx.fillText('🕹 이동: WASD / 방향키  |  자동 공격  |  B: BGM  |  N: SFX  |  ESC: 메뉴', W / 2, H - 34);
            ctx.font = '13px Arial';
            ctx.fillStyle = '#9999cc';
            ctx.fillText('레벨업 시 스킬 3개 중 하나를 선택하세요. 보스를 처치하면 다음 스테이지로 진입합니다.', W / 2, H - 14);
            ctx.restore();
        }
    }

    // ── 가상 조이스틱 (터치 UI) ─────────────
    if (typeof joystick !== 'undefined' && joystick.active) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        // 조이스틱 밑판
        ctx.beginPath();
        ctx.arc(joystick.sx, joystick.sy, 50, 0, Math.PI * 2);
        ctx.fillStyle = '#888';
        ctx.fill();
        // 조이스틱 스틱
        ctx.beginPath();
        ctx.arc(joystick.cx, joystick.cy, 25, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.restore();
    }

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

    // ── 스킬 패널 (보유 스킬 아이콘 + 레벨) ─────────────────
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
        var pRows  = Math.ceil(passives.length / P_COLS);
        var pCellW = P_SIZE + P_GAP;
        var pCellH = P_SIZE + P_GAP;
        var pTotalW = Math.min(passives.length, P_COLS) * pCellW - P_GAP + PAD * 2;
        var pTotalH = pRows * pCellH - P_GAP + PAD * 2;
        var pPanelY = curBottom - pTotalH;

        ctx.save();
        // 배경
        ctx.globalAlpha = 0.70;
        ctx.fillStyle = '#0a0a1a';
        ctx.beginPath(); ctx.roundRect(PANEL_X - PAD, pPanelY - PAD, pTotalW, pTotalH + PAD * 2, 8); ctx.fill();
        ctx.globalAlpha = 1;
        // 라벨
        ctx.font = 'bold 9px Arial';
        ctx.fillStyle = '#8877cc';
        ctx.textAlign = 'left';
        ctx.fillText('PASSIVE', PANEL_X, pPanelY - PAD - 3);
        // 테두리
        ctx.strokeStyle = '#3311aa';
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.roundRect(PANEL_X - PAD, pPanelY - PAD, pTotalW, pTotalH + PAD * 2, 8); ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (var i = 0; i < passives.length; i++) {
            var col = i % P_COLS;
            var row = Math.floor(i / P_COLS);
            var bx  = PANEL_X + col * pCellW;
            var by  = pPanelY + row * pCellH;
            var sk  = passives[i].sk;
            var lv  = passives[i].lv;
            // 아이콘 배경
            ctx.globalAlpha = 0.88;
            ctx.fillStyle = '#180830';
            ctx.beginPath(); ctx.roundRect(bx, by, P_SIZE, P_SIZE, 5); ctx.fill();
            ctx.globalAlpha = 1;
            // 아이콘
            ctx.font = '17px serif';
            ctx.fillText(sk.icon, bx + P_SIZE / 2, by + P_SIZE / 2 - 4);
            // Lv 배지
            ctx.font = 'bold 9px Arial';
            ctx.fillStyle = '#ffdd55';
            ctx.fillText('Lv.' + lv, bx + P_SIZE / 2, by + P_SIZE - 6);
        }
        ctx.textBaseline = 'alphabetic';
        ctx.restore();

        curBottom = pPanelY - PAD - 26; // 라벨("PASSIVE") 글씨가 안 잘리도록 여백 확보
    }

    // ── 2. 액티브 패널 (패시브 위) ────────────────────────
    var A_SIZE   = 44;  // 아이콘 박스
    var A_BAR_H  = 6;   // 쿨타임 바 높이
    var A_CELL_H = A_SIZE + A_BAR_H + 4 + PAD; // 전체 셀 높이
    var A_CELL_W = A_SIZE + PAD;
    var A_GAP    = 2;

    if (actives.length > 0) {
        var aTotalW = actives.length * A_CELL_W - PAD + PAD * 2;
        var aTotalH = A_CELL_H - PAD + PAD * 2;
        var aPanelY = curBottom - aTotalH;

        ctx.save();
        // 배경
        ctx.globalAlpha = 0.75;
        ctx.fillStyle = '#0d0a22';
        ctx.beginPath(); ctx.roundRect(PANEL_X - PAD, aPanelY - PAD, aTotalW, aTotalH + PAD * 2, 8); ctx.fill();
        ctx.globalAlpha = 1;
        // 라벨
        ctx.font = 'bold 9px Arial';
        ctx.fillStyle = '#ffcc44';
        ctx.textAlign = 'left';
        ctx.fillText('ACTIVE', PANEL_X, aPanelY - PAD - 3);
        // 테두리
        ctx.strokeStyle = '#aaaa22';
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.roundRect(PANEL_X - PAD, aPanelY - PAD, aTotalW, aTotalH + PAD * 2, 8); ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (var i = 0; i < actives.length; i++) {
            var bx  = PANEL_X + i * A_CELL_W;
            var by  = aPanelY;
            var sk  = actives[i].sk;
            var lv  = actives[i].lv;

            var maxCd = sk.getMaxCd ? sk.getMaxCd(p) : 1;
            var curCd = sk.getCurCd ? sk.getCurCd(p) : 0;
            var ready = curCd <= 0;
            // 게이지: 0=쿨다운 직후(꽉 참), maxCd=방금 발동(비어있음)
            var fillRatio = ready ? 1 : 1 - (curCd / maxCd);

            // 아이콘 배경 (준비되면 금테, 쿨중이면 보라)
            ctx.globalAlpha = 0.9;
            ctx.fillStyle = ready ? '#1a140a' : '#100818';
            ctx.beginPath(); ctx.roundRect(bx, by, A_SIZE, A_SIZE, 7); ctx.fill();
            // 배경 테두리
            ctx.strokeStyle = ready ? '#ffcc44' : '#553388';
            ctx.lineWidth = ready ? 1.8 : 1;
            ctx.beginPath(); ctx.roundRect(bx, by, A_SIZE, A_SIZE, 7); ctx.stroke();
            ctx.globalAlpha = 1;

            // 아이콘 (이모지)
            ctx.font = '22px serif';
            ctx.fillText(sk.icon, bx + A_SIZE / 2, by + A_SIZE / 2 - 5);

            // Lv 배지 (아이콘 우하단)
            ctx.font = 'bold 9px Arial';
            ctx.fillStyle = ready ? '#ffee77' : '#aa88ff';
            ctx.fillText('Lv.' + lv, bx + A_SIZE / 2, by + A_SIZE - 6);

            // 쿨타임 게이지 바
            var barX = bx;
            var barY = by + A_SIZE + 3;
            var barW = A_SIZE;
            // 바 배경
            ctx.fillStyle = '#1a1a2e';
            ctx.beginPath(); ctx.roundRect(barX, barY, barW, A_BAR_H, 3); ctx.fill();
            // 충전 게이지 (준비되면 황금, 발동 직전이면 청록, 충전중이면 보라)
            if (fillRatio > 0) {
                var barColor;
                if (ready)             barColor = '#ffcc00';
                else if (fillRatio > 0.75) barColor = '#44eebb';
                else                   barColor = '#8844ff';

                ctx.fillStyle = barColor;
                ctx.shadowColor = barColor;
                ctx.shadowBlur = 4;
                ctx.beginPath(); ctx.roundRect(barX, barY, barW * fillRatio, A_BAR_H, 3); ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
        ctx.textBaseline = 'alphabetic';
        ctx.restore();
    }
}
