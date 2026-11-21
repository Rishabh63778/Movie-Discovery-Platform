import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import api from "../api/axios.js"
import FilmographyCard from "../components/FilmographyCard.jsx"
import Navbar from "../components/Navbar.jsx"
import getInitials from "../utils/initials.js"
import "../styles/Person.css"

const CATEGORIES = [
    { key: "acting", label: "Acting" },
    { key: "directing", label: "Directing" },
    { key: "writing", label: "Writing" },
    { key: "production", label: "Production" }
]

const EXTERNAL_LABELS = {
    imdb: "IMDb",
    wikidata: "Wikidata",
    instagram: "Instagram",
    twitter: "Twitter / X",
    facebook: "Facebook",
    tiktok: "TikTok",
    youtube: "YouTube"
}

const formatDate = (value) => {
    if (!value) return "Not available"

    const date = new Date(
        value.length === 10 ? `${value}T00:00:00Z` : value
    )

    if (Number.isNaN(date.getTime())) return value

    return new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC"
    }).format(date)
}

function PersonSkeleton() {
    return (
        <div
            className="Person-Skeleton"
            role="status"
            aria-label="Loading person profile"
        >
            <div className="Person-Skeleton-Hero">
                <div className="Skeleton-Block Person-Skeleton-Photo" />

                <div className="Person-Skeleton-Identity">
                    <div className="Skeleton-Block Person-Skeleton-Line Person-Skeleton-Line--Short" />
                    <div className="Skeleton-Block Person-Skeleton-Line Person-Skeleton-Line--Title" />
                    <div className="Skeleton-Block Person-Skeleton-Line" />
                    <div className="Skeleton-Block Person-Skeleton-Line Person-Skeleton-Line--Medium" />
                </div>
            </div>

            <div className="Skeleton-Block Person-Skeleton-Section" />
            <div className="Skeleton-Block Person-Skeleton-Section Person-Skeleton-Section--Tall" />
        </div>
    )
}

