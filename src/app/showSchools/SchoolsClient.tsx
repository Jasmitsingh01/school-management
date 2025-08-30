'use client';

import { useState, ChangeEvent, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { School } from '@/types';

interface SchoolsClientProps {
  initialSchools: School[];
  initialCities: string[];
  initialError: string | null;
}

interface ApiResponse {
  schools: School[];
  cities: string[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    totalPages: number;
  };
}

interface EditFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  contact: string;
  email_id: string;
  image?: string;
}

export default function SchoolsClient({ 
  initialSchools, 
  initialCities, 
  initialError 
}: SchoolsClientProps) {
  const [schools, setSchools] = useState<School[]>(initialSchools);
  const [cities, setCities] = useState<string[]>(initialCities);
  const [error, setError] = useState<string | null>(initialError);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCity, setFilterCity] = useState<string>('');
  
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const ITEMS_PER_PAGE = 12;
  
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    name: '',
    address: '',
    city: '',
    state: '',
    contact: '',
    email_id: '',
  });
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({});
  const [isEditSubmitting, setIsEditSubmitting] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState<string>('');
  const [editImageError, setEditImageError] = useState<string>('');
  const [editDragActive, setEditDragActive] = useState<boolean>(false);
  const [editImageUploaded, setEditImageUploaded] = useState<boolean>(false);
  const [editUploadedImagePath, setEditUploadedImagePath] = useState<string>('');
  const [imageUploadProgress, setImageUploadProgress] = useState<number>(0);
  console.log(editImageFile)
  const loadingRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  const refreshData = async (showLoader = true): Promise<void> => {
    try {
      if (showLoader) setLoading(true);
      setPage(1);
      setHasMore(true);
      
      const params = new URLSearchParams({
        page: '1',
        limit: ITEMS_PER_PAGE.toString(),
        _t: Date.now().toString()
      });

      if (searchTerm) params.append('search', searchTerm);
      if (filterCity) params.append('city', filterCity);

      const response = await fetch(`/api/schools?${params}`, {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch schools');
      }
      
      const data: ApiResponse = await response.json();
      setSchools(data.schools);
      setCities(data.cities);
      setHasMore(data.pagination?.hasMore ?? true);
      setError(null);
    } catch (error) {
      console.error('Error refreshing schools:', error);
      setError('Failed to refresh schools data');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const loadMoreSchools = useCallback(async (): Promise<void> => {
    if (loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      
      const params = new URLSearchParams({
        page: nextPage.toString(),
        limit: ITEMS_PER_PAGE.toString()
      });

      if (searchTerm) params.append('search', searchTerm);
      if (filterCity) params.append('city', filterCity);

      const response = await fetch(`/api/schools?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to load more schools');
      }
      
      const data: ApiResponse = await response.json();
      
      if (data.schools.length === 0 || !data.pagination?.hasMore) {
        setHasMore(false);
      } else {
        setSchools(prev => [...prev, ...data.schools]);
        setPage(nextPage);
        setHasMore(data.pagination.hasMore);
      }
    } catch (error) {
      console.error('Error loading more schools:', error);
      setError('Failed to load more schools');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page, searchTerm, filterCity]);

  const handleEditImageChange = async (file: File): Promise<void> => {
    setEditImageError('');
    setImageUploadProgress(0);
    
    if (!file) return;
    
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setEditImageError('Please select a valid image file (JPEG, PNG, or WebP)');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setEditImageError('Image size should be less than 5MB');
      return;
    }

    setEditImageFile(file);
    setEditPreviewUrl(URL.createObjectURL(file));
    setEditImageUploaded(false);
    
    setEditUploadedImagePath('');

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setImageUploadProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200 || xhr.status === 201) {
          try {
            const result = JSON.parse(xhr.responseText);
            console.log('Upload result:', result);
            
            const imagePath = result.filePath || result.url || result.path;
            if (imagePath) {
              setEditUploadedImagePath(imagePath);
              setEditImageUploaded(true);
              setImageUploadProgress(100);
              console.log('Image uploaded successfully:', imagePath);
            } else {
              throw new Error('No file path in upload response');
            }
          } catch (parseError) {
            console.error('Error parsing upload response:', parseError);
            setEditImageError('Upload response error');
            setEditImageUploaded(false);
          }
        } else {
          console.error('Upload failed with status:', xhr.status);
          setEditImageError('Upload failed');
          setEditImageUploaded(false);
        }
      });
      

      xhr.addEventListener('error', () => {
        console.error('Upload network error');
        setEditImageError('Upload failed');
        setEditImageUploaded(false);
      });

      xhr.open('POST', '/api/upload');
      xhr.send(uploadFormData);

    } catch (error) {
      setEditImageError('Failed to upload image. Please try again.');
      console.error('Upload error:', error);
      setImageUploadProgress(0);
      setEditImageUploaded(false);
    }
  };
  
  const handleEditFileInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) handleEditImageChange(file);
  };

  const handleEditDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setEditDragActive(true);
  };

  const handleEditDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setEditDragActive(false);
  };

  const handleEditDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setEditDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleEditImageChange(file);
  };

  const cleanupEditPreview = () => {
    if (editPreviewUrl) {
      URL.revokeObjectURL(editPreviewUrl);
      setEditPreviewUrl('');
    }
    setEditImageFile(null);
    setEditImageError('');
    setEditImageUploaded(false);
    setEditUploadedImagePath('');
    setImageUploadProgress(0);
  };

  const removeEditImage = () => {
    cleanupEditPreview();
    setEditFormData(prev => ({ ...prev, image: '' }));
  };

  const handleEditClick = (school: School) => {
    setEditingSchool(school);
    setEditFormData({
      name: school.name,
      address: school.address,
      city: school.city,
      state: school.state,
      contact: school.contact || '',
      email_id: school.email_id || '',
      image: school.image,
    });
    setEditFormErrors({});
    
    cleanupEditPreview();
    setEditUploadedImagePath('');
    setEditImageUploaded(false);
    
    setShowEditModal(true);
  };

  const validateEditForm = (data: EditFormData): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    if (!data.name || data.name.trim().length < 3) {
      errors.name = 'School name must be at least 3 characters';
    }
    if (!data.address || data.address.trim().length < 5) {
      errors.address = 'Address must be at least 5 characters';
    }
    if (!data.city || !/^[a-zA-Z\s]+$/.test(data.city)) {
      errors.city = 'City should contain only letters';
    }
    if (!data.state || !/^[a-zA-Z\s]+$/.test(data.state)) {
      errors.state = 'State should contain only letters';
    }
    if (!data.contact || !/^\d{10}$/.test(data.contact)) {
      errors.contact = 'Contact must be exactly 10 digits';
    }
    if (!data.email_id || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email_id)) {
      errors.email_id = 'Please enter a valid email';
    }
    
    return errors;
  };

  const handleEditFormChange = (field: keyof EditFormData, value: string) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
    if (editFormErrors[field]) {
      setEditFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingSchool) return;
    
    const errors = validateEditForm(editFormData);
    if (Object.keys(errors).length > 0) {
      setEditFormErrors(errors);
      return;
    }
    
    try {
      setIsEditSubmitting(true);
      
      let finalImagePath = editFormData.image || '';
      
      if (editImageUploaded && editUploadedImagePath) {
        finalImagePath = editUploadedImagePath;
        console.log('Using new uploaded image:', finalImagePath);
      } else if (editPreviewUrl && !editImageUploaded) {
        throw new Error('Please wait for image upload to complete');
      }
      
      const updatePayload = {
        name: editFormData.name.trim(),
        address: editFormData.address.trim(),
        city: editFormData.city.trim(),
        state: editFormData.state.trim(),
        contact: editFormData.contact.trim(),
        email_id: editFormData.email_id.trim(),
        image: finalImagePath
      };
      
      console.log('Update payload:', updatePayload);
      
      const response = await fetch(`/api/schools?id=${editingSchool.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to update school');
      }
      
      setSchools(prev => prev.map(school => 
        school.id === editingSchool.id 
          ? { ...school, ...updatePayload }
          : school
      ));
      
      setShowEditModal(false);
      setEditingSchool(null);
      cleanupEditPreview();
      
      await refreshData(false);
      
    } catch (error) {
      console.error('Error updating school:', error);
      setError(error instanceof Error ? error.message : 'Failed to update school');
    } finally {
      setIsEditSubmitting(false);
    }
  };
  
  const handleDeleteClick = (schoolId: number) => {
    setDeleteConfirmId(schoolId);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/schools?id=${deleteConfirmId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete school');
      }
      
      setSchools(prev => prev.filter(school => school.id !== deleteConfirmId));
      setDeleteConfirmId(null);
      
      await refreshData(false);
      
    } catch (error) {
      console.error('Error deleting school:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete school');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmId(null);
  };

  const filteredSchools = schools.filter((school: School) => {
    const matchesSearch = searchTerm === '' || 
      school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = filterCity === '' || school.city === filterCity;
    return matchesSearch && matchesCity;
  });

  const clearFilters = (): void => {
    setSearchTerm('');
    setFilterCity('');
    setPage(1);
    setHasMore(true);
    refreshData();
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
    setPage(1);
    setHasMore(true);
  };

  const handleCityChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    setFilterCity(e.target.value);
    setPage(1);
    setHasMore(true);
  };

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && hasMore && !loadingMore && !searchTerm && !filterCity) {
      loadMoreSchools();
    }
  }, [hasMore, loadingMore, searchTerm, filterCity, loadMoreSchools]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '20px',
      threshold: 0.1,
    });

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => observer.disconnect();
  }, [handleObserver]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm || filterCity) {
        refreshData();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filterCity]);

  useEffect(() => {
    const handleSchoolAdded = () => {
      refreshData(false);
    };

    window.addEventListener('schoolAdded', handleSchoolAdded);
    
    return () => {
      window.removeEventListener('schoolAdded', handleSchoolAdded);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (editPreviewUrl) {
        URL.revokeObjectURL(editPreviewUrl);
      }
    };
  }, [editPreviewUrl]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Schools Directory</h1>
            <span className="bg-blue-100 text-blue-800 text-xs sm:text-sm font-medium px-2 py-0.5 rounded-full">
              {filteredSchools.length} school{filteredSchools.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => refreshData()}
              disabled={loading}
              className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white py-2 px-4 rounded-md transition duration-200 text-sm"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            <Link 
              href="/addSchool" 
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 sm:px-6 rounded-md transition duration-200 text-sm text-center"
            >
              Add New School
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search Schools
              </label>
              <input
                type="text"
                id="search"
                placeholder="Search by name or address..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by City
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  id="city"
                  value={filterCity}
                  onChange={handleCityChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Cities</option>
                  {cities.map((city: string) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                {(searchTerm || filterCity) && (
                  <button
                    onClick={clearFilters}
                    className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-lg text-gray-600">Loading...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-medium">Error: {error}</p>
                  <button
                    onClick={() => refreshData()}
                    className="text-sm underline hover:no-underline mt-1"
                  >
                    Try again
                  </button>
                </div>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-700 hover:text-red-900"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {!loading && !error && filteredSchools.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No Schools Found</h2>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterCity 
                ? "No schools match your search criteria. Try adjusting your filters."
                : "There are no schools in the database yet. Add your first school!"}
            </p>
            <Link 
              href="/addSchool" 
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md transition duration-200"
            >
              Add New School
            </Link>
          </div>
        )}

        {!loading && !error && filteredSchools.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6">
            {filteredSchools.map((school: School) => (
              <div key={school.id} className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200 transform hover:-translate-y-1">
                <div className="relative h-48 overflow-hidden">
                  {school.image ? (
                    <Image
                      src={school.image}
                      alt={`${school.name} building`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center group-hover:from-blue-50 group-hover:to-blue-100 transition-colors duration-300">
                      <svg className="w-16 h-16 text-gray-400 group-hover:text-blue-400 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  )}
                  
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditClick(school)}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-colors"
                        title="Edit School"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(school.id)}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg transition-colors"
                        title="Delete School"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 sm:p-5">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2">
                    {school.name}
                  </h2>
                  
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-start space-x-3">
                      <svg className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-600 break-words leading-relaxed">{school.address}</p>
                        <p className="text-gray-600 font-medium mt-1">{school.city}, {school.state}</p>
                      </div>
                    </div>
                    
                    {school.contact && (
                      <div className="flex items-center space-x-3">
                        <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <p className="text-gray-600 font-mono">{school.contact}</p>
                      </div>
                    )}
                    
                    {school.email_id && (
                      <div className="flex items-center space-x-3">
                        <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-600 break-all font-mono text-xs">{school.email_id}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && hasMore && !searchTerm && !filterCity && (
          <div ref={loadingRef} className="flex justify-center items-center py-8">
            {loadingMore && (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Loading more schools...</span>
              </div>
            )}
          </div>
        )}

        {!loading && !error && !hasMore && filteredSchools.length > 0 && (
          <div className="text-center py-8">
            <div className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              You&apos;ve reached the end of the schools list
            </div>
          </div>
        )}

        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 z-50"
            title="Scroll to top"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        )}
      </div>

      {showEditModal && editingSchool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Edit School</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingSchool(null);
                    cleanupEditPreview();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-6">
                {(editFormData.image || editPreviewUrl) && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Image
                    </label>
                    <div className="relative w-48 h-32">
                      <Image
                        src={editPreviewUrl || editFormData.image || ''}
                        alt="Current school image"
                        fill
                        className="object-cover rounded-lg border"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Update School Image
                  </label>
                  
                  <div
                    onDragOver={handleEditDragOver}
                    onDragLeave={handleEditDragLeave}
                    onDrop={handleEditDrop}
                    className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                      editDragActive 
                        ? 'border-blue-400 bg-blue-50' 
                        : editImageError 
                        ? 'border-red-300 bg-red-50' 
                        : editImageUploaded 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,image/webp"
                      onChange={handleEditFileInputChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    
                    {editPreviewUrl ? (
                      <div className="space-y-3">
                        <div className="relative mx-auto w-32 h-24">
                          <Image
                            src={editPreviewUrl}
                            alt="New school preview"
                            fill
                            className="object-cover rounded-lg"
                          />
                        </div>
                        
                        {!editImageUploaded && imageUploadProgress > 0 && (
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${imageUploadProgress}%` }}
                            />
                            <p className="text-xs text-gray-600 mt-1">{Math.round(imageUploadProgress)}% uploaded</p>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <p className={`text-sm font-medium ${editImageUploaded ? 'text-green-600' : 'text-blue-600'}`}>
                            {editImageUploaded ? 'New image uploaded successfully!' : 'Uploading new image...'}
                          </p>
                          <div className="flex justify-center space-x-2">
                            <button
                              type="button"
                              onClick={removeEditImage}
                              className="text-sm text-red-600 hover:text-red-700 underline"
                            >
                              Remove new image
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <svg className="mx-auto w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium text-blue-600">Click to upload a new image</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG or WebP (max. 5MB)</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {editImageError && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {editImageError}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      School Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => handleEditFormChange('name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        editFormErrors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter school name"
                    />
                    {editFormErrors.name && (
                      <p className="mt-1 text-sm text-red-600">{editFormErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={editFormData.email_id}
                      onChange={(e) => handleEditFormChange('email_id', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        editFormErrors.email_id ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="contact@school.edu"
                    />
                    {editFormErrors.email_id && (
                      <p className="mt-1 text-sm text-red-600">{editFormErrors.email_id}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={editFormData.contact}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        handleEditFormChange('contact', value);
                      }}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        editFormErrors.contact ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="1234567890"
                      maxLength={10}
                    />
                    {editFormErrors.contact && (
                      <p className="mt-1 text-sm text-red-600">{editFormErrors.contact}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={editFormData.address}
                      onChange={(e) => handleEditFormChange('address', e.target.value)}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                        editFormErrors.address ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter complete address"
                    />
                    {editFormErrors.address && (
                      <p className="mt-1 text-sm text-red-600">{editFormErrors.address}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editFormData.city}
                      onChange={(e) => handleEditFormChange('city', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        editFormErrors.city ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter city name"
                    />
                    {editFormErrors.city && (
                      <p className="mt-1 text-sm text-red-600">{editFormErrors.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editFormData.state}
                      onChange={(e) => handleEditFormChange('state', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        editFormErrors.state ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter state name"
                    />
                    {editFormErrors.state && (
                      <p className="mt-1 text-sm text-red-600">{editFormErrors.state}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingSchool(null);
                      cleanupEditPreview();
                    }}
                    className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={Boolean(isEditSubmitting || (editPreviewUrl && !editImageUploaded))}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-md transition-colors flex items-center"
                  >
                    {isEditSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Updating...
                      </>
                    ) : editPreviewUrl && !editImageUploaded ? (
                      'Wait for image upload...'
                    ) : (
                      'Update School'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Delete School</h3>
                  <p className="text-sm text-gray-500">Are you sure you want to delete this school? This action cannot be undone.</p>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-md transition-colors flex items-center"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export type { School, SchoolsClientProps };
