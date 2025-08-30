'use client';

import { useState, ChangeEvent, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FormValues, UploadResponse } from '@/types';

const schema = yup.object().shape({
  name: yup.string()
    .required('School name is required')
    .min(3, 'School name must be at least 3 characters')
    .max(100, 'School name must not exceed 100 characters'),
  address: yup.string()
    .required('Address is required')
    .min(5, 'Address must be at least 5 characters')
    .max(200, 'Address must not exceed 200 characters'),
  city: yup.string()
    .required('City is required')
    .matches(/^[a-zA-Z\s]+$/, 'City should contain only letters'),
  state: yup.string()
    .required('State is required')
    .matches(/^[a-zA-Z\s]+$/, 'State should contain only letters'),
  contact: yup.string()
    .matches(/^\d{10}$/, 'Contact must be a 10-digit number')
    .required('Contact number is required'),
  email_id: yup.string()
    .email('Please enter a valid email')
    .required('Email is required'),
});

export default function AddSchool() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [submitError, setSubmitError] = useState<string>('');
  const [submitSuccess, setSubmitSuccess] = useState<string>('');
  const [imageError, setImageError] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, touchedFields },
    reset,

    watch,
    trigger,
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      address: '',
      city: '',
      state: '',
      contact: '',
      email_id: '',
    }
  });

  const formData = watch();

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleImageChange = (file: File): void => {
    setImageError('');
    
    if (!file) return;
    
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setImageError('Please select a valid image file (JPEG, PNG, or WebP)');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image size should be less than 5MB');
      return;
    }

    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

 
  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) handleImageChange(file);
  };


  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageChange(file);
  };

 
  const cleanupPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
    setImageFile(null);
    setImageError('');
  };


  const handleNextStep = async () => {
    const isFormValid = await trigger(); 
    
    if (!imageFile) {
      setImageError('Please select a school image');
      return;
    }
    
    if (isFormValid && imageFile) {
      setCurrentStep(2);
      setSubmitError('');
    }
  };


  const handlePreviousStep = () => {
    setCurrentStep(1);
  };

  const onSubmit = async (data: FormValues): Promise<void> => {
    try {
      if (!imageFile) {
        setImageError('Please select a school image');
        return;
      }

      setIsSubmitting(true);
      setSubmitError('');
      setSubmitSuccess('');

      const formData = new FormData();
      formData.append('file', imageFile);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.message || 'Failed to upload image');
      }

      const uploadResult = await uploadResponse.json() as UploadResponse;
      
      const schoolResponse = await fetch('/api/schools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          image: uploadResult.filePath,
        }),
      });

      if (!schoolResponse.ok) {
        const errorData = await schoolResponse.json();
        throw new Error(errorData.message || 'Failed to add school');
      }

      setSubmitSuccess('School added successfully!');
      reset();
      setImageFile(null);
      cleanupPreview();
      
      setTimeout(() => {
        router.push('/showSchools');
      }, 2000);
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to add school');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Add New School</h1>
                          <p className="mt-2 text-gray-600 text-sm sm:text-base text-wrap-balance">
                {currentStep === 1 
                  ? 'Fill in the details to register a new educational institution'
                  : 'Review your information before submitting'
                }
              </p>
          </div>
          <Link 
            href="/showSchools" 
            className="inline-flex items-center px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm sm:text-base"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Schools
          </Link>
        </div>
        </div>

        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-0">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                currentStep >= 1 ? 'bg-blue-600' : 'bg-gray-200'
              }`}>
                {currentStep > 1 ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  '1'
                )}
              </div>
              <span className="ml-2 text-sm font-medium">School Information</span>
            </div>
            <div className={`hidden sm:block flex-1 mx-4 h-0.5 ${currentStep > 1 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Review & Submit</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {submitSuccess && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-green-800 font-medium">{submitSuccess}</span>
              </div>
            </div>
          )}

          {submitError && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-red-800 font-medium">{submitError}</span>
              </div>
            </div>
          )}

          <div className="p-4 sm:p-8">
            <form onSubmit={handleSubmit((data) => onSubmit(data as FormValues))}>
              
              {currentStep === 1 && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="lg:col-span-2">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                          School Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="name"
                          type="text"
                          {...register('name')}
                          placeholder="Enter the full name of the school"
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                            errors.name ? 'border-red-300 bg-red-50' : touchedFields.name ? 'border-green-300 bg-green-50' : 'border-gray-300'
                          }`}
                        />
                        {errors.name && (
                          <p className="mt-2 text-sm text-red-600 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errors.name.message}
                          </p>
                        )}
                      </div>

                     
                      <div>
                        <label htmlFor="email_id" className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="email_id"
                          type="email"
                          {...register('email_id')}
                          placeholder="contact@school.edu"
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                            errors.email_id ? 'border-red-300 bg-red-50' : touchedFields.email_id ? 'border-green-300 bg-green-50' : 'border-gray-300'
                          }`}
                        />
                        {errors.email_id && (
                          <p className="mt-2 text-sm text-red-600 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errors.email_id.message}
                          </p>
                        )}
                      </div>

                 
                      <div>
                        <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-2">
                          Contact Number <span className="text-red-500">*</span>
                        </label>
                        <Controller
                          name="contact"
                          control={control}
                          render={({ field }) => (
                            <div className="relative">
                              <input
                                id="contact"
                                type="tel"
                                {...field}
                                placeholder="1234567890"
                                maxLength={10}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, '');
                                  field.onChange(value);
                                }}
                                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                                  errors.contact ? 'border-red-300 bg-red-50' : touchedFields.contact ? 'border-green-300 bg-green-50' : 'border-gray-300'
                                }`}
                              />
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                              </div>
                            </div>
                          )}
                        />
                        {errors.contact && (
                          <p className="mt-2 text-sm text-red-600 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errors.contact.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

              
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Information</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                      <div className="lg:col-span-2">
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                          Full Address <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="address"
                          {...register('address')}
                          rows={3}
                          placeholder="Enter the complete address of the school"
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none ${
                            errors.address ? 'border-red-300 bg-red-50' : touchedFields.address ? 'border-green-300 bg-green-50' : 'border-gray-300'
                          }`}
                        />
                        {errors.address && (
                          <p className="mt-2 text-sm text-red-600 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errors.address.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                          City <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="city"
                          type="text"
                          {...register('city')}
                          placeholder="Enter city name"
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                            errors.city ? 'border-red-300 bg-red-50' : touchedFields.city ? 'border-green-300 bg-green-50' : 'border-gray-300'
                          }`}
                        />
                        {errors.city && (
                          <p className="mt-2 text-sm text-red-600 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errors.city.message}
                          </p>
                        )}
                      </div>

                   
                      <div>
                        <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                          State <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="state"
                          type="text"
                          {...register('state')}
                          placeholder="Enter state name"
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                            errors.state ? 'border-red-300 bg-red-50' : touchedFields.state ? 'border-green-300 bg-green-50' : 'border-gray-300'
                          }`}
                        />
                        {errors.state && (
                          <p className="mt-2 text-sm text-red-600 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errors.state.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">School Image</h3>
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Upload School Image <span className="text-red-500">*</span>
                      </label>
                      
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                          dragActive 
                            ? 'border-blue-400 bg-blue-50' 
                            : imageError 
                            ? 'border-red-300 bg-red-50' 
                            : imageFile 
                            ? 'border-green-300 bg-green-50' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/jpg,image/webp"
                          onChange={handleFileInputChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        
                        {previewUrl ? (
                          <div className="space-y-4">
                            <div className="relative mx-auto w-48 h-32">
                              <Image
                                src={previewUrl}
                                alt="School preview"
                                fill
                                style={{ objectFit: 'cover' }}
                                className="rounded-lg"
                              />
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm text-green-600 font-medium">Image uploaded successfully!</p>
                              <button
                                type="button"
                                onClick={cleanupPreview}
                                className="inline-flex items-center px-3 py-1 text-sm text-red-600 hover:text-red-700 transition-colors"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Remove image
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <svg className="mx-auto w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <div>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                              </p>
                              <p className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG or WebP (max. 5MB)</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {imageError && (
                        <p className="text-sm text-red-600 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {imageError}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-center sm:flex-row gap-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        reset();
                        cleanupPreview();
                        setSubmitError('');
                        setSubmitSuccess('');
                      }}
                      className="flex-1 sm:flex-none px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                    >
                      Reset Form
                    </button>
                    
                    <div className="flex gap-4 sm:ml-auto">
                      <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium border border-gray-300 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="px-8 py-3 text-nowrap bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors inline-flex items-center"
                      >
                        Review
                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Review Information</h3>
                    <p className="text-gray-600 mb-6">Please review all the information below before submitting.</p>

                    <div className="bg-gray-50 rounded-lg p-6 space-y-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-4">Basic Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-500">School Name</label>
                            <p className="text-gray-900">{formData.name || 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Email Address</label>
                            <p className="text-gray-900">{formData.email_id || 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Contact Number</label>
                            <p className="text-gray-900">{formData.contact || 'Not provided'}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-4">Location Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <label className="text-sm font-medium text-gray-500">Full Address</label>
                            <p className="text-gray-900">{formData.address || 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">City</label>
                            <p className="text-gray-900">{formData.city || 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">State</label>
                            <p className="text-gray-900">{formData.state || 'Not provided'}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-4">School Image</h4>
                        {previewUrl ? (
                          <div className="relative w-64 h-40">
                            <Image
                              src={previewUrl}
                              alt="School preview"
                              fill
                              style={{ objectFit: 'cover' }}
                              className="rounded-lg border"
                            />
                          </div>
                        ) : (
                          <p className="text-gray-500">No image uploaded</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handlePreviousStep}
                      className="flex-1 sm:flex-none px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors inline-flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                      Back to Edit
                    </button>
                    
                    <div className="flex gap-4 sm:ml-auto">
                      <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium border border-gray-300 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors inline-flex items-center"
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Submitting...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Submit School
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
