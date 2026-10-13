export class OgcError extends Error {
    readonly status: number | null;

    constructor(message: string, status: number | null = null) {
        super(message);
        this.name = 'OgcError';
        this.status = status;
    }
}

export const exceptionText = (body: string): string | null => {
    const match = /<(?:ows:)?ExceptionText>([\s\S]*?)<\/(?:ows:)?ExceptionText>/.exec(body)
        ?? /<ServiceException[^>]*>([\s\S]*?)<\/ServiceException>/.exec(body);
    return match?.[1]?.trim() ?? null;
};

export const withQuery = (url: string, params: readonly (readonly [string, string])[]): string => {
    const target = new URL(url, typeof location === 'undefined' ? 'http://localhost/' : location.href);
    params.forEach(([key, value]) => {
        if (key === 'subset') target.searchParams.append(key, value);
        else target.searchParams.set(key, value);
    });
    return /^[a-z]+:\/\//i.test(url) ? target.toString() : `${target.pathname}${target.search}`;
};

const isXml = (response: Response, bytes: Uint8Array): boolean => {
    const type = response.headers.get('content-type') ?? '';
    return /xml/i.test(type) || bytes[0] === 0x3c;
};

export const fetchBinary = async (url: string, fetcher: typeof fetch, signal?: AbortSignal): Promise<{ response: Response; buffer: ArrayBuffer }> => {
    const response = await fetcher(url, signal ? { signal } : {});
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 1));
    if (!response.ok || isXml(response, bytes)) {
        const text = new TextDecoder().decode(buffer);
        throw new OgcError(exceptionText(text) ?? `Request failed with HTTP ${response.status}`, response.status);
    }
    return { response, buffer };
};
