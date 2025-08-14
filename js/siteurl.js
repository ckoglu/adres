// siteurl.js
export function siteURL() {
  const site = location.origin; 
  const pathname = location.pathname; 
  const parts = pathname.split('/').filter(Boolean); 
  const repository = parts.length > 0 ? `/${parts[0]}/` : '/';

  return {
    site,
    repository,
    js: `${site}${repository}js/`,
    modul: `${site}${repository}js/modules/`,
    helper: `${site}${repository}js/helper/`
  };
}
// url.helper
// url.modul