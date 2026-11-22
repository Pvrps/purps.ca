import { describe, expect, it } from 'bun:test';
import { addressOf, routeFor, siteFor } from './sites';

const SITES = ['osu'];

describe('siteFor', () => {
	it('picks a site by the first part of its name', () => {
		expect(siteFor('osu.purps.ca', SITES)).toBe('osu');
		expect(siteFor('osu.localhost', SITES)).toBe('osu');
		expect(siteFor('OSU.Purps.CA', SITES)).toBe('osu');
	});

	it('gives every other name the landing page', () => {
		expect(siteFor('purps.ca', SITES)).toBe('landing');
		expect(siteFor('www.purps.ca', SITES)).toBe('landing');
		expect(siteFor('nothing-here.purps.ca', SITES)).toBe('landing');
		expect(siteFor('localhost', SITES)).toBe('landing');
		expect(siteFor('192.168.1.10', SITES)).toBe('landing');
	});

	it("isn't fooled by a name which merely ends the same", () => {
		expect(siteFor('osu.notpurps.ca', SITES)).toBe('landing');
		expect(siteFor('osu.purps.ca.example.com', SITES)).toBe('landing');
	});

	it('only knows the sites it is told of', () => {
		expect(siteFor('osu.purps.ca', [])).toBe('landing');
		expect(siteFor('landing.purps.ca', SITES)).toBe('landing');
	});
});

describe('addressOf', () => {
	it('is the public address from any public name', () => {
		expect(addressOf('osu', new URL('https://purps.ca/'))).toBe('https://osu.purps.ca');
		expect(addressOf('osu', new URL('http://nothing-here.example.com/'))).toBe(
			'https://osu.purps.ca'
		);
	});

	it('stays on the copy being worked on', () => {
		expect(addressOf('osu', new URL('http://localhost:5173/'))).toBe('http://osu.localhost:5173');
		expect(addressOf('osu', new URL('http://nope.localhost:4173/x'))).toBe(
			'http://osu.localhost:4173'
		);
	});
});

describe('routeFor', () => {
	it('puts each address under its own site', () => {
		expect(routeFor('osu.purps.ca', '/', SITES)).toBe('/sites/osu');
		expect(routeFor('purps.ca', '/', SITES)).toBe('/sites/landing');
		expect(routeFor('osu.purps.ca', '/anything', SITES)).toBe('/sites/osu/anything');
	});

	it("keeps one site's pages out of reach of another's name", () => {
		expect(routeFor('purps.ca', '/sites/osu', SITES)).toBe('/sites/landing/sites/osu');
	});

	it('leaves shared addresses alone', () => {
		expect(routeFor('osu.purps.ca', '/healthz', SITES)).toBe('/healthz');
	});
});
