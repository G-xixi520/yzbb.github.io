/**
 * chat-enhance.js - 聊天增强
 * 功能：链接预览、粘贴图片发送
 * 依赖：utils.js, core.js
 */

(function() {
    'use strict';

    // ========== 链接预览 ==========
    // 支持平台列表
    const PLATFORMS = [
        { domain: 'bilibili.com', name: 'B站', icon: '📺', color: '#FB7299' },
        { domain: 'douyin.com', name: '抖音', icon: '🎵', color: '#000000' },
        { domain: 'xiaohongshu.com', name: '小红书', icon: '📕', color: '#FF2442' },
        { domain: 'xhs.com', name: '小红书', icon: '📕', color: '#FF2442' },
        { domain: 'music.163.com', name: '网易云音乐', icon: '🎶', color: '#E53E3E' },
        { domain: 'youtube.com', name: 'YouTube', icon: '▶️', color: '#FF0000' },
        { domain: 'youtu.be', name: 'YouTube', icon: '▶️', color: '#FF0000' },
        { domain: 'zhihu.com', name: '知乎', icon: '💡', color: '#0066FF' },
        { domain: 'weibo.com', name: '微博', icon: '📱', color: '#FF8200' },
        { domain: 'github.com', name: 'GitHub', icon: '🐙', color: '#24292E' },
        { domain: 'x.com', name: 'Twitter', icon: '🐦', color: '#000000' },
        { domain: 'twitter.com', name: 'Twitter', icon: '🐦', color: '#000000' },
        { domain: 'instagram.com', name: 'Instagram', icon: '📸', color: '#E4405F' },
        { domain: 'v.qq.com', name: '腾讯视频', icon: '🎬', color: '#FF4D00' },
        { domain: 'iqiyi.com', name: '爱奇艺', icon: '🎬', color: '#00BFA5' },
        { domain: 'youku.com', name: '优酷', icon: '🎬', color: '#00A8FF' }
    ];

    function detectPlatform(url) {
        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname.replace(/^www\./, '');
            for (const p of PLATFORMS) {
                if (hostname.includes(p.domain) || url.includes(p.domain)) {
                    return p;
                }
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    function extractTitleFromUrl(url) {
        try {
            const urlObj = new URL(url);
            const path = urlObj.pathname.split('/').filter(Boolean);
            if (path.length > 0) {
                const last = decodeURIComponent(path[path.length - 1]);
                if (last && last.length < 40 && !last.match(/^[0-9]+$/)) {
                    return last.replace(/[-_]/g, ' ').trim();
                }
            }
            // 尝试从search参数提取
            const params = new URLSearchParams(urlObj.search);
            const titleParams = ['title', 'name', 'q', 'query', 'keyword'];
            for (const key of titleParams) {
                const val = params.get(key);
                if (val && val.length < 60) {
                    return decodeURIComponent(val);
                }
            }
            // 如果还是找不到，用域名
            return urlObj.hostname.replace(/^www\./, '');
        } catch (e) {
            return url;
        }
    }

    function fetchLinkPreview(url) {
        return new Promise((resolve) => {
            const platform = detectPlatform(url);
            const title = extractTitleFromUrl(url);

            const result = {
                url: url,
                title: title || url.slice(0, 50),
                platform: platform,
                icon: platform ? platform.icon : '🔗',
                color: platform ? platform.color : 'var(--accent-color)',
                name: platform ? platform.name : '网页链接',
                desc: platform ? `来自 ${platform.name}` : ''
            };

            resolve(result);
        });
    }

    // ========== 渲染链接预览卡片 ==========
    function renderLinkPreview(linkData, isSent = true) {
        const icon = linkData.icon || '🔗';
        const color = linkData.color || 'var(--accent-color)';
        const title = linkData.title || linkData.url;
        const desc = linkData.desc || linkData.name || '';

        return `
            <div style="display:flex;align-items:stretch;gap:10px;padding:10px 14px;background:${isSent ? 'rgba(255,255,255,0.12)' : 'var(--primary-bg)'};border-radius:12px;border:1px solid ${isSent ? 'rgba(255,255,255,0.15)' : 'var(--border-color)'};cursor:pointer;max-width:300px;" onclick="window.open('${escapeHtml(linkData.url)}','_blank')">
                <div style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:10px;background:${color}20;color:${color};font-size:20px;flex-shrink:0;">
                    ${icon}
                </div>
                <div style="flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;">
                    <div style="font-size:13px;font-weight:600;color:${isSent ? '#fff' : 'var(--text-primary)'};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(title)}</div>
                    <div style="font-size:11px;color:${isSent ? 'rgba(255,255,255,0.6)' : 'var(--text-secondary)'};">${escapeHtml(desc)}</div>
                </div>
                <div style="display:flex;align-items:center;color:${isSent ? 'rgba(255,255,255,0.4)' : 'var(--text-secondary)'};font-size:14px;flex-shrink:0;">➜</div>
            </div>
        `;
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ========== 检测消息中的链接并替换 ==========
    function processMessageLinks(text) {
        if (!text) return { text: text, links: [] };

        // 匹配URL
        const urlRegex = /(https?:\/\/[^\s<>"']+)/g;
        const matches = text.match(urlRegex);

        if (!matches) return { text: text, links: [] };

        const links = [];
        let processed = text;

        matches.forEach((url, index) => {
            const placeholder = `__LINK_${index}__`;
            links.push({ url: url, index: index });
            processed = processed.replace(url, placeholder);
        });

        return { text: processed, links: links };
    }

    // ========== 增强消息发送（检测链接） ==========
    const originalSendMessage = window.sendMessage;

    window.sendMessage = function(textOverride = null, type = 'normal') {
        const text = textOverride || DOMElements.messageInput.value.trim();
        const imageFile = DOMElements.imageInput.files[0];

        if (!text && !imageFile && type === 'normal') return;

        // 检测链接
        const hasLinks = text && text.match(/(https?:\/\/[^\s<>"']+)/);
        let linkData = null;

        if (hasLinks) {
            const url = text.match(/(https?:\/\/[^\s<>"']+)/)[0];
            // 使用同步方式获取链接预览（简化版）
            const platform = detectPlatform(url);
            linkData = {
                url: url,
                title: extractTitleFromUrl(url),
                platform: platform,
                icon: platform ? platform.icon : '🔗',
                color: platform ? platform.color : 'var(--accent-color)',
                name: platform ? platform.name : '网页链接',
                desc: platform ? `来自 ${platform.name}` : ''
            };
        }

        // 调用原始发送逻辑
        if (typeof originalSendMessage === 'function') {
            // 如果有链接，将链接替换为预览卡片HTML
            if (linkData) {
                // 移除原始URL，只保留预览卡片
                const cleanText = text.replace(/(https?:\/\/[^\s<>"']+)/g, '').trim();
                const finalText = cleanText || linkData.title;
                // 保存链接数据到消息
                const messageData = {
                    id: Date.now(),
                    sender: 'user',
                    text: finalText,
                    timestamp: new Date(),
                    image: imageFile ? null : null,
                    status: 'sent',
                    favorited: false,
                    note: null,
                    replyTo: currentReplyTo,
                    type: 'link',
                    linkData: linkData
                };

                if (imageFile) {
                    // 有图片时正常处理图片
                    optimizeImage(imageFile).then(imgSrc => {
                        messageData.image = imgSrc;
                        addMessage(messageData);
                        playSound('send');
                        currentReplyTo = null;
                        updateReplyPreview();
                        DOMElements.imageInput.value = '';
                        triggerReply();
                    });
                } else {
                    addMessage(messageData);
                    playSound('send');
                    currentReplyTo = null;
                    updateReplyPreview();
                    triggerReply();
                }
                DOMElements.messageInput.value = '';
                DOMElements.messageInput.style.height = '36px';
                DOMElements.messageInput.style.overflow = 'hidden';
                return;
            }

            // 无链接，正常发送
            originalSendMessage(textOverride, type);
        }
    };

    // ========== 触发回复 ==========
    function triggerReply() {
        if (window._pendingReplyTimer) clearTimeout(window._pendingReplyTimer);
        const delayRange = settings.replyDelayMax - settings.replyDelayMin;
        const randomDelay = settings.replyDelayMin + Math.random() * delayRange;
        window._pendingReplyTimer = setTimeout(() => {
            window._pendingReplyTimer = null;
            if (typeof simulateReply === 'function') {
                simulateReply();
            }
        }, randomDelay);
    }

    // ========== 粘贴图片发送 ==========
    function initPasteImage() {
        const input = document.getElementById('message-input');
        if (!input) return;

        input.addEventListener('paste', function(e) {
            const items = e.clipboardData && e.clipboardData.items;
            if (!items) return;

            let imageFile = null;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.startsWith('image/')) {
                    imageFile = items[i].getAsFile();
                    break;
                }
            }

            if (imageFile) {
                e.preventDefault();

                // 检查大小
                if (imageFile.size > MAX_IMAGE_SIZE) {
                    showNotification('图片大小不能超过5MB', 'error');
                    return;
                }

                showNotification('正在发送图片...', 'info', 1500);

                optimizeImage(imageFile).then(imgSrc => {
                    if (isBatchMode) {
                        batchMessages.push({ id: Date.now() + batchMessages.length, text: '', image: imgSrc });
                        updateBatchPreview();
                        showNotification('已添加到批量发送', 'success', 1200);
                    } else {
                        const messageData = {
                            id: Date.now(),
                            sender: 'user',
                            text: '',
                            timestamp: new Date(),
                            image: imgSrc,
                            status: 'sent',
                            favorited: false,
                            note: null,
                            replyTo: currentReplyTo,
                            type: 'normal'
                        };
                        addMessage(messageData);
                        playSound('send');
                        currentReplyTo = null;
                        updateReplyPreview();
                        triggerReply();
                    }
                }).catch(() => {
                    showNotification('图片处理失败', 'error');
                });

                DOMElements.imageInput.value = '';
            }

            // 检测粘贴的是否有纯文本中的链接
            const text = e.clipboardData.getData('text/plain');
            if (text && text.match(/(https?:\/\/[^\s<>"']+)/)) {
                // 有链接，让链接处理逻辑接管
                // 但不要阻止粘贴，用户可能想粘贴纯文本链接
                // 使用 setTimeout 让输入框先接收内容，然后检测
                setTimeout(() => {
                    const currentText = input.value;
                    if (currentText.match(/(https?:\/\/[^\s<>"']+)/)) {
                        // 如果有链接，自动触发发送（但让用户决定）
                        // 这里只做检测，不自动发送
                    }
                }, 50);
            }
        });
    }

    // ========== 消息渲染增强（显示链接卡片） ==========
    // 修改消息渲染，检测 linkData
    const originalRenderMessage = window.renderMessages;
    if (originalRenderMessage) {
        // 在 addMessage 中已经处理了 linkData，这里不需要额外修改
        // 但我们需要确保 link 类型的消息能正确显示
    }

    // ========== 在消息列表中渲染链接卡片 ==========
    // 修改 createMessageFragment 或 addMessage 中的渲染逻辑
    // 这里通过 Monkey Patch 的方式增强

    // 保存原始的 addMessage
    const originalAddMessage = window.addMessage;

    if (originalAddMessage) {
        window.addMessage = function(message) {
            // 如果是链接类型，添加渲染标记
            if (message.type === 'link' && message.linkData) {
                // 链接消息会由下面的渲染增强处理
            }
            originalAddMessage(message);
        };
    }

    // ========== 增强消息渲染 ==========
    // 在 renderMessages 后处理链接卡片
    const originalRenderMessages = window.renderMessages;

    if (originalRenderMessages) {
        window.renderMessages = function(preserveScroll = false) {
            originalRenderMessages(preserveScroll);

            // 处理链接消息
            setTimeout(() => {
                const container = DOMElements.chatContainer;
                if (!container) return;

                // 查找所有链接类型的消息
                container.querySelectorAll('.message-wrapper').forEach(wrapper => {
                    const msgId = wrapper.dataset.msgId || wrapper.dataset.id;
                    const msg = messages.find(m => String(m.id) === String(msgId));
                    if (msg && msg.type === 'link' && msg.linkData) {
                        const messageEl = wrapper.querySelector('.message');
                        if (messageEl) {
                            // 检查是否已经被替换
                            if (messageEl.querySelector('.link-preview-container')) return;

                            const isSent = msg.sender === 'user';
                            const previewHtml = renderLinkPreview(msg.linkData, isSent);

                            // 如果消息有文本内容，保留文本，在下方添加预览
                            if (msg.text && msg.text.trim()) {
                                // 已经在消息中显示了文本，追加预览
                                const containerDiv = document.createElement('div');
                                containerDiv.className = 'link-preview-container';
                                containerDiv.style.marginTop = '8px';
                                containerDiv.innerHTML = previewHtml;
                                messageEl.appendChild(containerDiv);
                            } else {
                                // 只有链接，替换消息内容
                                messageEl.innerHTML = previewHtml;
                                messageEl.style.padding = '0';
                                messageEl.style.background = 'transparent';
                                messageEl.style.boxShadow = 'none';
                            }
                        }
                    }
                });
            }, 50);
        };
    }

    // ========== 初始化 ==========
    function init() {
        initPasteImage();
        console.log('[聊天增强] 已初始化：链接预览 + 粘贴图片');
    }

    // 如果 DOM 已加载，立即初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ========== 暴露 API ==========
    window.ChatEnhance = {
        detectPlatform: detectPlatform,
        fetchLinkPreview: fetchLinkPreview,
        renderLinkPreview: renderLinkPreview,
        processMessageLinks: processMessageLinks,
        init: init
    };

})();