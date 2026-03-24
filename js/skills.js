// ──────────────────────────────────────────────
// skills.js
// 레벨업 UI 표시 및 스킬 카드 선택 처리
// ──────────────────────────────────────────────

/**
 * SKILLS 풀에서 n개를 무작위로 뽑아 반환한다.
 * @param {number} n
 * @returns {Array}
 */
function getSkillCards(n) {
    var p = state.player;
    // oneTime 스킬은 이미 보유 중이면 풀에서 제외
    var pool = SKILLS.filter(function (sk) {
        if (sk.oneTime && sk.acquired && sk.acquired(p)) return false;
        return true;
    });
    var chosen = [];
    for (var i = 0; i < n && pool.length > 0; i++) {
        var idx = Math.floor(Math.random() * pool.length);
        chosen.push(pool.splice(idx, 1)[0]);
    }
    return chosen;
}

/**
 * 레벨업 오버레이를 표시하고 스킬 카드를 생성한다.
 * 카드를 클릭하면 해당 스킬을 플레이어에게 적용하고 게임을 재개한다.
 */
function showLevelUp() {
    state.paused = true;
    playSound('levelup');

    var countElem = document.getElementById('pendingLevelUpCount');
    if (countElem) {
        if (state.player.pendingLevelUps > 0) {
            countElem.textContent = '(남은 횟수: ' + state.player.pendingLevelUps + ')';
        } else {
            countElem.textContent = '';
        }
    }

    var cards = getSkillCards(3);
    var div = document.getElementById('cards');
    div.innerHTML = '';

    for (var i = 0; i < cards.length; i++) {
        (function (sk, idx) {
            var c = document.createElement('div');
            c.className = 'card';
            c.innerHTML =
                '<div class="icon">' + sk.icon + '</div>' +
                '<div class="name"><span style="color:#aaa; font-size:12px;">[' + (idx + 1) + ']</span> ' + sk.name + '</div>' +
                '<div class="desc">' + sk.desc + '</div>';

            c.onclick = function () {
                sk.apply(state.player);

                // 레벨업 공통 보너스: 최대 HP +10, 칼 데미지 +2, HP 전량 회복
                var p = state.player;
                p.maxHp += 10;
                p.swordDmg += 2;
                p.hp = p.maxHp;

                document.getElementById('levelUp').style.display = 'none';
                state.paused = false;
            };

            div.appendChild(c);
        })(cards[i], i);
    }

    // ── 리롤 버튼 ──────────────────────────────────
    var rerollDiv = document.getElementById('rerollArea');
    if (rerollDiv) {
        var p = state.player;
        if (p.rerollsLeft > 0) {
            rerollDiv.innerHTML = '<button id="rerollBtn" class="rerollBtn">🔀 다시 뽑기 [R]  (남은 횟수: ' + p.rerollsLeft + ')</button>';
            document.getElementById('rerollBtn').onclick = function () {
                p.rerollsLeft--;
                playSound('click');
                showLevelUp(); // 새 카드 3장 재표시
            };
        } else {
            rerollDiv.innerHTML = '<span style="color:#555; font-size:13px;">리롤 소진</span>';
        }
    }

    document.getElementById('levelUp').style.display = 'flex';
    if (typeof focusFirstMenuBtn === 'function') focusFirstMenuBtn();
}
