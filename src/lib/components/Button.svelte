<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		href: string;
		/** The one thing a visitor is most likely there to do. */
		primary?: boolean;
		children: Snippet;
	}

	let { href, primary = false, children }: Props = $props();
</script>

<a
	{href}
	class="inline-flex items-center gap-[0.6em] rounded-full border px-[1.15em] py-[0.7em] text-[0.95rem] font-semibold no-underline transition hover:-translate-y-px {primary
		? 'border-(--accent) bg-(--accent) text-[#1b0a13] hover:brightness-110'
		: 'border-white/10 hover:border-white/30'}"
>
	{@render children()}
</a>
