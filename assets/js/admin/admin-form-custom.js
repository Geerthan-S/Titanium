/**
 * admin-form-custom.js
 * Custom structured controls for the Treatment CMS form.
 * Each control writes its state to a hidden <input> as JSON.
 */

import { publicMediaUrl } from '../data/media-repository.js';

const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ─── Utility: sync hidden input ───────────────────────────────────────────────
function sync(container, name, value) {
  let hidden = container.querySelector(`input[type="hidden"][data-custom-field="${name}"]`);
  if (!hidden) {
    hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = name;
    hidden.dataset.customField = name;
    container.appendChild(hidden);
  }
  hidden.value = JSON.stringify(value);
}

function fireChange(container) {
  container.dispatchEvent(new Event('change', { bubbles: true }));
}

// ─── Chip List ─────────────────────────────────────────────────────────────────
// Used for: conditionsTreated, alternativeNames, secondarySearchPhrases
export function initChipList(container, { name, values = [], placeholder = 'Add item…' }) {
  let items = [...values];
  const render = () => {
    container.innerHTML = `
      <div class="chip-list" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;">
        ${items.map((v, i) => `<span class="chip" style="display:flex;align-items:center;gap:4px;background:var(--admin-emerald-50,#f0fdf4);border:1px solid var(--admin-emerald-200,#a7f3d0);border-radius:20px;padding:2px 10px 2px 12px;font-size:0.8rem;">
          ${esc(v)}<button type="button" data-rm="${i}" aria-label="Remove" style="background:none;border:none;cursor:pointer;color:var(--admin-muted);font-size:1rem;line-height:1;padding:0 0 0 4px;">&times;</button>
        </span>`).join('')}
      </div>
      <div style="display:flex;gap:8px;">
        <input type="text" data-chip-input placeholder="${esc(placeholder)}" style="flex:1;min-width:0;" />
        <button type="button" data-chip-add style="white-space:nowrap;">+ Add</button>
      </div>`;
    sync(container, name, items);
    container.querySelector('[data-chip-input]')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); addItem(); }
    });
    container.querySelector('[data-chip-add]')?.addEventListener('click', addItem);
    container.querySelectorAll('[data-rm]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.rm);
        items.splice(idx, 1);
        render();
        fireChange(container);
      });
    });
  };
  const addItem = () => {
    const input = container.querySelector('[data-chip-input]');
    const val = input.value.trim();
    if (val && !items.includes(val)) { items.push(val); render(); fireChange(container); }
    else input.value = '';
  };
  render();
  return { getValue: () => items, setValue: (v) => { items = [...(v || [])]; render(); } };
}

// ─── Repeatable Text List ──────────────────────────────────────────────────────
// Used for: unsuitableCandidates
export function initRepeatableText(container, { name, values = [], placeholder = 'Add item…', addLabel = '+ Add item' }) {
  let items = [...values];
  const render = () => {
    container.innerHTML = `
      <div data-list-items>
        ${items.map((v, i) => `<div style="display:flex;gap:6px;margin-bottom:6px;" data-item-row="${i}">
          <input type="text" value="${esc(v)}" data-item-val="${i}" placeholder="${esc(placeholder)}" style="flex:1;min-width:0;">
          <button type="button" data-rm="${i}" aria-label="Remove" style="flex-shrink:0;">✕</button>
        </div>`).join('')}
      </div>
      <button type="button" data-add style="margin-top:4px;">${esc(addLabel)}</button>`;
    sync(container, name, items);
    container.querySelectorAll('[data-item-val]').forEach((inp) => {
      inp.addEventListener('input', () => {
        items[Number(inp.dataset.itemVal)] = inp.value;
        sync(container, name, items);
        fireChange(container);
      });
    });
    container.querySelectorAll('[data-rm]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (items[Number(btn.dataset.rm)]) {
          if (!confirm('Remove this item?')) return;
        }
        items.splice(Number(btn.dataset.rm), 1);
        render(); fireChange(container);
      });
    });
    container.querySelector('[data-add]').addEventListener('click', () => {
      items.push(''); render(); fireChange(container);
      container.querySelector(`[data-item-val="${items.length - 1}"]`)?.focus();
    });
  };
  render();
  return { getValue: () => items, setValue: (v) => { items = [...(v || [])]; render(); } };
}

// ─── Benefits List ─────────────────────────────────────────────────────────────
export function initBenefitsList(container, { name, values = [] }) {
  let items = values.map((v, i) => ({ title: v.title || '', description: v.description || '', sortOrder: v.sortOrder ?? (i + 1) }));
  const render = () => {
    container.innerHTML = `
      <div data-list>
        ${items.map((item, i) => `<div style="border:1px solid var(--admin-line);border-radius:6px;padding:10px;margin-bottom:8px;background:var(--admin-surface);" data-item="${i}">
          <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px;">
            <span style="font-size:0.7rem;color:var(--admin-muted);font-weight:700;">BENEFIT ${i + 1}</span>
            <button type="button" data-rm="${i}" style="margin-left:auto;background:none;border:none;cursor:pointer;color:var(--admin-danger,#dc2626);" aria-label="Remove benefit">✕</button>
          </div>
          <div style="display:grid;grid-template-columns:1fr auto;gap:6px;margin-bottom:6px;">
            <input type="text" data-field="title" placeholder="Benefit title" value="${esc(item.title)}" style="width:100%;">
            <input type="number" data-field="sortOrder" value="${item.sortOrder}" min="1" style="width:64px;" placeholder="#">
          </div>
          <textarea data-field="description" placeholder="Optional short description" rows="2" style="width:100%;">${esc(item.description)}</textarea>
        </div>`).join('')}
      </div>
      <button type="button" data-add style="margin-top:4px;">+ Add benefit</button>`;
    sync(container, name, items);
    container.querySelectorAll('[data-item]').forEach((row) => {
      const idx = Number(row.dataset.item);
      row.querySelectorAll('[data-field]').forEach((el) => {
        el.addEventListener('input', () => {
          items[idx][el.dataset.field] = el.type === 'number' ? Number(el.value) : el.value;
          sync(container, name, items); fireChange(container);
        });
      });
      row.querySelector('[data-rm]').addEventListener('click', () => {
        if (items[idx]?.title && !confirm('Remove this benefit?')) return;
        items.splice(idx, 1); render(); fireChange(container);
      });
    });
    container.querySelector('[data-add]').addEventListener('click', () => {
      items.push({ title: '', description: '', sortOrder: items.length + 1 }); render(); fireChange(container);
    });
  };
  render();
  return { getValue: () => items, setValue: (v) => { items = (v || []).map((item, i) => ({ title: item.title || '', description: item.description || '', sortOrder: item.sortOrder ?? (i + 1) })); render(); } };
}

