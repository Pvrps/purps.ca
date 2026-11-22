<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		class?: string;
	}

	let { children, class: extra = '' }: Props = $props();
</script>

<!-- The small spaced-out label, led in by a rule, which heads a section on every site. -->
<div
	class="flex items-center gap-[0.9em] font-mono text-[0.72rem] tracking-[0.34em] text-(--accent) uppercase before:h-px before:w-[2.2em] before:bg-current before:opacity-70 {extra}"
>
	{@render children()}
</div>
