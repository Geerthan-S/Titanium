import { escapeHtml, formatDate, statusClass } from './admin-utils.js';

function valueFor(record, column) {
  const value = typeof column.value === 'function' ? column.value(record) : record[column.key];
  return value ?? '—';
}

export function createAdminTable(container, {
  records = [],
  columns = [],
  filters = [],
  actions = [],
  pageSize = 8,
  emptyMessage = 'No records match the current filters.',
} = {}) {
  const state = { query: '', filters: {}, sortKey: columns[0]?.key, sortDirection: 'asc', page: 1, records };

  const filteredRecords = () => {
    const query = state.query.toLowerCase();
    const result = state.records.filter((record) => {
      const matchesQuery = !query || Object.values(record).some((value) => String(value ?? '').toLowerCase().includes(query));
      const matchesFilters = Object.entries(state.filters).every(([key, value]) => !value || String(record[key] ?? '') === value);
      return matchesQuery && matchesFilters;
    });
    const column = columns.find(({ key }) => key === state.sortKey);
    return result.sort((a, b) => String(valueFor(a, column) ?? '').localeCompare(String(valueFor(b, column) ?? ''), undefined, { numeric: true }) * (state.sortDirection === 'asc' ? 1 : -1));
  };

  const renderCell = (record, column) => {
    const value = valueFor(record, column);
    if (column.render) return column.render(value, record);
    if (column.type === 'status') return `<span class="${statusClass(value)}">${escapeHtml(value)}</span>`;
    if (column.type === 'date') return escapeHtml(formatDate(value));
    return escapeHtml(value);
  };

  const render = () => {
    const filtered = filteredRecords();
    const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
    state.page = Math.min(state.page, pages);
    const visible = filtered.slice((state.page - 1) * pageSize, state.page * pageSize);
    container.innerHTML = `
      <div class="admin-table-tools">
        <label class="admin-search-field"><i data-lucide="search" aria-hidden="true"></i><span class="visually-hidden">Search records</span><input type="search" placeholder="Search records…" value="${escapeHtml(state.query)}" data-table-search></label>
        <div class="admin-table-filters">${filters.map((filter) => `<label><span class="visually-hidden">${escapeHtml(filter.label)}</span><select data-table-filter="${filter.key}"><option value="">All ${escapeHtml(filter.label)}</option>${filter.options.map((option) => `<option${state.filters[filter.key] === option ? ' selected' : ''}>${escapeHtml(option)}</option>`).join('')}</select></label>`).join('')}</div>
      </div>
      <div class="admin-table-frame">
        ${visible.length ? `<table><thead><tr>${columns.map((column) => `<th scope="col"><button type="button" data-table-sort="${column.key}">${escapeHtml(column.label)}${state.sortKey === column.key ? `<span aria-hidden="true">${state.sortDirection === 'asc' ? '↑' : '↓'}</span>` : ''}</button></th>`).join('')}<th scope="col"><span class="visually-hidden">Actions</span></th></tr></thead><tbody>${visible.map((record) => `<tr>${columns.map((column) => `<td data-label="${escapeHtml(column.label)}">${renderCell(record, column)}</td>`).join('')}<td class="admin-row-actions">${actions.map((action) => `<button type="button" class="${action.danger ? 'is-danger' : ''}" data-row-action="${action.key}" data-record-id="${record.id}" title="${escapeHtml(action.label)}"><i data-lucide="${action.icon || 'ellipsis'}" aria-hidden="true"></i><span>${escapeHtml(action.label)}</span></button>`).join('')}</td></tr>`).join('')}</tbody></table>` : `<div class="admin-empty-state"><i data-lucide="inbox" aria-hidden="true"></i><h3>No records found</h3><p>${escapeHtml(emptyMessage)}</p></div>`}
      </div>
      <div class="admin-pagination"><p>Showing ${visible.length} of ${filtered.length} records</p><div><button type="button" data-page-change="-1" ${state.page === 1 ? 'disabled' : ''}>Previous</button><span>Page ${state.page} of ${pages}</span><button type="button" data-page-change="1" ${state.page === pages ? 'disabled' : ''}>Next</button></div></div>`;
    container.dispatchEvent(new CustomEvent('admin-table:rendered'));
  };

  container.addEventListener('input', (event) => {
    if (event.target.matches('[data-table-search]')) { state.query = event.target.value; state.page = 1; render(); }
  });
  container.addEventListener('change', (event) => {
    const key = event.target.dataset.tableFilter;
    if (key) { state.filters[key] = event.target.value; state.page = 1; render(); }
  });
  container.addEventListener('click', (event) => {
    const sort = event.target.closest('[data-table-sort]');
    if (sort) {
      state.sortDirection = state.sortKey === sort.dataset.tableSort && state.sortDirection === 'asc' ? 'desc' : 'asc';
      state.sortKey = sort.dataset.tableSort;
      render();
    }
    const page = event.target.closest('[data-page-change]');
    if (page) { state.page += Number(page.dataset.pageChange); render(); }
  });

  render();
  return {
    refresh(nextRecords) { state.records = nextRecords; render(); },
    state,
  };
}