// ─── Procedure Steps ───────────────────────────────────────────────────────────
export function initProcedureSteps(container, { name, values = [] }) {
  let items = values.map((v, i) => ({ title: v.title || '', description: v.description || '', duration: v.duration || '', sortOrder: v.sortOrder ?? (i + 1) }));
  const render = () => {
    container.innerHTML = `
      <div data-list>
        ${items.map((item, i) => `<div style="border:1px solid var(--admin-line);border-radius:6px;padding:10px;margin-bottom:8px;background:var(--admin-surface);" data-item="${i}">
          <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px;">
            <span style="font-size:0.7rem;color:var(--admin-muted);font-weight:700;">STEP ${i + 1}</span>
            <button type="button" data-rm="${i}" style="margin-left:auto;background:none;border:none;cursor:pointer;color:var(--admin-danger,#dc2626);" aria-label="Remove step">✕</button>
          </div>
          <div style="display:grid;grid-template-columns:1fr 160px auto;gap:6px;margin-bottom:6px;">
            <input type="text" data-field="title" placeholder="Step title *" value="${esc(item.title)}" required style="width:100%;">
            <input type="text" data-field="duration" placeholder="Duration (e.g. 30 min)" value="${esc(item.duration)}" style="width:100%;">
            <input type="number" data-field="sortOrder" value="${item.sortOrder}" min="1" style="width:64px;" placeholder="#">
          </div>
          <textarea data-field="description" placeholder="Step description" rows="2" style="width:100%;">${esc(item.description)}</textarea>
        </div>`).join('')}
      </div>
      <button type="button" data-add>+ Add procedure step</button>`;
    sync(container, name, items);
    container.querySelectorAll('[data-item]').forEach((row) => {
      const idx = Number(row.dataset.item);
      row.querySelectorAll('[data-field]').forEach((el) => {
        el.addEventListener('input', () => {
          items[idx][el.dataset.field] = el.type === 'number' ? Number(el.value) : el.value;
          sync(container, name, items); fireChange(container);
        });
      });
      row.querySelector('[data-rm]').addEventListener('click', () => {
        if (items[idx]?.title && !confirm('Remove this step?')) return;
        items.splice(idx, 1); render(); fireChange(container);
      });
    });
    container.querySelector('[data-add]').addEventListener('click', () => {
      items.push({ title: '', description: '', duration: '', sortOrder: items.length + 1 }); render(); fireChange(container);
    });
  };
  render();
  return { getValue: () => items, setValue: (v) => { items = (v || []).map((item, i) => ({ title: item.title || '', description: item.description || '', duration: item.duration || '', sortOrder: item.sortOrder ?? (i + 1) })); render(); } };
}

// ─── FAQ List ──────────────────────────────────────────────────────────────────
export function initFaqList(container, { name, values = [] }) {
  let items = values.map((v, i) => ({ question: v.question || '', answer: v.answer || '', sortOrder: v.sortOrder ?? (i + 1) }));
  const render = () => {
    container.innerHTML = `
      <div data-list>
        ${items.map((item, i) => `<div style="border:1px solid var(--admin-line);border-radius:6px;padding:10px;margin-bottom:8px;background:var(--admin-surface);" data-item="${i}">
          <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px;">
            <span style="font-size:0.7rem;color:var(--admin-muted);font-weight:700;">FAQ ${i + 1}</span>
            <input type="number" data-field="sortOrder" value="${item.sortOrder}" min="1" style="width:56px;margin-left:auto;" placeholder="#">
            <button type="button" data-rm="${i}" style="background:none;border:none;cursor:pointer;color:var(--admin-danger,#dc2626);" aria-label="Remove FAQ">✕</button>
          </div>
          <input type="text" data-field="question" placeholder="Question *" value="${esc(item.question)}" required style="width:100%;margin-bottom:6px;">
          <textarea data-field="answer" placeholder="Answer *" rows="3" style="width:100%;" required>${esc(item.answer)}</textarea>
        </div>`).join('')}
      </div>
      <button type="button" data-add>+ Add FAQ</button>`;
    sync(container, name, items);
    container.querySelectorAll('[data-item]').forEach((row) => {
      const idx = Number(row.dataset.item);
      row.querySelectorAll('[data-field]').forEach((el) => {
        el.addEventListener('input', () => {
          items[idx][el.dataset.field] = el.type === 'number' ? Number(el.value) : el.value;
          sync(container, name, items); fireChange(container);
        });
      });
      row.querySelector('[data-rm]').addEventListener('click', () => {
        if ((items[idx]?.question || items[idx]?.answer) && !confirm('Remove this FAQ?')) return;
        items.splice(idx, 1); render(); fireChange(container);
      });
    });
    container.querySelector('[data-add]').addEventListener('click', () => {
      items.push({ question: '', answer: '', sortOrder: items.length + 1 }); render(); fireChange(container);
    });
  };
  render();
  return { getValue: () => items, setValue: (v) => { items = (v || []).map((item, i) => ({ question: item.question || '', answer: item.answer || '', sortOrder: item.sortOrder ?? (i + 1) })); render(); } };
}

