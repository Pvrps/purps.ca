<script lang="ts">
	import SiteHeader from '#lib/components/SiteHeader.svelte';
	import Tag from '#lib/components/Tag.svelte';
	import ToolCard from '#lib/components/ToolCard.svelte';
	import HitCircles from '#lib/osu/HitCircles.svelte';
	import favicon from '#lib/osu/favicon.svg';
	import { TOOLS } from '#lib/osu/tools.ts';

	const links = [
		...TOOLS.map((tool) => ({ href: `#${tool.id}`, text: tool.name.toLowerCase() })),
		{
			href: 'https://github.com/Pvrps?tab=repositories&q=osu&type=&language=&sort=',
			text: 'github'
		}
	];
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
	class="min-h-screen overflow-x-clip [--accent:var(--color-pink)] [--hero:9.5rem]"
	style="background:
		radial-gradient(900px 520px at 12% -8%, rgb(255 102 171 / 0.2), transparent 70%),
		radial-gradient(900px 620px at 96% 8%, rgb(140 102 255 / 0.2), transparent 70%),
		radial-gradient(800px 600px at 60% 110%, rgb(93 214 255 / 0.1), transparent 70%)"
>
	<HitCircles />

	<div class="relative mx-auto w-[min(1280px,100%-3rem)]">
		<SiteHeader name="osu.purps.ca" label="tools" icon={favicon} {links} />

		<section class="flex h-(--hero) flex-col justify-center">
			<Tag>osu! tools</Tag>
			<h1 class="mt-4 font-serif text-[clamp(2rem,4vw,2.8rem)] leading-[1.12]">
				Tools for <b class="font-semibold text-(--accent)">osu!</b>
			</h1>
		</section>

		<section>
			{#each TOOLS as tool, i (tool.id)}
				<!-- Each tool has a screen to itself. The first shares its screen with the title above it. -->
				<div
					class="grid items-center py-6 {i === 0
						? 'min-h-[calc(100vh-3.6rem-var(--hero))] pt-0'
						: 'min-h-[calc(100vh-3.6rem)]'}"
				>
					<ToolCard {tool} flip={i % 2 === 1} />
				</div>
			{/each}
		</section>
	</div>
</div>
