import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/**
 * Nothing lives at a name which ends up here, and it is told so the way a browser or a search engine
 * understands, as well as in words.
 */
export const load: PageServerLoad = () => error(404, 'No site by that name');