// ─── Clinical References ───────────────────────────────────────────────────────
export function initClinicalReferences(container, { name, values = [] }) {
  let items = values.map((v) => ({ title: v.title || '', organisation: v.organisation || '', url: v.url || '', publicationDate: v.publicationDate || '' }));
  const render = () => {
    container.innerHTML = `
      <div data-list>
        ${items.map((item, i) => `<div style="border:1px solid var(--admin-line);border-radius:6px;padding:10px;margin-bottom:8px;background:var(--admin-surface);" data-item="${i}">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-size:0.7rem;color:var(--admin-muted);font-weight:700;">REFERENCE ${i + 1}</span>
            <button type="button" data-rm="${i}" style="background:none;border:none;cursor:pointer;color:var(--admin-danger,#dc2626);" aria-label="Remove reference">✕</button>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px;">
            <input type="text" data-field="title" placeholder="Reference title" value="${esc(item.title)}" style="grid-column:1/-1;">
            <input type="text" data-field="organisation" placeholder="Organisation / publication" value="${esc(item.organisation)}">
            <input type="date" data-field="publicationDate" value="${esc(item.publicationDate)}">
          </div>
          <input type="url" data-field="url" placeholder="Source URL (https://…)" value="${esc(item.url)}" style="width:100%;">
        </div>`).join('')}
      </div>
      <button type="button" data-add>+ Add reference</button>`;
    sync(container, name, items);
    container.querySelectorAll('[data-item]').forEach((row) => {
      const idx = Number(row.dataset.item);
      row.querySelectorAll('[data-field]').forEach((el) => {
        el.addEventListener('input', () => { items[idx][el.dataset.field] = el.value; sync(container, name, items); fireChange(container); });
      });
      row.querySelector('[data-rm]').addEventListener('click', () => {
        if (items[idx]?.title && !confirm('Remove this reference?')) return;
        items.splice(idx, 1); render(); fireChange(container);
      });
    });
    container.querySelector('[data-add]').addEventListener('click', () => {
      items.push({ title: '', organisation: '', url: '', publicationDate: '' }); render(); fireChange(container);
    });
  };
  render();
  return { getValue: () => items, setValue: (v) => { items = (v || []).map((r) => ({ title: r.title || '', organisation: r.organisation || '', url: r.url || '', publicationDate: r.publicationDate || '' })); render(); } };
}

// ─── Searchable Multi-Select for Related Treatments ───────────────────────────
export function initRelatedTreatmentsSelector(container, { name, values = [], treatments = [], currentId = '' }) {
  let selected = values.filter((id) => id && id !== currentId);
  let query = '';
  const byId = new Map(treatments.map((t) => [t.id, t]));

  const render = () => {
    const filtered = query
      ? treatments.filter((t) => t.id !== currentId && !selected.includes(t.id) && (t.name.toLowerCase().includes(query.toLowerCase()) || (t.category || '').toLowerCase().includes(query.toLowerCase())))
      : treatments.filter((t) => t.id !== currentId && !selected.includes(t.id));

    container.innerHTML = `
      <div style="margin-bottom:8px;">
        ${selected.map((id) => {
      const t = byId.get(id);
      const label = t ? `${t.name}${t.category ? ` · ${t.category}` : ''}${t.status === 'archived' ? ' (archived)' : ''}` : `Unknown (${id})`;
      const style = t?.status === 'archived' ? 'color:var(--admin-warning,#b45309);' : '';
      return `<span style="display:inline-flex;align-items:center;gap:4px;background:var(--admin-emerald-50,#f0fdf4);border:1px solid var(--admin-emerald-200,#a7f3d0);border-radius:20px;padding:2px 8px;font-size:0.8rem;margin:0 4px 4px 0;${style}">
            ${esc(label)}<button type="button" data-deselect="${esc(id)}" style="background:none;border:none;cursor:pointer;padding:0 0 0 4px;" aria-label="Remove">&times;</button>
          </span>`;
    }).join('')}
      </div>
      <input type="text" data-search placeholder="Search treatments…" value="${esc(query)}" style="width:100%;margin-bottom:4px;">
      <div data-options style="max-height:160px;overflow-y:auto;border:1px solid var(--admin-line);border-radius:4px;background:var(--admin-bg);">
        ${filtered.length ? filtered.slice(0, 20).map((t) => `<div data-select="${esc(t.id)}" style="padding:6px 10px;cursor:pointer;font-size:0.85rem;" data-hover>
          <strong>${esc(t.name)}</strong>${t.category ? `<span style="color:var(--admin-muted);margin-left:6px;">${esc(t.category)}</span>` : ''}
        </div>`).join('') : `<div style="padding:8px 10px;color:var(--admin-muted);font-size:0.85rem;">${query ? 'No matching treatments.' : 'No other treatments available.'}</div>`}
      </div>`;
    sync(container, name, selected);

    container.querySelector('[data-search]')?.addEventListener('input', (e) => { query = e.target.value; render(); });
    container.querySelectorAll('[data-select]').forEach((el) => {
      el.addEventListener('mouseenter', () => el.style.background = 'var(--admin-hover,#f8fafc)');
      el.addEventListener('mouseleave', () => el.style.background = '');
      el.addEventListener('click', () => {
        const id = el.dataset.select;
        if (!selected.includes(id)) { selected.push(id); query = ''; render(); fireChange(container); }
      });
    });
    container.querySelectorAll('[data-deselect]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selected = selected.filter((id) => id !== btn.dataset.deselect);
        render(); fireChange(container);
      });
    });
  };
  render();
  return { getValue: () => selected, setValue: (v) => { selected = (v || []).filter((id) => id !== currentId); render(); } };
}

