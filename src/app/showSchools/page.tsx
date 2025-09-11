import { executeQuery } from '@/lib/db';
import { Suspense } from 'react';
import SchoolsClient, { School } from './SchoolsClient';

async function getSchools() {
  try {
    const schoolsRaw = await executeQuery({
      query: 'SELECT id, name, address, city, state, contact, email_id, image, created_by FROM schools ORDER BY name ASC'
    }) as School[];
    
    const schools: School[] = schoolsRaw.map(school => ({
      ...school,
      created_by: school.created_by !== null && school.created_by !== undefined ? Number(school.created_by) : undefined
    }));
    
    const uniqueCities = [...new Set(schools.map(school => school.city))].sort();
    
    return {
      schools,
      cities: uniqueCities,
      error: null
    };
  } catch (error) {
    console.error('Error fetching schools:', error);
    return {
      schools: [],
      cities: [],
      error: 'Failed to fetch schools. Please try again later.'
    };
  }
}

function SchoolsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-lg text-gray-600">Loading schools...</span>
        </div>
      </div>
    </div>
  );
}

export default async function ShowSchools() {
  const { schools, cities, error } = await getSchools();
  
  return (
    <Suspense fallback={<SchoolsLoading />}>
      <SchoolsClient 
        initialSchools={schools as School[]}
        initialCities={cities as string[]} 
        initialError={error as string} 
      />
    </Suspense>
  );
}
