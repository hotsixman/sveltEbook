import { readFileSync } from "fs";

export const ssr = false;

export async function load(){
    const bookFile = readFileSync('./books/test.epub');

    return {
        bookFile: Array.from(bookFile)
    }
}