// ─── Doctor Selector ───────────────────────────────────────────────────────────
export function initDoctorSelector(container, { name, value = '', doctors = [], onSelect, credentialsName }) {
  let selectedId = value;
  let query = '';
  const byId = new Map(doctors.map((d) => [d.id, d]));
  const selected = byId.get(value);

  const render = () => {
    const filtered = query
      ? doctors.filter((d) => d.name.toLowerCase().includes(query.toLowerCase()) || (d.specialization || '').toLowerCase().includes(query.toLowerCase()))
      : doctors;

    container.innerHTML = `
      ${selectedId ? `<div style="display:flex;align-items:center;gap:8px;padding:8px;border:1px solid var(--admin-emerald-200,#a7f3d0);border-radius:6px;margin-bottom:8px;background:var(--admin-emerald-50,#f0fdf4);">
        <div style="flex:1;">
          <strong style="font-size:0.9rem;">${esc(byId.get(selectedId)?.name || `Doctor (${selectedId})`)}</strong>
          ${byId.get(selectedId)?.specialization ? `<span style="color:var(--admin-muted);font-size:0.8rem;display:block;">${esc(byId.get(selectedId).specialization)}</span>` : ''}
        </div>
        <button type="button" data-clear style="background:none;border:none;cursor:pointer;color:var(--admin-muted);" aria-label="Clear selection">&times; Change</button>
      </div>` : ''}
      <input type="text" data-search placeholder="Search doctors…" value="${esc(query)}" style="width:100%;margin-bottom:4px;">
      <div data-options style="max-height:160px;overflow-y:auto;border:1px solid var(--admin-line);border-radius:4px;background:var(--admin-bg);">
        ${filtered.slice(0, 20).map((d) => `<div data-select="${esc(d.id)}" style="padding:6px 10px;cursor:pointer;font-size:0.85rem;${d.id === selectedId ? 'background:var(--admin-emerald-50,#f0fdf4);' : ''}">
          <strong>${esc(d.name)}</strong><span style="color:var(--admin-muted);margin-left:6px;">${esc(d.specialization || d.designation || '')}</span>
        </div>`).join('')}
      </div>`;
    sync(container, name, selectedId);

    container.querySelector('[data-search]')?.addEventListener('input', (e) => { query = e.target.value; render(); });
    container.querySelector('[data-clear]')?.addEventListener('click', () => { selectedId = ''; query = ''; render(); fireChange(container); if (credentialsName) sync(container, credentialsName, ''); });
    container.querySelectorAll('[data-select]').forEach((el) => {
      el.addEventListener('mouseenter', () => el.style.background = 'var(--admin-hover,#f8fafc)');
      el.addEventListener('mouseleave', () => el.style.background = el.dataset.select === selectedId ? 'var(--admin-emerald-50,#f0fdf4)' : '');
      el.addEventListener('click', () => {
        selectedId = el.dataset.select;
        const doc = byId.get(selectedId);
        if (onSelect && doc) onSelect(doc);
        query = ''; render(); fireChange(container);
      });
    });
  };
  render();
  return { getValue: () => selectedId, setValue: (v) => { selectedId = v; render(); } };
}

// ─── Pricing Controls ──────────────────────────────────────────────────────────
const PRICING_LABELS = {
  exact_price: 'Exact price',
  starting_from: 'Starting from',
  price_range: 'Price range',
  consultation_required: 'Consultation required',
  not_displayed: 'Do not display pricing',
};

function formatPrice(type, min, max, currency = 'INR') {
  const sym = currency === 'INR' ? '₹' : currency;
  const fmt = (v) => v != null && v !== '' ? `${sym}${Number(v).toLocaleString('en-IN')}` : null;
  if (type === 'exact_price') return fmt(min) || '—';
  if (type === 'starting_from') return fmt(min) ? `Starting from ${fmt(min)}` : '—';
  if (type === 'price_range') return (fmt(min) && fmt(max)) ? `${fmt(min)} – ${fmt(max)}` : '—';
  if (type === 'consultation_required') return 'Pricing available after consultation';
  return 'Not displayed';
}

