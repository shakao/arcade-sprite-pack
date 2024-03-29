/**
 * This file contains util functions taken directly from pxt-core and lightly modified
 */

import { AssetType, getProjectPalette } from "./project";

export const IMAGE_MIME_TYPE = "image/x-mkcd-f4"

export function browserDownloadUInt8Array(buf: Uint8Array, name: string, contentType: string = "application/octet-stream", userContextWindow?: Window, onError?: (err: any) => void): string {
    return browserDownloadBase64(btoa(uint8ArrayToString(buf)), name, contentType, userContextWindow, onError)
}

export function browserDownloadText(text: string, filename: string) {
    const encoded = btoa(text);
    browserDownloadDataUri(toDownloadDataUri(encoded, "text/plain"), filename)
}

export function isEdge(): boolean {
    return !!navigator && /Edge/i.test(navigator.userAgent);
}

export function isIE(): boolean {
    return !!navigator && /Trident/i.test(navigator.userAgent);
}

export function browserDownloadDataUri(uri: string, name: string) {
    if (isEdge() || isIE()) {
        //Fix for edge
        let byteString = atob(uri.split(',')[1]);
        let ia = stringToUint8Array(byteString);
        let blob = new Blob([ia], { type: "img/png" });
        window.navigator.msSaveOrOpenBlob(blob, name);
    } else {
        let link = <any>window.document.createElement('a');
        if (typeof link.download == "string") {
            link.href = uri;
            link.download = name;
            document.body.appendChild(link); // for FF
            link.click();
            document.body.removeChild(link);
        } else {
            document.location.href = uri;
        }
    }
}

export function browserDownloadBase64(b64: string, name: string, contentType: string = "application/octet-stream", userContextWindow?: Window, onError?: (err: any) => void): string {
    const saveBlob = (<any>window).navigator.msSaveOrOpenBlob;
    const dataurl = toDownloadDataUri(b64, name);
    try {
        if (saveBlob) {
            const b = new Blob([stringToUint8Array(atob(b64))], { type: contentType })
            const result = (<any>window).navigator.msSaveOrOpenBlob(b, name);
        } else browserDownloadDataUri(dataurl, name);
    } catch (e) {
        if (onError) onError(e);
    }
    return dataurl;
}

export function toDownloadDataUri(b64: string, contentType: string): string {
    let protocol = "data";
    const dataurl = protocol + ":" + contentType + ";base64," + b64
    return dataurl;
}

// this will take lower 8 bits from each character
export function stringToUint8Array(input: string) {
    let len = input.length;
    let res = new Uint8Array(len)
    for (let i = 0; i < len; ++i)
        res[i] = input.charCodeAt(i) & 0xff;
    return res;
}

export function hexToUint8Array(hex: string) {
    let r = new Uint8ClampedArray(hex.length >> 1);
    for (let i = 0; i < hex.length; i += 2)
        r[i >> 1] = parseInt(hex.slice(i, i + 2), 16)
    return r
}

export function uint8ArrayToString(input: ArrayLike<number>) {
    let len = input.length;
    let res = ""
    for (let i = 0; i < len; ++i)
        res += String.fromCharCode(input[i]);
    return res;
}


