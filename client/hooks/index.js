import { useState, useEffect, useContext, useRef } from 'react';
import jwt_decode from 'jwt-decode';

import { UserContext } from '@/providers/UserProvider';
import { PlaceContext } from '@/providers/PlaceProvider';

import { getItemFromLocalStorage, setItemsInLocalStorage, removeItemFromLocalStorage } from '@/utils';
import axiosInstance from '@/utils/axios';

// USER
export const useAuth = () => {
    return useContext(UserContext)
}

export const useProvideAuth = () => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const storedUser = getItemFromLocalStorage('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false)
    }, [])

    const register = async (formData) => {
        const { name, email, password } = formData;

        try {
            const { data } = await axiosInstance.post('/register', {
                name,
                email,
                password,
            });
            if (data.user && data.token) {
                setUser(data.user)
                // save user and token in local storage
                setItemsInLocalStorage('user', data.user)
                setItemsInLocalStorage('token', data.token)
            }
            return { success: true, message: 'Registration successful' }
        } catch (error) {
            console.error('Register error:', error.response?.data || error.message);
            const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
            return { success: false, message: errorMessage }
        }
    }

    const login = async (formData) => {
        const { email, password } = formData;

        try {
            const { data } = await axiosInstance.post('/login', {
                email,
                password,
            });
            if (data.user && data.token) {
                setUser(data.user)
                // save user and token in local storage
                setItemsInLocalStorage('user', data.user)
                setItemsInLocalStorage('token', data.token)
            }
            return { success: true, message: 'Login successful' }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Login failed';
            return { success: false, message: errorMessage }
        }
    }

    const googleLogin = async (credential) => {
        const decoded = jwt_decode(credential);
        try {
            const { data } = await axiosInstance.post('/google-login', {
                name: `${decoded.given_name} ${decoded.family_name}`,
                email: decoded.email,
            });
            if (data.user && data.token) {
                setUser(data.user)
                // save user and token in local storage
                setItemsInLocalStorage('user', data.user)
                setItemsInLocalStorage('token', data.token)
            }
            return { success: true, message: 'Login successfull' }
        } catch (error) {
            return { success: false, message: error.message }
        }
    }

    const logout = async () => {
        try {
            const { data } = await axiosInstance.get('/logout');
            if (data.success) {
                setUser(null);

                // Clear user data and token from localStorage when logging out
                removeItemFromLocalStorage('user');
                removeItemFromLocalStorage('token');
            }
            return { success: true, message: 'Logout successfull' }
        } catch (error) {
            console.log(error)
            return { success: false, message: 'Something went wrong!' }
        }
    }

    const uploadPicture = async (picture) => {
        try {
            const formData = new FormData()
            formData.append('picture', picture)
            const { data } = await axiosInstance.post('/upload-picture', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            return data
        } catch (error) {
            console.log(error)
        }
    }

    const updateUser = async (userDetails) => {
        const { name, password, picture } = userDetails;
        const email = JSON.parse(getItemFromLocalStorage('user')).email
        try {
            const { data } = await axiosInstance.put('/update-user', {
                name, password, email, picture
            })
            return data;
        } catch (error) {
            console.log(error)
        }
    }


    return {
        user,
        setUser,
        register,
        login,
        googleLogin,
        logout,
        loading,
        uploadPicture,
        updateUser
    }
}


// PLACES
export const usePlaces = () => {
    return useContext(PlaceContext)
}

export const useProvidePlaces = () => {
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const hasSeededRef = useRef(false);

    const getPlaces = async () => {
        try {
            const { data } = await axiosInstance.get('/places');
            const fetchedPlaces = data.places || [];
            setPlaces(fetchedPlaces);

            if (fetchedPlaces.length === 0 && !hasSeededRef.current) {
                hasSeededRef.current = true;
                await axiosInstance.post('/places/seed');
                const seeded = await axiosInstance.get('/places');
                setPlaces(seeded.data.places || []);
            }
        } catch (error) {
            console.error('Failed to load places', error);
            setPlaces([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getPlaces();
    }, [])

    return {
        places,
        setPlaces,
        loading,
        setLoading
    }
}