export function initPricingControls(container, { values = {} }) {
  let type = values.pricingDisplayType || 'consultation_required';
  let minPrice = values.minPrice ?? '';
  let maxPrice = values.maxPrice ?? '';
  const render = () => {
    const needMin = ['exact_price', 'starting_from', 'price_range'].includes(type);
    const needMax = type === 'price_range';
    container.innerHTML = `
      <div style="margin-bottom:14px;">
        <label style="font-weight:600;font-size:0.82rem;text-transform:uppercase;letter-spacing:.05em;color:var(--admin-muted);display:block;margin-bottom:8px;">Pricing display type</label>
        <div style="display:flex;flex-direction:column;gap:4px;">
          ${Object.entries(PRICING_LABELS).map(([val, label]) => {
      const active = type === val;
      return `<label data-pricing-option="${val}" style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:9px 12px;border-radius:7px;border:1.5px solid ${active ? 'var(--admin-emerald-400,#34d399)' : 'var(--admin-line,#e5e7eb)'};background:${active ? 'var(--admin-emerald-50,#f0fdf4)' : 'transparent'};transition:border-color .15s,background .15s;">
              <span style="flex-shrink:0;width:16px;height:16px;border-radius:50%;border:2px solid ${active ? 'var(--admin-emerald-500,#10b981)' : 'var(--admin-line-strong,#9ca3af)'};background:${active ? 'var(--admin-emerald-500,#10b981)' : 'transparent'};display:flex;align-items:center;justify-content:center;">
                ${active ? '<span style="width:6px;height:6px;border-radius:50%;background:#fff;display:block;"></span>' : ''}
              </span>
              <input type="radio" name="pricingDisplayType_ctrl" value="${val}" ${active ? 'checked' : ''} style="position:absolute;opacity:0;pointer-events:none;width:0;height:0;">
              <span style="font-size:0.88rem;font-weight:${active ? '600' : '400'};color:${active ? 'var(--admin-emerald-800,#065f46)' : 'var(--admin-charcoal,#1f2937)'};">${esc(label)}</span>
            </label>`;
    }).join('')}
        </div>
      </div>
      ${needMin ? `<div style="margin-bottom:8px;"><label style="font-weight:600;font-size:0.85rem;display:block;margin-bottom:4px;">${type === 'exact_price' ? 'Price (₹)' : 'Minimum price (₹)'}</label><input type="number" data-price-min min="0" step="100" value="${minPrice}" placeholder="0" style="width:180px;"></div>` : ''}
      ${needMax ? `<div style="margin-bottom:8px;"><label style="font-weight:600;font-size:0.85rem;display:block;margin-bottom:4px;">Maximum price (₹)</label><input type="number" data-price-max min="0" step="100" value="${maxPrice}" placeholder="0" style="width:180px;"></div>` : ''}
      <div style="margin-top:12px;padding:10px 14px;background:var(--admin-emerald-50,#f0fdf4);border-radius:6px;border:1px solid var(--admin-emerald-200,#a7f3d0);">
        <span style="font-size:0.7rem;color:var(--admin-muted);font-weight:700;letter-spacing:.06em;display:block;margin-bottom:3px;">LIVE PREVIEW</span>
        <strong id="pricing-preview" style="font-size:1.05rem;color:var(--admin-emerald-800,#065f46);">${esc(formatPrice(type, minPrice, maxPrice))}</strong>
      </div>`;
    // Sync hidden inputs
    sync(container, 'pricingDisplayType', type);
    sync(container, 'minPrice', needMin ? (minPrice !== '' ? Number(minPrice) : null) : null);
    sync(container, 'maxPrice', needMax ? (maxPrice !== '' ? Number(maxPrice) : null) : null);

    container.querySelectorAll('[data-pricing-option]').forEach((label) => {
      label.addEventListener('click', () => {
        type = label.dataset.pricingOption;
        minPrice = '';
        maxPrice = '';
        render();
        fireChange(container);
      });
    });
    container.querySelector('[data-price-min]')?.addEventListener('input', (e) => { minPrice = e.target.value; sync(container, 'minPrice', minPrice !== '' ? Number(minPrice) : null); container.querySelector('#pricing-preview').textContent = formatPrice(type, minPrice, maxPrice); fireChange(container); });
    container.querySelector('[data-price-max]')?.addEventListener('input', (e) => { maxPrice = e.target.value; sync(container, 'maxPrice', maxPrice !== '' ? Number(maxPrice) : null); container.querySelector('#pricing-preview').textContent = formatPrice(type, minPrice, maxPrice); fireChange(container); });

  };
  render();
  return { getValue: () => ({ pricingDisplayType: type, minPrice: minPrice !== '' ? Number(minPrice) : null, maxPrice: maxPrice !== '' ? Number(maxPrice) : null }), setValue: (v) => { type = v.pricingDisplayType || 'consultation_required'; minPrice = v.minPrice ?? ''; maxPrice = v.maxPrice ?? ''; render(); } };
}

