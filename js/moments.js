/**
 * moments.js - 朋友圈升级版
 * 功能：拼字卡、楼中楼评论、链接预览
 */

(function() {
  'use strict';

  // ========== 用户配置 ==========
  const userConfig = {
    name: '我',
    signature: '生活不止眼前的代码',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me&backgroundColor=b6e3f4',
    coverImage: 'https://picsum.photos/seed/cover123/800/400'
  };

  // ========== 从 Home 页同步头像 ==========
  async function syncAvatarFromHome() {
    let avatarUrl = null;
    let userName = null;
    let userSignature = null;

    const lsAvatar = localStorage.getItem('home_avatar_me');
    if (lsAvatar) avatarUrl = lsAvatar;
    const lsProfile = localStorage.getItem('profile_me');
    if (lsProfile) {
      try {
        const profile = JSON.parse(lsProfile);
        if (!userName) userName = profile.name || null;
        if (!userSignature) userSignature = profile.signature || null;
      } catch(e) {}
    }

    if (typeof homeGetGlobal === 'function') {
      if (!avatarUrl) avatarUrl = homeGetGlobal('home_avatar_me');
      if (!userName || !userSignature) {
        const profileStr = homeGetGlobal('profile_me');
        if (profileStr) {
          try {
            const profile = JSON.parse(profileStr);
            if (!userName) userName = profile.name || null;
            if (!userSignature) userSignature = profile.signature || null;
          } catch(e) {}
        }
      }
    }

    if (typeof localforage !== 'undefined') {
      try {
        if (!avatarUrl) {
          var lfAvatar = await localforage.getItem('home_avatar_me');
          if (lfAvatar) avatarUrl = lfAvatar;
        }
        if (!userName || !userSignature) {
          var lfProfile = await localforage.getItem('profile_me');
          if (lfProfile) {
            var profile = JSON.parse(lfProfile);
            if (!userName) userName = profile.name || null;
            if (!userSignature) userSignature = profile.signature || null;
          }
        }
      } catch(e) {}
    }

    if (avatarUrl) userConfig.avatar = avatarUrl;
    if (userName) userConfig.name = userName;
    if (userSignature) userConfig.signature = userSignature.replace(/^["']|["']$/g, '');

    return { avatar: userConfig.avatar, name: userConfig.name, signature: userConfig.signature };
  }

  // ========== 获取梦角信息 ==========
  function getPartnerName() {
    if (typeof settings !== 'undefined' && settings.partnerName) {
      return settings.partnerName;
    }
    return '梦角';
  }

  function getPartnerAvatar() {
    if (typeof settings !== 'undefined' && settings.partnerAvatar) {
      return settings.partnerAvatar;
    }
    return 'https://api.dicebear.com/7.x/avataaars/svg?seed=partner&backgroundColor=c0aede';
  }

  // ========== 数据管理 ==========
  const MOMENTS_KEY = 'moments_data_v2';
  let momentsData = [];

  function loadMoments() {
    try {
      const saved = localStorage.getItem(MOMENTS_KEY);
      momentsData = saved ? JSON.parse(saved) : [];
    } catch (e) {
      momentsData = [];
    }
  }

  function saveMoments() {
    try {
      localStorage.setItem(MOMENTS_KEY, JSON.stringify(momentsData));
    } catch (e) {
      console.warn('[朋友圈] 保存失败:', e);
    }
  }

  loadMoments();

  // ========== 获取字卡库 ==========
  function getCardPool() {
    let pool = [];
    if (typeof customReplies !== 'undefined' && Array.isArray(customReplies)) {
      pool = customReplies.map(r => String(r || '').trim()).filter(Boolean);
    }
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

  // ========== 生成拼字卡 ==========
  function generateCardSet(count) {
    const pool = getCardPool();
    if (pool.length === 0) return ['今天天气真好', '想和你一起散步'];

    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const actualCount = Math.min(count, shuffled.length);
    return shuffled.slice(0, actualCount);
  }

  // ========== 渲染拼字卡为图片（用Canvas生成） ==========
  function renderCardToImage(texts, callback) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const W = 400, H = 300;
    canvas.width = W;
    canvas.height = H;

    // 背景渐变
    const bgColors = [
      ['#fce4ec', '#f8bbd0'],
      ['#e8f5e9', '#c8e6c9'],
      ['#e3f2fd', '#bbdefb'],
      ['#fff8e1', '#ffecb3'],
      ['#f3e5f5', '#e1bee7']
    ];
    const bg = bgColors[Math.floor(Math.random() * bgColors.length)];
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, bg[0]);
    grad.addColorStop(1, bg[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // 装饰边框
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, W - 20, H - 20);

    // 绘制文字
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const fontSize = Math.min(28, Math.floor((W - 40) / (texts.join('').length / 2)));
    ctx.font = `600 ${Math.max(16, fontSize)}px "Noto Serif SC", serif`;
    ctx.fillStyle = '#3a3a3a';
    ctx.shadowColor = 'rgba(255,255,255,0.5)';
    ctx.shadowBlur = 8;

    const lineHeight = Math.max(32, fontSize + 8);
    const totalHeight = texts.length * lineHeight;
    const startY = (H - totalHeight) / 2 + lineHeight / 2;

    texts.forEach((text, i) => {
      ctx.shadowBlur = 8;
      ctx.fillText(text, W / 2, startY + i * lineHeight);
    });

    // 角落装饰
    ctx.shadowBlur = 0;
    ctx.font = '14px serif';
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    const emojis = ['🌸', '✨', '💕', '🌙', '☀️'];
    ctx.fillText(emojis[Math.floor(Math.random() * emojis.length)], 20, 30);

    callback(canvas.toDataURL('image/png'));
  }

  // ========== 生成拼字卡发布内容 ==========
  function generateCardMoment() {
    return new Promise((resolve) => {
      const count = Math.floor(Math.random() * 3) + 1; // 1-3张
      const cards = generateCardSet(count);
      renderCardToImage(cards, (imageData) => {
        resolve({
          type: 'card',
          cards: cards,
          image: imageData,
          text: cards.join(' · ')
        });
      });
    });
  }

  // ========== 链接预览（抓取网页信息） ==========
  function fetchLinkPreview(url) {
    return new Promise((resolve) => {
      // 使用简单的匹配方式
      const patterns = [
        { domain: 'bilibili.com', name: 'B站', icon: '📺' },
        { domain: 'douyin.com', name: '抖音', icon: '🎵' },
        { domain: 'xiaohongshu.com', name: '小红书', icon: '📕' },
        { domain: 'xhs.com', name: '小红书', icon: '📕' },
        { domain: 'music.163.com', name: '网易云', icon: '🎶' },
        { domain: 'youtube.com', name: 'YouTube', icon: '▶️' },
        { domain: 'zhihu.com', name: '知乎', icon: '💡' },
        { domain: 'weibo.com', name: '微博', icon: '📱' }
      ];

      let match = patterns.find(p => url.includes(p.domain));
      let title = url;
      let desc = '点击查看链接内容';

      // 尝试从URL提取标题
      try {
        const urlObj = new URL(url);
        const path = urlObj.pathname.split('/').filter(Boolean);
        if (path.length > 0) {
          const last = decodeURIComponent(path[path.length - 1]);
          if (last && last.length < 30) {
            title = last.replace(/[-_]/g, ' ');
          }
        }
      } catch(e) {}

      if (title === url) {
        title = url.length > 40 ? url.slice(0, 40) + '...' : url;
      }

      resolve({
        url: url,
        title: title,
        desc: desc,
        icon: match ? match.icon : '🔗',
        name: match ? match.name : '网页链接'
      });
    });
  }

  // ========== 发布时间格式化 ==========
  function formatTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    if (diff < 604800000) return Math.floor(diff / 86400000) + '天前';

    const date = new Date(timestamp);
    return `${date.getMonth()+1}月${date.getDate()}日`;
  }

  // ========== 发布朋友圈 ==========
  async function publishMoment(content, type = 'text', extra = null) {
    let moment = {
      id: Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      publisher: userConfig.name,
      publisherAvatar: userConfig.avatar,
      time: Date.now(),
      type: type,
      content: content,
      likes: [],
      comments: [],
      collected: false
    };

    if (type === 'card' && extra) {
      moment.cards = extra.cards || [];
      moment.cardImage = extra.image || '';
    }

    if (type === 'link' && extra) {
      moment.linkData = extra;
    }

    if (type === 'sticker' && extra) {
      moment.sticker = extra;
    }

    momentsData.unshift(moment);
    saveMoments();
    renderMoments();

    // 如果是用户发布的，触发梦角自动回复
    if (type !== 'system') {
      setTimeout(() => {
        partnerAutoReply(moment.id);
      }, 1500 + Math.random() * 3000);
    }
  }

  // ========== 梦角自动回复 ==========
  function partnerAutoReply(momentId) {
    const moment = momentsData.find(m => m.id === momentId);
    if (!moment) return;

    const partnerName = getPartnerName();
    const partnerAvatar = getPartnerAvatar();

    // 30%概率点赞
    if (Math.random() < 0.3 && !moment.likes.includes(partnerName)) {
      moment.likes.push(partnerName);
    }

    // 40%概率评论
    if (Math.random() < 0.4) {
      const pool = getCardPool();
      let replyText = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : '好棒！✨';
      // 随机加emoji
      const emojis = ['✨', '💕', '🌸', '🌟', '🥰', '💖', '🌙'];
      if (Math.random() < 0.3) {
        replyText += ' ' + emojis[Math.floor(Math.random() * emojis.length)];
      }

      moment.comments.push({
        id: 'cmt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        name: partnerName,
        avatar: partnerAvatar,
        text: replyText,
        time: Date.now(),
        replies: []
      });
    }

    saveMoments();
    renderMoments();
  }

  // ========== 楼中楼评论 ==========
  function addComment(momentId, parentId, text, isReply = false) {
    const moment = momentsData.find(m => m.id === momentId);
    if (!moment) return;

    const myName = userConfig.name;
    const myAvatar = userConfig.avatar;

    const comment = {
      id: 'cmt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: myName,
      avatar: myAvatar,
      text: text.trim(),
      time: Date.now(),
      replies: []
    };

    if (isReply && parentId) {
      // 查找父评论
      const parent = moment.comments.find(c => c.id === parentId);
      if (parent) {
        // 检查是否回复的是子回复
        const parentReply = parent.replies.find(r => r.id === parentId);
        if (parentReply) {
          parentReply.replies.push(comment);
        } else {
          parent.replies.push(comment);
        }
      } else {
        // 尝试在子回复中查找
        let found = false;
        moment.comments.forEach(c => {
          if (!found) {
            const child = c.replies.find(r => r.id === parentId);
            if (child) {
              child.replies.push(comment);
              found = true;
            }
          }
        });
        if (!found) {
          // 如果找不到父级，作为一级评论
          moment.comments.push(comment);
        }
      }
    } else {
      moment.comments.push(comment);
    }

    saveMoments();
    renderMoments();

    // 触发梦角回复评论（30%概率）
    if (Math.random() < 0.3) {
      setTimeout(() => {
        partnerReplyComment(momentId, comment.id);
      }, 1000 + Math.random() * 2000);
    }
  }

  // ========== 梦角回复评论 ==========
  function partnerReplyComment(momentId, commentId) {
    const moment = momentsData.find(m => m.id === momentId);
    if (!moment) return;

    const partnerName = getPartnerName();
    const partnerAvatar = getPartnerAvatar();

    let targetComment = moment.comments.find(c => c.id === commentId);
    if (!targetComment) {
      // 在子回复中查找
      for (const c of moment.comments) {
        const child = c.replies.find(r => r.id === commentId);
        if (child) {
          targetComment = child;
          break;
        }
        for (const r of c.replies || []) {
          const deep = r.replies.find(d => d.id === commentId);
          if (deep) {
            targetComment = deep;
            break;
          }
        }
      }
    }

    if (!targetComment) return;

    const pool = getCardPool();
    let replyText = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : '好呀～💕';
    const emojis = ['✨', '💕', '🌸', '🌟', '🥰', '💖'];
    if (Math.random() < 0.3) {
      replyText += ' ' + emojis[Math.floor(Math.random() * emojis.length)];
    }

    const reply = {
      id: 'cmt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: partnerName,
      avatar: partnerAvatar,
      text: replyText,
      time: Date.now(),
      replies: []
    };

    // 如果是子回复，添加到父级
    if (targetComment.replies) {
      targetComment.replies.push(reply);
    } else {
      targetComment.replies = [reply];
    }

    saveMoments();
    renderMoments();
  }

  // ========== 渲染朋友圈 ==========
  function renderMoments() {
    const container = document.getElementById('momentsList');
    if (!container) return;
    container.className = 'ig-moments';
    if (momentsData.length === 0) {
      container.innerHTML = `
        <div class="moments-empty-state" style="text-align:center;padding:60px 20px;color:#999;">
          <div style="font-size:48px;margin-bottom:16px;opacity:0.5;">📝</div>
          <div style="font-size:16px;margin-bottom:8px;">还没有朋友圈动态</div>
          <div style="font-size:13px;color:#ccc;">点击右下角 + 按钮发布第一条</div>
        </div>
      `;
      return;
    }

    container.innerHTML = momentsData.map(m => renderMomentCard(m)).join('');
    bindCommentEvents();
  }

  // ========== 渲染单条朋友圈 ==========
  function renderMomentCard(m) {
    const isMe = m.publisher === userConfig.name;
    const timeStr = formatTime(m.time);

    // 内容渲染
    let contentHtml = '';

    // 文本内容
    if (m.content) {
      contentHtml += `<div class="moment-text">${escapeHtml(m.content)}</div>`;
    }

    // 拼字卡
    if (m.type === 'card' && m.cardImage) {
      contentHtml += `
        <div style="margin-top:8px;border-radius:12px;overflow:hidden;max-width:400px;">
          <img src="${m.cardImage}" style="width:100%;height:auto;display:block;border-radius:12px;" loading="lazy">
          ${m.cards ? `<div style="font-size:11px;color:var(--text-secondary);margin-top:4px;text-align:center;">📝 ${m.cards.join(' · ')}</div>` : ''}
        </div>
      `;
    }

    // 链接预览
    if (m.type === 'link' && m.linkData) {
      const ld = m.linkData;
      contentHtml += `
        <div style="margin-top:8px;border:1px solid var(--border-color);border-radius:12px;overflow:hidden;cursor:pointer;" onclick="window.open('${escapeHtml(ld.url)}','_blank')">
          <div style="padding:12px 14px;display:flex;align-items:center;gap:10px;">
            <span style="font-size:24px;">${ld.icon || '🔗'}</span>
            <div style="flex:1;min-width:0;">
              <div style="font-size:14px;font-weight:600;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(ld.title || ld.url)}</div>
              <div style="font-size:11px;color:var(--text-secondary);">${escapeHtml(ld.name || '网页链接')} · ${escapeHtml(ld.desc || '')}</div>
            </div>
            <span style="font-size:12px;color:var(--text-secondary);">👉</span>
          </div>
        </div>
      `;
    }

    // 表情包
    if (m.type === 'sticker' && m.sticker) {
      contentHtml += `
        <div style="margin-top:8px;max-width:150px;border-radius:8px;overflow:hidden;">
          <img src="${m.sticker}" style="width:100%;height:auto;display:block;border-radius:8px;" loading="lazy">
        </div>
      `;
    }

    // 评论渲染（楼中楼）
    let commentsHtml = '';
    if (m.comments.length > 0) {
      commentsHtml = `
        <div class="interaction-area" style="margin-top:8px;">
          <div class="interaction-bubble" style="background:var(--secondary-bg);border-radius:10px;padding:8px 12px;">
            ${renderCommentsTree(m.comments)}
          </div>
        </div>
      `;
    }

    // 点赞
    const likeNames = m.likes.join('、');
    const likesHtml = m.likes.length > 0 ? `
      <div style="padding:4px 0;display:flex;align-items:center;gap:4px;font-size:12px;color:var(--text-secondary);">
        <span style="color:var(--accent-color);">❤️</span>
        <span>${likeNames}</span>
      </div>
    ` : '';

    const likedClass = m.likes.includes(userConfig.name) ? 'liked' : '';

    return `
      <div class="moment-card" data-moment-id="${m.id}">
        <div class="moment-header">
          <img class="moment-avatar" src="${m.publisherAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}" alt="${escapeHtml(m.publisher)}">
          <div class="moment-meta">
            <div class="moment-nickname" style="color:${isMe ? 'var(--accent-color)' : '#576b95'};">${escapeHtml(m.publisher)} ${isMe ? '📌' : ''}</div>
            <div class="moment-time">${timeStr}</div>
          </div>
        </div>
        <div class="moment-content" style="padding-left:52px;">
          ${contentHtml}
        </div>
        <div style="padding-left:52px;margin-top:6px;">
          ${likesHtml}
          <div class="moment-actions" style="display:flex;gap:12px;padding:4px 0;">
            <button class="action-btn ${likedClass}" onclick="toggleLike('${m.id}')" style="background:none;border:none;cursor:pointer;font-size:14px;display:flex;align-items:center;gap:4px;color:var(--text-secondary);">
              <span>❤️</span> <span>${m.likes.length}</span>
            </button>
            <button class="action-btn" onclick="openCommentInput('${m.id}')" style="background:none;border:none;cursor:pointer;font-size:14px;display:flex;align-items:center;gap:4px;color:var(--text-secondary);">
              <span>💬</span> <span>${m.comments.length}</span>
            </button>
            <button class="action-btn" onclick="collectMoment('${m.id}')" style="background:none;border:none;cursor:pointer;font-size:14px;color:${m.collected ? '#f59e0b' : 'var(--text-secondary)'};">
              ${m.collected ? '⭐' : '☆'}
            </button>
          </div>
          ${commentsHtml}
        </div>
      </div>
    `;
  }

  // ========== 递归渲染评论树（楼中楼） ==========
  function renderCommentsTree(comments, depth = 0) {
    if (!comments || comments.length === 0) return '';

    const maxDepth = 3;
    const indent = depth > 0 ? 'padding-left:16px;border-left:2px solid var(--border-color);' : '';

    return comments.map(c => {
      const replyCount = c.replies ? c.replies.length : 0;
      const repliesHtml = c.replies && c.replies.length > 0
        ? renderCommentsTree(c.replies, depth + 1)
        : '';

      return `
        <div class="comment-item" style="${indent}padding:4px 0;${depth > 0 ? 'margin-top:4px;' : ''}">
          <div style="display:flex;align-items:flex-start;gap:6px;">
            <img src="${c.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}" style="width:24px;height:24px;border-radius:50%;object-fit:cover;flex-shrink:0;">
            <div style="flex:1;min-width:0;">
              <span class="comment-name" style="font-weight:600;color:${c.name === userConfig.name ? 'var(--accent-color)' : '#576b95'};font-size:12px;">${escapeHtml(c.name)}</span>
              <span class="comment-text" style="font-size:13px;color:var(--text-primary);">${escapeHtml(c.text)}</span>
              <div style="font-size:10px;color:var(--text-secondary);margin-top:2px;">
                ${formatTime(c.time)}
                <button onclick="openReplyInput('${c.id}')" style="background:none;border:none;color:var(--accent-color);font-size:10px;cursor:pointer;padding:0 4px;">回复</button>
                ${replyCount > 0 ? `<span style="opacity:0.5;">· ${replyCount}条回复</span>` : ''}
              </div>
              ${repliesHtml}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ========== 点赞 ==========
  function toggleLike(momentId) {
    const moment = momentsData.find(m => m.id === momentId);
    if (!moment) return;
    const name = userConfig.name;
    const idx = moment.likes.indexOf(name);
    if (idx >= 0) {
      moment.likes.splice(idx, 1);
    } else {
      moment.likes.push(name);
    }
    saveMoments();
    renderMoments();
  }

  // ========== 收藏 ==========
  function collectMoment(momentId) {
    const moment = momentsData.find(m => m.id === momentId);
    if (!moment) return;
    moment.collected = !moment.collected;
    saveMoments();
    renderMoments();
  }

  // ========== 评论输入 ==========
  let activeCommentMomentId = null;
  let activeReplyParentId = null;

  function openCommentInput(momentId) {
    activeCommentMomentId = momentId;
    activeReplyParentId = null;
    showCommentPopup('写评论...');
  }

  function openReplyInput(parentId) {
    activeReplyParentId = parentId;
    showCommentPopup('回复...');
  }

  function showCommentPopup(placeholder) {
    const container = document.getElementById('moments-container');
    if (!container) return;

    // 移除旧的评论输入
    const old = container.querySelector('.comment-popup');
    if (old) old.remove();

    const popup = document.createElement('div');
    popup.className = 'comment-popup';
    popup.style.cssText = `
      position:fixed;bottom:0;left:0;right:0;background:var(--secondary-bg);
      padding:12px 16px;z-index:999;border-top:1px solid var(--border-color);
      display:flex;gap:8px;align-items:center;
    `;
    popup.innerHTML = `
      <input type="text" id="comment-input-field" placeholder="${placeholder}" 
             style="flex:1;padding:10px 14px;border:1.5px solid var(--border-color);
                    border-radius:20px;font-size:14px;background:var(--primary-bg);
                    color:var(--text-primary);outline:none;font-family:var(--font-family);">
      <button onclick="submitComment()" style="padding:8px 18px;border:none;border-radius:20px;
              background:var(--accent-color);color:#fff;font-weight:600;cursor:pointer;">
        发送
      </button>
      <button onclick="closeCommentPopup()" style="padding:8px 12px;border:none;border-radius:20px;
              background:transparent;color:var(--text-secondary);cursor:pointer;">✕</button>
    `;
    container.appendChild(popup);

    const input = document.getElementById('comment-input-field');
    if (input) {
      input.focus();
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          submitComment();
        }
        if (e.key === 'Escape') {
          closeCommentPopup();
        }
      });
    }
  }

  function closeCommentPopup() {
    const popup = document.querySelector('.comment-popup');
    if (popup) popup.remove();
    activeCommentMomentId = null;
    activeReplyParentId = null;
  }

  function submitComment() {
    const input = document.getElementById('comment-input-field');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const momentId = activeCommentMomentId;
    const parentId = activeReplyParentId;

    if (momentId) {
      addComment(momentId, parentId, text, !!parentId);
    }

    closeCommentPopup();
  }

  // ========== 绑定评论事件（事件委托） ==========
  function bindCommentEvents() {
    const container = document.getElementById('momentsList');
    if (!container) return;

    // 移除旧绑定，使用事件委托
  }

  // ========== 发布面板 ==========
  function openPublishPanel() {
    const container = document.getElementById('moments-container');
    if (!container) return;

    // 移除旧面板
    const old = container.querySelector('.publish-panel');
    if (old) old.remove();

    const panel = document.createElement('div');
    panel.className = 'publish-panel';
    panel.style.cssText = `
      position:fixed;bottom:0;left:0;right:0;background:var(--secondary-bg);
      border-radius:20px 20px 0 0;z-index:1000;padding:20px 16px;
      box-shadow:0 -4px 20px rgba(0,0,0,0.1);max-height:70vh;overflow-y:auto;
    `;
    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <span style="font-size:16px;font-weight:600;">发布动态</span>
        <button onclick="closePublishPanel()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text-secondary);">✕</button>
      </div>
      <textarea id="publish-text-input" placeholder="这一刻的想法..." style="width:100%;min-height:80px;padding:12px;border:1.5px solid var(--border-color);border-radius:12px;font-size:14px;font-family:var(--font-family);background:var(--primary-bg);color:var(--text-primary);outline:none;resize:vertical;"></textarea>
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
        <button onclick="publishCardMoment()" style="padding:8px 16px;border:1px solid var(--border-color);border-radius:20px;background:var(--primary-bg);cursor:pointer;font-size:12px;display:flex;align-items:center;gap:4px;">
          🎴 拼字卡
        </button>
        <button onclick="publishStickerMoment()" style="padding:8px 16px;border:1px solid var(--border-color);border-radius:20px;background:var(--primary-bg);cursor:pointer;font-size:12px;display:flex;align-items:center;gap:4px;">
          🖼️ 表情包
        </button>
        <button onclick="publishLinkMoment()" style="padding:8px 16px;border:1px solid var(--border-color);border-radius:20px;background:var(--primary-bg);cursor:pointer;font-size:12px;display:flex;align-items:center;gap:4px;">
          🔗 链接
        </button>
        <button onclick="publishTextMoment()" style="padding:8px 16px;border:none;border-radius:20px;background:var(--accent-color);color:#fff;cursor:pointer;font-size:12px;font-weight:600;">
          📤 发布
        </button>
      </div>
      <div style="margin-top:8px;font-size:11px;color:var(--text-secondary);">
        💡 拼字卡从字卡库随机抽取，可自行编辑内容
      </div>
    `;

    container.appendChild(panel);

    // 聚焦
    setTimeout(() => {
      const input = document.getElementById('publish-text-input');
      if (input) input.focus();
    }, 100);
  }

  function closePublishPanel() {
    const panel = document.querySelector('.publish-panel');
    if (panel) panel.remove();
  }

  // ========== 发布各种类型 ==========
  function publishTextMoment() {
    const input = document.getElementById('publish-text-input');
    const text = input ? input.value.trim() : '';
    if (!text) {
      if (typeof showNotification === 'function') {
        showNotification('请输入内容', 'warning');
      }
      return;
    }
    publishMoment(text, 'text');
    closePublishPanel();
    if (typeof showNotification === 'function') {
      showNotification('✅ 已发布', 'success');
    }
  }

  function publishCardMoment() {
    const input = document.getElementById('publish-text-input');
    const userText = input ? input.value.trim() : '';

    // 从字卡库获取
    const pool = getCardPool();
    const count = Math.floor(Math.random() * 3) + 1;
    let cards = [];

    if (userText) {
      // 如果用户输入了文字，用用户的文字
      cards = userText.split(/[，,、\n]/).filter(s => s.trim());
      if (cards.length === 0) cards = [userText];
    } else {
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      cards = shuffled.slice(0, count);
      if (cards.length === 0) cards = ['今天天气真好', '想和你一起'];
    }

    // 限制最多5张
    if (cards.length > 5) cards = cards.slice(0, 5);

    renderCardToImage(cards, (imageData) => {
      publishMoment(userText || cards.join(' · '), 'card', {
        cards: cards,
        image: imageData
      });
      closePublishPanel();
      if (typeof showNotification === 'function') {
        showNotification('🎴 拼字卡已发布', 'success');
      }
    });
  }

  function publishStickerMoment() {
    const pool = getStickerPool();
    if (pool.length === 0) {
      if (typeof showNotification === 'function') {
        showNotification('没有表情包，请先添加', 'warning');
      }
      return;
    }

    const sticker = pool[Math.floor(Math.random() * pool.length)];
    const input = document.getElementById('publish-text-input');
    const text = input ? input.value.trim() : '';

    publishMoment(text || '✨ 分享一个表情', 'sticker', sticker);
    closePublishPanel();
    if (typeof showNotification === 'function') {
      showNotification('🖼️ 表情已发布', 'success');
    }
  }

  function publishLinkMoment() {
    const input = document.getElementById('publish-text-input');
    const text = input ? input.value.trim() : '';

    // 检测是否包含链接
    const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
    if (!urlMatch) {
      if (typeof showNotification === 'function') {
        showNotification('请粘贴链接', 'warning');
      }
      return;
    }

    const url = urlMatch[1];
    fetchLinkPreview(url).then(linkData => {
      const content = text.replace(url, '').trim() || linkData.title;
      publishMoment(content, 'link', linkData);
      closePublishPanel();
      if (typeof showNotification === 'function') {
        showNotification('🔗 链接已分享', 'success');
      }
    });
  }

  // ========== 工具函数 ==========
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ========== 初始化 ==========
  async function init() {
    await syncAvatarFromHome();
    renderMoments();

    // 深色模式
    const container = document.getElementById('moments-container');
    if (container) {
      const savedBg = localStorage.getItem('home_card_bg');
      const isDark = savedBg === 'night';
      container.classList.toggle('dark-mode', isDark);
    }
  }

  // ========== 对外暴露 ==========
  window.MomentsApp = {
    init: init,
    render: renderMoments,
    openPublishPanel: openPublishPanel,
    closePublishPanel: closePublishPanel,
    publishTextMoment: publishTextMoment,
    publishCardMoment: publishCardMoment,
    publishStickerMoment: publishStickerMoment,
    publishLinkMoment: publishLinkMoment,
    toggleLike: toggleLike,
    collectMoment: collectMoment,
    openCommentInput: openCommentInput,
    openReplyInput: openReplyInput,
    submitComment: submitComment,
    closeCommentPopup: closeCommentPopup,
    addComment: addComment,
    getData: () => momentsData,
    syncAvatarFromHome: syncAvatarFromHome
  };

  // 监听Home页更新
  window.addEventListener('homeGlobalUpdated', function(e) {
    const key = e.detail.key;
    if (key === 'home_avatar_me' || key === 'profile_me') {
      syncAvatarFromHome().then(() => {
        renderMoments();
      });
    }
  });

})();