import assert from 'node:assert/strict';
import test from 'node:test';

import { createAdminTable } from '../assets/js/admin/admin-table.js';
import { canArchiveRecord } from '../assets/js/admin/admin-workflows.js';

// Setup basic global mocks for DOM
global.window = {};
global.document = {
    activeElement: null
};
global.CustomEvent = class CustomEvent {
    constructor(name, data) {
        this.name = name;
        this.data = data;
    }
};

test('createAdminTable filters out archived and cancelled records by default', () => {
    const records = [
        { id: 't1', name: 'Treatment One', status: 'Published' },
        { id: 't2', name: 'Treatment Two', status: 'Draft' },
        { id: 't3', name: 'Treatment Three', status: 'Archived' },
        { id: 't4', name: 'Treatment Four', status: 'Unpublished' },
        { id: 't5', name: 'Treatment Five', status: 'Cancelled' },
    ];

    const columns = [{ key: 'name', label: 'Name' }, { key: 'status', label: 'Status', type: 'status' }];
    const filters = [{ key: 'status', label: 'publish states', options: ['published', 'archived'] }];

    const host = {
        innerHTML: '',
        dispatchEvent(event) { },
        addEventListener(name, callback) { }
    };

    const table = createAdminTable(host, { records, columns, filters });

    // Get displayed records on default rendering
    const textContent = host.innerHTML;
    assert.match(textContent, /Treatment One/);
    assert.match(textContent, /Treatment Two/);
    assert.doesNotMatch(textContent, /Treatment Three/);
    assert.doesNotMatch(textContent, /Treatment Four/);
    assert.doesNotMatch(textContent, /Treatment Five/);

    // Explicitly set filter to 'archived'
    table.state.filters.status = 'archived';
    table.refresh(records);

    const updatedText = host.innerHTML;
    assert.doesNotMatch(updatedText, /Treatment One/);
    assert.doesNotMatch(updatedText, /Treatment Two/);
    assert.match(updatedText, /Treatment Three/); // Archived maps to 'archived' case-insensitively
    assert.doesNotMatch(updatedText, /Treatment Four/); // Unpublished is now Archived, but t4 in this raw array is still Unpublished.

    // Verify option label formatting and value attribute presence
    assert.match(updatedText, /value="published"/);
    assert.match(updatedText, /Published<\/option>/);
    assert.match(updatedText, /value="archived"/);
    assert.match(updatedText, /Archived<\/option>/);
});

test('canArchiveRecord returns correct archive policy types', () => {
    assert.equal(canArchiveRecord('treatments').mode, 'archive');
    assert.equal(canArchiveRecord('websiteAssets').mode, 'delete');
    assert.equal(canArchiveRecord('seo').mode, 'delete');
});
