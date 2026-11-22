/**
 * Which site a request is for.
 *
 * Every site lives in this one app, under `src/routes/sites/<name>`, and is chosen by the name it was asked
 * for: `osu.purps.ca` is the site in `sites/osu`. Any name which isn't a site of its own gets the landing page.
 *
 * Nothing here knows which sites there are: that is read from the folders themselves, in `known.ts`, and
 * handed in.
 */

/** The site every name without one of its own is given. */
export const LANDING = 'landing';

/** The addresses a site can be reached under end in one of these: the public one, and one for working on it. */
const DOMAINS = ['purps.ca', 'localhost'];

/** The part of a hostname in front of a domain, or null if the hostname isn't under that domain. */
function subdomainOf(hostname: string, domain: string): string | null {
	if (hostname === domain) return '';
	return hostname.endsWith(`.${domain}`) ? hostname.slice(0, -domain.length - 1) : null;
}

/** The part of a hostname in front of whichever of the domains it is under, or null if it is under neither. */
function subdomain(hostname: string): string | null {
	const name = hostname.toLowerCase();

	for (const domain of DOMAINS) {
		const found = subdomainOf(name, domain);
		if (found !== null) return found;
	}

	return null;
}

/** The site a name belongs to, out of the sites there are. */
export function siteFor(hostname: string, sites: readonly string[]): string {
	const name = subdomain(hostname);

	return name !== null && sites.includes(name) ? name : LANDING;
}

/**
 * The address of a site, as a link from the page at `from`. While working on the app that is its
 * `.localhost` name, so a link leads to the copy being worked on; from anywhere else it is the public one.
 */
export function addressOf(site: string, from: Pick<URL, 'hostname' | 'protocol' | 'port'>): string {
	if (subdomainOf(from.hostname.toLowerCase(), 'localhost') !== null) {
		return `${from.protocol}//${site}.localhost${from.port ? `:${from.port}` : ''}`;
	}

	return `https://${site}.purps.ca`;
}

/** Addresses which mean the same on every site, and so are left alone. */
const SHARED_PATHS = ['/healthz'];

/** Where in the app the page for an address lives. */
export function routeFor(hostname: string, pathname: string, sites: readonly string[]): string {
	if (SHARED_PATHS.includes(pathname)) return pathname;

	return `/sites/${siteFor(hostname, sites)}${pathname === '/' ? '' : pathname}`;
}
