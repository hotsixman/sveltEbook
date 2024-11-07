<script lang="ts">
    import { Book } from "$lib/class/Book.svelte";

    interface Data {
        bookFile: number[];
    }

    let { data }: { data: Data } = $props();
    let { bookFile } = data;

    const book = Book.load(bookFile);
    book.then(async(book) => {
        if(!book) return;

        await book.loadToc();
    })
</script>