// ─── Before/After Gallery ──────────────────────────────────────────────────────
export function initBeforeAfterGallery(container, { name, values = [], galleryAssets = [] }) {
  let items = values.map((v, i) => ({ ...v, sortOrder: v.sortOrder ?? (i + 1) }));
  const assetById = new Map(galleryAssets.map((a) => [a.id, a]));

  const render = () => {
    container.innerHTML = `
      <div data-list>
        ${items.map((item, i) => {
      const beforeAsset = assetById.get(item.beforeAssetId);
      const afterAsset = assetById.get(item.afterAssetId);
      const beforeThumb = beforeAsset ? publicMediaUrl(beforeAsset.url || beforeAsset.imagePath || '') : '';
      const afterThumb = afterAsset ? publicMediaUrl(afterAsset.url || afterAsset.imagePath || '') : '';
      return `<div style="border:1px solid var(--admin-line);border-radius:6px;padding:10px;margin-bottom:10px;background:var(--admin-surface);" data-item="${i}">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <span style="font-size:0.7rem;font-weight:700;color:var(--admin-muted);">COMPARISON ${i + 1}</span>
              <div style="display:flex;align-items:center;gap:8px;">
                <input type="number" data-field="sortOrder" value="${item.sortOrder}" min="1" style="width:56px;" placeholder="#">
                <button type="button" data-rm="${i}" style="background:none;border:none;cursor:pointer;color:var(--admin-danger,#dc2626);" aria-label="Remove">✕</button>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
              <div>
                <span style="font-size:0.75rem;font-weight:700;display:block;margin-bottom:4px;">Before</span>
                <div style="height:80px;border:1px dashed var(--admin-line);border-radius:4px;display:flex;align-items:center;justify-content:center;overflow:hidden;cursor:pointer;background:#fafafa;" data-pick="before">
                  ${beforeThumb ? `<img src="${esc(beforeThumb)}" style="width:100%;height:100%;object-fit:cover;" alt="Before">` : '<span style="font-size:0.7rem;color:var(--admin-muted);">Select image</span>'}
                </div>
              </div>
              <div>
                <span style="font-size:0.75rem;font-weight:700;display:block;margin-bottom:4px;">After</span>
                <div style="height:80px;border:1px dashed var(--admin-line);border-radius:4px;display:flex;align-items:center;justify-content:center;overflow:hidden;cursor:pointer;background:#fafafa;" data-pick="after">
                  ${afterThumb ? `<img src="${esc(afterThumb)}" style="width:100%;height:100%;object-fit:cover;" alt="After">` : '<span style="font-size:0.7rem;color:var(--admin-muted);">Select image</span>'}
                </div>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px;">
              <input type="text" data-field="caption" placeholder="Caption" value="${esc(item.caption || '')}">
              <input type="text" data-field="timelineStage" placeholder="Stage (e.g. 3 months after)" value="${esc(item.timelineStage || '')}">
            </div>
            <label style="display:flex;align-items:center;gap:8px;font-size:0.85rem;cursor:pointer;">
              <input type="checkbox" data-field="consentConfirmed" ${item.consentConfirmed ? 'checked' : ''}> Patient consent confirmed for this comparison
            </label>
            ${!item.consentConfirmed ? '<p style="color:var(--admin-danger,#dc2626);font-size:0.78rem;margin:4px 0 0;">Consent is required before publishing.</p>' : ''}
          </div>`;
    }).join('')}
      </div>
      <button type="button" data-add>+ Add comparison</button>`;
    sync(container, name, items);
    container.querySelectorAll('[data-item]').forEach((row) => {
      const idx = Number(row.dataset.item);
      row.querySelectorAll('[data-field]').forEach((el) => {
        el.addEventListener('change', () => { items[idx][el.dataset.field] = el.type === 'checkbox' ? el.checked : el.type === 'number' ? Number(el.value) : el.value; sync(container, name, items); render(); fireChange(container); });
        el.addEventListener('input', () => { if (el.type !== 'checkbox') { items[idx][el.dataset.field] = el.type === 'number' ? Number(el.value) : el.value; sync(container, name, items); fireChange(container); } });
      });
      row.querySelector('[data-rm]').addEventListener('click', () => {
        if (!confirm('Remove this comparison?')) return;
        items.splice(idx, 1); render(); fireChange(container);
      });
      // Image picker stubs (opens gallery picker in parent context)
      row.querySelectorAll('[data-pick]').forEach((el) => {
        el.addEventListener('click', () => {
          const slot = el.dataset.pick; // 'before' or 'after'
          container.dispatchEvent(new CustomEvent('treatment:pick-asset', {
            bubbles: true, detail: {
              itemIndex: idx, slot, type: 'before-after', callback: (asset) => {
                if (slot === 'before') { items[idx].beforeAssetId = asset.id; items[idx].beforeUrl = asset.url || ''; }
                else { items[idx].afterAssetId = asset.id; items[idx].afterUrl = asset.url || ''; }
                render(); fireChange(container);
              }
            }
          }));
        });
      });
    });
    container.querySelector('[data-add]').addEventListener('click', () => {
      items.push({ beforeAssetId: '', afterAssetId: '', beforeUrl: '', afterUrl: '', caption: '', timelineStage: '', sortOrder: items.length + 1, consentConfirmed: false });
      render(); fireChange(container);
    });
  };
  render();
  return { getValue: () => items, setValue: (v) => { items = (v || []).map((item, i) => ({ ...item, sortOrder: item.sortOrder ?? (i + 1) })); render(); } };
}