const unicodeES5IdentifierStart = [170, 170, 181, 181, 186, 186, 192, 214, 216, 246, 248, 705, 710, 721, 736, 740, 748, 748, 750, 750, 880, 884, 886, 887, 890, 893, 902, 902, 904, 906, 908, 908, 910, 929, 931, 1013, 1015, 1153, 1162, 1319, 1329, 1366, 1369, 1369, 1377, 1415, 1488, 1514, 1520, 1522, 1568, 1610, 1646, 1647, 1649, 1747, 1749, 1749, 1765, 1766, 1774, 1775, 1786, 1788, 1791, 1791, 1808, 1808, 1810, 1839, 1869, 1957, 1969, 1969, 1994, 2026, 2036, 2037, 2042, 2042, 2048, 2069, 2074, 2074, 2084, 2084, 2088, 2088, 2112, 2136, 2208, 2208, 2210, 2220, 2308, 2361, 2365, 2365, 2384, 2384, 2392, 2401, 2417, 2423, 2425, 2431, 2437, 2444, 2447, 2448, 2451, 2472, 2474, 2480, 2482, 2482, 2486, 2489, 2493, 2493, 2510, 2510, 2524, 2525, 2527, 2529, 2544, 2545, 2565, 2570, 2575, 2576, 2579, 2600, 2602, 2608, 2610, 2611, 2613, 2614, 2616, 2617, 2649, 2652, 2654, 2654, 2674, 2676, 2693, 2701, 2703, 2705, 2707, 2728, 2730, 2736, 2738, 2739, 2741, 2745, 2749, 2749, 2768, 2768, 2784, 2785, 2821, 2828, 2831, 2832, 2835, 2856, 2858, 2864, 2866, 2867, 2869, 2873, 2877, 2877, 2908, 2909, 2911, 2913, 2929, 2929, 2947, 2947, 2949, 2954, 2958, 2960, 2962, 2965, 2969, 2970, 2972, 2972, 2974, 2975, 2979, 2980, 2984, 2986, 2990, 3001, 3024, 3024, 3077, 3084, 3086, 3088, 3090, 3112, 3114, 3123, 3125, 3129, 3133, 3133, 3160, 3161, 3168, 3169, 3205, 3212, 3214, 3216, 3218, 3240, 3242, 3251, 3253, 3257, 3261, 3261, 3294, 3294, 3296, 3297, 3313, 3314, 3333, 3340, 3342, 3344, 3346, 3386, 3389, 3389, 3406, 3406, 3424, 3425, 3450, 3455, 3461, 3478, 3482, 3505, 3507, 3515, 3517, 3517, 3520, 3526, 3585, 3632, 3634, 3635, 3648, 3654, 3713, 3714, 3716, 3716, 3719, 3720, 3722, 3722, 3725, 3725, 3732, 3735, 3737, 3743, 3745, 3747, 3749, 3749, 3751, 3751, 3754, 3755, 3757, 3760, 3762, 3763, 3773, 3773, 3776, 3780, 3782, 3782, 3804, 3807, 3840, 3840, 3904, 3911, 3913, 3948, 3976, 3980, 4096, 4138, 4159, 4159, 4176, 4181, 4186, 4189, 4193, 4193, 4197, 4198, 4206, 4208, 4213, 4225, 4238, 4238, 4256, 4293, 4295, 4295, 4301, 4301, 4304, 4346, 4348, 4680, 4682, 4685, 4688, 4694, 4696, 4696, 4698, 4701, 4704, 4744, 4746, 4749, 4752, 4784, 4786, 4789, 4792, 4798, 4800, 4800, 4802, 4805, 4808, 4822, 4824, 4880, 4882, 4885, 4888, 4954, 4992, 5007, 5024, 5108, 5121, 5740, 5743, 5759, 5761, 5786, 5792, 5866, 5870, 5872, 5888, 5900, 5902, 5905, 5920, 5937, 5952, 5969, 5984, 5996, 5998, 6000, 6016, 6067, 6103, 6103, 6108, 6108, 6176, 6263, 6272, 6312, 6314, 6314, 6320, 6389, 6400, 6428, 6480, 6509, 6512, 6516, 6528, 6571, 6593, 6599, 6656, 6678, 6688, 6740, 6823, 6823, 6917, 6963, 6981, 6987, 7043, 7072, 7086, 7087, 7098, 7141, 7168, 7203, 7245, 7247, 7258, 7293, 7401, 7404, 7406, 7409, 7413, 7414, 7424, 7615, 7680, 7957, 7960, 7965, 7968, 8005, 8008, 8013, 8016, 8023, 8025, 8025, 8027, 8027, 8029, 8029, 8031, 8061, 8064, 8116, 8118, 8124, 8126, 8126, 8130, 8132, 8134, 8140, 8144, 8147, 8150, 8155, 8160, 8172, 8178, 8180, 8182, 8188, 8305, 8305, 8319, 8319, 8336, 8348, 8450, 8450, 8455, 8455, 8458, 8467, 8469, 8469, 8473, 8477, 8484, 8484, 8486, 8486, 8488, 8488, 8490, 8493, 8495, 8505, 8508, 8511, 8517, 8521, 8526, 8526, 8544, 8584, 11264, 11310, 11312, 11358, 11360, 11492, 11499, 11502, 11506, 11507, 11520, 11557, 11559, 11559, 11565, 11565, 11568, 11623, 11631, 11631, 11648, 11670, 11680, 11686, 11688, 11694, 11696, 11702, 11704, 11710, 11712, 11718, 11720, 11726, 11728, 11734, 11736, 11742, 11823, 11823, 12293, 12295, 12321, 12329, 12337, 12341, 12344, 12348, 12353, 12438, 12445, 12447, 12449, 12538, 12540, 12543, 12549, 12589, 12593, 12686, 12704, 12730, 12784, 12799, 13312, 19893, 19968, 40908, 40960, 42124, 42192, 42237, 42240, 42508, 42512, 42527, 42538, 42539, 42560, 42606, 42623, 42647, 42656, 42735, 42775, 42783, 42786, 42888, 42891, 42894, 42896, 42899, 42912, 42922, 43000, 43009, 43011, 43013, 43015, 43018, 43020, 43042, 43072, 43123, 43138, 43187, 43250, 43255, 43259, 43259, 43274, 43301, 43312, 43334, 43360, 43388, 43396, 43442, 43471, 43471, 43520, 43560, 43584, 43586, 43588, 43595, 43616, 43638, 43642, 43642, 43648, 43695, 43697, 43697, 43701, 43702, 43705, 43709, 43712, 43712, 43714, 43714, 43739, 43741, 43744, 43754, 43762, 43764, 43777, 43782, 43785, 43790, 43793, 43798, 43808, 43814, 43816, 43822, 43968, 44002, 44032, 55203, 55216, 55238, 55243, 55291, 63744, 64109, 64112, 64217, 64256, 64262, 64275, 64279, 64285, 64285, 64287, 64296, 64298, 64310, 64312, 64316, 64318, 64318, 64320, 64321, 64323, 64324, 64326, 64433, 64467, 64829, 64848, 64911, 64914, 64967, 65008, 65019, 65136, 65140, 65142, 65276, 65313, 65338, 65345, 65370, 65382, 65470, 65474, 65479, 65482, 65487, 65490, 65495, 65498, 65500,];
const unicodeES5IdentifierPart = [170, 170, 181, 181, 186, 186, 192, 214, 216, 246, 248, 705, 710, 721, 736, 740, 748, 748, 750, 750, 768, 884, 886, 887, 890, 893, 902, 902, 904, 906, 908, 908, 910, 929, 931, 1013, 1015, 1153, 1155, 1159, 1162, 1319, 1329, 1366, 1369, 1369, 1377, 1415, 1425, 1469, 1471, 1471, 1473, 1474, 1476, 1477, 1479, 1479, 1488, 1514, 1520, 1522, 1552, 1562, 1568, 1641, 1646, 1747, 1749, 1756, 1759, 1768, 1770, 1788, 1791, 1791, 1808, 1866, 1869, 1969, 1984, 2037, 2042, 2042, 2048, 2093, 2112, 2139, 2208, 2208, 2210, 2220, 2276, 2302, 2304, 2403, 2406, 2415, 2417, 2423, 2425, 2431, 2433, 2435, 2437, 2444, 2447, 2448, 2451, 2472, 2474, 2480, 2482, 2482, 2486, 2489, 2492, 2500, 2503, 2504, 2507, 2510, 2519, 2519, 2524, 2525, 2527, 2531, 2534, 2545, 2561, 2563, 2565, 2570, 2575, 2576, 2579, 2600, 2602, 2608, 2610, 2611, 2613, 2614, 2616, 2617, 2620, 2620, 2622, 2626, 2631, 2632, 2635, 2637, 2641, 2641, 2649, 2652, 2654, 2654, 2662, 2677, 2689, 2691, 2693, 2701, 2703, 2705, 2707, 2728, 2730, 2736, 2738, 2739, 2741, 2745, 2748, 2757, 2759, 2761, 2763, 2765, 2768, 2768, 2784, 2787, 2790, 2799, 2817, 2819, 2821, 2828, 2831, 2832, 2835, 2856, 2858, 2864, 2866, 2867, 2869, 2873, 2876, 2884, 2887, 2888, 2891, 2893, 2902, 2903, 2908, 2909, 2911, 2915, 2918, 2927, 2929, 2929, 2946, 2947, 2949, 2954, 2958, 2960, 2962, 2965, 2969, 2970, 2972, 2972, 2974, 2975, 2979, 2980, 2984, 2986, 2990, 3001, 3006, 3010, 3014, 3016, 3018, 3021, 3024, 3024, 3031, 3031, 3046, 3055, 3073, 3075, 3077, 3084, 3086, 3088, 3090, 3112, 3114, 3123, 3125, 3129, 3133, 3140, 3142, 3144, 3146, 3149, 3157, 3158, 3160, 3161, 3168, 3171, 3174, 3183, 3202, 3203, 3205, 3212, 3214, 3216, 3218, 3240, 3242, 3251, 3253, 3257, 3260, 3268, 3270, 3272, 3274, 3277, 3285, 3286, 3294, 3294, 3296, 3299, 3302, 3311, 3313, 3314, 3330, 3331, 3333, 3340, 3342, 3344, 3346, 3386, 3389, 3396, 3398, 3400, 3402, 3406, 3415, 3415, 3424, 3427, 3430, 3439, 3450, 3455, 3458, 3459, 3461, 3478, 3482, 3505, 3507, 3515, 3517, 3517, 3520, 3526, 3530, 3530, 3535, 3540, 3542, 3542, 3544, 3551, 3570, 3571, 3585, 3642, 3648, 3662, 3664, 3673, 3713, 3714, 3716, 3716, 3719, 3720, 3722, 3722, 3725, 3725, 3732, 3735, 3737, 3743, 3745, 3747, 3749, 3749, 3751, 3751, 3754, 3755, 3757, 3769, 3771, 3773, 3776, 3780, 3782, 3782, 3784, 3789, 3792, 3801, 3804, 3807, 3840, 3840, 3864, 3865, 3872, 3881, 3893, 3893, 3895, 3895, 3897, 3897, 3902, 3911, 3913, 3948, 3953, 3972, 3974, 3991, 3993, 4028, 4038, 4038, 4096, 4169, 4176, 4253, 4256, 4293, 4295, 4295, 4301, 4301, 4304, 4346, 4348, 4680, 4682, 4685, 4688, 4694, 4696, 4696, 4698, 4701, 4704, 4744, 4746, 4749, 4752, 4784, 4786, 4789, 4792, 4798, 4800, 4800, 4802, 4805, 4808, 4822, 4824, 4880, 4882, 4885, 4888, 4954, 4957, 4959, 4992, 5007, 5024, 5108, 5121, 5740, 5743, 5759, 5761, 5786, 5792, 5866, 5870, 5872, 5888, 5900, 5902, 5908, 5920, 5940, 5952, 5971, 5984, 5996, 5998, 6000, 6002, 6003, 6016, 6099, 6103, 6103, 6108, 6109, 6112, 6121, 6155, 6157, 6160, 6169, 6176, 6263, 6272, 6314, 6320, 6389, 6400, 6428, 6432, 6443, 6448, 6459, 6470, 6509, 6512, 6516, 6528, 6571, 6576, 6601, 6608, 6617, 6656, 6683, 6688, 6750, 6752, 6780, 6783, 6793, 6800, 6809, 6823, 6823, 6912, 6987, 6992, 7001, 7019, 7027, 7040, 7155, 7168, 7223, 7232, 7241, 7245, 7293, 7376, 7378, 7380, 7414, 7424, 7654, 7676, 7957, 7960, 7965, 7968, 8005, 8008, 8013, 8016, 8023, 8025, 8025, 8027, 8027, 8029, 8029, 8031, 8061, 8064, 8116, 8118, 8124, 8126, 8126, 8130, 8132, 8134, 8140, 8144, 8147, 8150, 8155, 8160, 8172, 8178, 8180, 8182, 8188, 8204, 8205, 8255, 8256, 8276, 8276, 8305, 8305, 8319, 8319, 8336, 8348, 8400, 8412, 8417, 8417, 8421, 8432, 8450, 8450, 8455, 8455, 8458, 8467, 8469, 8469, 8473, 8477, 8484, 8484, 8486, 8486, 8488, 8488, 8490, 8493, 8495, 8505, 8508, 8511, 8517, 8521, 8526, 8526, 8544, 8584, 11264, 11310, 11312, 11358, 11360, 11492, 11499, 11507, 11520, 11557, 11559, 11559, 11565, 11565, 11568, 11623, 11631, 11631, 11647, 11670, 11680, 11686, 11688, 11694, 11696, 11702, 11704, 11710, 11712, 11718, 11720, 11726, 11728, 11734, 11736, 11742, 11744, 11775, 11823, 11823, 12293, 12295, 12321, 12335, 12337, 12341, 12344, 12348, 12353, 12438, 12441, 12442, 12445, 12447, 12449, 12538, 12540, 12543, 12549, 12589, 12593, 12686, 12704, 12730, 12784, 12799, 13312, 19893, 19968, 40908, 40960, 42124, 42192, 42237, 42240, 42508, 42512, 42539, 42560, 42607, 42612, 42621, 42623, 42647, 42655, 42737, 42775, 42783, 42786, 42888, 42891, 42894, 42896, 42899, 42912, 42922, 43000, 43047, 43072, 43123, 43136, 43204, 43216, 43225, 43232, 43255, 43259, 43259, 43264, 43309, 43312, 43347, 43360, 43388, 43392, 43456, 43471, 43481, 43520, 43574, 43584, 43597, 43600, 43609, 43616, 43638, 43642, 43643, 43648, 43714, 43739, 43741, 43744, 43759, 43762, 43766, 43777, 43782, 43785, 43790, 43793, 43798, 43808, 43814, 43816, 43822, 43968, 44010, 44012, 44013, 44016, 44025, 44032, 55203, 55216, 55238, 55243, 55291, 63744, 64109, 64112, 64217, 64256, 64262, 64275, 64279, 64285, 64296, 64298, 64310, 64312, 64316, 64318, 64318, 64320, 64321, 64323, 64324, 64326, 64433, 64467, 64829, 64848, 64911, 64914, 64967, 65008, 65019, 65024, 65039, 65056, 65062, 65075, 65076, 65101, 65103, 65136, 65140, 65142, 65276, 65296, 65305, 65313, 65338, 65343, 65343, 65345, 65370, 65382, 65470, 65474, 65479, 65482, 65487, 65490, 65495, 65498, 65500,];
const reservedWords = ["abstract", "any", "as", "break",
    "case", "catch", "class", "continue", "const", "constructor", "debugger",
    "declare", "default", "delete", "do", "else", "enum", "export", "extends",
    "false", "finally", "for", "from", "function", "get", "if", "implements",
    "import", "in", "instanceof", "interface", "is", "let", "module", "namespace",
    "new", "null", "package", "private", "protected", "public",
    "require", "global", "return", "set", "static", "super", "switch",
    "symbol", "this", "throw", "true", "try", "type", "typeof", "var", "void",
    "while", "with", "yield", "async", "await", "of", "Math"];


