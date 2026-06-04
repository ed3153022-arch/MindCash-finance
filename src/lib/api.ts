import { supabase } from './supabase';
import { ApiResponse, Profile, PaginationParams, PaginatedResponse } from '@/types';

export class ApiService {
  // Profile operations
  static async getProfile(userId: string): Promise<ApiResponse<Profile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data as Profile,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch profile',
      };
    }
  }

  static async updateProfile(userId: string, updates: Partial<Profile>): Promise<ApiResponse<Profile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data as Profile,
        message: 'Profile updated successfully!',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update profile',
      };
    }
  }

  static async createProfile(profile: Omit<Profile, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Profile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          ...profile,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data as Profile,
        message: 'Profile created successfully!',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create profile',
      };
    }
  }

  // Generic CRUD operations
  static async create<T>(table: string, data: Partial<T>): Promise<ApiResponse<T>> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: result as T,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create ${table} record`,
      };
    }
  }

  static async read<T>(
    table: string,
    params?: PaginationParams & { filters?: Record<string, any> }
  ): Promise<ApiResponse<PaginatedResponse<T>>> {
    try {
      let query = supabase.from(table).select('*', { count: 'exact' });

      // Apply filters
      if (params?.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      // Apply search
      if (params?.search) {
        query = query.ilike('name', `%${params.search}%`);
      }

      // Apply sorting
      if (params?.sortBy) {
        query = query.order(params.sortBy, { 
          ascending: params.sortOrder === 'asc' 
        });
      }

      // Apply pagination
      if (params?.page && params?.limit) {
        const from = (params.page - 1) * params.limit;
        const to = from + params.limit - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query;

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      const total = count || 0;
      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: {
          data: data as T[],
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch ${table} records`,
      };
    }
  }

  static async update<T>(
    table: string,
    id: string,
    updates: Partial<T>
  ): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data as T,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update ${table} record`,
      };
    }
  }

  static async delete(table: string, id: string): Promise<ApiResponse> {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        message: 'Record deleted successfully!',
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete ${table} record`,
      };
    }
  }

  // File upload
  static async uploadFile(
    bucket: string,
    path: string,
    file: File
  ): Promise<ApiResponse<{ path: string; url: string }>> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          upsert: true,
        });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return {
        success: true,
        data: {
          path: data.path,
          url: publicUrl,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to upload file',
      };
    }
  }
}