function Person() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [person, setPerson] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    const [awards, setAwards] = useState(null)
    const [awardsLoading, setAwardsLoading] = useState(false)
    const [awardsError, setAwardsError] = useState("")

    const [bioExpanded, setBioExpanded] = useState(false)
    const [activeCategory, setActiveCategory] = useState("acting")

    useEffect(() => {
        let cancelled = false

        const fetchPerson = async () => {
            setLoading(true)
            setError("")
            setPerson(null)
            setAwards(null)
            setAwardsError("")
            setAwardsLoading(false)
            setBioExpanded(false)
            setActiveCategory("acting")

            window.scrollTo(0, 0)

            try {
                const response = await api.get(`/people/${id}`)

                if (cancelled) return

                const data = response.data.data
                setPerson(data)
                setLoading(false)

                const preferredCategory = CATEGORIES.find(
                    (category) => data.filmography?.[category.key]?.length > 0
                )

                if (preferredCategory) {
                    setActiveCategory(preferredCategory.key)
                }

                if (data.externalIds?.wikidataId) {
                    setAwardsLoading(true)

                    try {
                        const awardsResponse = await api.get(`/people/${id}/awards`)

                        if (!cancelled) {
                            setAwards(awardsResponse.data.data)
                        }
                    } catch (awardsRequestError) {
                        if (!cancelled) {
                            setAwardsError(
                                awardsRequestError.response?.data?.message
                                || "Unable to load verified awards data right now."
                            )
                        }
                    } finally {
                        if (!cancelled) setAwardsLoading(false)
                    }
                } else {
                    setAwards({
                        available: false,
                        awards: [],
                        nominations: [],
                        reason: "This person has no linked Wikidata profile, so verified awards data is unavailable."
                    })
                }
            } catch (requestError) {
                if (cancelled) return

                setError(
                    requestError.response?.status === 404
                        ? "Person not found"
                        : requestError.response?.data?.message
                        || "Unable to load this person right now."
                )
                setLoading(false)
            }
        }

        fetchPerson()

        return () => {
            cancelled = true
        }
    }, [id])

    const externalLinks = useMemo(() => {
        if (!person) return []

        const links = person.externalIds?.links || {}
        const items = Object.entries(EXTERNAL_LABELS)
            .filter(([key]) => links[key])
            .map(([key, label]) => ({
                key,
                label,
                url: links[key]
            }))

        if (person.homepage) {
            items.unshift({
                key: "homepage",
                label: "Official site",
                url: person.homepage
            })
        }

        return items
    }, [person])

    const counts = person?.filmography?.counts || {}
    const activeCredits = person?.filmography?.[activeCategory] || []
    const activeLabel = CATEGORIES.find(
        (category) => category.key === activeCategory
    )?.label || "Filmography"

    const renderAwards = () => {
        if (awardsLoading) {
            return (
                <div className="Person-Awards-Skeleton" aria-hidden="true">
                    <div className="Skeleton-Block Person-Awards-Skeleton-Line" />
                    <div className="Skeleton-Block Person-Awards-Skeleton-Line Person-Awards-Skeleton-Line--Short" />
                    <div className="Skeleton-Block Person-Awards-Skeleton-Line Person-Awards-Skeleton-Line--Medium" />
                </div>
            )
        }

        if (awardsError) {
            return (
                <div className="Person-Awards-Unavailable">
                    <p>{awardsError}</p>
                    <p className="Person-Awards-Note">
                        TMDB does not provide an awards database. We only show
                        verified records when a reliable source is available.
                    </p>
                </div>
            )
        }

        if (!awards?.available) {
            return (
                <div className="Person-Awards-Unavailable">
                    <p>
                        {awards?.reason
                            || "Verified awards and nominations data is not available for this person."}
                    </p>
                    <p className="Person-Awards-Note">
                        TMDB does not provide an awards database. We only display
                        verified records from Wikidata when they are available.
                    </p>
                </div>
            )
        }

        const awardItems = awards.awards || []
        const nominationItems = awards.nominations || []

        return (
            <>
                <p className="Person-Awards-Note">
                    Verified records from{" "}
                    <a
                        href={awards.sourceUrl || "https://www.wikidata.org"}
                        target="_blank"
                        rel="noreferrer"
                    >
                        Wikidata
                    </a>
                    . TMDB does not provide an awards database.
                </p>

                <div className="Person-Awards-Groups">
                    {
                        awardItems.length > 0 && (
                            <div className="Person-Awards-Group">
                                <h3>
                                    Awards received
                                    <span>{awardItems.length}</span>
                                </h3>

                                <ul>
                                    {
                                        awardItems.map((item) => (
                                            <li key={`award-${item.name}`}>
                                                <span className="Person-Award-Name">
                                                    {item.name}
                                                </span>

                                                {
                                                    item.years?.length > 0 && (
                                                        <span className="Person-Award-Year">
                                                            {item.years.join(", ")}
                                                        </span>
                                                    )
                                                }
                                            </li>
                                        ))
                                    }
                                </ul>
                            </div>
                        )
                    }

                    {
                        nominationItems.length > 0 && (
                            <div className="Person-Awards-Group">
                                <h3>
                                    Nominations
                                    <span>{nominationItems.length}</span>
                                </h3>

                                <ul>
                                    {
                                        nominationItems.map((item) => (
                                            <li key={`nomination-${item.name}`}>
                                                <span className="Person-Award-Name">
                                                    {item.name}
                                                </span>

                                                {
                                                    item.years?.length > 0 && (
                                                        <span className="Person-Award-Year">
                                                            {item.years.join(", ")}
                                                        </span>
                                                    )
                                                }
                                            </li>
                                        ))
                                    }
                                </ul>
                            </div>
                        )
                    }
                </div>
            </>
        )
    }

    if (loading) {
        return (
            <div className="Person-Page">
                <Navbar />

                <main className="Person-Main">
                    <Link to="/home" className="Person-Back">
                        ← Back to Home
                    </Link>

                    <PersonSkeleton />
                </main>
            </div>
        )
    }

    if (error || !person) {
        return (
            <div className="Person-Page">
                <Navbar />

                <main className="Person-Main">
                    <Link to="/home" className="Person-Back">
                        ← Back to Home
                    </Link>

                    <div className="Person-State">
                        <h1>{error || "Person not found"}</h1>
                        <p>
                            The profile you are looking for could not be loaded.
                        </p>

                        <button
                            type="button"
                            className="Person-State-Button"
                            onClick={() => navigate("/home")}
                        >
                            Back to Home
                        </button>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="Person-Page">
            <Navbar />

            <main className="Person-Main">
                <Link to="/home" className="Person-Back">
                    ← Back to Home
                </Link>

                <section className="Person-Hero">
                    <div className="Person-Photo-Wrap">
                        {
                            person.profile?.url ? (
                                <img
                                    className="Person-Photo"
                                    src={person.profile.url}
                                    alt={person.name}
                                />
                            ) : (
                                <div className="Person-Photo Person-Photo-Fallback">
                                    {getInitials(person.name)}
                                </div>
                            )
                        }
                    </div>

                    <div className="Person-Identity">
                        <p className="Person-Eyebrow">
                            {person.knownForDepartment || "Film & Television"}
                        </p>

                        <h1>{person.name}</h1>

                        <div className="Person-Meta">
                            {
                                person.birthday && (
                                    <span>Born {formatDate(person.birthday)}</span>
                                )
                            }

                            {
                                person.placeOfBirth && (
                                    <span>{person.placeOfBirth}</span>
                                )
                            }

                            {
                                person.deathday && (
                                    <span>Died {formatDate(person.deathday)}</span>
                                )
                            }
                        </div>

                        {
                            person.alsoKnownAs?.length > 0 && (
                                <p className="Person-AlsoKnownAs">
                                    Also known as: {person.alsoKnownAs.slice(0, 4).join(", ")}
                                </p>
                            )
                        }

                        {
                            person.knownFor?.length > 0 && (
                                <div className="Person-KnownFor">
                                    <span className="Person-KnownFor-Label">
                                        Known for
                                    </span>

                                    <div className="Person-KnownFor-List">
                                        {
                                            person.knownFor.slice(0, 5).map((credit) => (
                                                credit.type === "movie" ? (
                                                    <button
                                                        key={credit.id}
                                                        type="button"
                                                        className="Person-KnownFor-Chip"
                                                        onClick={() => navigate(`/movie/${credit.id}`)}
                                                    >
                                                        {credit.title}
                                                        {credit.year ? ` (${credit.year})` : ""}
                                                    </button>
                                                ) : (
                                                    <span
                                                        key={credit.id}
                                                        className="Person-KnownFor-Chip Person-KnownFor-Chip--Static"
                                                    >
                                                        {credit.title}
                                                        {credit.year ? ` (${credit.year})` : ""}
                                                    </span>
                                                )
                                            ))
                                        }
                                    </div>
                                </div>
                            )
                        }

                        {
                            externalLinks.length > 0 && (
                                <div className="Person-Links">
                                    {
                                        externalLinks.map((link) => (
                                            <a
                                                key={link.key}
                                                className="Person-Link"
                                                href={link.url}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                {link.label}
                                            </a>
                                        ))
                                    }
                                </div>
                            )
                        }
                    </div>
                </section>

                <div className="Person-Content">
                    <section className="Person-Section">
                        <h2>Biography</h2>

                        {
                            person.biography ? (
                                <>
                                    <p
                                        className={
                                            bioExpanded
                                                ? "Person-Bio-Text Person-Bio-Text--Expanded"
                                                : "Person-Bio-Text"
                                        }
                                    >
                                        {person.biography}
                                    </p>

                                    {
                                        person.biography.length > 280 && (
                                            <button
                                                type="button"
                                                className="Person-Bio-Toggle"
                                                onClick={() => setBioExpanded((current) => !current)}
                                                aria-expanded={bioExpanded}
                                            >
                                                {bioExpanded ? "Show less" : "Read more"}
                                            </button>
                                        )
                                    }
                                </>
                            ) : (
                                <p className="Person-Empty">
                                    No biography is available for this person yet.
                                </p>
                            )
                        }
                    </section>

                    <section className="Person-Section">
                        <h2>Personal details</h2>

                        <div className="Person-Details-Grid">
                            <div className="Person-Detail">
                                <span>Known for</span>
                                <strong>{person.knownForDepartment || "Not available"}</strong>
                            </div>

                            <div className="Person-Detail">
                                <span>Birthday</span>
                                <strong>{formatDate(person.birthday)}</strong>
                            </div>

                            <div className="Person-Detail">
                                <span>Place of birth</span>
                                <strong>{person.placeOfBirth || "Not available"}</strong>
                            </div>

                            <div className="Person-Detail">
                                <span>Gender</span>
                                <strong>{person.genderLabel || "Not specified"}</strong>
                            </div>
                        </div>
                    </section>

                    <section className="Person-Section">
                        <h2>Awards &amp; Nominations</h2>

                        {renderAwards()}
                    </section>

                    <section className="Person-Section">
                        <div className="Person-Filmography-Header">
                            <h2>Filmography</h2>
                            <span>{counts.total || 0} movie credits</span>
                        </div>

                        <div
                            className="Person-Filmography-Tabs"
                            role="tablist"
                            aria-label="Filmography categories"
                        >
                            {
                                CATEGORIES.map((category) => (
                                    <button
                                        key={category.key}
                                        type="button"
                                        role="tab"
                                        id={`filmography-tab-${category.key}`}
                                        aria-selected={activeCategory === category.key}
                                        aria-controls="filmography-panel"
                                        className={
                                            activeCategory === category.key
                                                ? "Person-Filmography-Tab Person-Filmography-Tab--Active"
                                                : "Person-Filmography-Tab"
                                        }
                                        onClick={() => setActiveCategory(category.key)}
                                    >
                                        {category.label}
                                        <span>{counts[category.key] || 0}</span>
                                    </button>
                                ))
                            }
                        </div>

                        <div
                            id="filmography-panel"
                            role="tabpanel"
                            aria-labelledby={`filmography-tab-${activeCategory}`}
                        >
                            {
                                activeCredits.length > 0 ? (
                                    <div className="Filmography-Grid">
                                        {
                                            activeCredits.map((credit) => (
                                                <FilmographyCard
                                                    key={`${activeCategory}-${credit.id}`}
                                                    credit={credit}
                                                />
                                            ))
                                        }
                                    </div>
                                ) : (
                                    <p className="Person-Empty">
                                        No {activeLabel.toLowerCase()} credits are
                                        available for this person.
                                    </p>
                                )
                            }
                        </div>
                    </section>
                </div>

                <footer className="Person-Attribution">
                    Person and filmography data provided by{" "}
                    <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer">
                        TMDB
                    </a>
                    . Awards data, when available, is sourced from{" "}
                    <a href="https://www.wikidata.org" target="_blank" rel="noreferrer">
                        Wikidata
                    </a>
                    . This product uses the TMDB API but is not endorsed or
                    certified by TMDB.
                </footer>
            </main>
        </div>
    )
}

export default Person
