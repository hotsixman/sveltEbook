import JSZip, { loadAsync } from "jszip";
import { dirname, join } from 'path-browserify';

export class Book {
    /**
     * Load epub file.
     */
    static async load(bookFile: number[]): Promise<Book | null> {
        const unzipped = await loadAsync(bookFile);

        //check mimetype
        const isMimetypeValid = await this.checkMimetype(unzipped);
        if (!isMimetypeValid) {
            console.error('Invalid mimetype.');
            return null;
        }

        //check META-INF/container.xml and get OPF file path
        const opfPath = await this.getOpfPath(unzipped);
        if (opfPath === null) {
            console.error('Invalid container.xml file.');
            return null;
        }
        const rootPath = dirname(opfPath);

        //parse package
        const packageData = await this.parsePackage(unzipped, opfPath);
        if (packageData === null) {
            console.error('Invalid opf file.');
            return null;
        }
        
        return new Book(unzipped, rootPath, packageData);
    }

    /**
     * Check if mimetype is valid.
     */
    static async checkMimetype(unzipped: JSZip): Promise<boolean> {
        const mimetypeFile = unzipped.files.mimetype;
        if (typeof (mimetypeFile) === "undefined" || mimetypeFile.dir === true) {
            return false;
        }
        if (await mimetypeFile.async('string') !== "application/epub+zip") {
            return false;
        }
        return true;
    }

    /**
     * Get the path of .opf file.
     */
    static async getOpfPath(unzipped: JSZip): Promise<null | string> {
        const containerXML = unzipped.files['META-INF/container.xml'];
        if (typeof (containerXML) === "undefined" || containerXML.dir === true) {
            return null;
        }

        try {
            const xmlDocument = (new DOMParser()).parseFromString(await containerXML.async('string'), 'application/xml');
            const rootFile = xmlDocument.querySelector('container > rootfiles > rootfile');
            if (rootFile === null) {
                return null;
            }

            const opfPath = rootFile.getAttribute('full-path');
            if (opfPath === null) {
                return null;
            }

            const opf = unzipped.files[opfPath];
            if (typeof (opf) === "undefined" || opf.dir === true) {
                return null;
            }

            return opfPath;
        }
        catch {
            return null;
        }
    }

    /**
     * Parse package
     */
    static async parsePackage(unzipped: JSZip, opfPath: string): Promise<Package | null> {
        const opfFile = unzipped.files[opfPath];
        const opfString = await opfFile.async('string');

        const opfDocument = (new DOMParser()).parseFromString(opfString, 'application/xml');

        const metadata = this.parseMetadata(opfDocument);
        if (metadata === null) return null;

        const manifest = this.parseManifest(opfDocument);
        if (manifest === null) return null;

        const spine = this.parseSpine(opfDocument);
        if (spine === null) return null;

        const opf: Package = {
            metadata,
            manifest,
            spine
        }
        return opf;
    }

    /**
     * Parse metadata in package.
     * @todo Add parse other Dublin Core Optional Elements
     */
    private static parseMetadata(opfDocument: Document): Metadata | null {
        const metadataElement = opfDocument.querySelector('package > metadata');
        if (!metadataElement) return null;

        const identifier = metadataElement.getElementsByTagName('dc:identifier')?.[0]?.textContent;
        const title = metadataElement.getElementsByTagName('dc:title')?.[0]?.textContent;
        const language = metadataElement.getElementsByTagName('dc:language')?.[0]?.textContent;

        if (identifier === null || title === null || language === null) {
            return null;
        }

        const metadata: Metadata = {
            identifier,
            title,
            language
        }

        return metadata;
    }

    /**
     * Parse manifest in package.
     */
    private static parseManifest(opfDocument: Document): Manifest | null {
        const manifestElement = opfDocument.querySelector('package > manifest');
        if (!manifestElement) return null;

        const manifest: Manifest = {};
        Array.from(manifestElement.getElementsByTagName('item')).forEach((item) => {
            const id = item.getAttribute('id');
            const href = item.getAttribute('href');
            const mediaType = item.getAttribute('media-type');

            if (id === null || href === null || mediaType === null) return;
            

            const manifestItem: ManifestItem = {
                href,
                mediaType,
                mediaOverlay: item.getAttribute('media-overlay') ?? undefined,
                properties: (item.getAttribute('properties') as ManifestProperties) ?? undefined,
                fallback: item.getAttribute('fallback') ?? undefined
            }

            manifest[id] = manifestItem;
        })

        return manifest;
    }

    /**
     * Parse spine in package.
     */
    private static parseSpine(opfDocument: Document): Spine | null {
        const spineElement = opfDocument.querySelector('package > spine');
        if (!spineElement) return null;

        const spine: Spine = [];
        Array.from(spineElement.getElementsByTagName('itemref')).forEach((itemRef) => {
            const idref = itemRef.getAttribute('idref');
            if (idref === null) return;

            spine.push({
                idref,
                id: itemRef.getAttribute('id') ?? undefined,
                linear: itemRef.getAttribute('linear') ?? undefined,
                properties: itemRef.getAttribute('properties') ?? undefined
            })
        })

        return spine;
    }


    file: JSZip;
    rootPath: string;
    packageData: Package;

    constructor(file: JSZip, rootPath: string, packageData: Package) {
        this.file = file;
        this.rootPath = rootPath;
        this.packageData = packageData;
    }

    /*
    async loadToc(){
        const tocHref = Object.values(this.packageData.manifest).find(e => e.properties === 'nav')?.href;
        if(tocHref === undefined) return;

        const tocFilePath = join(this.rootPath, tocHref);
        const tocFile = this.file.files[tocFilePath];
        if(tocFile === undefined || tocFile.dir === true) return;

        const tocXHTML = await tocFile.async('string');
        const tocDocument = (new DOMParser).parseFromString(tocXHTML, 'application/xhtml+xml');
    }
    */
}