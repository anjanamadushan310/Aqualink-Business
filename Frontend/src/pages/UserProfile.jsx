import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL, API_URL } from '../config';
import LoadingSpinner from '../components/user-profile/LoadingSpinner';
import ErrorDisplay from '../components/user-profile/ErrorDisplay';
import ProfileSection from '../components/user-profile/ProfileSection';
import BasicInformationSection from '../components/user-profile/BasicInformationSection';
import AddressSection from './../components/user-profile/AddressSection';
import ActionButtons from '../components/user-profile/ActionButtons';
import AddRoleSection from '../components/user-profile/AddRoleSection';
import { districtToTowns } from '../components/user-profile/locationData';
import { useAuth } from '../context/AuthContext';

const UserProfile = () => {
    const { refreshUserData, user } = useAuth();
    const [profile, setProfile] = useState({});
    const [initialProfile, setInitialProfile] = useState({});
    const [editingSection, setEditingSection] = useState(null);
    const [errors, setErrors] = useState({});
    const [logoFile, setLogoFile] = useState(null);
    const [availableTowns, setAvailableTowns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        // Add a small delay to ensure token is available after login
        const timer = setTimeout(() => {
            fetchProfile();
        }, 100);
        
        return () => clearTimeout(timer);
    }, []);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            return null;
        }
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    };

    const handleAuthError = (error) => {
        if (error.response?.status === 401) {
            // Clear invalid tokens
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Redirect to login or show login modal
            window.location.href = '/login';
            return true;
        }
        return false;
    };

    const fetchProfile = async () => {
        setLoading(true);
        setErrors({});
        
        try {
            const headers = getAuthHeaders();
            if (!headers) {
                throw new Error('No authentication token found. Please log in again.');
            }

            console.log('Fetching profile with headers:', headers);
            
            const response = await axios.get(`${API_BASE_URL}/api/profile`, {
                headers
            });

            console.log('Profile fetched successfully:', response.data);
            setProfile(response.data);
            setInitialProfile(response.data);
            
            // Update localStorage with profile data on initial load
            const storedUser = JSON.parse(localStorage.getItem('user'));
            if (storedUser) {
                let userUpdated = false;
                
                if (response.data.logoUrl && !storedUser.logoUrl) {
                    storedUser.logoUrl = response.data.logoUrl;
                    userUpdated = true;
                }
                
                if (response.data.businessName && !storedUser.businessName) {
                    storedUser.businessName = response.data.businessName;
                    userUpdated = true;
                }
                
                if (userUpdated) {
                    localStorage.setItem('user', JSON.stringify(storedUser));
                    refreshUserData();
                }
            }
            
            if (response.data.addressDistrict) {
                setAvailableTowns(districtToTowns[response.data.addressDistrict] || []);
            }
        } catch (error) {
            console.error("Failed to fetch profile:", error);
            
            if (!handleAuthError(error)) {
                const errorMessage = error.response?.data?.message || 
                                   error.response?.data?.error || 
                                   error.message ||
                                   'Failed to load profile. Please try again.';
                setErrors({ general: errorMessage });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'addressDistrict') {
            const towns = districtToTowns[value] || [];
            setAvailableTowns(towns);
            setProfile({ 
                ...profile, 
                [name]: value,
                addressTown: ''
            });
        } else {
            setProfile({ ...profile, [name]: value });
        }
        
        // Clear errors for this field
        if (errors[name]) {
            setErrors({ ...errors, [name]: null });
        }
    };
    
    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files.length === 0) return;
        
        const file = files[0];
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        if (file.size > maxSize) {
            setErrors({ ...errors, [name]: 'File size should not exceed 5MB' });
            return;
        }

        // Check file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            setErrors({ ...errors, [name]: 'Only JPEG, PNG, and GIF images are allowed' });
            return;
        }
        
        if (name === 'logo') {
            setLogoFile(file);
        }
        
        if (errors[name]) {
            setErrors({ ...errors, [name]: null });
        }
    };

    const validate = () => {
        const newErrors = {};
        
        if (editingSection === 'basic') {
            if (!profile.businessName?.trim()) {
                newErrors.businessName = 'Business name is required.';
            }
            if (!profile.businessType?.trim()) {
                newErrors.businessType = 'Business type is required.';
            }
        }
        
        if (editingSection === 'address') {
            if (!profile.addressPlace?.trim()) {
                newErrors.addressPlace = 'Place/Building is required.';
            }
            if (!profile.addressStreet?.trim()) {
                newErrors.addressStreet = 'Street is required.';
            }
            if (!profile.addressDistrict) {
                newErrors.addressDistrict = 'Please select a district.';
            }
            if (!profile.addressTown?.trim()) {
                newErrors.addressTown = 'Please select a town.';
            }
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        
        setLoading(true);
        setErrors({});
        setSuccessMessage('');

        try {
            const headers = getAuthHeaders();
            if (!headers) {
                throw new Error('No authentication token found. Please log in again.');
            }

            const formData = new FormData();
            formData.append('profileData', JSON.stringify(profile));
            
            if (logoFile) {
                formData.append('logo', logoFile);
            }

            const response = await axios.put(`${API_BASE_URL}/api/profile`, formData, {
                headers: {
                    ...headers,
                    'Content-Type': 'multipart/form-data'
                }
            });

            console.log('Profile updated successfully:', response.data);

            // Update state with response data
            setProfile(response.data);
            setInitialProfile(response.data);
            setEditingSection(null);
            setErrors({});
            setLogoFile(null);
            setSuccessMessage('Profile updated successfully!');

            // Update user in localStorage with logoUrl and businessName
            const storedUser = JSON.parse(localStorage.getItem('user'));
            if (storedUser) {
                let userUpdated = false;
                
                if (response.data.logoUrl) {
                    storedUser.logoUrl = response.data.logoUrl;
                    userUpdated = true;
                }
                
                if (response.data.businessName) {
                    storedUser.businessName = response.data.businessName;
                    userUpdated = true;
                }
                
                if (userUpdated) {
                    localStorage.setItem('user', JSON.stringify(storedUser));
                    // Refresh user data in AuthContext to reflect the updated data
                    refreshUserData();
                }
            }

            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage('');
            }, 3000);

        } catch (error) {
            console.error("Failed to update profile:", error);
            
            if (!handleAuthError(error)) {
                const errorMessage = error.response?.data?.message || 
                                   error.response?.data?.error || 
                                   'Failed to save changes. Please try again.';
                setErrors({ general: errorMessage });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setProfile(initialProfile);
        setEditingSection(null);
        setErrors({});
        setLogoFile(null);
        setSuccessMessage('');
        
        if (initialProfile.addressDistrict) {
            setAvailableTowns(districtToTowns[initialProfile.addressDistrict] || []);
        } else {
            setAvailableTowns([]);
        }
    };

    const isEditing = (section) => editingSection === section;

    // Show loading spinner during initial load
    if (loading && !profile.businessName) {
        return <LoadingSpinner message="Loading profile..." />;
    }

    // Show error if no token and profile couldn't be fetched
    if (errors.general && !profile.businessName) {
        return (
            <div className="bg-gray-100 min-h-screen p-8">
                <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">My Business Profile</h1>
                <ErrorDisplay error={errors.general} />
                <div className="text-center mt-4">
                    <button 
                        onClick={fetchProfile}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-100 min-h-screen p-8">
            <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">My Business Profile</h1>
            
            <ErrorDisplay error={errors.general} />
            
            {/* Success Message */}
            {successMessage && (
                <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                    {successMessage}
                </div>
            )}

            {/* Add Role Section */}
            {user && user.roles && (
                <AddRoleSection 
                    currentRoles={user.roles} 
                    onRoleAdded={fetchProfile}
                />
            )}
            
            {/* Basic Information Section */}
            <ProfileSection 
                title="Basic Information" 
                onEdit={() => setEditingSection('basic')} 
                isEditing={isEditing('basic')}
            >
                <BasicInformationSection
                    profile={profile}
                    isEditing={isEditing('basic')}
                    onInputChange={handleInputChange}
                    onFileChange={handleFileChange}
                    errors={errors}
                    logoFile={logoFile}
                />
            </ProfileSection>

            {/* Business Address Section */}
            <ProfileSection 
                title="Business Address" 
                onEdit={() => setEditingSection('address')} 
                isEditing={isEditing('address')}
            >
                <AddressSection
                    profile={profile}
                    isEditing={isEditing('address')}
                    onInputChange={handleInputChange}
                    errors={errors}
                    availableTowns={availableTowns}
                />
            </ProfileSection>

            {/* Action Buttons */}
            {editingSection && (
                <ActionButtons
                    onCancel={handleCancel}
                    onSave={handleSave}
                    loading={loading}
                />
            )}
        </div>
    );
};

export default UserProfile;