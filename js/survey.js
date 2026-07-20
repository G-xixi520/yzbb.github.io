/**
 * survey.js - 问卷调查
 * 双方可创建、回答、查看结果
 */

(function() {
    'use strict';

    const STORAGE_KEY = 'surveyData';

    // ========== 数据管理 ==========
    let surveys = [];

    function loadData() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            surveys = saved ? JSON.parse(saved) : [];
        } catch (e) {
            surveys = [];
        }
    }

    function saveData() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(surveys));
        } catch (e) {
            console.warn('[问卷调查] 保存失败:', e);
        }
    }

    loadData();

    // ========== 获取昵称 ==========
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

    // ========== 生成ID ==========
    function generateId() {
        return 'survey_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }

    // ========== 创建问卷 ==========
    function createSurvey(question, options, isMulti) {
        if (!question.trim()) {
            if (typeof showNotification === 'function') {
                showNotification('请输入问题', 'warning');
            }
            return false;
        }
        if (!options || options.length < 2) {
            if (typeof showNotification === 'function') {
                showNotification('请至少添加2个选项', 'warning');
            }
            return false;
        }

        const survey = {
            id: generateId(),
            question: question.trim(),
            options: options.map(text => ({
                id: 'opt_' + Math.random().toString(36).substr(2, 6),
                text: text.trim(),
                votes: []
            })),
            isMulti: isMulti || false,
            createdBy: getMyName(),
            createdAt: Date.now(),
            answeredBy: [] // 记录已答过的人
        };

        surveys.unshift(survey);
        saveData();
        renderSurveyList();
        if (typeof showNotification === 'function') {
            showNotification('✅ 问卷已发布', 'success');
        }
        return true;
    }

    // ========== 投票 ==========
    function vote(surveyId, optionIds) {
        const survey = surveys.find(s => s.id === surveyId);
        if (!survey) return;

        const voter = getMyName();
        // 检查是否已答过
        if (survey.answeredBy.includes(voter)) {
            if (typeof showNotification === 'function') {
                showNotification('你已经回答过了', 'warning');
            }
            return;
        }

        if (!Array.isArray(optionIds)) {
            optionIds = [optionIds];
        }

        // 单选检查
        if (!survey.isMulti && optionIds.length > 1) {
            if (typeof showNotification === 'function') {
                showNotification('这是单选题，只能选一个', 'warning');
            }
            return;
        }

        // 记录投票
        optionIds.forEach(optId => {
            const opt = survey.options.find(o => o.id === optId);
            if (opt && !opt.votes.includes(voter)) {
                opt.votes.push(voter);
            }
        });

        survey.answeredBy.push(voter);
        saveData();
        renderSurveyList();
        if (typeof showNotification === 'function') {
            showNotification('✅ 投票成功！', 'success');
        }
    }

    // ========== 删除问卷 ==========
    function deleteSurvey(surveyId) {
        if (!confirm('确定要删除这个问卷吗？')) return;
        surveys = surveys.filter(s => s.id !== surveyId);
        saveData();
        renderSurveyList();
        if (typeof showNotification === 'function') {
            showNotification('已删除', 'info');
        }
    }

    // ========== 渲染问卷列表 ==========
    function renderSurveyList() {
        const container = document.getElementById('survey-content');
        if (!container) return;

        loadData();

        if (surveys.length === 0) {
            container.innerHTML = `
                <div class="journal-empty">
                    <i class="fas fa-poll" style="font-size:36px;opacity:0.3;display:block;margin-bottom:12px;"></i>
                    还没有问卷，点击「创建问卷」开始
                </div>
            `;
            return;
        }

        const myName = getMyName();
        const partnerName = getPartnerName();

        container.innerHTML = surveys.map(survey => {
            const isAnswered = survey.answeredBy.includes(myName);
            const totalVotes = survey.options.reduce((sum, o) => sum + o.votes.length, 0);
            const createdByMe = survey.createdBy === myName;

            // 构建选项HTML
            let optionsHtml = survey.options.map(opt => {
                const isSelected = opt.votes.includes(myName);
                const count = opt.votes.length;
                const percent = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;

                if (isAnswered || createdByMe) {
                    // 显示结果
                    return `
                        <div class="opt" style="position:relative;padding:8px 12px;background:rgba(var(--accent-color-rgb),0.06);border-radius:8px;margin-bottom:4px;display:flex;justify-content:space-between;align-items:center;">
                            <span>${escapeHtml(opt.text)}</span>
                            <span style="font-size:11px;color:var(--text-secondary);">
                                ${count}票 (${percent}%)
                            </span>
                            <div style="position:absolute;left:0;top:0;height:100%;width:${percent}%;background:rgba(var(--accent-color-rgb),0.12);border-radius:8px;pointer-events:none;"></div>
                        </div>
                    `;
                } else {
                    // 可投票
                    const isChecked = isSelected;
                    return `
                        <label class="opt" style="display:flex;align-items:center;gap:8px;padding:6px 12px;border-radius:8px;cursor:pointer;border:1px solid ${isChecked ? 'var(--accent-color)' : 'var(--border-color)'};background:${isChecked ? 'rgba(var(--accent-color-rgb),0.08)' : 'transparent'};">
                            <input type="${survey.isMulti ? 'checkbox' : 'radio'}" 
                                   name="survey_${survey.id}" 
                                   value="${opt.id}"
                                   ${isChecked ? 'checked' : ''}
                                   style="accent-color:var(--accent-color);">
                            <span>${escapeHtml(opt.text)}</span>
                            <span style="font-size:10px;color:var(--text-secondary);margin-left:auto;">${opt.votes.length}票</span>
                        </label>
                    `;
                }
            }).join('');

            // 投票按钮（仅当未回答且不是创建者本人）
            let actionHtml = '';
            if (!isAnswered && !createdByMe) {
                const isMulti = survey.isMulti;
                actionHtml = `
                    <button class="modal-btn modal-btn-primary" onclick="submitVote('${survey.id}', ${isMulti})" style="width:100%;margin-top:8px;padding:8px;font-size:13px;">
                        <i class="fas fa-check"></i> 提交投票
                    </button>
                `;
            } else if (isAnswered) {
                actionHtml = `
                    <div style="font-size:11px;color:var(--text-secondary);text-align:center;margin-top:6px;">
                        <i class="fas fa-check-circle" style="color:var(--accent-color);"></i> 已投票
                    </div>
                `;
            } else if (createdByMe) {
                actionHtml = `
                    <div style="font-size:11px;color:var(--text-secondary);text-align:center;margin-top:6px;">
                        <i class="fas fa-user-edit" style="color:var(--accent-color);"></i> 你创建的
                        <button class="modal-btn modal-btn-secondary" onclick="deleteSurvey('${survey.id}')" style="font-size:10px;padding:2px 10px;margin-left:6px;color:#ff6b6b;">删除</button>
                    </div>
                `;
            }

            const time = new Date(survey.createdAt);
            const timeStr = time.toLocaleString('zh-CN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const typeLabel = survey.isMulti ? '多选' : '单选';

            return `
                <div class="survey-item">
                    <div class="question">${escapeHtml(survey.question)}</div>
                    <div class="meta">
                        <span>📝 ${escapeHtml(survey.createdBy)}</span>
                        <span>· ${typeLabel}</span>
                        <span>· ${timeStr}</span>
                        <span>· ${totalVotes}人参与</span>
                    </div>
                    <div class="options">
                        ${optionsHtml}
                    </div>
                    ${actionHtml}
                </div>
            `;
        }).join('');
    }

    // ========== 提交投票 ==========
    window.submitVote = function(surveyId, isMulti) {
        const survey = surveys.find(s => s.id === surveyId);
        if (!survey) return;

        const container = document.getElementById('survey-content');
        const inputs = container.querySelectorAll(`input[name="survey_${surveyId}"]:checked`);
        const selectedIds = Array.from(inputs).map(input => input.value);

        if (selectedIds.length === 0) {
            if (typeof showNotification === 'function') {
                showNotification('请至少选择一个选项', 'warning');
            }
            return;
        }

        vote(surveyId, selectedIds);
    };

    // ========== 打开创建问卷弹窗 ==========
    function openCreateSurveyModal() {
        const container = document.getElementById('survey-content');
        if (!container) return;

        container.innerHTML = `
            <div style="background:var(--secondary-bg);border-radius:12px;padding:16px;border:1px solid var(--border-color);">
                <div style="font-size:14px;font-weight:600;color:var(--text-primary);margin-bottom:12px;">
                    📝 创建问卷
                </div>
                <div style="margin-bottom:12px;">
                    <label style="font-size:12px;color:var(--text-secondary);display:block;margin-bottom:4px;">问题</label>
                    <input type="text" id="survey-question-input" placeholder="输入问题..." style="width:100%;padding:10px 12px;border:1.5px solid var(--border-color);border-radius:10px;font-size:14px;background:var(--primary-bg);color:var(--text-primary);outline:none;font-family:var(--font-family);">
                </div>
                <div style="margin-bottom:12px;">
                    <label style="font-size:12px;color:var(--text-secondary);display:block;margin-bottom:4px;">选项（至少2个）</label>
                    <div id="survey-options-container">
                        <div class="survey-option-row" style="display:flex;gap:6px;margin-bottom:6px;">
                            <input type="text" class="survey-option-input" placeholder="选项1" style="flex:1;padding:8px 10px;border:1.5px solid var(--border-color);border-radius:8px;font-size:13px;background:var(--primary-bg);color:var(--text-primary);outline:none;font-family:var(--font-family);">
                            <button class="modal-btn modal-btn-secondary" onclick="removeSurveyOption(this)" style="font-size:11px;padding:4px 8px;">✕</button>
                        </div>
                        <div class="survey-option-row" style="display:flex;gap:6px;margin-bottom:6px;">
                            <input type="text" class="survey-option-input" placeholder="选项2" style="flex:1;padding:8px 10px;border:1.5px solid var(--border-color);border-radius:8px;font-size:13px;background:var(--primary-bg);color:var(--text-primary);outline:none;font-family:var(--font-family);">
                            <button class="modal-btn modal-btn-secondary" onclick="removeSurveyOption(this)" style="font-size:11px;padding:4px 8px;">✕</button>
                        </div>
                    </div>
                    <button class="modal-btn modal-btn-secondary" onclick="addSurveyOption()" style="font-size:12px;padding:4px 12px;margin-top:4px;">
                        <i class="fas fa-plus"></i> 添加选项
                    </button>
                </div>
                <div style="margin-bottom:12px;display:flex;align-items:center;gap:8px;">
                    <label style="font-size:12px;color:var(--text-secondary);">允许</label>
                    <label style="display:flex;align-items:center;gap:4px;font-size:13px;cursor:pointer;">
                        <input type="radio" name="survey-multi" value="false" checked style="accent-color:var(--accent-color);">
                        单选
                    </label>
                    <label style="display:flex;align-items:center;gap:4px;font-size:13px;cursor:pointer;">
                        <input type="radio" name="survey-multi" value="true" style="accent-color:var(--accent-color);">
                        多选
                    </label>
                </div>
                <div style="display:flex;gap:8px;">
                    <button class="modal-btn modal-btn-secondary" onclick="cancelCreateSurvey()" style="flex:1;padding:10px;font-size:13px;">取消</button>
                    <button class="modal-btn modal-btn-primary" onclick="confirmCreateSurvey()" style="flex:2;padding:10px;font-size:13px;">
                        <i class="fas fa-paper-plane"></i> 发布问卷
                    </button>
                </div>
            </div>
        `;
    }

    // ========== 添加/删除选项 ==========
    window.addSurveyOption = function() {
        const container = document.getElementById('survey-options-container');
        if (!container) return;
        const count = container.querySelectorAll('.survey-option-row').length + 1;
        const row = document.createElement('div');
        row.className = 'survey-option-row';
        row.style.cssText = 'display:flex;gap:6px;margin-bottom:6px;';
        row.innerHTML = `
            <input type="text" class="survey-option-input" placeholder="选项${count}" style="flex:1;padding:8px 10px;border:1.5px solid var(--border-color);border-radius:8px;font-size:13px;background:var(--primary-bg);color:var(--text-primary);outline:none;font-family:var(--font-family);">
            <button class="modal-btn modal-btn-secondary" onclick="removeSurveyOption(this)" style="font-size:11px;padding:4px 8px;">✕</button>
        `;
        container.appendChild(row);
    };

    window.removeSurveyOption = function(btn) {
        const container = document.getElementById('survey-options-container');
        if (!container) return;
        const rows = container.querySelectorAll('.survey-option-row');
        if (rows.length <= 2) {
            if (typeof showNotification === 'function') {
                showNotification('至少保留2个选项', 'warning');
            }
            return;
        }
        btn.closest('.survey-option-row').remove();
    };

    window.cancelCreateSurvey = function() {
        renderSurveyList();
    };

    window.confirmCreateSurvey = function() {
        const questionInput = document.getElementById('survey-question-input');
        const optionInputs = document.querySelectorAll('.survey-option-input');
        const multiRadio = document.querySelector('input[name="survey-multi"]:checked');

        const question = questionInput ? questionInput.value.trim() : '';
        const options = Array.from(optionInputs).map(inp => inp.value.trim()).filter(v => v);
        const isMulti = multiRadio ? multiRadio.value === 'true' : false;

        if (createSurvey(question, options, isMulti)) {
            // 清空输入
            if (questionInput) questionInput.value = '';
            optionInputs.forEach(inp => inp.value = '');
        }
    };

    // ========== 工具函数 ==========
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ========== 绑定事件 ==========
    document.addEventListener('click', function(e) {
        const target = e.target.closest('#survey-create-btn');
        if (target) {
            openCreateSurveyModal();
        }
    });

    document.addEventListener('click', function(e) {
        const target = e.target.closest('#survey-list-btn');
        if (target) {
            renderSurveyList();
        }
    });

    document.addEventListener('click', function(e) {
        const target = e.target.closest('#close-survey');
        if (target) {
            const modal = document.getElementById('survey-modal');
            if (modal && typeof hideModal === 'function') {
                hideModal(modal);
            } else if (modal) {
                modal.style.display = 'none';
            }
        }
    });

    // 高级功能中打开
    document.addEventListener('click', function(e) {
        const target = e.target.closest('#survey-function');
        if (target) {
            const modal = document.getElementById('survey-modal');
            if (modal && typeof showModal === 'function') {
                showModal(modal);
                setTimeout(renderSurveyList, 100);
            } else if (modal) {
                modal.style.display = 'flex';
                setTimeout(renderSurveyList, 100);
            }
        }
    });

    // ========== 暴露API ==========
    window.SurveyApp = {
        loadData: loadData,
        saveData: saveData,
        createSurvey: createSurvey,
        vote: vote,
        deleteSurvey: deleteSurvey,
        render: renderSurveyList,
        getData: () => surveys
    };

    // ========== 模拟梦角创建问卷 ==========
    function partnerAutoCreateSurvey() {
        // 20%概率
        if (Math.random() > 0.2) return;

        const questions = [
            '你最喜欢的季节是？',
            '周末最想做的事情是？',
            '你觉得最浪漫的事是什么？',
            '我们第一次见面你是什么感觉？',
            '你更喜欢猫还是狗？'
        ];
        const optionSets = [
            ['春天', '夏天', '秋天', '冬天'],
            ['一起旅行', '宅在家里', '看电影', '吃大餐'],
            ['看日出日落', '雨中漫步', '一起做饭', '写情书'],
            ['紧张又期待', '像老朋友', '心跳加速', '很自然'],
            ['猫🐱', '狗🐕', '都喜欢', '都不喜欢']
        ];

        const idx = Math.floor(Math.random() * questions.length);
        const question = questions[idx];
        const options = optionSets[idx] || ['选项A', '选项B', '选项C'];

        const survey = {
            id: generateId(),
            question: question,
            options: options.map(text => ({
                id: 'opt_' + Math.random().toString(36).substr(2, 6),
                text: text,
                votes: []
            })),
            isMulti: false,
            createdBy: getPartnerName(),
            createdAt: Date.now(),
            answeredBy: []
        };

        surveys.unshift(survey);
        saveData();

        // 如果弹窗打开，刷新
        const modal = document.getElementById('survey-modal');
        if (modal && modal.style.display !== 'none') {
            renderSurveyList();
        }

        if (typeof showNotification === 'function') {
            showNotification(`💕 ${getPartnerName()} 发布了新问卷`, 'info', 3000);
        }
    }

    // 每2小时检查一次
    setInterval(() => {
        partnerAutoCreateSurvey();
    }, 2 * 60 * 60 * 1000);

    // 首次加载延迟触发
    setTimeout(partnerAutoCreateSurvey, 8000);

})();