'use strict';

class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

class NotFoundError extends Error {
  constructor(projectId) {
    super(`Project not found: ${projectId}`);
    this.name = 'NotFoundError';
    this.projectId = projectId;
  }
}

class ConflictError extends Error {
  constructor(projectId, currentVersion) {
    super(`Version conflict for ${projectId}: current version is ${currentVersion}`);
    this.name = 'ConflictError';
    this.projectId = projectId;
    this.currentVersion = currentVersion;
  }
}

module.exports = { ValidationError, NotFoundError, ConflictError };
