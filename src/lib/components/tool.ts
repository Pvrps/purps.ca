export interface Download {
	/** The system a file is for, as a visitor would call it. */
	system: 'Linux' | 'Windows' | 'macOS';
	href: string;
}

/** One tool, as a site lists it. */
export interface Tool {
	/** Used in the page's address, as in `#skin-mixer`. */
	id: string;
	name: string;
	/** What it works with. */
	tag: string;
	summary: string;
	points: string[];
	image: string;
	imageAlt: string;
	source: string;
	/** Where every release is listed, for a visitor whose system can't be told. */
	releases: string;
	downloads: Download[];
}
