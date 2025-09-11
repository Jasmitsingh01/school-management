import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { School, SchoolResponse, SchoolsResponse } from '@/types';
import { verifyAuth } from '@/lib/auth';

interface SchoolData {
  name: string;
  address: string;
  city: string;
  state: string;
  contact: string;
  image: string;
  email_id: string;
}

interface QueryResult {
  insertId: number;
}

function sanitizeForSQL(value: string): string {
  return value.replace(/'/g, "''").replace(/\\/g, '\\\\');
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (id) {
      const schoolId = parseInt(id);
      if (isNaN(schoolId)) {
        return NextResponse.json(
          { error: 'Invalid school ID' },
          { status: 400 }
        );
      }
      
      const schoolsRaw = await executeQuery({
      query: `SELECT * FROM schools WHERE id = ?`,
      values: [schoolId]
    }) as Array<{
      id: number;
      name: string;
      address: string;
      city: string;
      state: string;
      contact: string;
      email_id: string;
      image: string;
      created_by: number;
    }>;
      
      if (schoolsRaw.length === 0) {
        return NextResponse.json(
          { error: 'School not found' },
          { status: 404 }
        );
      }
      
      const school = {
        ...schoolsRaw[0],
        created_by: schoolsRaw[0].created_by !== null && schoolsRaw[0].created_by !== undefined ? Number(schoolsRaw[0].created_by) : undefined
      };
      
      const response: SchoolResponse = { school };
      return NextResponse.json(response, { status: 200 });
    }
    
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    
    const schoolsRaw = await executeQuery({
      query: `SELECT id, name, address, city, state, contact, email_id, image, created_by FROM schools ORDER BY name ASC LIMIT ? OFFSET ?`,
      values: [limit.toString(), offset.toString()]
    }) as Array<{
      id: number;
      name: string;
      address: string;
      city: string;
      state: string;
      contact: string;
      email_id: string;
      image: string;
      created_by: number;
    }>;    
    
    const schools: School[] = schoolsRaw.map(school => ({
      ...school,
      created_by: school.created_by !== null && school.created_by !== undefined ? Number(school.created_by) : undefined
    }));
    
    
    const totalCountResult = await executeQuery({
      query: 'SELECT COUNT(*) as total FROM schools'
    }) as { total: number }[];
    
    const totalCount = totalCountResult[0]?.total || 0;
    const hasMore = offset + schools.length < totalCount;
    
    const allCitiesResult = await executeQuery({
      query: 'SELECT DISTINCT city FROM schools ORDER BY city ASC'
    }) as { city: string }[];
    
    const cities: string[] = allCitiesResult.map(row => row.city);
    
    const headers = new Headers();
    headers.set('Cache-Control', 's-maxage=10, stale-while-revalidate=59');
    
    const response: SchoolsResponse = { 
      schools, 
      cities,
      pagination: {
        page,
        limit,
        total: totalCount,
        hasMore
      }
    };
    return NextResponse.json(response, { 
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Error fetching schools:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schools' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
 
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const data = await request.json() as SchoolData;
    const { name, address, city, state, contact, image, email_id } = data;
    
    const requiredFields: Record<string, string> = { 
      name, 
      address, 
      city, 
      state, 
      contact, 
      image, 
      email_id 
    };
    
    const missingFields: string[] = Object.entries(requiredFields)
      .filter(([, value]) => !value || !value.trim())
      .map(([key]) => key);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: 'Missing required fields', 
          missingFields 
        },
        { status: 400 }
      );
    }

    if (!/^\d{10}$/.test(contact)) {
      return NextResponse.json(
        { error: 'Contact must be exactly 10 digits' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email_id)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const result = await executeQuery({
      query: `
        INSERT INTO schools (name, address, city, state, contact, image, email_id, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      values: [name.trim(), address.trim(), city.trim(), state.trim(), contact.trim(), image.trim(), email_id.trim(), user.userId]
    }) as QueryResult;
    
    revalidatePath('/showSchools');
    
    return NextResponse.json(
      { message: 'School added successfully', id: result.insertId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding school:', error);
    return NextResponse.json(
      { error: 'Failed to add school' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request): Promise<NextResponse> {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'School ID is required' },
        { status: 400 }
      );
    }

    const schoolId = parseInt(id);
    if (isNaN(schoolId)) {
      return NextResponse.json(
        { error: 'Invalid school ID' },
        { status: 400 }
      );
    }

    const schools = await executeQuery({
      query: `SELECT created_by FROM schools WHERE id = ?`,
      values: [schoolId] as (string | number)[]
    }) as { created_by: number }[];

    if (schools.length === 0) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    if (schools[0].created_by !== user.userId) {
      return NextResponse.json(
        { error: 'You can only edit schools that you created' },
        { status: 403 }
      );
    }

    const data = await request.json() as SchoolData;
    const { name, address, city, state, contact, image, email_id } = data;
    
    await executeQuery({
      query: `
        UPDATE schools 
        SET name = ?, address = ?, city = ?, state = ?, contact = ?, image = ?, email_id = ?
        WHERE id = ?
      `,
      values: [name.trim(), address.trim(), city.trim(), state.trim(), contact.trim(), image.trim(), email_id.trim(), schoolId]
    });
    
    revalidatePath('/showSchools');
    
    return NextResponse.json(
      { message: 'School updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating school:', error);
    return NextResponse.json(
      { error: 'Failed to update school' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'School ID is required' },
        { status: 400 }
      );
    }

    const schoolId = parseInt(id);
    if (isNaN(schoolId)) {
      return NextResponse.json(
        { error: 'Invalid school ID' },
        { status: 400 }
      );
    }

    const schools = await executeQuery({
      query: `SELECT created_by FROM schools WHERE id = ?`,
      values: [schoolId] as (string | number)[]
    }) as { created_by: number }[];

    if (schools.length === 0) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    if (schools[0].created_by !== user.userId) {
      return NextResponse.json(
        { error: 'You can only delete schools that you created' },
        { status: 403 }
      );
    }
    
    await executeQuery({
      query: `DELETE FROM schools WHERE id = ?`,
      values: [schoolId] as (string | number)[]
    });
    
    revalidatePath('/showSchools');
    
    return NextResponse.json(
      { message: 'School deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting school:', error);
    return NextResponse.json(
      { error: 'Failed to delete school' },
      { status: 500 }
    );
  }
}
