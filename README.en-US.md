# WeRead

Bring your WeRead bookshelf, highlights, and thoughts into Tau. Passages you save while reading become searchable, citable in articles, and can be turned into cards or questions with one click.

## Get Started in 3 Steps

1. **Install the plugin**: Install **WeRead** from the Plugin Center, then toggle it on under **Installed** on the Plugins page. A **WeRead** entry appears in the desktop Sidebar—or in the feature grid at the top of **Me** on mobile—without restarting.
2. **Connect your account**: Open **WeRead**, click **Open the page**, copy your API Key from the WeRead **AI Skills** page, and paste it back. Once validated, your shelf syncs automatically.
3. **Browse your notes**: Open any book to read your highlights and thoughts organized by chapter.

## What You Can Do

- **Browse your shelf**: Filter by **Reading / Finished / Not started** or **With notes**, sort by last read, progress, or note count, switch freely between **Covers** and **List** views, or search by title or author.
- **Read notes**: The book page shows the table of contents on the left and chapter-grouped highlights on the right, with your thoughts highlighted so they stand out at a glance.
- **Use your notes**: Hover over a highlight to copy it or click **Make a card**; you can also **Copy as Markdown** for the entire book, or click **Open in WeRead** to jump back to the book.
- **Cite notes**: Synced highlights and thoughts become Tau excerpts that can be searched and cited in articles; clicking a citation jumps straight back to that spot in the book.

## On Mobile

- **Shelf**: The top bar shows your book count, total reading time, and the **Sync** button, with a search icon for titles and authors. Tap `⋯` next to Sync to view the last sync result, run **Full re-sync**, or open **Account & connection** to replace your key. Below that are categories, and the rightmost button lets you filter by status, change sort order, and switch between Covers and List views.
- **Reading notes**: Below the book title are **Open in WeRead** and **Fetch again**, with more actions under `⋯` such as copying all notes as Markdown. While scrolling, the filter bar stays pinned at the top, and the **Contents** button on the right shows the current chapter and lets you jump to another.
- **Using notes**: Tap a highlight to make a card, copy the highlight, or copy the highlight and thought together; long-press to select specific words.
- If you already connected WeRead on desktop and synced your library via cloud sync to mobile, opening WeRead on mobile will already be connected—no need to enter the API Key again.

## Syncing

- Returning the app to the foreground triggers an automatic incremental sync silently without a success toast. Repeated resume events are coalesced, and returning again mid-sync schedules one follow-up pass after the current round finishes. Disabling the plugin stops automatic sync.

- Normally, clicking **Sync** in the upper-right corner of the shelf is all you need—it only updates newly added books and those recently read or annotated, so it runs fast.
- If anything looks out of sync, click the arrow next to **Sync** (`⋯` on mobile) and choose **Full re-sync** to re-fetch the entire shelf (slower with large libraries; try not to switch away while syncing on mobile).
- After adding new highlights in WeRead, open that book here and click **Fetch notes again** to pull them in.

## FAQ

**Can I still read notes offline?** Yes. Synced highlights and thoughts are stored locally and stay readable and citable offline. Only full-book reviews and standalone thoughts without a passage require a network connection.

**What if it says "API Key expired"?** Click **Re-enter** on the shelf banner (or go to **Account & connection** in plugin Settings, or via `⋯` on the mobile shelf) and paste a new key. Your existing shelf and notes remain intact.

**What happens if I remove a book from my WeRead shelf?** On the next sync, excerpts from that book are hidden. If you add the book back to your shelf later, its excerpts and article citations are restored as before.

**Will disabling or disconnecting the plugin delete my notes?** No. Synced excerpts remain preserved, and citations in your articles continue to work.

**Why do I need to enter the key again in another workspace?** API keys and bookshelves are stored per workspace, so each workspace connects separately.

## Note

- Treat your API Key like an account credential—never share it with others or include it in screenshots or issue reports.
