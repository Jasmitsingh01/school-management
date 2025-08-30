'use client';

import { useState, ChangeEvent, JSX, useEffect, useRef, useCallback } from 'react';
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
  };
}

export default function SchoolsClient({ 
  initialSchools, 
  initialCities, 
  initialError 
}: SchoolsClientProps): JSX.Element {
  const [schools, setSchools] = useState<School[]>(initialSchools);
  const [cities, setCities] = useState<string[]>(initialCities);
  const [error, setError] = useState<string | null>(initialError);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCity, setFilterCity] = useState<string>('');
  
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const ITEMS_PER_PAGE = 10;
  
  const loadingRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  const refreshData = async (): Promise<void> => {
    try {
      setLoading(true);
      setPage(1);
      setHasMore(true);
      const response = await fetch('/api/schools');
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
      setLoading(false);
    }
  };

  const loadMoreSchools = async (): Promise<void> => {
    if (loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const response = await fetch(`/api/schools?page=${nextPage}&limit=${ITEMS_PER_PAGE}`);
      
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
    if (target.isIntersecting && hasMore && !loadingMore) {
      loadMoreSchools();
    }
  }, [hasMore, loadingMore, loadMoreSchools]);

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
              onClick={refreshData}
              disabled={loading}
              className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md transition duration-200 disabled:opacity-50 text-sm"
              type="button"
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
                    title="Clear filters"
                    type="button"
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
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium">Error: {error}</p>
                <p className="text-sm">Please try refreshing the page or contact support.</p>
              </div>
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
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center group-hover:from-blue-50 group-hover:to-blue-100 transition-colors duration-300">
                      <svg className="w-16 h-16 text-gray-400 group-hover:text-blue-400 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-4 sm:p-5">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2">
                    {school.name}
                  </h2>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-600 break-words leading-relaxed">{school.address}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-600 font-medium">{school.city}, {school.state}</p>
                      </div>
                    </div>
                    
                    {school.contact && (
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-600 font-mono">{school.contact}</p>
                        </div>
                      </div>
                    )}
                    
                    {school.email_id && (
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-600 break-all font-mono">{school.email_id}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && hasMore && (
          <div ref={loadingRef} className="flex justify-center items-center py-8">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Loading more schools...</span>
            </div>
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
            type="button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}


export type { School, SchoolsClientProps };
