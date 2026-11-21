const AUTH_STORAGE_KEYS = [
    "token",
    "accessToken",
    "refreshToken",
    "auth",
    "user"
]

const getStorage = (type) => {
    try {
        return type === "session" ? window.sessionStorage : window.localStorage
    } catch {
        return null
    }
}

export const clearStoredAuthData = () => {
    // Authentication tokens are stored in HttpOnly cookies. This only removes
    // any legacy/plain-token data that might have been persisted previously.
    ;["local", "session"].forEach((type) => {
        const storage = getStorage(type)

        if (!storage) return

        AUTH_STORAGE_KEYS.forEach((key) => {
            try {
                storage.removeItem(key)
            } catch {
                // Ignore storage errors (for example, private browsing).
            }
        })
    })
}

export const getDisplayName = (user) => {
    const name = String(
        user?.fullName || user?.name || user?.username || ""
    ).trim()

    if (name) return name

    const emailName = String(user?.email || "").split("@")[0].trim()

    return emailName || "User"
}

export const getUserInitials = (user) => {
    const displayName = getDisplayName(user)
    const initials = displayName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()

    if (initials) return initials

    return user?.email?.[0]?.toUpperCase() || "U"
}

export const getAvatarUrl = (user) => {
    const candidate =
        user?.avatar ||
        user?.avatarUrl ||
        user?.profilePicture ||
        user?.profileImage

    return typeof candidate === "string" ? candidate.trim() : ""
}
