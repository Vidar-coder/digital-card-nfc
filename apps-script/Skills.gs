/** Skills.gs — 06_Skills. */
function skillActions_() {
  return sectionActions_('SKILLS', {
    create: 'createSkill',
    get: 'getSkills',
    update: 'updateSkill',
    delete: 'deleteSkill',
    sync: 'syncSkills',
  }, 'Skill');
}
