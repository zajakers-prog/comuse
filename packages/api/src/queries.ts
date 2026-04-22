import type { SupabaseClient } from './client';

export function createQueries(supabase: SupabaseClient) {
  return {
    // Projects
    async getProjects(options?: { limit?: number; category?: string }) {
      let query = supabase
        .from('projects')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (options?.category) {
        query = query.eq('category', options.category);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      return query;
    },

    async getProject(id: string) {
      return supabase
        .from('projects')
        .select('*, users!projects_creator_id_fkey(display_name, avatar_url)')
        .eq('id', id)
        .single();
    },

    // Branches
    async getBranches(projectId: string) {
      return supabase
        .from('branches')
        .select('*, users!branches_author_id_fkey(display_name)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });
    },

    async getBranch(id: string) {
      return supabase
        .from('branches')
        .select('*, users!branches_author_id_fkey(display_name, avatar_url)')
        .eq('id', id)
        .single();
    },

    // User
    async getUserProfile(userId: string) {
      return supabase.from('users').select('*').eq('id', userId).single();
    },

    // Notifications
    async getNotifications(userId: string) {
      return supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
    },

    async markNotificationRead(id: string) {
      return supabase.from('notifications').update({ read: true }).eq('id', id);
    },
  };
}
