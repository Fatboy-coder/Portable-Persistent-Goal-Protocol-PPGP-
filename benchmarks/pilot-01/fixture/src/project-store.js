'use strict';

class ProjectStore {
  constructor(projects = []) {
    this.projects = new Map(projects.map((project) => [project.id, project]));
  }

  get(projectId) {
    return this.projects.get(projectId) || null;
  }

  save(project) {
    this.projects.set(project.id, project);
    return project;
  }
}

module.exports = { ProjectStore };
