import type { Reroute } from '@sveltejs/kit/hooks';
import { routeFor } from '#lib/sites.ts';

/** Sends each request to the pages of the site it was asked for by name. */
export const reroute: Reroute = ({ url }) => routeFor(url.hostname, url.pathname);
