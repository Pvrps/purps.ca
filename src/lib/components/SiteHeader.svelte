<script lang="ts">
	interface Props {
		/** The site's address, shown as its name. */
		name: string;
		/** What kind of place this is, in a word. */
		label: string;
		icon: string;
		/** Places on the page itself. */
		links: { href: string; text: string }[];
		/** Where the site's code is kept. */
		github: string;
	}

	let { name, label, icon, links, github }: Props = $props();
</script>

<header
	class="sticky top-0 z-10 -mx-6 flex items-center justify-between gap-4 bg-ink/70 px-6 py-3 font-mono text-[0.8rem] tracking-[0.08em] backdrop-blur-md"
>
	<a href="/" class="flex items-center gap-[0.7em] font-semibold no-underline">
		<img src={icon} alt="" class="size-[26px]" />
		{name} <span class="font-normal text-muted">// {label}</span>
	</a>

	<nav class="flex items-center gap-6">
		<!-- On a narrow screen there is only room for the way off the site. -->
		{#each links as link (link.href)}
			<a href={link.href} class="text-muted no-underline hover:text-white max-md:hidden">
				{link.text}
			</a>
		{/each}

		<!-- Set apart as a button, so it isn't taken for one more place on the page. -->
		<a
			href={github}
			target="_blank"
			rel="noreferrer"
			class="flex items-center gap-[0.6em] rounded-full border border-white/15 bg-white/5 px-[1em] py-[0.5em] text-white no-underline transition hover:border-(--accent) hover:text-(--accent)"
		>
			<svg viewBox="0 0 16 16" aria-hidden="true" class="size-[1.25em]">
				<path
					fill="currentColor"
					d="M8 .2a8 8 0 00-2.53 15.59c.4.07.55-.17.55-.38v-1.34c-2.23.48-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.05-.49.05-.49.8.06 1.23.83 1.23.83.72 1.22 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 014 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.19c0 .21.15.46.55.38A8 8 0 008 .2z"
				/>
			</svg>
			GitHub
			<svg viewBox="0 0 16 16" aria-hidden="true" class="size-[0.9em] opacity-60">
				<path
					d="M6 3h7v7M13 3L4 12"
					fill="none"
					stroke="currentColor"
					stroke-width="1.7"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</a>
	</nav>
</header>
