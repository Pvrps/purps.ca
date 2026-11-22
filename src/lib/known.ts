/**
 * The sites there are, read from the folders under `src/routes/sites`. Adding a folder there adds a site:
 * it is served under its own name, and listed on the landing page, with nothing to write down anywhere else.
 */
import { LANDING } from './sites.ts';

export interface Site {
	/** The folder's name, which is also the first part of the site's address. */
	name: string;
	/** What the site is, in a few words, from the `site.ts` beside its pages. */
	label: string;
}

const pages = import.meta.glob('/src/routes/sites/*/+page.svelte');
const labels = import.meta.glob<string>('/src/routes/sites/*/site.ts', {
	eager: true,
	import: 'label'
});

const nameOf = (path: string) => path.split('/').at(-2)!;

export const SITES: Site[] = Object.keys(pages)
	.map(nameOf)
	.filter((name) => name !== LANDING)
	.sort()
	.map((name) => ({ name, label: labels[`/src/routes/sites/${name}/site.ts`] ?? '' }));

export const SITE_NAMES = SITES.map((site) => site.name);
