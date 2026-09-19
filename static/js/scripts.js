/*
 * @Author: Chenyu Zhao
 * @Date: 2026-01-15 22:42:47
 * @LastEditors: Chenyu Zhao zhaochenyu@icn.ist.hokudai.ac.jp
 * @LastEditTime: 2026-04-17 13:09:28
 * @FilePath: /git_repo/yukipage/static/js/scripts.js
 * @Description: 
 * 
 * Copyright (c) 2026 by Hokkaido Univ., IST, ICN Lab/Chenyu Zhao, All Rights Reserved.
 */
const content_dir = 'contents/';
const section_names = ['home', 'education', 'experience', 'skills', 'awards', 'publications'];
const language_key = 'yukipage-language';

window.addEventListener('DOMContentLoaded', () => {
    const mainNav = document.body.querySelector('#mainNav');
    const navbarToggler = document.body.querySelector('.navbar-toggler');
    const navbarCollapse = document.getElementById('navbarResponsive');

    function updateNavigationOffset() {
        const offset = Math.ceil(mainNav.getBoundingClientRect().height);
        document.documentElement.style.setProperty('--navigation-offset', `${offset}px`);
        return offset;
    }

    const scrollSpy = new bootstrap.ScrollSpy(document.body, {
        target: mainNav,
        offset: updateNavigationOffset(),
    });
    window.addEventListener('resize', () => {
        if (!navbarCollapse.classList.contains('show')) updateNavigationOffset();
    });
    navbarCollapse.addEventListener('hidden.bs.collapse', updateNavigationOffset);

    document.querySelectorAll('#navbarResponsive .nav-link').forEach(link => {
        link.addEventListener('click', event => {
            const hash = link.getAttribute('href');
            const target = hash?.startsWith('#') ? document.getElementById(hash.slice(1)) : null;
            if (!target) return;

            event.preventDefault();
            const scrollToTarget = () => {
                requestAnimationFrame(() => {
                    const targetTop = window.scrollY + target.getBoundingClientRect().top;
                    window.scrollTo({ top: Math.max(0, targetTop - updateNavigationOffset()) });
                    if (window.location.hash !== hash) window.history.pushState(null, '', hash);
                });
            };

            if (window.getComputedStyle(navbarToggler).display !== 'none'
                && navbarCollapse.classList.contains('show')) {
                navbarCollapse.addEventListener('hidden.bs.collapse', scrollToTarget, { once: true });
                bootstrap.Collapse.getOrCreateInstance(navbarCollapse, { toggle: false }).hide();
            } else {
                scrollToTarget();
            }
        });
    });

    marked.use({ mangle: false, headerIds: false });
    const buttons = document.querySelectorAll('[data-language]');
    const status = document.getElementById('content-status');
    const cache = new Map();
    let requestId = 0;
    let activeLanguage;
    let renderQueue = Promise.resolve();

    function loadText(path) {
        if (!cache.has(path)) {
            cache.set(path, fetch(path).then(response => {
                if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
                return response.text();
            }).catch(error => {
                cache.delete(path);
                throw error;
            }));
        }
        return cache.get(path);
    }

    async function switchLanguage(language) {
        const currentRequest = ++requestId;
        status.hidden = false;
        status.lang = language === 'zh' ? 'zh-CN' : 'en';
        status.textContent = language === 'zh' ? '正在加载…' : 'Loading…';
        document.getElementById('main-content').setAttribute('aria-busy', 'true');

        try {
            // Load the entire language before replacing content, so languages never mix.
            const [configText, ...markdown] = await Promise.all([
                loadText(`${content_dir}${language}/config.yml`),
                ...section_names.map(name => loadText(`${content_dir}${language}/${name}.md`)),
            ]);
            const config = jsyaml.load(configText);
            const html = markdown.map(content => marked.parse(content));
            // Serialize DOM replacement with MathJax, including rapid language changes.
            renderQueue = renderQueue.then(async () => {
                if (currentRequest !== requestId) return;
                const math = window.MathJax;
                if (math?.startup?.promise) await math.startup.promise.catch(console.error);
                if (currentRequest !== requestId) return;
                const containers = section_names.map(name => document.getElementById(`${name}-md`));
                if (math?.typesetClear) math.typesetClear(containers);
                containers.forEach((container, index) => { container.innerHTML = html[index]; });
                document.querySelectorAll('[data-i18n]').forEach(element => {
                    element.textContent = config[element.dataset.i18n];
                });
                document.getElementById('language-switch').setAttribute('aria-label', config['language-label']);
                navbarToggler.setAttribute('aria-label', config['navigation-label']);
                document.querySelector('#avatar img').alt = config['photo-label'];
                document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
                buttons.forEach(button => {
                    button.setAttribute('aria-pressed', String(button.dataset.language === language));
                });
                activeLanguage = language;
                try { localStorage.setItem(language_key, language); } catch { /* Storage may be disabled. */ }
                status.hidden = true;
                document.getElementById('main-content').setAttribute('aria-busy', 'false');
                scrollSpy.refresh();
                if (math?.typesetPromise) {
                    try { await math.typesetPromise(containers); } catch (error) { console.error(error); }
                }
                scrollSpy.refresh();
            });
            await renderQueue;
        } catch (error) {
            renderQueue = Promise.resolve();
            if (currentRequest !== requestId) return;
            console.error(error);
            const messageLanguage = activeLanguage || language;
            status.lang = messageLanguage === 'zh' ? 'zh-CN' : 'en';
            status.textContent = messageLanguage === 'zh'
                ? '内容加载失败，请重新选择语言以重试。'
                : 'Content could not be loaded. Select a language to retry.';
            status.hidden = false;
            document.getElementById('main-content').setAttribute('aria-busy', 'false');
        }
    }

    buttons.forEach(button => {
        button.addEventListener('click', () => switchLanguage(button.dataset.language));
    });
    let preferredLanguage;
    try { preferredLanguage = localStorage.getItem(language_key); } catch { /* Use browser language. */ }
    if (!['zh', 'en'].includes(preferredLanguage)) {
        preferredLanguage = (navigator.languages?.[0] || navigator.language || 'en')
            .toLowerCase().startsWith('zh') ? 'zh' : 'en';
    }
    switchLanguage(preferredLanguage);
});
