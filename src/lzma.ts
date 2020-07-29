
// @ts-ignore
import * as LZMA from "../node_modules/lzma/src/lzma_worker-min";

export function lzmaCompressAsync(text: string) {
    const lzma = LZMA.LZMA;

    return new Promise<Uint8Array>((resolve, reject) => {
        try {
            lzma.compress(text, 7, (res: any, error: any) => {
                if (error) reject(error);
                else resolve(new Uint8Array(res));
            });
        }
        catch (e) {
            reject(e);
        }
    });
}

export function lzmaDecompressAsync(data: Uint8Array) {
    const lzma = LZMA.LZMA;

    return new Promise<string>((resolve, reject) => {
        try {
            lzma.decompress(data, (res: string, error: any) => {
                if (error) reject(error);
                else resolve(res);
            });
        }
        catch (e) {
            reject(e);
        }
    });
}