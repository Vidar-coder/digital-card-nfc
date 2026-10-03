/** Services.gs — 07_Services. */
function serviceActions_() {
  return sectionActions_('SERVICES', {
    create: 'createService',
    get: 'getServices',
    update: 'updateService',
    delete: 'deleteService',
    sync: 'syncServices',
  }, 'Service');
}