export function escapeIdentifier(name: string): string {
    if (!name) return '_';

    let n = name.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_$]/g, a =>
        isIdentifierPart(a.charCodeAt(0)) ? a : "");

    if (n.length === 0 || reservedWords.indexOf(n) !== -1 || !isIdentifierStart(n.charAt(0))) {
        n = "_" + n;
    }

    return n;
}

function isIdentifierPart(charCode: number) {
    return lookupInUnicodeMap(charCode, unicodeES5IdentifierPart);
}

function isIdentifierStart(char: string) {
    if (/[a-zA-Z_$]/.test(char)) return true;
    return lookupInUnicodeMap(char.charCodeAt(0), unicodeES5IdentifierStart);
}

function lookupInUnicodeMap(code: number, map: number[]): boolean {
    // Bail out quickly if it couldn't possibly be in the map.
    if (code < map[0]) {
        return false;
    }

    // Perform binary search in one of the Unicode range maps
    let lo = 0;
    let hi: number = map.length;
    let mid: number;

    while (lo + 1 < hi) {
        mid = lo + (hi - lo) / 2;
        // mid has to be even to catch a range's beginning
        mid -= mid % 2;
        if (map[mid] <= code && code <= map[mid + 1]) {
            return true;
        }

        if (code < map[mid]) {
            hi = mid;
        }
        else {
            lo = mid + 2;
        }
    }

    return false;
}
class ImageConverter {
    private palette: Uint8Array | null = null
    private start: number = 0

