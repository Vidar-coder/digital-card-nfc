/** SocialLinks.gs — 03_Social_Links (multiple accounts per user). */
function socialLinkActions_() {
  return sectionActions_('SOCIAL_LINKS', {
    create: 'createSocialLink',
    get: 'getSocialLinks',
    update: 'updateSocialLink',
    delete: 'deleteSocialLink',
    sync: 'syncSocialLinks',
  }, 'Social link');
}
