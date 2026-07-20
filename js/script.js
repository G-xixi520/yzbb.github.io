/**
 * journal.js - 梦角日记
 * 从字卡库中随机抽取字卡作为日记内容
 */

(function() {
    'use strict';

    const STORAGE_KEY = 'journalData';
    const MAX_ENTRIES = 100;

    // ========== 数据管理 ==========
    function getJournalData() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    function saveJournalData(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('[日记] 保存失败:', e);
        }
    }

    // ========== 获取字卡库（从回复库中抽取） ==========
    function getCardPool() {
        // 优先从全局 customReplies 获取
        let pool = [];
        if (typeof customReplies !== 'undefined' && Array.isArray(customReplies)) {
            pool = customReplies.map(r => String(r || '').trim()).filter(Boolean);
        }
        // 如果为空，尝试从 localStorage 读取
        if (pool.length === 0) {
            try {
                const saved = localStorage.getItem('customReplies');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed)) {
                        pool = parsed.map(r => String(r || '').trim()).filter(Boolean);
                    }
                }
            } catch (e) {}
        }
        // 保底默认字卡
        if (pool.length === 0) {
            pool = [
                '今天天气真好，想和你一起出去走走',
                '做了一个很美的梦，梦里有你',
                '窗外下着小雨，让我想起你',
                '今天看到一朵云，像你的样子',
                '有点想你了，就现在',
                '晚上星星很多，你看到了吗',
                '今天学会了一道新菜，想给你尝尝',
                '路上看到一对情侣，想到了我们',
                '今天工作有点累，但想到你就有力量了',
                '晚安，愿你有个好梦'
            ];
        }
        return pool;
    }

    // ========== 获取表情包 ==========
    function getStickerPool() {
        let stickers = [];
        if (typeof stickerLibrary !== 'undefined' && Array.isArray(stickerLibrary)) {
            stickers = stickerLibrary.filter(Boolean);
        }
        if (stickers.length === 0 && typeof myStickerLibrary !== 'undefined' && Array.isArray(myStickerLibrary)) {
            stickers = myStickerLibrary.filter(Boolean);
        }
        return stickers;
    }

    // ========== 生成单条日记 ==========
    function generateJournalEntry() {
        const pool = getCardPool();
        const stickerPool = getStickerPool();

        // 随机选 1-3 条字卡拼接
        const count = Math.floor(Math.random() * 3) + 1;
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        let content = shuffled.slice(0, count).join('。');

        // 随机添加 emoji（30%概率）
        const emojis = ['✨', '🌸', '💕', '🌙', '☀️', '🍀', '🌟', '🎵', '💭', '🍵', '📖', '🌺'];
        if (Math.random() < 0.3) {
            content += ' ' + emojis[Math.floor(Math.random() * emojis.length)];
        }

        // 随机添加表情包（20%概率）
        let sticker = null;
        if (stickerPool.length > 0 && Math.random() < 0.2) {
            sticker = stickerPool[Math.floor(Math.random() * stickerPool.length)];
        }

        // 随机心情标签
        const moods = ['😊', '🥰', '🤗', '💖', '🌙', '☕', '🌸', '🍃', '✨', '💭'];
        const mood = moods[Math.floor(Math.random() * moods.length)];

        return {
            content: content,
            sticker: sticker,
            mood: mood,
            timestamp: Date.now(),
            id: 'journal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)
        };
    }

    // ========== 自动生成新日记 ==========
    function autoGenerateJournal() {
        const data = getJournalData();
        const entry = generateJournalEntry();
        data.unshift(entry);
        // 限制数量
        if (data.length > MAX_ENTRIES) {
            data.length = MAX_ENTRIES;
        }
        saveJournalData(data);
        renderJournalList();
        return entry;
    }

    // ========== 渲染日记列表 ==========
    function renderJournalList() {
        const container = document.getElementById('journal-list');
        if (!container) return;

        const data = getJournalData();

        if (data.length === 0) {
            container.innerHTML = `
                <div class="journal-empty">
                    <i class="fas fa-feather-alt"></i>
                    还没有日记，梦角会随机写下的～
                </div>
            `;
            return;
        }

        container.innerHTML = data.map(entry => {
            const time = new Date(entry.timestamp);
            const timeStr = time.toLocaleString('zh-CN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            const stickerHtml = entry.sticker
                ? `<img src="${entry.sticker}" class="sticker-img" alt="表情" loading="lazy">`
                : '';
            return `
                <div class="journal-entry">
                    <div class="meta">
                        <span class="mood">${entry.mood || '💭'}</span>
                        <span>${timeStr}</span>
                        <span style="margin-left:auto;font-size:10px;opacity:0.5;">#梦角日记</span>
                    </div>
                    <div class="content">${escapeHtml(entry.content)}</div>
                    ${stickerHtml}
                </div>
            `;
        }).join('');
    }

    // ========== 工具函数 ==========
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ========== 对外暴露 ==========
    window.JournalApp = {
        getData: getJournalData,
        saveData: saveJournalData,
        generateEntry: generateJournalEntry,
        autoGenerate: autoGenerateJournal,
        render: renderJournalList,
        getCardPool: getCardPool,
        getStickerPool: getStickerPool
    };

    // ========== 初始化 & 定时生成 ==========
    let journalTimer = null;

    function startJournalTimer() {
        if (journalTimer) clearInterval(journalTimer);
        // 每 3-6 小时生成一篇（随机间隔）
        const interval = (3 + Math.random() * 3) * 60 * 60 * 1000;
        journalTimer = setTimeout(() => {
            if (document.getElementById('journal-modal')?.style.display !== 'none') {
                // 如果弹窗打开，生成并刷新
                autoGenerateJournal();
            }
            // 继续下一轮
            startJournalTimer();
        }, interval);
    }

    // 页面加载时启动
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            startJournalTimer();
            // 首次生成一条（如果有数据则跳过）
            const data = getJournalData();
            if (data.length === 0) {
                setTimeout(autoGenerateJournal, 3000);
            }
        });
    } else {
        startJournalTimer();
        const data = getJournalData();
        if (data.length === 0) {
            setTimeout(autoGenerateJournal, 3000);
        }
    }

    // ========== 绑定弹窗打开事件 ==========
    document.addEventListener('click', function(e) {
        const target = e.target.closest('[onclick*="openApp(\'journal\')"]') ||
                       e.target.closest('.app-item[data-app="journal"]');
        if (target) {
            setTimeout(() => {
                renderJournalList();
                // 如果日记为空，立即生成一篇
                const data = getJournalData();
                if (data.length === 0) {
                    autoGenerateJournal();
                }
            }, 200);
        }
    });

    // 刷新按钮
    document.addEventListener('click', function(e) {
        if (e.target.id === 'journal-refresh-btn' || e.target.closest('#journal-refresh-btn')) {
            autoGenerateJournal();
            if (typeof showNotification === 'function') {
                showNotification('✨ 梦角写了一篇新日记', 'success', 2000);
            }
        }
    });

    // 关闭按钮
    document.addEventListener('click', function(e) {
        if (e.target.id === 'close-journal' || e.target.closest('#close-journal')) {
            const modal = document.getElementById('journal-modal');
            if (modal && typeof hideModal === 'function') {
                hideModal(modal);
            } else if (modal) {
                modal.style.display = 'none';
            }
        }
    });

})();