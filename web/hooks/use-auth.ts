import { useAuthStore } from "@/lib/store/auth.store"
import { useShallow } from "zustand/react/shallow"

export function useAuth() {
    const { user, logout, isAuthenticated } = useAuthStore(
        useShallow((state) => ({
            user: state.user,
            logout: state.logout,
            isAuthenticated: !!state.user,
        }))
    )

    return { user, logout, isAuthenticated }
}