// ─── Additional Gallery ────────────────────────────────────────────────────────
export function initAdditionalGallery(container, { name, values = [], galleryAssets = [] }) {
  let items = values.map((v, i) => ({ assetId: v.assetId || '', imagePath: v.imagePath || v.url || '', altText: v.altText || '', caption: v.caption || '', sortOrder: v.sortOrder ?? (i + 1) }));
  const render = () => {
    container.innerHTML = `
      <div data-grid style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;margin-bottom:8px;">
        ${items.map((item, i) => {
      const url = publicMediaUrl(item.imagePath || item.url || '');
      return `<div style="border:1px solid var(--admin-line);border-radius:6px;overflow:hidden;background:var(--admin-surface);" data-item="${i}">
            <div style="height:80px;overflow:hidden;position:relative;cursor:pointer;" data-pick="${i}">
              ${url ? `<img src="${esc(url)}" style="width:100%;height:100%;object-fit:cover;" alt="${esc(item.altText)}">` : '<div style="height:100%;display:flex;align-items:center;justify-content:center;color:var(--admin-muted);font-size:0.7rem;">No image</div>'}
              <button type="button" data-rm="${i}" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,.5);color:#fff;border:none;border-radius:50%;width:20px;height:20px;cursor:pointer;font-size:12px;line-height:1;display:flex;align-items:center;justify-content:center;" aria-label="Remove">✕</button>
            </div>
            <div style="padding:6px;">
              <input type="text" data-field="altText" placeholder="Alt text" value="${esc(item.altText)}" style="width:100%;font-size:0.75rem;margin-bottom:4px;">
              <input type="text" data-field="caption" placeholder="Caption" value="${esc(item.caption)}" style="width:100%;font-size:0.75rem;">
            </div>
          </div>`;
    }).join('')}
        <div data-add-new style="border:2px dashed var(--admin-line);border-radius:6px;min-height:120px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--admin-muted);font-size:0.8rem;flex-direction:column;gap:4px;">
          <span style="font-size:1.5rem;">+</span><span>Add image</span>
        </div>
      </div>`;
    sync(container, name, items);
    container.querySelectorAll('[data-item]').forEach((row) => {
      const idx = Number(row.dataset.item);
      row.querySelectorAll('[data-field]').forEach((el) => {
        el.addEventListener('input', () => { items[idx][el.dataset.field] = el.value; sync(container, name, items); fireChange(container); });
      });
      row.querySelector('[data-rm]').addEventListener('click', (e) => {
        e.stopPropagation();
        items.splice(idx, 1); render(); fireChange(container);
      });
      row.querySelector('[data-pick]').addEventListener('click', () => {
        container.dispatchEvent(new CustomEvent('treatment:pick-asset', {
          bubbles: true, detail: {
            type: 'gallery', callback: (asset) => {
              items[idx].assetId = asset.id; items[idx].imagePath = asset.url || asset.imagePath || '';
              render(); fireChange(container);
            }
          }
        }));
      });
    });
    container.querySelector('[data-add-new]').addEventListener('click', () => {
      container.dispatchEvent(new CustomEvent('treatment:pick-asset', {
        bubbles: true, detail: {
          type: 'gallery', callback: (asset) => {
            items.push({ assetId: asset.id, imagePath: asset.url || '', altText: asset.alt || '', caption: '', sortOrder: items.length + 1 });
            render(); fireChange(container);
          }
        }
      }));
    });
  };
  render();
  return { getValue: () => items, setValue: (v) => { items = (v || []).map((item, i) => ({ assetId: item.assetId || '', imagePath: item.imagePath || '', altText: item.altText || '', caption: item.caption || '', sortOrder: item.sortOrder ?? (i + 1) })); render(); } };
}

// ─── System Status Badges ──────────────────────────────────────────────────────
const STATUS_BADGE_COLORS = {
  Included: '#16a34a', Excluded: '#dc2626', Generated: '#16a34a', Pending: '#d97706',
  'Not generated': '#6b7280', Failed: '#dc2626', Outdated: '#d97706',
};

