/* VLI PC input bridge — keep the original bottom tabs usable while PC V24 is mounted. */
(() => {
  'use strict';
  if (window.VLI_PC_INPUT_FIX) return;
  window.VLI_PC_INPUT_FIX = true;

  const TAB_MAP = {
    char: 'character',
    inv: 'inventory',
    skill: 'skills',
    quest: 'quests',
    forge: 'forge',
    more: 'system'
  };

  function bind() {
    const api = window.VLI_PC_UI_V24_INTEGRATION;
    if (!api || typeof api.openPanel !== 'function') {
      setTimeout(bind, 100);
      return;
    }

    document.querySelectorAll('#tabs button[data-t]').forEach(btn => {
      if (btn.dataset.pcInputFix) return;
      const panel = TAB_MAP[btn.dataset.t];
      if (!panel) return;
      btn.dataset.pcInputFix = '1';
      btn.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        api.openPanel(panel);
      }, true);
    });

    const team = document.getElementById('tabRide');
    if (team && !team.dataset.pcInputFix) {
      team.dataset.pcInputFix = '1';
      team.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        api.openPanel('team');
      }, true);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, {once: true});
  } else {
    bind();
  }
})();
