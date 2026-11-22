import { describe, expect, it } from 'bun:test';
import { routeFor, siteFor } from './sites';

describe('siteFor', () => {
	it('picks a site by the first part of its name', () => {
		expect(siteFor('osu.purps.ca')).toBe('osu');
		expect(siteFor('osu.localhost')).toBe('osu');
		expect(siteFor('OSU.Purps.CA')).toBe('osu');
	});

	it('gives every other name the landing page', () => {
		expect(siteFor('purps.ca')).toBe('landing');
		expect(siteFor('www.purps.ca')).toBe('landing');
		expect(siteFor('nothing-here.purps.ca')).toBe('landing');
		expect(siteFor('localhost')).toBe('landing');
		expect(siteFor('192.168.1.10')).toBe('landing');
	});

	it("isn't fooled by a name which merely ends the same", () => {
		expect(siteFor('osu.notpurps.ca')).toBe('landing');
		expect(siteFor('osu.purps.ca.example.com')).toBe('landing');
	});
});

describe('routeFor', () => {
	it('puts each address under its own site', () => {
		expect(routeFor('osu.purps.ca', '/')).toBe('/sites/osu');
		expect(routeFor('purps.ca', '/')).toBe('/sites/landing');
		expect(routeFor('osu.purps.ca', '/anything')).toBe('/sites/osu/anything');
	});

	it("keeps one site's pages out of reach of another's name", () => {
		expect(routeFor('purps.ca', '/sites/osu')).toBe('/sites/landing/sites/osu');
	});

	it('leaves shared addresses alone', () => {
		expect(routeFor('osu.purps.ca', '/healthz')).toBe('/healthz');
	});
});
