export function setupDragAndDrop(r: HTMLElement, filter: (file: File) => boolean, dragged: (files: File[]) => void) {
    r.addEventListener('paste', function (e: ClipboardEvent) {
        if (e.clipboardData) {
            // has file?
            let files: File[] = [];
            for (let i = 0; i < e.clipboardData.files.length; i++) {
                if (e.clipboardData.files.item(i)) files.push(e.clipboardData.files.item(i) as File);
            }
            files = files.filter(filter);
            if (files.length > 0) {
                e.stopPropagation(); // Stops some browsers from redirecting.
                e.preventDefault();
                dragged(files);
            }
            // has item?
            else if (e.clipboardData.items && e.clipboardData.items.length > 0) {
                let f = e.clipboardData.items[0].getAsFile()
                if (f) {
                    e.stopPropagation(); // Stops some browsers from redirecting.
                    e.preventDefault();
                    dragged([f])
                }
            }
        }
    })
    r.addEventListener('dragover', function (e: DragEvent) {
        if (e.dataTransfer) {
            let types = e.dataTransfer.types;
            let found = false;
            for (let i = 0; i < types.length; ++i)
                if (types[i] === "Files")
                    found = true;
            if (found) {
                if (e.preventDefault) e.preventDefault(); // Necessary. Allows us to drop.
                e.dataTransfer.dropEffect = 'copy';  // See the section on the DataTransfer object.
                return false;
            }
        }
        return true;
    }, false);
    r.addEventListener('drop', function (e: DragEvent) {
        if (e.dataTransfer) {
            const files: File[] = [];
            for (let i = 0; i < e.dataTransfer.files.length; i++) {
                if (e.dataTransfer.files.item(i)) files.push(e.dataTransfer.files.item(i) as File);
            }
            if (files.length > 0) {
                e.stopPropagation(); // Stops some browsers from redirecting.
                e.preventDefault();
                dragged(files);
            }
        }
        return false;
    }, false);
    r.addEventListener('dragend', function (e: DragEvent) {
        return false;
    }, false);
}

export function fileReadAsBufferAsync(f: File): Promise<Uint8Array | null> { // ArrayBuffer
    if (!f)
        return Promise.resolve<Uint8Array | null>(null);
    else {
        return new Promise<Uint8Array | null>((resolve, reject) => {
            let reader = new FileReader();
            reader.onerror = (ev) => resolve(null);
            reader.onload = (ev) => resolve(new Uint8Array(reader.result as ArrayBuffer));
            reader.readAsArrayBuffer(f);
        });
    }
}

export function fileReadAsTextAsync(f: File): Promise<string | null> {
    if (!f)
        return Promise.resolve<string| null>(null);
    else {
        return new Promise<string | null>((resolve, reject) => {
            let reader = new FileReader();
            reader.onerror = (ev) => resolve(null);
            reader.onload = (ev) => resolve(reader.result as string);
            reader.readAsText(f);
        });
    }
}
