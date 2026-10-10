(() => {
  function install() {
    for (const wrapper of document.querySelectorAll('[data-hp-native-resource]')) {
      const root = wrapper.querySelector('.native-table');
      if (!root || root.dataset.hpReady) continue;
      root.dataset.hpReady = 'true';
      const table = root.querySelector('.native-table-scroll');
      const read = root.querySelector('.native-table-read');
      const rows = [...root.querySelectorAll('tbody tr')];
      const readRows = [...root.querySelectorAll('.read-row')];
      const search = root.querySelector('input[type=search]');
      const status = root.querySelector('[role=status]');
      const empty = root.querySelector('.empty-state');
      const buttons = [...root.querySelectorAll('[data-view]')];
      const expand = root.querySelector('[data-expand]');
      let userView = false;
      function setView(value) {
        table.hidden = value !== 'compare';
        read.hidden = value !== 'read';
        buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === value)));
      }
      buttons.forEach(button => button.addEventListener('click', () => {
        userView = true; setView(button.dataset.view);
      }));
      const terms = rows.map(row => row.textContent.toLocaleLowerCase());
      function filter() {
        const query = search.value.trim().toLocaleLowerCase(); let count = 0;
        terms.forEach((text, i) => {
          const match = !query || text.includes(query);
          rows[i].hidden = !match; readRows[i].hidden = !match;
          if (match) count++;
        });
        status.textContent = query ? `${count} of ${rows.length} patterns` : `${rows.length} patterns`;
        empty.hidden = count !== 0;
      }
      search.addEventListener('input', filter);
      root.querySelector('[data-clear]').addEventListener('click', () => {
        search.value = ''; filter(); search.focus();
      });
      const dialog = document.createElement('dialog');
      dialog.className = 'hp-native-resource';
      dialog.setAttribute('aria-label', 'Expanded Length Limit table');
      const top = document.createElement('div'); top.className = 'focus-top';
      const label = document.createElement('span'); label.textContent = 'Hidden Patterns · Length Limit';
      const close = document.createElement('button'); close.type = 'button'; close.textContent = 'Close ×';
      top.append(label, close); dialog.append(top);
      let marker;
      function restore() { if (marker?.parentNode) marker.replaceWith(root); }
      expand.addEventListener('click', () => {
        marker = document.createComment('native table position');
        root.before(marker); dialog.append(root); document.body.append(dialog);
        dialog.showModal(); close.focus();
      });
      close.addEventListener('click', () => dialog.close());
      dialog.addEventListener('close', () => { restore(); dialog.remove(); expand.focus(); });
      window.addEventListener('beforeprint', () => {
        if (dialog.open) { dialog.close(); restore(); }
      });
      function adapt() {
        if (!userView && !dialog.open) setView(wrapper.getBoundingClientRect().width <= 700 ? 'read' : 'compare');
      }
      root.querySelector('.table-tools').hidden = false;
      if (typeof dialog.showModal !== 'function') expand.hidden = true;
      adapt();
      if ('ResizeObserver' in window) new ResizeObserver(adapt).observe(wrapper);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
