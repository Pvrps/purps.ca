<script lang="ts">
	interface Props {
		/** The site's address, shown as its name. */
		name: string;
		/** What kind of place this is, in a word. */
		label: string;
		icon: string;
		links: { href: string; text: string }[];
	}

	let { name, label, icon, links }: Props = $props();
</script>

<header
	class="sticky top-0 z-10 -mx-6 flex items-center justify-between gap-4 bg-ink/70 px-6 py-4 font-mono text-[0.8rem] tracking-[0.08em] backdrop-blur-md"
>
	<a href="/" class="flex items-center gap-[0.7em] font-semibold no-underline">
		<img src={icon} alt="" class="size-[26px]" />
		{name} <span class="font-normal text-muted">// {label}</span>
	</a>

	<nav class="flex gap-6">
		{#each links as link, i (link.href)}
			<!-- On a narrow screen there is only room for the last link, which leads off the site. -->
			<a
				href={link.href}
				class="text-muted no-underline hover:text-white {i < links.length - 1
					? 'max-md:hidden'
					: ''}"
			>
				{link.text}
			</a>
		{/each}
	</nav>
</header>
