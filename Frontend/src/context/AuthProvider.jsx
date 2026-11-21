import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react"
import api from "../api/axios.js"
import { clearStoredAuthData } from "../utils/user.js"
import { AuthContext } from "./authContext.js"

const getResponseUser = (response) => {
    const payload = response?.data?.data

    if (!payload) return null

    return payload.user || payload
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let cancelled = false

        const fetchcurrentuser = async () => {
            try {
                const response = await api.get("/api/auth/me")

                if (!cancelled) {
                    setUser(getResponseUser(response))
                }
            } catch {
                if (!cancelled) {
                    setUser(null)
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        fetchcurrentuser()

        return () => {
            cancelled = true
        }
    }, [])

    const login = useCallback(async (credentials) => {
        const response = await api.post("/users/login", credentials)
        const nextUser = getResponseUser(response)

        setUser(nextUser)
        return nextUser
    }, [])

    const refreshUser = useCallback(async () => {
        try {
            const response = await api.get("/api/auth/me")
            const nextUser = getResponseUser(response)

            setUser(nextUser)
            return nextUser
        } catch (error) {
            if (error.response?.status === 401) {
                setUser(null)
            }

            return null
        }
    }, [])

    const updateUser = useCallback((nextUser) => {
        setUser(nextUser)
    }, [])

    const logout = useCallback(async () => {
        try {
            await api.post("/users/logout")
        } catch (error) {
            // An expired access token should not prevent the local session
            // from being cleared. Try a refresh once before giving up.
            if (error.response?.status === 401) {
                try {
                    await api.post("/users/refresh")
                    await api.post("/users/logout")
                } catch {
                    // The local session is still cleared below.
                }
            }
        } finally {
            setUser(null)
            clearStoredAuthData()
        }
    }, [])

    const value = useMemo(() => ({
        user,
        loading,
        isAuthenticated: Boolean(user),
        login,
        logout,
        refreshUser,
        updateUser
    }), [user, loading, login, logout, refreshUser, updateUser])

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
