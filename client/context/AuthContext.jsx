import { createContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext(); 

export const AuthProvider = ({ children }) => {

    const [token, setToken] = useState(localStorage.getItem("token"))
    const [authUser, setAuthUser] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [socket, setSocket] = useState(null);
    const isAuthCheckRunning = useRef(false);

    const setAuthHeaders = (value) => {
        if (value) {
            axios.defaults.headers.common["token"] = value;
            axios.defaults.headers.common["Authorization"] = `Bearer ${value}`;
            return;
        }

        delete axios.defaults.headers.common["token"];
        delete axios.defaults.headers.common["Authorization"];
    };

    // Check if user is authenticated and if so, set the user data and connect the socket
    const checkAuth = async () => {
        const savedToken = localStorage.getItem("token");

        if (!savedToken) {
            setAuthUser(null);
            setAuthHeaders(null);
            return;
        }

        if (isAuthCheckRunning.current) return;
        isAuthCheckRunning.current = true;

        try {
            setAuthHeaders(savedToken);
            const { data } = await axios.get("/api/auth/check");
            if (data.success) {
                setAuthUser(data.user);
                connectSocket(data.user);
            }
        } catch (error) {
            const status = error.response?.status;
            if (status === 401 || status === 403) {
                localStorage.removeItem("token");
                setToken(null);
                setAuthUser(null);
                setAuthHeaders(null);
                return;
            }
            toast.error(error.response?.data?.message || error.message);
        } finally {
            isAuthCheckRunning.current = false;
        }
    } 

    // Login function to handle user authentication and socket connection
    const login = async (state, credentials) => {
        try {
            const { data } = await axios.post(`/api/auth/${state}`, credentials);
            if (data.success) {
                setAuthUser(data.userData);
                connectSocket(data.userData);
                setAuthHeaders(data.token);
                setToken(data.token);
                localStorage.setItem("token", data.token);
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    } 
    // Logout function to handle user logout and socket disconnection
    const logout = async () => {
        localStorage.removeItem("token");
        setToken(null);
        setAuthUser(null);
        setOnlineUsers([]);
        setAuthHeaders(null);
        toast.success("Logged out successfully");
        if (socket) socket.disconnect();
    }

    // Update profile function to handle user profile updates
    const updateProfile = async (body) => {
        try {
            const { data } = await axios.put("/api/auth/update-profile", body);
            if (data.success) {
                setAuthUser(data.user || data.userData);
                toast.success("Profile updated successfully");
                return true;
            } else {
                toast.error(data.message);
                return false;
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
            return false;
        }
    }


    // Connect socket function to handle socket connection and online users updates
    const connectSocket = (userData) => {
        if (!userData || socket?.connected) return;
        const newSocket = io(backendUrl, {
            query: {
                userId: userData._id, 
            }
        });
        newSocket.connect();
        setSocket(newSocket);

        newSocket.on("getOnlineUsers", (userIds)=> {
            setOnlineUsers(userIds);
        })
    }

    useEffect(() => {
        const savedToken = localStorage.getItem("token");

        if (savedToken) {
            setToken(savedToken);
            setAuthHeaders(savedToken);
        } else {
            setAuthHeaders(null);
            setToken(null);
        }

        checkAuth();
    }, [])

    const value = {
        axios, 
        authUser, 
        onlineUsers, 
        socket, 
        login, 
        logout, 
        updateProfile
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}