export function initSystemInfoPanel(container, { record = {} }) {
  const computeSitemapStatus = () => {
    const status = String(record.status || '').toLowerCase();
    if (!['published', 'scheduled'].includes(status)) return 'Excluded';
    if (status === 'scheduled') return 'Excluded';
    if (!record.allowSearchIndexing) return 'Excluded';
    return 'Included';
  };

  const badge = (label) => {
    const color = STATUS_BADGE_COLORS[label] || '#6b7280';
    return `<span style="background:${color};color:#fff;border-radius:4px;padding:2px 8px;font-size:0.75rem;font-weight:700;">${esc(label)}</span>`;
  };

  const fmt = (v) => v ? new Date(v).toLocaleDateString('en-GB') : '—';

  container.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:0.85rem;">
      <div><span style="color:var(--admin-muted);font-size:0.75rem;font-weight:700;">SITEMAP STATUS</span><br>${badge(computeSitemapStatus())}</div>
      <div><span style="color:var(--admin-muted);font-size:0.75rem;font-weight:700;">HTML STATUS</span><br>${badge(record.generatedHtmlStatus || 'Pending')}</div>
      <div><span style="color:var(--admin-muted);font-size:0.75rem;font-weight:700;">STRUCTURED DATA</span><br>${badge(record.structuredDataStatus || 'Pending')}</div>
      <div><span style="color:var(--admin-muted);font-size:0.75rem;font-weight:700;">ROBOTS</span><br><code style="font-size:0.8rem;">${record.allowSearchIndexing !== false ? 'index, follow' : 'noindex, nofollow'}</code></div>
      <div><span style="color:var(--admin-muted);font-size:0.75rem;font-weight:700;">CREATED</span><br>${fmt(record.createdAt)}</div>
      <div><span style="color:var(--admin-muted);font-size:0.75rem;font-weight:700;">LAST UPDATED</span><br>${fmt(record.updatedAt)}</div>
    </div>`;
}

// ─── SEO Preview ───────────────────────────────────────────────────────────────
export function renderSeoPreview(container, { record = {}, clinicName = 'Titanium Roots Dental' }) {
  const title = record.seoTitle || (record.name ? `${record.name} | ${clinicName}` : clinicName);
  const desc = record.seoDescription || record.shortDescription || '';
  const slug = record.slug || slugify(record.name || '');
  const canonical = record.canonicalUrlOverride || `/treatments/${slug}/`;
  const socialTitle = record.socialTitle || title;
  const socialDesc = record.socialDescription || desc;
  const robots = record.allowSearchIndexing !== false ? 'index, follow' : 'noindex, nofollow';
  const seoTitleLen = title.length;
  const seoDescLen = desc.length;

  container.innerHTML = `
    <div style="font-size:0.85rem;margin-bottom:12px;">
      <strong style="font-size:0.8rem;color:var(--admin-muted);">Google Search Preview</strong>
      <div style="border:1px solid #e0e0e0;border-radius:8px;padding:12px;margin-top:6px;background:#fff;font-family:Arial,sans-serif;">
        <div style="font-size:0.75rem;color:#202124;margin-bottom:2px;">titanium-roots.com › treatments › ${esc(slug)}</div>
        <div style="color:#1a0dab;font-size:1rem;font-weight:400;margin-bottom:2px;">${esc(title.slice(0, 60))}${title.length > 60 ? '…' : ''}</div>
        <div style="color:#4d5156;font-size:0.85rem;">${esc(desc.slice(0, 160))}${desc.length > 160 ? '…' : ''}</div>
      </div>
      ${seoTitleLen > 60 ? `<p style="color:#d97706;font-size:0.75rem;margin-top:4px;">⚠ SEO title is ${seoTitleLen} characters (recommended ≤60)</p>` : ''}
      ${seoDescLen > 160 ? `<p style="color:#d97706;font-size:0.75rem;margin-top:2px;">⚠ SEO description is ${seoDescLen} characters (recommended ≤160)</p>` : ''}
    </div>
    <div style="margin-bottom:12px;">
      <strong style="font-size:0.8rem;color:var(--admin-muted);">Social Sharing Card</strong>
      <div style="border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;margin-top:6px;">
        ${record.socialImage || record.image ? `<div style="height:120px;background:var(--admin-muted) url(${esc(record.socialImage || record.image)}) center/cover;"></div>` : '<div style="height:60px;background:#e0e0e0;display:flex;align-items:center;justify-content:center;font-size:0.75rem;color:#888;">No social image set – featured image will be used as fallback</div>'}
        <div style="padding:10px;background:#fff;">
          <div style="font-size:0.85rem;font-weight:700;">${esc(socialTitle)}</div>
          <div style="font-size:0.8rem;color:#555;margin-top:2px;">${esc(socialDesc.slice(0, 125))}${socialDesc.length > 125 ? '…' : ''}</div>
        </div>
      </div>
    </div>
    <div style="font-size:0.82rem;color:var(--admin-muted);">
      <span style="margin-right:12px;"><strong>Canonical:</strong> <code>${esc(canonical)}</code></span>
      <span><strong>Robots:</strong> <code>${esc(robots)}</code></span>
    </div>`;
}

function slugify(v) {
  return String(v).toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

// ─── Treatment Card Preview ────────────────────────────────────────────────────
export function renderTreatmentCardPreview(container, { record = {}, clinicName = 'Titanium Roots Dental' }) {
  const formatPriceText = (r) => {
    const sym = '₹';
    const fmt = (v) => v != null && v !== '' ? `${sym}${Number(v).toLocaleString('en-IN')}` : null;
    if (r.pricingDisplayType === 'exact_price') return fmt(r.minPrice) || '';
    if (r.pricingDisplayType === 'starting_from') return fmt(r.minPrice) ? `From ${fmt(r.minPrice)}` : '';
    if (r.pricingDisplayType === 'price_range') return (fmt(r.minPrice) && fmt(r.maxPrice)) ? `${fmt(r.minPrice)} – ${fmt(r.maxPrice)}` : '';
    if (r.pricingDisplayType === 'not_displayed') return '';
    return 'Consultation required';
  };
  const imgUrl = record.image ? publicMediaUrl(record.image) : '';
  const price = formatPriceText(record);
  container.innerHTML = `
    <div style="background:#fff;border:1px solid var(--admin-line);border-radius:12px;overflow:hidden;max-width:360px;box-shadow:0 2px 8px rgba(0,0,0,.07);">
      <div style="height:160px;background:${imgUrl ? `url(${esc(imgUrl)}) center/cover` : '#e9f5f0'};position:relative;">
        ${record.featured ? '<span style="position:absolute;top:10px;left:10px;background:#16a34a;color:#fff;border-radius:4px;padding:2px 8px;font-size:0.7rem;font-weight:700;">Featured</span>' : ''}
        ${record.category ? `<span style="position:absolute;bottom:10px;left:10px;background:rgba(0,0,0,.55);color:#fff;border-radius:4px;padding:2px 8px;font-size:0.7rem;">${esc(record.category)}</span>` : ''}
      </div>
      <div style="padding:14px;">
        <h3 style="margin:0 0 6px;font-size:1rem;font-weight:700;">${esc(record.name || 'Treatment Name')}</h3>
        <p style="margin:0 0 10px;font-size:0.83rem;color:#555;line-height:1.5;">${esc((record.shortDescription || '').slice(0, 110))}${(record.shortDescription || '').length > 110 ? '…' : ''}</p>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;">
          ${record.duration ? `<span style="background:#f0fdf4;border-radius:4px;padding:2px 8px;font-size:0.75rem;color:#16a34a;font-weight:700;">⏱ ${esc(record.duration)}</span>` : ''}
          ${record.visits ? `<span style="background:#f0fdf4;border-radius:4px;padding:2px 8px;font-size:0.75rem;color:#16a34a;font-weight:700;">📅 ${esc(record.visits)}</span>` : ''}
          ${price ? `<span style="background:#fefce8;border-radius:4px;padding:2px 8px;font-size:0.75rem;color:#854d0e;font-weight:700;">${esc(price)}</span>` : ''}
        </div>
        <button style="width:100%;padding:8px;background:var(--admin-emerald-700,#15803d);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer;font-size:0.85rem;">View Treatment →</button>
      </div>
    </div>`;
}
