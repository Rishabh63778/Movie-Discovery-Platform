import { useState } from "react"
import { getAvatarUrl, getUserInitials } from "../utils/user.js"
import "../styles/ProfileAvatar.css"

function ProfileAvatar({ user, size = "navbar" }) {
    const avatarUrl = getAvatarUrl(user)
    const [failedUrl, setFailedUrl] = useState("")

    const showImage = Boolean(avatarUrl) && failedUrl !== avatarUrl

    return (
        <span className={`Profile-Avatar Profile-Avatar--${size}`}>
            {
                showImage ? (
                    <img
                        src={avatarUrl}
                        alt=""
                        onError={() => setFailedUrl(avatarUrl)}
                    />
                ) : (
                    <span aria-hidden="true">{getUserInitials(user)}</span>
                )
            }
        </span>
    )
}

export default ProfileAvatar
