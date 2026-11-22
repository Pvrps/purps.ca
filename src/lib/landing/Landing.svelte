<script lang="ts">
	import './landing.css';
	import { page } from '$app/state';
	import Tag from '#lib/components/Tag.svelte';
	import { SITES } from '#lib/known.ts';
	import { addressOf } from '#lib/sites.ts';
	import { startFairy, startTerminal } from './effects';

	let gl = $state<HTMLCanvasElement>();
	let fx: HTMLCanvasElement;
	let out: HTMLElement;
	let clock: HTMLElement;
	let ready = $state(false);
	// The routes are held back until the terminal has said its piece.
	let typed = $state(false);

	// Somewhere to go from here, listed by the terminal: each site, by the address it has from wherever this
	// page was reached.
	const routes = $derived(
		SITES.map((site) => {
			const href = addressOf(site.name, page.url);

			return { href, host: new URL(href).host, label: site.label };
		})
	);

	$effect(() => {
		const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
		const stops = [
			startFairy(fx, reduced),
			startTerminal(out, clock, { reduced, done: () => (typed = true) })
		];
		let gone = false;

		// The scene is large, so it is fetched only once the page is up, and only in a browser.
		void import('./scene.js')
			.then(({ startScene }) => {
				if (gone || !gl) return;

				stops.push(startScene(gl, { reduced }).stop);
				ready = true;
			})
			.catch((error) => {
				// No WebGL: the gradient behind stays as the background.
				console.warn('3D scene unavailable:', error);
			});

		return () => {
			gone = true;
			stops.forEach((stop) => stop());
		};
	});
</script>

<svelte:head>
	<title>Lost in the Forest</title>
	<meta name="robots" content="noindex, nofollow" />
	<meta name="theme-color" content="#3f9c8a" />
	<link
		rel="icon"
		href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><g fill='%23ffd75a'><polygon points='60,24 77,53 43,53'/><polygon points='43,53 60,82 26,82'/><polygon points='77,53 94,82 60,82'/></g></svg>"
	/>
</svelte:head>

<div class="landing [--accent:var(--color-mint)]">
	<div class="scene" aria-hidden="true">
		<canvas bind:this={gl} class="gl" class:ready></canvas>
		<div class="shade"></div>
	</div>

	<main>
		<div class="card">
			<svg class="gem" viewBox="0 0 120 120" fill="none" aria-hidden="true">
				<defs>
					<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stop-color="#fff6c2" /><stop offset=".5" stop-color="#ffd75a" /><stop
							offset="1"
							stop-color="#c98a12"
						/>
					</linearGradient>
				</defs>
				<circle
					class="ring"
					cx="60"
					cy="60"
					r="54"
					stroke="#ffffff"
					stroke-width="1.2"
					stroke-dasharray="3 9"
					opacity=".7"
				/>
				<circle
					class="ring2"
					cx="60"
					cy="60"
					r="46"
					stroke="#ffe08a"
					stroke-width="1"
					stroke-dasharray="40 14 4 14"
					opacity=".6"
				/>
				<g class="core" fill="url(#gold)" stroke="#fff3b0" stroke-width="1" stroke-linejoin="round">
					<polygon points="60,24 77,53 43,53" />
					<polygon points="43,53 60,82 26,82" />
					<polygon points="77,53 94,82 60,82" />
				</g>
			</svg>

			<Tag class="text-[clamp(0.62rem,1.1vw,0.74rem)]">404 // unrouted host</Tag>

			<div class="term" role="status">
				<header>
					<i><b></b></i><span>forest.gateway</span><span class="clock" bind:this={clock}>
						--:--:--
					</span>
				</header>
				<pre bind:this={out}></pre>

				{#if routes.length}
					<nav class="routes" class:typed aria-label="Sites">
						<h2>routes</h2>
						{#each routes as route (route.href)}
							<a href={route.href}>
								<span class="arrow" aria-hidden="true">&rarr;</span>
								<b>{route.host}</b>
								<i></i>
								<span>{route.label}</span>
							</a>
						{/each}
					</nav>
				{/if}
			</div>
		</div>
	</main>

	<canvas bind:this={fx} class="fx" aria-hidden="true"></canvas>
</div>
