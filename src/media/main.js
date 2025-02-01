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
                    <span class="lang-total">${stats.code} 行</span>
                </div>
                <div class="lang-details">
                    <div>代码: ${stats.code}</div>
                    <div>注释: ${stats.comments}</div>
                    <div>空行: ${stats.blanks}</div>
                </div>
            `;

            // 将卡片添加到容器中
            statsContainer.appendChild(card);
        }
    }
})();