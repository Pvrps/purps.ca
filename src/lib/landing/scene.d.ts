/** Draws the 3D scene into a canvas. Throws where WebGL isn't to be had. */
export function startScene(
	canvas: HTMLCanvasElement,
	options?: { reduced?: boolean }
): { resize: () => void; stop: () => void };
