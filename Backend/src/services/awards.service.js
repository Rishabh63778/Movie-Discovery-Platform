// TMDB has no awards database. Wikidata is used as a free, structured and
// verifiable source for awards received (P166) and nominations (P1411).
// If a lookup fails, callers receive an unavailable response instead of
// fabricated award data.
const WIKIDATA_API = "https://www.wikidata.org/w/api.php"
const REQUEST_TIMEOUT_MS = 6000
const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const FAILURE_TTL_MS = 5 * 60 * 1000
const MAX_ENTRIES = 250

const AWARD_PROPERTY = "P166"
const NOMINATION_PROPERTY = "P1411"
const POINT_IN_TIME_PROPERTY = "P585"

const cache = new Map()

const getCached = (key) => {
    const entry = cache.get(key)

    if (!entry) return null

    if (entry.expiresAt <= Date.now()) {
        cache.delete(key)
        return null
    }

    return entry.value
}

const setCached = (key, value, ttl) => {
    if (cache.size >= MAX_ENTRIES) {
        const oldestKey = cache.keys().next().value
        if (oldestKey) cache.delete(oldestKey)
    }

    cache.set(key, {
        value,
        expiresAt: Date.now() + ttl
    })
}

const requestWikidata = async (params) => {
    const query = new URLSearchParams({
        ...params,
        format: "json"
    })

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
        const response = await fetch(`${WIKIDATA_API}?${query.toString()}`, {
            headers: {
                Accept: "application/json",
                "User-Agent": "CineScope/1.0 (movie discovery and streaming website)"
            },
            signal: controller.signal
        })

        if (!response.ok) {
            throw new Error(`Wikidata request failed with status ${response.status}`)
        }

        return await response.json()
    } finally {
        clearTimeout(timeout)
    }
}

const extractClaims = (entity, property) => {
    const claims = entity?.claims?.[property]

    if (!Array.isArray(claims)) return []

    return claims
        .filter((claim) => claim.rank !== "deprecated")
        .map((claim) => {
            const id = claim.mainsnak?.datavalue?.value?.id || null
            const time = claim.qualifiers?.[POINT_IN_TIME_PROPERTY]?.[0]
                ?.datavalue?.value?.time || ""
            const yearMatch = time.match(/^[+-](\d{4})/)
            const year = yearMatch ? Number(yearMatch[1]) : null

            return id ? { id, year } : null
        })
        .filter(Boolean)
}

const groupClaims = (claims, type, getLabel) => {
    const grouped = new Map()

    claims.forEach((claim) => {
        const name = getLabel(claim.id)
        const key = `${type}:${name}`
        const existing = grouped.get(key) || {
            name,
            type,
            years: []
        }

        if (claim.year && !existing.years.includes(claim.year)) {
            existing.years.push(claim.year)
        }

        grouped.set(key, existing)
    })

    return Array.from(grouped.values())
        .map((item) => ({
            ...item,
            years: item.years.sort((a, b) => b - a)
        }))
        .sort((a, b) => (b.years[0] || 0) - (a.years[0] || 0))
}

const unavailable = (reason, sourceUrl = null) => ({
    available: false,
    source: "Wikidata",
    sourceUrl,
    items: [],
    awards: [],
    nominations: [],
    counts: {
        awards: 0,
        nominations: 0
    },
    reason
})

const getAwardsForWikidataId = async (wikidataId) => {
    if (!/^Q\d+$/.test(String(wikidataId || ""))) {
        return unavailable("No valid Wikidata identifier is available for this person.")
    }

    const cached = getCached(wikidataId)

    if (cached) return cached

    const sourceUrl = `https://www.wikidata.org/wiki/${wikidataId}`

    try {
        const entityPayload = await requestWikidata({
            action: "wbgetentities",
            ids: wikidataId,
            props: "claims"
        })

        const entity = entityPayload?.entities?.[wikidataId]

        if (!entity || entity.missing !== undefined) {
            const result = unavailable(
                "No verified Wikidata record was found for this person.",
                sourceUrl
            )

            setCached(wikidataId, result, FAILURE_TTL_MS)
            return result
        }

        const awardClaims = extractClaims(entity, AWARD_PROPERTY)
        const nominationClaims = extractClaims(entity, NOMINATION_PROPERTY)

        if (awardClaims.length === 0 && nominationClaims.length === 0) {
            const result = unavailable(
                "No verified award or nomination records were found on Wikidata for this person.",
                sourceUrl
            )

            setCached(wikidataId, result, CACHE_TTL_MS)
            return result
        }

        const awardIds = Array.from(new Set(
            [...awardClaims, ...nominationClaims].map((claim) => claim.id)
        )).slice(0, 50)

        const labelsPayload = await requestWikidata({
            action: "wbgetentities",
            ids: awardIds.join("|"),
            props: "labels",
            languages: "en"
        })

        const getLabel = (id) => (
            labelsPayload?.entities?.[id]?.labels?.en?.value || id
        )

        const awards = groupClaims(awardClaims, "award", getLabel)
        const nominations = groupClaims(nominationClaims, "nomination", getLabel)

        const result = {
            available: awards.length + nominations.length > 0,
            source: "Wikidata",
            sourceUrl,
            items: [...awards, ...nominations],
            awards,
            nominations,
            counts: {
                awards: awards.length,
                nominations: nominations.length
            },
            reason: awards.length + nominations.length > 0
                ? null
                : "No verified award or nomination records were found on Wikidata for this person."
        }

        setCached(wikidataId, result, CACHE_TTL_MS)

        return result
    } catch {
        const result = unavailable(
            "Verified awards data is temporarily unavailable. Please try again later.",
            sourceUrl
        )

        setCached(wikidataId, result, FAILURE_TTL_MS)

        return result
    }
}

export { getAwardsForWikidataId }
