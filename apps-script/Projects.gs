/** Projects.gs — 08_Projects (portfolio). */
function projectActions_() {
  return sectionActions_('PROJECTS', {
    create: 'createProject',
    get: 'getProjects',
    update: 'updateProject',
    delete: 'deleteProject',
    sync: 'syncProjects',
  }, 'Project');
}
