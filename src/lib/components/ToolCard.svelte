<script lang="ts">
	import Button from './Button.svelte';
	import Tag from './Tag.svelte';
	import type { Download, Tool } from './tool.ts';

	interface Props {
		tool: Tool;
		/** Puts the picture on the right, so a column of tools doesn't read as a table. */
		flip?: boolean;
	}

	let { tool, flip = false }: Props = $props();

	// The visitor's own system, once the page is running in their browser. Until then the button leads to
	// the list of releases, which is right for everyone.
	let system = $state<Download['system'] | null>(null);

	$effect(() => {
		const agent = navigator.userAgent;

		if (/Windows/i.test(agent)) system = 'Windows';
		else if (/Mac OS X|Macintosh/i.test(agent)) system = 'macOS';
		else if (/Linux|X11/i.test(agent) && !/Android/i.test(agent)) system = 'Linux';
	});

	const own = $derived(tool.downloads.find((download) => download.system === system));
</script>

<article
	id={tool.id}
	class="grid scroll-mt-20 overflow-hidden rounded-[20px] border border-white/10 bg-panel/70 shadow-[0_30px_80px_rgb(0_0_0/0.45)] backdrop-blur-lg md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] {flip
		? 'md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]'
		: ''}"
>
	<div
		class="flex items-center border-white/10 bg-[#08070c] max-md:border-b {flip
			? 'md:order-2 md:border-l'
			: 'md:border-r'}"
	>
		<img src={tool.image} alt={tool.imageAlt} class="block h-auto w-full" />
	</div>

	<div class="flex flex-col gap-4 p-[clamp(1.4rem,3vw,2.2rem)]">
		<Tag class="text-[0.68rem] [--accent:var(--color-sky)]">{tool.tag}</Tag>
		<h2 class="font-serif text-[1.9rem] leading-[1.15] font-semibold">{tool.name}</h2>
		<p class="text-muted">{tool.summary}</p>

		<ul class="grid gap-[0.45rem] text-[0.95rem]">
			{#each tool.points as point (point)}
				<li class="flex gap-[0.7em]">
					<span class="mt-[0.55em] size-[7px] flex-none rounded-full bg-(--accent)"></span>
					{point}
				</li>
			{/each}
		</ul>

		<div class="mt-auto flex flex-wrap items-center gap-3 pt-2">
			<Button href={own?.href ?? tool.releases} primary>
				<svg viewBox="0 0 16 16" aria-hidden="true" class="size-[1.05em]">
					<path
						d="M8 2v8M4.5 7L8 10.5 11.5 7M3 13h10"
						fill="none"
						stroke="currentColor"
						stroke-width="1.7"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				{own ? `Download for ${own.system}` : 'Download'}
			</Button>

			<Button href={tool.source}>
				<svg viewBox="0 0 16 16" aria-hidden="true" class="size-[1.05em]">
					<path
						fill="currentColor"
						d="M8 .2a8 8 0 00-2.53 15.59c.4.07.55-.17.55-.38v-1.34c-2.23.48-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.05-.49.05-.49.8.06 1.23.83 1.23.83.72 1.22 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 014 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.19c0 .21.15.46.55.38A8 8 0 008 .2z"
					/>
				</svg>
				Source
			</Button>
		</div>

		<p class="text-[0.86rem] text-muted">
			Also for
			{#each tool.downloads as download, i (download.system)}
				<a href={download.href} class="underline underline-offset-[3px] hover:text-white">
					{download.system}
				</a>{i < tool.downloads.length - 2 ? ', ' : i === tool.downloads.length - 2 ? ' and ' : '.'}
			{/each}
		</p>
	</div>
</article>
