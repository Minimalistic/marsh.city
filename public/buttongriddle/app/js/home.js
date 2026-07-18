// Home screen: one big tile per board. Renders into the same #board grid
// container. Only ever shown when there are 2+ boards (or in edit mode) —
// a single-board setup opens straight to its board, picker fully absent.

export function renderHome(ctx) {
  const { config, editing, container } = ctx;
  container.textContent = '';
  container.oncontextmenu = (e) => e.preventDefault();
  container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(min(220px, 44vw), 1fr))';
  container.style.gridTemplateRows = '';
  // Bounded rows + top-packed: with one board, a 1fr tile filled the screen
  // and read as a giant speak button instead of a list entry.
  container.style.gridAutoRows = 'minmax(96px, 20vh)';
  container.style.alignContent = 'start';
  container.classList.add('picker');

  for (const board of config.boards) {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'tile text-only board-tile';
    if (board.color) tile.style.background = board.color;
    tile.setAttribute('aria-label', editing ? `Open ${board.name} to edit` : `Open ${board.name}`);

    const kicker = document.createElement('span');
    kicker.className = 'board-kicker';
    const count = board.buttons.length;
    kicker.textContent = `Board · ${count} button${count === 1 ? '' : 's'}`;
    tile.appendChild(kicker);

    const label = document.createElement('span');
    label.className = 'tile-label';
    label.textContent = board.name;
    tile.appendChild(label);

    if (editing) {
      const controls = document.createElement('span');
      controls.className = 'tile-controls';
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'hide-toggle';
      editBtn.textContent = 'Rename';
      editBtn.setAttribute('aria-label', `Board settings for ${board.name}`);
      editBtn.addEventListener('click', (e) => { e.stopPropagation(); ctx.onEditBoard(board); });
      controls.appendChild(editBtn);
      tile.appendChild(controls);
    }

    tile.addEventListener('click', (e) => {
      if (!e.target.closest('.tile-controls')) ctx.onOpen(board);
    });
    container.appendChild(tile);
  }

  if (editing) {
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'tile add-tile';
    add.textContent = '+';
    add.setAttribute('aria-label', 'Add board');
    add.addEventListener('click', () => ctx.onAddBoard());
    container.appendChild(add);
  }
}
