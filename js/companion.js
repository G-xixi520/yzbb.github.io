/**
 * companion.js - 陪伴模块
 * 一起追剧、听歌、看书、番茄钟
 */

(function() {
    'use strict';

    // ========== 数据存储 ==========
    const STORAGE_KEY = 'companionData';
    let companionData = {
        movie: { link: '', note: '', updatedAt: null },
        music: { link: '', note: '', updatedAt: null },
        book: { content: '', progress: 0, fileName: '', updatedAt: null },
        timer: {
            startTime: null,
            duration: 0, // 秒
            isRunning: false,
            partnerStartTime: null,
            partnerDuration: 0,
            partnerIsRunning: false
        }
    };

    function loadData() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                companionData = { ...companionData, ...parsed };
            }
        } catch (e) {}
    }

    function saveData() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(companionData));
        } catch (e) {}
    }

    loadData();

    // ========== 获取梦角昵称 ==========
    function getPartnerName() {
        if (typeof settings !== 'undefined' && settings.partnerName) {
            return settings.partnerName;
        }
        return '梦角';
    }

    function getMyName() {
        if (typeof settings !== 'undefined' && settings.myName) {
            return settings.myName;
        }
        return '我';
    }

    // ========== 标签切换 ==========
    window.switchCompanionTab = function(tab) {
        document.querySelectorAll('.companion-tab').forEach(t => t.classList.remove('active'));
        const activeTab = document.querySelector(`.companion-tab[data-tab="${tab}"]`);
        if (activeTab) activeTab.classList.add('active');
        renderCompanionPanel(tab);
    };

    // ========== 渲染面板 ==========
    function renderCompanionPanel(tab) {
        const panel = document.getElementById('companion-panel');
        if (!panel) return;

        const partnerName = getPartnerName();
        const myName = getMyName();

        switch (tab) {
            case 'movie':
                panel.innerHTML = renderMoviePanel(partnerName);
                break;
            case 'music':
                panel.innerHTML = renderMusicPanel(partnerName);
                break;
            case 'book':
                panel.innerHTML = renderBookPanel(partnerName);
                break;
            case 'timer':
                panel.innerHTML = renderTimerPanel(partnerName, myName);
                break;
            default:
                panel.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-secondary);">请选择一项</div>';
        }
    }

    // ========== 追剧面板 ==========
    function renderMoviePanel(partnerName) {
        const data = companionData.movie;
        const hasLink = data.link && data.link.trim();
        const timeStr = data.updatedAt ? new Date(data.updatedAt).toLocaleString('zh-CN', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : '';

        return `
            <div style="padding:4px 0;">
                <div style="font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:8px;">
                    🎬 ${partnerName} 正在追
                </div>
                ${hasLink ? `
                    <div style="background:var(--secondary-bg);border-radius:12px;padding:14px;border:1px solid var(--border-color);margin-bottom:12px;">
                        <div style="font-size:13px;color:var(--text-primary);word-break:break-all;margin-bottom:6px;">
                            <a href="${escapeHtml(data.link)}" target="_blank" style="color:var(--accent-color);text-decoration:none;">
                                ${escapeHtml(data.link)}
                            </a>
                        </div>
                        ${data.note ? `<div style="font-size:12px;color:var(--text-secondary);">${escapeHtml(data.note)}</div>` : ''}
                        <div style="font-size:10px;color:var(--text-secondary);opacity:0.6;margin-top:6px;">更新于 ${timeStr}</div>
                    </div>
                ` : `
                    <div style="background:var(--secondary-bg);border-radius:12px;padding:20px;border:1px dashed var(--border-color);text-align:center;color:var(--text-secondary);font-size:13px;margin-bottom:12px;">
                        <i class="fas fa-film" style="font-size:24px;opacity:0.3;display:block;margin-bottom:8px;"></i>
                        ${partnerName} 还没有分享剧集
                    </div>
                `}
                <div style="display:flex;gap:8px;">
                    <input type="text" id="companion-movie-input" placeholder="粘贴视频链接..." style="flex:1;padding:10px 12px;border:1.5px solid var(--border-color);border-radius:10px;font-size:13px;background:var(--primary-bg);color:var(--text-primary);outline:none;font-family:var(--font-family);">
                    <button class="modal-btn modal-btn-primary" onclick="updateCompanionLink('movie')" style="padding:10px 16px;font-size:13px;">更新</button>
                </div>
                <div style="margin-top:6px;">
                    <input type="text" id="companion-movie-note" placeholder="想说的话..." style="width:100%;padding:8px 12px;border:1.5px solid var(--border-color);border-radius:10px;font-size:12px;background:var(--primary-bg);color:var(--text-primary);outline:none;font-family:var(--font-family);">
                </div>
            </div>
        `;
    }

    // ========== 听歌面板 ==========
    function renderMusicPanel(partnerName) {
        const data = companionData.music;
        const hasLink = data.link && data.link.trim();
        const timeStr = data.updatedAt ? new Date(data.updatedAt).toLocaleString('zh-CN', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : '';

        return `
            <div style="padding:4px 0;">
                <div style="font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:8px;">
                    🎵 ${partnerName} 在听
                </div>
                ${hasLink ? `
                    <div style="background:var(--secondary-bg);border-radius:12px;padding:14px;border:1px solid var(--border-color);margin-bottom:12px;">
                        <div style="font-size:13px;color:var(--text-primary);word-break:break-all;margin-bottom:6px;">
                            <a href="${escapeHtml(data.link)}" target="_blank" style="color:var(--accent-color);text-decoration:none;">
                                ${escapeHtml(data.link)}
                            </a>
                        </div>
                        ${data.note ? `<div style="font-size:12px;color:var(--text-secondary);">${escapeHtml(data.note)}</div>` : ''}
                        <div style="font-size:10px;color:var(--text-secondary);opacity:0.6;margin-top:6px;">更新于 ${timeStr}</div>
                    </div>
                ` : `
                    <div style="background:var(--secondary-bg);border-radius:12px;padding:20px;border:1px dashed var(--border-color);text-align:center;color:var(--text-secondary);font-size:13px;margin-bottom:12px;">
                        <i class="fas fa-music" style="font-size:24px;opacity:0.3;display:block;margin-bottom:8px;"></i>
                        ${partnerName} 还没有分享歌曲
                    </div>
                `}
                <div style="display:flex;gap:8px;">
                    <input type="text" id="companion-music-input" placeholder="粘贴音乐链接..." style="flex:1;padding:10px 12px;border:1.5px solid var(--border-color);border-radius:10px;font-size:13px;background:var(--primary-bg);color:var(--text-primary);outline:none;font-family:var(--font-family);">
                    <button class="modal-btn modal-btn-primary" onclick="updateCompanionLink('music')" style="padding:10px 16px;font-size:13px;">更新</button>
                </div>
                <div style="margin-top:6px;">
                    <input type="text" id="companion-music-note" placeholder="想说的话..." style="width:100%;padding:8px 12px;border:1.5px solid var(--border-color);border-radius:10px;font-size:12px;background:var(--primary-bg);color:var(--text-primary);outline:none;font-family:var(--font-family);">
                </div>
            </div>
        `;
    }

    // ========== 看书面板 ==========
    function renderBookPanel(partnerName) {
        const data = companionData.book;
        const hasContent = data.content && data.content.trim();
        const progress = data.progress || 0;
        const fileName = data.fileName || '';
        const timeStr = data.updatedAt ? new Date(data.updatedAt).toLocaleString('zh-CN', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : '';

        // 预览内容（前200字）
        let previewText = '';
        if (hasContent) {
            const lines = data.content.split('\n').filter(line => line.trim());
            previewText = lines.slice(0, 10).join('\n');
            if (previewText.length > 300) previewText = previewText.slice(0, 300) + '...';
        }

        return `
            <div style="padding:4px 0;">
                <div style="font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:8px;">
                    📖 ${partnerName} 在读
                </div>
                ${hasContent ? `
                    <div style="background:var(--secondary-bg);border-radius:12px;padding:14px;border:1px solid var(--border-color);margin-bottom:12px;">
                        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px;">📄 ${escapeHtml(fileName) || '未命名'}</div>
                        <div style="font-size:13px;color:var(--text-primary);white-space:pre-wrap;word-break:break-word;max-height:120px;overflow:hidden;line-height:1.6;">
                            ${escapeHtml(previewText)}
                        </div>
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;font-size:11px;color:var(--text-secondary);">
                            <span>阅读进度 ${progress}%</span>
                            <span>更新于 ${timeStr}</span>
                        </div>
                        <div style="width:100%;height:4px;background:var(--border-color);border-radius:2px;margin-top:6px;overflow:hidden;">
                            <div style="width:${progress}%;height:100%;background:var(--accent-color);border-radius:2px;"></div>
                        </div>
                    </div>
                ` : `
                    <div style="background:var(--secondary-bg);border-radius:12px;padding:20px;border:1px dashed var(--border-color);text-align:center;color:var(--text-secondary);font-size:13px;margin-bottom:12px;">
                        <i class="fas fa-book" style="font-size:24px;opacity:0.3;display:block;margin-bottom:8px;"></i>
                        ${partnerName} 还没有上传书籍
                    </div>
                `}
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <button class="modal-btn modal-btn-secondary" onclick="document.getElementById('companion-book-input').click()" style="flex:1;padding:10px;font-size:13px;">
                        <i class="fas fa-upload"></i> 上传 .txt
                    </button>
                    <input type="file" id="companion-book-input" accept=".txt" style="display:none;" onchange="uploadBookFile(this)">
                    <button class="modal-btn modal-btn-primary" onclick="clearBook()" style="padding:10px 16px;font-size:13px;">清除</button>
                </div>
                ${hasContent ? `
                    <div style="margin-top:8px;display:flex;gap:8px;">
                        <input type="range" min="0" max="100" value="${progress}" id="book-progress-slider" style="flex:1;accent-color:var(--accent-color);" oninput="updateBookProgress(this.value)">
                        <span style="font-size:12px;color:var(--text-secondary);min-width:44px;" id="book-progress-label">${progress}%</span>
                        <button class="modal-btn modal-btn-secondary" onclick="updateBookProgress(document.getElementById('book-progress-slider').value)" style="padding:4px 12px;font-size:11px;">保存</button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // ========== 番茄钟面板 ==========
    function renderTimerPanel(partnerName, myName) {
        const data = companionData.timer;
        const myRunning = data.isRunning;
        const partnerRunning = data.partnerIsRunning;

        // 计算已用时间
        function getElapsed(startTime, duration) {
            if (!startTime) return 0;
            if (startTime === 'partner') return 0;
            const start = typeof startTime === 'number' ? startTime : parseInt(startTime);
            if (isNaN(start)) return 0;
            return Math.floor((Date.now() - start) / 1000) + (duration || 0);
        }

        const myElapsed = myRunning ? getElapsed(data.startTime, data.duration) : (data.duration || 0);
        const partnerElapsed = partnerRunning ? getElapsed(data.partnerStartTime, data.partnerDuration) : (data.partnerDuration || 0);

        function formatTime(seconds) {
            const m = Math.floor(seconds / 60);
            const s = Math.floor(seconds % 60);
            return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }

        return `
            <div style="padding:4px 0;">
                <div style="font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:12px;">
                    ⏰ 番茄钟
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    <div style="background:var(--secondary-bg);border-radius:12px;padding:14px;border:1px solid var(--border-color);text-align:center;">
                        <div style="font-size:11px;color:var(--text-secondary);">${myName}</div>
                        <div style="font-size:28px;font-weight:700;color:var(--accent-color);font-variant-numeric:tabular-nums;">
                            ${formatTime(myElapsed)}
                        </div>
                        <button class="modal-btn ${myRunning ? 'modal-btn-secondary' : 'modal-btn-primary'}" 
                                onclick="toggleTimer('me')" 
                                style="font-size:12px;padding:6px 16px;margin-top:6px;">
                            ${myRunning ? '⏸ 暂停' : '▶ 开始'}
                        </button>
                        ${myRunning ? `<button class="modal-btn modal-btn-secondary" onclick="resetTimer('me')" style="font-size:11px;padding:4px 10px;margin-top:4px;">重置</button>` : ''}
                    </div>
                    <div style="background:var(--secondary-bg);border-radius:12px;padding:14px;border:1px solid var(--border-color);text-align:center;">
                        <div style="font-size:11px;color:var(--text-secondary);">${partnerName}</div>
                        <div style="font-size:28px;font-weight:700;color:var(--accent-color);font-variant-numeric:tabular-nums;">
                            ${formatTime(partnerElapsed)}
                        </div>
                        <div style="font-size:11px;color:var(--text-secondary);margin-top:6px;">
                            ${partnerRunning ? '⏳ 专注中' : '⏸ 已暂停'}
                        </div>
                    </div>
                </div>
                <div style="margin-top:10px;padding:10px 14px;background:rgba(var(--accent-color-rgb),0.06);border-radius:10px;border:1px solid rgba(var(--accent-color-rgb),0.15);text-align:center;font-size:12px;color:var(--text-secondary);">
                    <i class="fas fa-info-circle" style="margin-right:4px;"></i>
                    互相陪伴，一起专注吧 💪
                </div>
                <div style="margin-top:10px;display:flex;gap:8px;">
                    <button class="modal-btn modal-btn-secondary" onclick="clearTimerRecord()" style="flex:1;padding:8px;font-size:12px;">
                        <i class="fas fa-trash"></i> 清空记录
                    </button>
                </div>
            </div>
        `;
    }

    // ========== 更新链接（追剧/听歌） ==========
    window.updateCompanionLink = function(type) {
        const inputId = type === 'movie' ? 'companion-movie-input' : 'companion-music-input';
        const noteId = type === 'movie' ? 'companion-movie-note' : 'companion-music-note';
        const input = document.getElementById(inputId);
        const note = document.getElementById(noteId);
        if (!input) return;

        const link = input.value.trim();
        if (!link) {
            if (typeof showNotification === 'function') {
                showNotification('请输入链接', 'warning');
            }
            return;
        }

        companionData[type] = {
            link: link,
            note: note ? note.value.trim() : '',
            updatedAt: Date.now()
        };
        saveData();
        renderCompanionPanel(type === 'movie' ? 'movie' : 'music');
        if (typeof showNotification === 'function') {
            showNotification(`✅ ${type === 'movie' ? '剧集' : '歌曲'}已更新`, 'success');
        }
    };

    // ========== 上传书籍 ==========
    window.uploadBookFile = function(input) {
        const file = input.files[0];
        if (!file) return;
        if (!file.name.endsWith('.txt')) {
            if (typeof showNotification === 'function') {
                showNotification('请上传 .txt 文件', 'warning');
            }
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            companionData.book = {
                content: content,
                fileName: file.name,
                progress: 0,
                updatedAt: Date.now()
            };
            saveData();
            renderCompanionPanel('book');
            if (typeof showNotification === 'function') {
                showNotification(`✅ 已上传《${file.name}》`, 'success');
            }
        };
        reader.readAsText(file, 'UTF-8');
        input.value = '';
    };

    // ========== 更新阅读进度 ==========
    window.updateBookProgress = function(value) {
        const progress = parseInt(value) || 0;
        if (companionData.book.content) {
            companionData.book.progress = Math.min(100, Math.max(0, progress));
            companionData.book.updatedAt = Date.now();
            saveData();
            const label = document.getElementById('book-progress-label');
            if (label) label.textContent = progress + '%';
            if (typeof showNotification === 'function') {
                showNotification(`📖 进度已更新至 ${progress}%`, 'success', 1500);
            }
        }
    };

    // ========== 清除书籍 ==========
    window.clearBook = function() {
        if (!companionData.book.content) return;
        if (!confirm('确定要清除当前书籍吗？')) return;
        companionData.book = { content: '', progress: 0, fileName: '', updatedAt: null };
        saveData();
        renderCompanionPanel('book');
        if (typeof showNotification === 'function') {
            showNotification('已清除书籍', 'info');
        }
    };

    // ========== 番茄钟控制 ==========
    let timerInterval = null;

    window.toggleTimer = function(who) {
        const data = companionData.timer;
        if (who === 'me') {
            if (data.isRunning) {
                // 暂停
                data.duration += Math.floor((Date.now() - data.startTime) / 1000);
                data.isRunning = false;
                data.startTime = null;
            } else {
                // 开始
                data.startTime = Date.now();
                data.isRunning = true;
            }
        }
        saveData();
        renderCompanionPanel('timer');
        startTimerTick();
    };

    window.resetTimer = function(who) {
        const data = companionData.timer;
        if (who === 'me') {
            data.duration = 0;
            data.isRunning = false;
            data.startTime = null;
        }
        saveData();
        renderCompanionPanel('timer');
    };

    window.clearTimerRecord = function() {
        if (!confirm('确定要清空番茄钟记录吗？')) return;
        companionData.timer = {
            startTime: null,
            duration: 0,
            isRunning: false,
            partnerStartTime: null,
            partnerDuration: 0,
            partnerIsRunning: false
        };
        saveData();
        renderCompanionPanel('timer');
        if (typeof showNotification === 'function') {
            showNotification('已清空记录', 'info');
        }
    };

    function startTimerTick() {
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            const panel = document.getElementById('companion-panel');
            if (!panel || !panel.querySelector('.companion-tab.active[data-tab="timer"]')) {
                // 如果不在番茄钟面板，不刷新
                return;
            }
            // 只更新时间显示，不重绘整个面板
            const data = companionData.timer;
            const myRunning = data.isRunning;
            const partnerRunning = data.partnerIsRunning;

            function getElapsed(startTime, duration) {
                if (!startTime || startTime === 'partner') return duration || 0;
                if (isNaN(startTime)) return duration || 0;
                return Math.floor((Date.now() - startTime) / 1000) + (duration || 0);
            }

            const myElapsed = myRunning ? getElapsed(data.startTime, data.duration) : (data.duration || 0);
            const partnerElapsed = partnerRunning ? getElapsed(data.partnerStartTime, data.partnerDuration) : (data.partnerDuration || 0);

            function formatTime(seconds) {
                const m = Math.floor(seconds / 60);
                const s = Math.floor(seconds % 60);
                return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
            }

            const myEl = panel.querySelector('.companion-panel div:first-child .modal-btn-primary, .companion-panel div:first-child .modal-btn-secondary');
            const timeEls = panel.querySelectorAll('.companion-panel .modal-btn-primary + div + div, .companion-panel .modal-btn-secondary + div + div');
            // 简单更新：刷新整个面板（不频繁重绘）
            // 但为了避免闪烁，使用直接DOM更新
            const allTimeEls = panel.querySelectorAll('[style*="font-size:28px"]');
            if (allTimeEls.length >= 2) {
                allTimeEls[0].textContent = formatTime(myElapsed);
                allTimeEls[1].textContent = formatTime(partnerElapsed);
            }
        }, 1000);
    }

    // 打开陪伴弹窗时渲染
    document.addEventListener('click', function(e) {
        const target = e.target.closest('[onclick*="openApp(\'companion\')"]') ||
                       e.target.closest('.app-item[data-app="companion"]');
        if (target) {
            setTimeout(() => {
                renderCompanionPanel('movie');
                startTimerTick();
            }, 200);
        }
    });

    // 关闭弹窗时停止定时器
    document.addEventListener('click', function(e) {
        if (e.target.id === 'close-companion' || e.target.closest('#close-companion')) {
            if (timerInterval) clearInterval(timerInterval);
            const modal = document.getElementById('companion-modal');
            if (modal && typeof hideModal === 'function') {
                hideModal(modal);
            } else if (modal) {
                modal.style.display = 'none';
            }
        }
    });

    // ========== 工具函数 ==========
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ========== 暴露 API ==========
    window.CompanionApp = {
        loadData: loadData,
        saveData: saveData,
        renderPanel: renderCompanionPanel,
        getData: () => companionData
    };

    // ========== 模拟梦角更新（随机触发） ==========
    function partnerAutoUpdate() {
        const types = ['movie', 'music'];
        const type = types[Math.floor(Math.random() * types.length)];
        // 30%概率更新
        if (Math.random() > 0.3) return;

        const pool = {
            movie: [
                'https://www.bilibili.com/video/BV1GJ411x7e1',
                'https://www.bilibili.com/video/BV1C4411u7rF',
                'https://www.bilibili.com/video/BV1bV411r7pW'
            ],
            music: [
                'https://music.163.com/song?id=186016',
                'https://music.163.com/song?id=4343173',
                'https://music.163.com/song?id=25706282'
            ]
        };

        const links = pool[type] || [];
        if (links.length === 0) return;

        const link = links[Math.floor(Math.random() * links.length)];
        const notes = ['分享给你~', '好喜欢这首', '一起看吧', '听了好多遍', '你也会喜欢的'];
        const note = notes[Math.floor(Math.random() * notes.length)];

        companionData[type] = {
            link: link,
            note: note,
            updatedAt: Date.now()
        };
        saveData();

        // 如果弹窗打开，刷新
        const modal = document.getElementById('companion-modal');
        if (modal && modal.style.display !== 'none') {
            const activeTab = document.querySelector('.companion-tab.active');
            if (activeTab) {
                renderCompanionPanel(activeTab.dataset.tab);
            }
        }

        // 发送通知
        if (typeof showNotification === 'function') {
            const typeName = type === 'movie' ? '剧集' : '歌曲';
            showNotification(`💕 ${getPartnerName()} 分享了${typeName}`, 'info', 3000);
        }
    }

    // 每小时检查一次
    setInterval(() => {
        partnerAutoUpdate();
    }, 60 * 60 * 1000);

    // 首次加载延迟触发
    setTimeout(partnerAutoUpdate, 5000);

})();