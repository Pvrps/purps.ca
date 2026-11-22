import type { Tool } from '#lib/components/tool.ts';
import skinMixer from './skin-mixer.png';

const SKIN_MIXER = 'https://github.com/Pvrps/osu-skin-mixer';

/** The tools on the osu site, in the order they are shown. Adding one here is all it takes to list it. */
export const TOOLS: Tool[] = [
	{
		id: 'skin-mixer',
		name: 'Skin mixer',
		tag: 'for osu!lazer',
		summary:
			'Build one skin from the best parts of all of yours, and watch it play before it goes into the game.',
		points: [
			'Take any single element, or a whole group, from any skin you have',
			'Preview on beatmaps from your own library, with sound',
			'Draw on, recolour and resize images in a built-in editor',
			'One click writes the result into osu! as a skin of its own'
		],
		image: skinMixer,
		imageAlt:
			'The skin mixer: a list of every element of a skin, a live gameplay preview, and the versions of the cursor trail found in each skin',
		source: SKIN_MIXER,
		releases: `${SKIN_MIXER}/releases/latest`,
		downloads: [
			{
				system: 'Linux',
				href: `${SKIN_MIXER}/releases/latest/download/osu-skin-mixer-linux.AppImage`
			},
			{
				system: 'Windows',
				href: `${SKIN_MIXER}/releases/latest/download/osu-skin-mixer-windows.exe`
			},
			{ system: 'macOS', href: `${SKIN_MIXER}/releases/latest/download/osu-skin-mixer-macos.dmg` }
		]
	}
];
