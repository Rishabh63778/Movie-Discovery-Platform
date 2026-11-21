import { useNavigate } from "react-router-dom"
import getInitials from "../utils/initials.js"
import "../styles/PersonCard.css"

function PersonCard({ person }) {
    const navigate = useNavigate()

    const openPerson = () => {
        navigate(`/person/${person.id}`)
    }

    const handleKeyDown = (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            openPerson()
        }
    }

    return (
        <article
            className="Person-Card"
            onClick={openPerson}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            aria-label={`View profile for ${person.name}`}
        >
            {
                person.profile?.url ? (
                    <img
                        className="Person-Card-Photo"
                        src={person.profile.url}
                        alt={person.name}
                        loading="lazy"
                    />
                ) : (
                    <div className="Person-Card-Photo Person-Card-Fallback">
                        {getInitials(person.name)}
                    </div>
                )
            }

            <div className="Person-Card-Info">
                <span className="Person-Card-Department">
                    {person.knownForDepartment || "Film & TV"}
                </span>

                <h3>{person.name}</h3>

                <p className="Person-Card-KnownFor">
                    {
                        person.knownForText
                            ? `Known for ${person.knownForText}`
                            : "Explore their filmography"
                    }
                </p>
            </div>
        </article>
    )
}

export default PersonCard
