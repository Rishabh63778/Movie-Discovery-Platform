import { getMovieSummary } from "./tmdb.service.js"

const mapWithConcurrency = async (items, limit, mapper) => {
    const results = new Array(items.length)
    let nextIndex = 0

    const worker = async () => {
        while (nextIndex < items.length) {
            const index = nextIndex
            nextIndex += 1

            try {
                results[index] = await mapper(items[index], index)
            } catch {
                results[index] = null
            }
        }
    }

    const workerCount = Math.min(limit, items.length)

    await Promise.all(
        Array.from({ length: workerCount }, () => worker())
    )

    return results.filter(Boolean)
}

const enrichLibraryEntries = async (entries, buildEntry) => {
    return mapWithConcurrency(entries, 5, async (entry) => {
        try {
            const movie = await getMovieSummary(entry.movieId)
            return buildEntry(movie, entry)
        } catch {
            return {
                id: entry.movieId,
                movieId: entry.movieId,
                title: "Unavailable movie",
                unavailable: true,
                ...buildEntry({}, entry)
            }
        }
    })
}

export { enrichLibraryEntries }
