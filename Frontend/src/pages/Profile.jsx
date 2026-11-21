import { useCallback, useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import api from "../api/axios.js"
import ImageCropper from "../components/ImageCropper.jsx"
import Navbar from "../components/Navbar.jsx"
import ProfileAvatar from "../components/ProfileAvatar.jsx"
import { CalendarIcon, CameraIcon, MailIcon, UserIcon } from "../components/Icons.jsx"
import { useAuth } from "../context/useAuth.js"
import { getAvatarUrl, getDisplayName } from "../utils/user.js"
import "../styles/Profile.css"

const MAX_AVATAR_SIZE = 5 * 1024 * 1024
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"]

const formatdate = (value) => {
    if (!value) return "Not available"

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) return "Not available"

    return new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric"
    }).format(date)
}

function Profile() {
    const { user, refreshUser, updateUser } = useAuth()
    const fileInputRef = useRef(null)
    const cropUrlRef = useRef("")

    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState("")
    const [uploadSuccess, setUploadSuccess] = useState("")
    const [cropSource, setCropSource] = useState(null)

    useEffect(() => {
        refreshUser()
    }, [refreshUser])

    useEffect(() => () => {
        if (cropUrlRef.current) {
            URL.revokeObjectURL(cropUrlRef.current)
            cropUrlRef.current = ""
        }
    }, [])

    const closeCropper = useCallback(() => {
        if (cropUrlRef.current) {
            URL.revokeObjectURL(cropUrlRef.current)
            cropUrlRef.current = ""
        }

        setCropSource(null)
    }, [])

    if (!user) return null

    const displayName = getDisplayName(user)
    const email = user.email || "Not available"
    const memberSince = formatdate(user.createdAt)

    const handleAvatarChange = (event) => {
        const file = event.target.files?.[0]

        event.target.value = ""

        if (!file || uploading) return

        setUploadError("")
        setUploadSuccess("")

        if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
            setUploadError("Choose a JPEG, PNG or WebP image.")
            return
        }

        if (file.size > MAX_AVATAR_SIZE) {
            setUploadError("The image must be 5 MB or smaller.")
            return
        }

        if (cropUrlRef.current) {
            URL.revokeObjectURL(cropUrlRef.current)
        }

        const url = URL.createObjectURL(file)

        cropUrlRef.current = url
        setCropSource({ url, fileName: file.name })
    }

    const handleCropConfirm = async (croppedFile) => {
        setUploadError("")
        setUploadSuccess("")
        setUploading(true)

        try {
            const formData = new FormData()
            formData.append("avatar", croppedFile)

            const response = await api.patch("/users/avatar", formData)
            const updatedUser = response?.data?.data

            if (updatedUser) {
                updateUser(updatedUser)
            } else {
                await refreshUser()
            }

            setUploadSuccess("Profile picture updated.")
            closeCropper()
        } catch (error) {
            setUploadError(
                error.response?.data?.message
                || "Could not upload the picture. Please try again."
            )
        } finally {
            setUploading(false)
        }
    }

    const handleCropCancel = () => {
        if (uploading) return

        setUploadError("")
        closeCropper()
    }

    return (
        <div className="Profile-Page">
            <Navbar />

            <main className="Profile-Main">
                <Link to="/home" className="Profile-Back">
                    ← Back to Home
                </Link>

                <section className="Profile-Card">
                    <div className="Profile-Card-Hero">
                        <div className="Profile-Avatar-Editor">
                            <ProfileAvatar user={user} size="large" />

                            <div className="Profile-Avatar-Actions">
                                <button
                                    type="button"
                                    className="Profile-Avatar-Button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                >
                                    <CameraIcon className="Profile-Avatar-Button-Icon" />
                                    {uploading
                                        ? "Uploading..."
                                        : getAvatarUrl(user)
                                            ? "Change photo"
                                            : "Upload photo"}
                                </button>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="Profile-Avatar-Input"
                                    onChange={handleAvatarChange}
                                />

                                <span className="Profile-Avatar-Hint">
                                    JPEG, PNG or WebP · max 5 MB · crop before saving
                                </span>

                                {uploadError && (
                                    <p
                                        className="Profile-Avatar-Message Profile-Avatar-Message--error"
                                        role="alert"
                                    >
                                        {uploadError}
                                    </p>
                                )}

                                {uploadSuccess && (
                                    <p
                                        className="Profile-Avatar-Message Profile-Avatar-Message--success"
                                        role="status"
                                    >
                                        {uploadSuccess}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="Profile-Identity">
                            <p className="Profile-Eyebrow">CineScope Member</p>
                            <h1>{displayName}</h1>
                            <p className="Profile-Email">{email}</p>
                        </div>
                    </div>

                    <div className="Profile-Details">
                        <h2>Account details</h2>

                        <div className="Profile-Details-Grid">
                            <div className="Profile-Detail">
                                <span className="Profile-Detail-Icon">
                                    <UserIcon />
                                </span>

                                <div>
                                    <span className="Profile-Detail-Label">Full name</span>
                                    <span className="Profile-Detail-Value">{displayName}</span>
                                </div>
                            </div>

                            <div className="Profile-Detail">
                                <span className="Profile-Detail-Icon">
                                    <MailIcon />
                                </span>

                                <div>
                                    <span className="Profile-Detail-Label">Email address</span>
                                    <span className="Profile-Detail-Value">{email}</span>
                                </div>
                            </div>

                            <div className="Profile-Detail">
                                <span className="Profile-Detail-Icon">
                                    <CalendarIcon />
                                </span>

                                <div>
                                    <span className="Profile-Detail-Label">Member since</span>
                                    <span className="Profile-Detail-Value">{memberSince}</span>
                                </div>
                            </div>
                        </div>

                        <p className="Profile-Note">
                            Your password and authentication tokens are never shown on
                            this page.
                        </p>
                    </div>
                </section>
            </main>

            {cropSource && (
                <ImageCropper
                    key={cropSource.url}
                    src={cropSource.url}
                    fileName={cropSource.fileName}
                    busy={uploading}
                    error={uploadError}
                    onCancel={handleCropCancel}
                    onConfirm={handleCropConfirm}
                />
            )}
        </div>
    )
}

export default Profile
