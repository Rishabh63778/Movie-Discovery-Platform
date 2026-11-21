import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/useAuth.js"
import { getDisplayName } from "../utils/user.js"
import ProfileAvatar from "./ProfileAvatar.jsx"
import { ChevronDownIcon, LogoutIcon, UserIcon } from "./Icons.jsx"
import "../styles/ProfileDropdown.css"

function ProfileDropdown() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const [open, setOpen] = useState(false)
    const [loggingOut, setLoggingOut] = useState(false)

    const containerRef = useRef(null)
    const buttonRef = useRef(null)

    useEffect(() => {
        if (!open) return

        const handleOutsideClick = (event) => {
            if (!containerRef.current?.contains(event.target)) {
                setOpen(false)
            }
        }

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setOpen(false)
                buttonRef.current?.focus()
            }
        }

        document.addEventListener("pointerdown", handleOutsideClick)
        document.addEventListener("keydown", handleKeyDown)

        return () => {
            document.removeEventListener("pointerdown", handleOutsideClick)
            document.removeEventListener("keydown", handleKeyDown)
        }
    }, [open])

    if (!user) return null

    const displayName = getDisplayName(user)
    const email = user.email || "No email available"

    const handleLogout = async () => {
        if (loggingOut) return

        setLoggingOut(true)
        setOpen(false)

        try {
            await logout()
        } catch {
            // Local auth state is cleared by the context even if the request fails.
        } finally {
            setLoggingOut(false)
            navigate("/login", { replace: true })
        }
    }

    return (
        <div className="Profile-Dropdown" ref={containerRef}>
            <button
                ref={buttonRef}
                type="button"
                className={`Profile-Trigger ${open ? "Open" : ""}`}
                onClick={() => setOpen((current) => !current)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={`Open profile menu for ${displayName}`}
            >
                <ProfileAvatar user={user} />
                <ChevronDownIcon className="Profile-Chevron" />
            </button>

            <div
                className={`Profile-Menu ${open ? "Open" : ""}`}
                role="menu"
                aria-label="Profile menu"
                aria-hidden={!open}
            >
                <div className="Profile-Menu-Header">
                    <ProfileAvatar user={user} size="menu" />

                    <div className="Profile-Menu-Identity">
                        <strong title={displayName}>{displayName}</strong>
                        <span title={email}>{email}</span>
                    </div>
                </div>

                <div className="Profile-Menu-Divider" />

                <Link
                    to="/profile"
                    className="Profile-Menu-Item"
                    role="menuitem"
                    onClick={() => setOpen(false)}
                >
                    <UserIcon className="Profile-Menu-Icon" />
                    <span>View Profile</span>
                </Link>

                <button
                    type="button"
                    className="Profile-Menu-Item Profile-Menu-Logout"
                    role="menuitem"
                    onClick={handleLogout}
                    disabled={loggingOut}
                >
                    <LogoutIcon className="Profile-Menu-Icon" />
                    <span>{loggingOut ? "Logging out..." : "Logout"}</span>
                </button>
            </div>
        </div>
    )
}

export default ProfileDropdown
