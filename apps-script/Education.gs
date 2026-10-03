/** Education.gs — 05_Education and 15_Certifications. */
function educationActions_() {
  return sectionActions_('EDUCATION', {
    create: 'createEducation',
    get: 'getEducation',
    update: 'updateEducation',
    delete: 'deleteEducation',
    sync: 'syncEducation',
  }, 'Education');
}

function certificationActions_() {
  return sectionActions_('CERTIFICATIONS', {
    create: 'createCertification',
    get: 'getCertifications',
    update: 'updateCertification',
    delete: 'deleteCertification',
    sync: 'syncCertifications',
  }, 'Certification');
}
