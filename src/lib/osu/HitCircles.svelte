<script lang="ts">
	// Hit circles with their approach circles closing in, drifting behind the page.

	interface Circle {
		x: number;
		y: number;
		radius: number;
		colour: string;
		life: number;
		age: number;
	}

	const COLOURS = ['#ff66ab', '#8c66ff', '#5dd6ff'];

	let canvas: HTMLCanvasElement;

	$effect(() => {
		const context = canvas.getContext('2d')!;
		const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
		let width = 0;
		let height = 0;
		let request = 0;

		const resize = () => {
			const ratio = Math.min(2, devicePixelRatio || 1);

			width = innerWidth;
			height = innerHeight;
			canvas.width = width * ratio;
			canvas.height = height * ratio;
			context.setTransform(ratio, 0, 0, ratio, 0, 0);
		};

		const spawn = (age: number): Circle => ({
			x: Math.random() * width,
			y: Math.random() * height,
			radius: 26 + Math.random() * 30,
			colour: COLOURS[Math.floor(Math.random() * COLOURS.length)],
			life: 4200 + Math.random() * 2600,
			age
		});

		const draw = (circle: Circle) => {
			const progress = circle.age / circle.life;
			// Fades in, is "hit" three quarters of the way through, then swells and fades.
			const hit = Math.max(0, (progress - 0.75) / 0.25);
			const alpha = hit > 0 ? 1 - hit : Math.min(1, progress * 5);

			context.globalAlpha = alpha * 0.5;
			context.lineWidth = 3;
			context.strokeStyle = context.fillStyle = circle.colour;
			context.beginPath();
			context.arc(circle.x, circle.y, circle.radius * (1 + hit * 0.35), 0, Math.PI * 2);
			context.stroke();
			context.globalAlpha = alpha * 0.1;
			context.fill();

			if (hit === 0) {
				context.globalAlpha = alpha * 0.35;
				context.lineWidth = 1.5;
				context.beginPath();
				context.arc(
					circle.x,
					circle.y,
					circle.radius * (1 + 2.2 * (1 - progress / 0.75)),
					0,
					Math.PI * 2
				);
				context.stroke();
			}
		};

		resize();

		const count = Math.round(Math.min(16, Math.max(6, (width * height) / 110000)));
		let circles = Array.from({ length: count }, () => spawn(Math.random() * 4000));
		let last = performance.now();

		const frame = (now: number) => {
			const elapsed = Math.min(64, now - last);
			last = now;

			context.clearRect(0, 0, width, height);
			circles = circles.map((circle) => {
				circle.age += elapsed;
				return circle.age >= circle.life ? spawn(0) : circle;
			});
			circles.forEach(draw);
			context.globalAlpha = 1;

			// With motion turned down, a single still frame is drawn and left.
			if (!still) request = requestAnimationFrame(frame);
		};

		request = requestAnimationFrame(frame);
		addEventListener('resize', resize);

		return () => {
			cancelAnimationFrame(request);
			removeEventListener('resize', resize);
		};
	});
</script>

<canvas
	bind:this={canvas}
	aria-hidden="true"
	class="pointer-events-none fixed inset-0 size-full opacity-55"
></canvas>
