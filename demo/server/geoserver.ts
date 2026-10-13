import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { personasCollection } from './personas.js';

export type Query = (name: string) => string | null;

export type Handler = (query: Query, res: ServerResponse) => boolean;

const exception = (res: ServerResponse, text: string): void => {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/xml');
    res.end(`<ows:ExceptionReport><ows:Exception><ows:ExceptionText>${text}</ows:ExceptionText></ows:Exception></ows:ExceptionReport>`);
};

export const sendJson = (res: ServerResponse, body: unknown): void => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(body));
};

const wfs: Handler = (query, res) => {
    if (query('request') !== 'GetFeature') return false;
    const type = query('typeNames') ?? query('typeName');
    if (type === 'demo:personas') {
        sendJson(res, personasCollection(Date.now()));
        return true;
    }
    exception(res, `Unknown type ${type ?? ''}`);
    return true;
};

const handlers: Record<string, Handler[]> = { WFS: [wfs] };

export const registerHandler = (service: string, handler: Handler): void => {
    handlers[service] = [...(handlers[service] ?? []), handler];
};

const handle = (req: IncomingMessage, res: ServerResponse, next: () => void): void => {
    const params = new URL(req.url ?? '/', 'http://demo').searchParams;
    const lower = new Map([...params.entries()].map(([key, value]) => [key.toLowerCase(), value]));
    const query: Query = (name) => lower.get(name.toLowerCase()) ?? null;
    const service = (query('service') ?? '').toUpperCase();
    const served = (handlers[service] ?? []).some((handler) => handler(query, res));
    if (!served) next();
};

export const fakeGeoServer = (): Plugin => ({
    name: 'alebrije-fake-geoserver',
    configureServer(server) {
        server.middlewares.use('/geoserver/ows', handle);
    },
    configurePreviewServer(server) {
        server.middlewares.use('/geoserver/ows', handle);
    },
});
