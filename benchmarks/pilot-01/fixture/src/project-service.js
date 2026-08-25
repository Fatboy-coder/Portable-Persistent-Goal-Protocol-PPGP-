'use strict';

const { ValidationError, NotFoundError, ConflictError } = require('./errors');

class ProjectService {
  constructor(store, auditLog) {
    this.store = store;
    this.auditLog = auditLog;
  }

  getProject(projectId) {
    const project = this.store.get(projectId);
    if (!project) throw new NotFoundError(projectId);
    return project;
  }

  renameProject(projectId, newName, expectedVersion) {
    throw new Error('Not implemented');
  }
}

module.exports = { ProjectService };
