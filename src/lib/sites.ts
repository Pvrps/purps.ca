/**
 * Which site a request is for.
 *
 * Every site lives in this one app, under `src/routes/sites/<id>`, and is chosen by the name it was asked for:
 * `osu.purps.ca` is the osu site. Any name which isn't a site of its own gets the landing page.
 */

export type SiteId = 'landing' | 'osu';

/** The sites with a name of their own, by the first part of that name. */
const SUBDOMAINS: Record<string, SiteId> = {
	osu: 'osu'
};

/** The addresses a site can be reached under end in one of these: the public one, and one for working on it. */
const DOMAINS = ['purps.ca', 'localhost'];

/** The part of a hostname in front of a domain, or null if the hostname isn't under that domain. */
function subdomainOf(hostname: string, domain: string): string | null {
	if (hostname === domain) return '';
	return hostname.endsWith(`.${domain}`) ? hostname.slice(0, -domain.length - 1) : null;
}

export function siteFor(hostname: string): SiteId {
	const name = hostname.toLowerCase();

	for (const domain of DOMAINS) {
		const subdomain = subdomainOf(name, domain);
		if (subdomain !== null) return SUBDOMAINS[subdomain] ?? 'landing';
	}

	// Reached by some other name entirely, such as a bare address.
	return 'landing';
}

/** Addresses which mean the same on every site, and so are left alone. */
const SHARED_PATHS = ['/healthz'];

/** Where in the app the page for an address lives. */
export function routeFor(hostname: string, pathname: string): string {
	if (SHARED_PATHS.includes(pathname)) return pathname;

	return `/sites/${siteFor(hostname)}${pathname === '/' ? '' : pathname}`;
}
