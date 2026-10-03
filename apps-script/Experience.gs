/** Experience.gs — 04_Experience (multiple roles per user). */
function experienceActions_() {
  return sectionActions_('EXPERIENCE', {
    create: 'createExperience',
    get: 'getExperience',
    update: 'updateExperience',
    delete: 'deleteExperience',
    sync: 'syncExperience',
  }, 'Experience');
}
