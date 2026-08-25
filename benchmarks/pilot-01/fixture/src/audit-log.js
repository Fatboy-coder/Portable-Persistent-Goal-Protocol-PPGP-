'use strict';

class AuditLog {
  constructor() {
    this.events = [];
  }

  append(event) {
    this.events.push({ ...event });
  }

  all() {
    return this.events.map((event) => ({ ...event }));
  }
}

module.exports = { AuditLog };