    logTime() {
        if (this.start) {
            let d = Date.now() - this.start
            pxt.debug("Icon creation: " + d + "ms")
        }
    }

    convert(jresURL: string): any {
        if (!this.start)
            this.start = Date.now()

        let data = atob(jresURL.slice(jresURL.indexOf(",") + 1))
        let magic = data.charCodeAt(0);
        let w = data.charCodeAt(1);
        let h = data.charCodeAt(2);

        if (magic === 0x87) {
            magic = 0xe0 | data.charCodeAt(1);
            w = data.charCodeAt(2) | (data.charCodeAt(3) << 8);
            h = data.charCodeAt(4) | (data.charCodeAt(5) << 8);
            data = data.slice(4);
        }

        if (magic != 0xe1 && magic != 0xe4)
            return null

        function htmlColorToBytes(hexColor: string) {
            const v = parseInt(hexColor.replace(/#/, ""), 16)
            return [(v >> 0) & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff, 0xff]
        }


        if (!this.palette) {
            let arrs = getProjectPalette().map(htmlColorToBytes);

            // Set the alpha for transparency at index 0
            arrs[0][3] = 0;
            this.palette = new Uint8Array(arrs.length * 4)
            for (let i = 0; i < arrs.length; ++i) {
                this.palette[i * 4 + 0] = arrs[i][0]
                this.palette[i * 4 + 1] = arrs[i][1]
                this.palette[i * 4 + 2] = arrs[i][2]
                this.palette[i * 4 + 3] = arrs[i][3]
            }
        }

        if (magic == 0xe1) {
            return this.genMonochrome(data, w, h);
        }

        const scaleFactor = ((pxt.BrowserUtils.isEdge() || pxt.BrowserUtils.isIE()) && w < 100 && h < 100) ? 3 : 1;
        return this.genColor(data, w, h, scaleFactor);
    }

    genMonochrome(data: string, w: number, h: number) {
        let outByteW = (w + 3) & ~3

        let bmpHeaderSize = 14 + 40 + this.palette!.length
        let bmpSize = bmpHeaderSize + outByteW * h
        let bmp = new Uint8Array(bmpSize)

        bmp[0] = 66
        bmp[1] = 77
        pxt.HF2.write32(bmp, 2, bmpSize)
        pxt.HF2.write32(bmp, 10, bmpHeaderSize)
        pxt.HF2.write32(bmp, 14, 40) // size of this header
        pxt.HF2.write32(bmp, 18, w)
        pxt.HF2.write32(bmp, 22, -h) // not upside down
        pxt.HF2.write16(bmp, 26, 1) // 1 color plane
        pxt.HF2.write16(bmp, 28, 8) // 8bpp
        pxt.HF2.write32(bmp, 38, 2835) // 72dpi
        pxt.HF2.write32(bmp, 42, 2835)
        pxt.HF2.write32(bmp, 46, this.palette!.length >> 2)

        bmp.set(this.palette!, 54)

        let inP = 4
        let outP = bmpHeaderSize
        let mask = 0x01
        let v = data.charCodeAt(inP++)
        for (let x = 0; x < w; ++x) {
            outP = bmpHeaderSize + x
            for (let y = 0; y < h; ++y) {
                bmp[outP] = (v & mask) ? 1 : 0
                outP += outByteW
                mask <<= 1
                if (mask == 0x100) {
                    mask = 0x01
                    v = data.charCodeAt(inP++)
                }
            }
        }

        return "data:image/bmp;base64," + btoa(pxt.U.uint8ArrayToString(bmp))
    }

    genColor(data: string, width: number, height: number, intScale: number) {
        intScale = Math.max(1, intScale | 0);
        const w = width * intScale;
        const h = height * intScale;

        let outByteW = w << 2;
        let bmpHeaderSize = 138;
        let bmpSize = bmpHeaderSize + outByteW * h
        let bmp = new Uint8Array(bmpSize)

        bmp[0] = 66
        bmp[1] = 77
        pxt.HF2.write32(bmp, 2, bmpSize)
        pxt.HF2.write32(bmp, 10, bmpHeaderSize)
        pxt.HF2.write32(bmp, 14, 124) // size of this header
        pxt.HF2.write32(bmp, 18, w)
        pxt.HF2.write32(bmp, 22, -h) // not upside down
        pxt.HF2.write16(bmp, 26, 1) // 1 color plane
        pxt.HF2.write16(bmp, 28, 32) // 32bpp
        pxt.HF2.write16(bmp, 30, 3) // magic?
        pxt.HF2.write32(bmp, 38, 2835) // 72dpi
        pxt.HF2.write32(bmp, 42, 2835)

        pxt.HF2.write32(bmp, 54, 0xff0000) // Red bitmask
        pxt.HF2.write32(bmp, 58, 0xff00) // Green bitmask
        pxt.HF2.write32(bmp, 62, 0xff) // Blue bitmask
        pxt.HF2.write32(bmp, 66, 0xff000000) // Alpha bitmask

        // Color space (sRGB)
        bmp[70] = 0x42; // B
        bmp[71] = 0x47; // G
        bmp[72] = 0x52; // R
        bmp[73] = 0x73; // s

        let inP = 4
        let outP = bmpHeaderSize
        let isTransparent = true;

        for (let x = 0; x < w; x++) {
            let high = false;
            outP = bmpHeaderSize + (x << 2)
            let columnStart = inP;

            let v = data.charCodeAt(inP++);
            let colorStart = high ? (((v >> 4) & 0xf) << 2) : ((v & 0xf) << 2);

            for (let y = 0; y < h; y++) {
                if (v) isTransparent = false;
                bmp[outP] = this.palette![colorStart]
                bmp[outP + 1] = this.palette![colorStart + 1]
                bmp[outP + 2] = this.palette![colorStart + 2]
                bmp[outP + 3] = this.palette![colorStart + 3]
                outP += outByteW

                if (y % intScale === intScale - 1) {
                    if (high) {
                        v = data.charCodeAt(inP++);
                    }
                    high = !high;

                    colorStart = high ? (((v >> 4) & 0xf) << 2) : ((v & 0xf) << 2);
                }
            }

            if (isTransparent) {
                // If all pixels are completely transparent, browsers won't render the image properly;
                // set one pixel to be slightly opaque to fix that
                bmp[bmpHeaderSize + 3] = 1;
            }

            if (x % intScale === intScale - 1) {
                if (!(height % 2)) --inP;
                while (inP & 3) inP++
            }
            else {
                inP = columnStart;
            }
        }

        return "data:image/bmp;base64," + btoa(pxt.U.uint8ArrayToString(bmp))
    }
}


export function generatePreviewURI(asset: pxt.Asset, imgConv = new ImageConverter()) {
    switch (asset.type) {
        case AssetType.Image:
        case AssetType.Tile:
            asset.previewURI = imgConv.convert("data:image/x-mkcd-f," + (asset as pxt.ProjectImage).jresData);
            return asset;
        case AssetType.Tilemap:
            let tilemap = asset as pxt.ProjectTilemap;
            asset.previewURI = tilemapToImageURI(tilemap.data, Math.max(tilemap.data.tilemap.width, tilemap.data.tilemap.height), false);
            return asset;
        case AssetType.Animation:
            let anim = asset as pxt.Animation;
            if (anim.frames?.length <= 0) return null;
            (anim as any).framePreviewURIs = anim.frames.map(bitmap => imgConv.convert("data:image/x-mkcd-f," + pxt.sprite.base64EncodeBitmap(bitmap)));
            asset.previewURI = (anim as any).framePreviewURIs[0];
            return asset;
    }
}

export function tilemapToImageURI(data: pxt.sprite.TilemapData, sideLength: number, lightMode: boolean) {
    const colors = getProjectPalette();
    const canvas = document.createElement("canvas");
    canvas.width = sideLength;
    canvas.height = sideLength;

    // Works well for all of our default sizes, does not work well if the size is not
    // a multiple of 2 or is greater than 32 (i.e. from the decompiler)
    const cellSize = Math.min(sideLength / data.tilemap.width, sideLength / data.tilemap.height);

    // Center the image if it isn't square
    const xOffset = Math.max(Math.floor((sideLength * (1 - (data.tilemap.width / data.tilemap.height))) / 2), 0);
    const yOffset = Math.max(Math.floor((sideLength * (1 - (data.tilemap.height / data.tilemap.width))) / 2), 0);

    let context: CanvasRenderingContext2D;
    if (lightMode) {
        context = canvas.getContext("2d", { alpha: false })!;
        context.fillStyle = "#dedede";
        context.fillRect(0, 0, sideLength, sideLength);
    }
    else {
        context = canvas.getContext("2d")!;
    }

    let tileColors: string[] = [];

    for (let c = 0; c < data.tilemap.width; c++) {
        for (let r = 0; r < data.tilemap.height; r++) {
            const tile = data.tilemap.get(c, r);

            if (tile) {
                if (!tileColors[tile]) {
                    const tileInfo = data.tileset.tiles[tile];
                    tileColors[tile] = tileInfo ? pxt.sprite.computeAverageColor(pxt.sprite.Bitmap.fromData(tileInfo.bitmap), colors) : "#dedede";
                }

                context.fillStyle = tileColors[tile];
                context.fillRect(xOffset + c * cellSize, yOffset + r * cellSize, cellSize, cellSize);
            }
            else if (lightMode) {
                context.fillStyle = "#dedede";
                context.fillRect(xOffset + c * cellSize, yOffset + r * cellSize, cellSize, cellSize);
            }
        }
    }

    return canvas.toDataURL();
}
