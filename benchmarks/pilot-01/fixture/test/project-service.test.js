'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { ProjectStore } = require('../src/project-store');
const { AuditLog } = require('../src/audit-log');
const { ProjectService } = require('../src/project-service');
const { ValidationError, NotFoundError, ConflictError } = require('../src/errors');

function setup() {
  const store = new ProjectStore([
    { id: 'p-1', name: 'Alpha Project', version: 2 },
    { id: 'p-2', name: 'Beta Project', version: 1 }
  ]);
  const auditLog = new AuditLog();
  const service = new ProjectService(store, auditLog);
  return { store, auditLog, service };
}

test('successful rename trims name, increments version once, persists, and audits once', () => {
  const { store, auditLog, service } = setup();
  const result = service.renameProject('p-1', '  Gamma Project  ', 2);

  assert.deepEqual(result, { id: 'p-1', name: 'Gamma Project', version: 3 });
  assert.deepEqual(store.get('p-1'), { id: 'p-1', name: 'Gamma Project', version: 3 });
  assert.deepEqual(auditLog.all(), [
    {
      type: 'project.renamed',
      projectId: 'p-1',
      from: 'Alpha Project',
      to: 'Gamma Project',
      version: 3
    }
  ]);
});

test('same normalized name is a no-op', () => {
  const { store, auditLog, service } = setup();
  const result = service.renameProject('p-1', '  Alpha Project ', 2);

  assert.deepEqual(result, { id: 'p-1', name: 'Alpha Project', version: 2 });
  assert.deepEqual(store.get('p-1'), { id: 'p-1', name: 'Alpha Project', version: 2 });
  assert.deepEqual(auditLog.all(), []);
});

test('stale version throws ConflictError with currentVersion and leaves state unchanged', () => {
  const { store, auditLog, service } = setup();

  assert.throws(
    () => service.renameProject('p-1', 'Gamma Project', 1),
    (error) => {
      assert.ok(error instanceof ConflictError);
      assert.equal(error.currentVersion, 2);
      return true;
    }
  );

  assert.deepEqual(store.get('p-1'), { id: 'p-1', name: 'Alpha Project', version: 2 });
  assert.deepEqual(auditLog.all(), []);
});

test('missing project throws NotFoundError and does not audit', () => {
  const { auditLog, service } = setup();
  assert.throws(() => service.renameProject('missing', 'Gamma Project', 1), NotFoundError);
  assert.deepEqual(auditLog.all(), []);
});

test('invalid name and version are rejected without mutation or audit', () => {
  const { store, auditLog, service } = setup();

  assert.throws(() => service.renameProject('p-1', ' x ', 2), ValidationError);
  assert.throws(() => service.renameProject('p-1', 'Gamma Project', 0), ValidationError);
  assert.throws(() => service.renameProject('p-1', 'Gamma Project', 2.5), ValidationError);

  assert.deepEqual(store.get('p-1'), { id: 'p-1', name: 'Alpha Project', version: 2 });
  assert.deepEqual(auditLog.all(), []);
});

test('store and service do not expose live persisted references', () => {
  const { store, service } = setup();

  const fromStore = store.get('p-1');
  fromStore.name = 'MUTATED OUTSIDE STORE';
  fromStore.version = 999;

  assert.deepEqual(store.get('p-1'), { id: 'p-1', name: 'Alpha Project', version: 2 });

  const fromService = service.getProject('p-2');
  fromService.name = 'MUTATED THROUGH SERVICE';

  assert.deepEqual(service.getProject('p-2'), { id: 'p-2', name: 'Beta Project', version: 1 });
});

test('failed rename cannot leak partial mutation through aliased store objects', () => {
  const { store, auditLog, service } = setup();

  assert.throws(() => service.renameProject('p-1', 'Gamma Project', 1), ConflictError);

  assert.deepEqual(store.get('p-1'), { id: 'p-1', name: 'Alpha Project', version: 2 });
  assert.deepEqual(auditLog.all(), []);
});
