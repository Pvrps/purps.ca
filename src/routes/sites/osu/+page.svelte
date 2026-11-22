<script lang="ts">
	import SiteHeader from '#lib/components/SiteHeader.svelte';
	import Tag from '#lib/components/Tag.svelte';
	import ToolCard from '#lib/components/ToolCard.svelte';
	import HitCircles from '#lib/osu/HitCircles.svelte';
	import favicon from '#lib/osu/favicon.svg';
	import { TOOLS } from '#lib/osu/tools.ts';

	const links = TOOLS.map((tool) => ({ href: `#${tool.id}`, text: tool.name.toLowerCase() }));
	const github = 'https://github.com/Pvrps?tab=repositories&q=osu&type=&language=&sort=';
</script>

<svelte:head>
	<title>osu! tools</title>
	<meta name="description" content="Tools for osu!, starting with a skin mixer for osu!lazer." />
	<meta name="theme-color" content="#120f1c" />
	<meta property="og:title" content="osu! tools" />
	<meta
		property="og:description"
		content="Tools for osu!, starting with a skin mixer for osu!lazer."
	/>
	<link rel="icon" type="image/svg+xml" href={favicon} />
</svelte:head>

<div
	class="flex min-h-dvh flex-col overflow-x-clip [--accent:var(--color-pink)]"
	style="background:
		radial-gradient(900px 520px at 12% -8%, rgb(255 102 171 / 0.2), transparent 70%),
		radial-gradient(900px 620px at 96% 8%, rgb(140 102 255 / 0.2), transparent 70%),
		radial-gradient(800px 600px at 60% 110%, rgb(93 214 255 / 0.1), transparent 70%)"
>
	<HitCircles />

	<div class="relative mx-auto flex w-[min(1280px,100%-3rem)] flex-1 flex-col">
		<SiteHeader name="osu.purps.ca" label="tools" icon={favicon} {links} {github} />

		<section class="flex flex-col justify-center py-8">
			<Tag>osu! tools</Tag>
			<h1 class="mt-4 font-serif text-[clamp(2rem,4vw,2.8rem)] leading-[1.12]">
				Tools for <b class="font-semibold text-(--accent)">osu!</b>
			</h1>
		</section>

		<section class="flex flex-1 flex-col">
			{#each TOOLS as tool, i (tool.id)}
				<!--
					Each tool has a screen to itself. The first shares its screen with the title above it, taking
					whatever room is left, so a page with one tool is exactly as tall as the screen.
				-->
				<div
					class="grid items-center pb-6 {i === 0 ? 'flex-1' : 'min-h-[calc(100dvh-3.7rem)] pt-6'}"
				>
					<ToolCard {tool} flip={i % 2 === 1} />
				</div>
			{/each}
		</section>
	</div>
</div>
