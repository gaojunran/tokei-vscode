// media/main.js
(function () {
    const vscode = acquireVsCodeApi();

    const statsContainer = document.getElementById('stats-container');
    const refreshBtn = document.getElementById('refresh-btn');

    refreshBtn.onclick = () => {
        vscode.postMessage({ type: 'refresh' });
    };

    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.type) {
            case 'update':
                updateStats(message.data);
                break;
        }
    });

    function sortCardsByCode() {
        // 获取所有卡片
        const cards = Array.from(statsContainer.getElementsByClassName('lang-card'));
    
        // 按照stats.code进行排序
        cards.sort((a, b) => {
            const codeA = parseInt(a.getElementsByClassName('lang-total')[0].textContent.replace(' Lines', ''), 10);
            const codeB = parseInt(b.getElementsByClassName('lang-total')[0].textContent.replace(' Lines', ''), 10);
            return codeB - codeA;
        });
    
        // 清空容器
        statsContainer.innerHTML = '';
    
        // 重新将排序后的卡片添加到容器中
        cards.forEach(card => {
            statsContainer.appendChild(card);
        });
    }

    function updateStats(data) {
        // 清空容器
        statsContainer.innerHTML = '';

        // 遍历数据并生成卡片
        for (const [lang, stats] of Object.entries(data)) {
            const card = document.createElement('div');
            card.className = 'lang-card';

            card.innerHTML = `
                <div class="lang-header">
                    <span class="lang-name">${lang}</span>
                    <span class="lang-total">${stats.code} Lines</span>
                </div>
            `;

            // 将卡片添加到容器中
            statsContainer.appendChild(card);
        }

        sortCardsByCode();
    }
})();