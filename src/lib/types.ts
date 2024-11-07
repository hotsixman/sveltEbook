/**
 * Metadata type in package.
 * @see {@link https://www.w3.org/TR/epub/#sec-pkg-metadata}
 */
interface Metadata{
    identifier: string;
    title: string;
    language: string;
    contributor?: string;
    coverage?: string;
    creator?: CreatorMetadata[];
    date?: Date;
    description?: string;
    format?: string;
    publisher?: string;
    relation?: string;
    rights?: string;
    source?: string;
    subject?: string;
    type?: string;
}
interface CreatorMetadata{
    name: string;
    alternate?: Record<string, string>;
    fileAs?: string[]
}

/**
 * Manifest type in package.
 * @see {@link https://www.w3.org/TR/epub/#sec-pkg-manifest}
 */
interface Manifest{
    [id: string]: ManifestItem;
}
type ManifestProperties = 'cover-image' | 'mathml' | 'nav' | 'remote-resources' | 'scripted' | 'svg' | 'switch';
interface ManifestItem {
    href: string;
    properties?: ManifestProperties;
    mediaOverlay?: string;
    mediaType: string;
    /**
     * @todo fallback 기능 추가
     */
    fallback?: string;
}

/**
 * Spine type in package.
 * @see {@link https://www.w3.org/TR/epub/#sec-pkg-spine}
 */
type Spine = ItemRef[];
/**
 * @todo Add spine properties.
 */
interface ItemRef{
    id?: string;
    idref: string;
    linear?: string;
    properties?: string;
}

/**
 * package type.
 */
interface Package{
    metadata: Metadata;
    manifest: Manifest;
    spine: Spine;
}