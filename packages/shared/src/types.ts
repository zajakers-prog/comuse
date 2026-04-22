// ========== Enums ==========
export type ProjectCategory = 'writing' | 'music' | 'comic' | 'screenplay' | 'lyrics';
export type LicenseType = 'open' | 'approval';
export type ProjectStatus = 'draft' | 'published';
export type BranchStatus = 'draft' | 'published';
export type ContributionRole = 'material' | 'story' | 'ending' | 'expansion' | 'edit' | 'translation';
export type TranslatorType = 'ai' | 'human';
export type NotificationType = 'branch_added' | 'comment' | 'promotion' | 'contribution' | 'report_resolved';
export type ReportStatus = 'pending' | 'resolved' | 'dismissed';
export type AuthProvider = 'google' | 'apple';

// ========== Database Types ==========
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          provider: string;
          locale: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          provider?: string;
          locale?: string;
        };
        Update: {
          display_name?: string | null;
          avatar_url?: string | null;
          locale?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          creator_id: string;
          title: string;
          category: ProjectCategory;
          description: string | null;
          language: string;
          license_type: LicenseType;
          status: ProjectStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          creator_id?: string;
          title: string;
          category: ProjectCategory;
          description?: string | null;
          language?: string;
          license_type?: LicenseType;
          status?: ProjectStatus;
        };
        Update: {
          title?: string;
          category?: ProjectCategory;
          description?: string | null;
          language?: string;
          license_type?: LicenseType;
          status?: ProjectStatus;
        };
      };
      branches: {
        Row: {
          id: string;
          project_id: string;
          parent_branch_id: string | null;
          author_id: string;
          title: string;
          content: Record<string, unknown> | null;
          completion_percent: number;
          status: BranchStatus;
          path: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          parent_branch_id?: string | null;
          author_id?: string;
          title: string;
          content?: Record<string, unknown> | null;
          completion_percent?: number;
          status?: BranchStatus;
        };
        Update: {
          title?: string;
          content?: Record<string, unknown> | null;
          completion_percent?: number;
          status?: BranchStatus;
        };
      };
      contributions: {
        Row: {
          id: string;
          branch_id: string;
          user_id: string;
          role: ContributionRole;
          ai_score: number | null;
          confirmed_at: string | null;
        };
        Insert: {
          id?: string;
          branch_id: string;
          user_id: string;
          role: ContributionRole;
          ai_score?: number | null;
          confirmed_at?: string | null;
        };
        Update: {
          role?: ContributionRole;
          ai_score?: number | null;
          confirmed_at?: string | null;
        };
      };
      ai_evaluations: {
        Row: {
          id: string;
          branch_id: string;
          commercial_score: number | null;
          artistic_score: number | null;
          summary_10lines: string | null;
          evaluated_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          commercial_score?: number | null;
          artistic_score?: number | null;
          summary_10lines?: string | null;
        };
        Update: {
          commercial_score?: number | null;
          artistic_score?: number | null;
          summary_10lines?: string | null;
        };
      };
      translations: {
        Row: {
          id: string;
          source_type: string;
          source_id: string;
          language: string;
          translated_content: Record<string, unknown>;
          translator_type: TranslatorType;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_type: string;
          source_id: string;
          language: string;
          translated_content: Record<string, unknown>;
          translator_type?: TranslatorType;
        };
        Update: {
          language?: string;
          translated_content?: Record<string, unknown>;
          translator_type?: TranslatorType;
        };
      };
      promotions: {
        Row: {
          id: string;
          branch_id: string;
          user_id: string;
          start_at: string;
          end_at: string;
          payment_id: string | null;
          amount: number;
        };
        Insert: {
          id?: string;
          branch_id: string;
          user_id: string;
          start_at: string;
          end_at: string;
          payment_id?: string | null;
          amount: number;
        };
        Update: {
          start_at?: string;
          end_at?: string;
          payment_id?: string | null;
          amount?: number;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          reference_id: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: NotificationType;
          reference_id?: string | null;
          read?: boolean;
        };
        Update: {
          read?: boolean;
        };
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          target_type: string;
          target_id: string;
          reason: string;
          status: ReportStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          target_type: string;
          target_id: string;
          reason: string;
          status?: ReportStatus;
        };
        Update: {
          reason?: string;
          status?: ReportStatus;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      project_category: ProjectCategory;
      license_type: LicenseType;
      project_status: ProjectStatus;
      branch_status: BranchStatus;
      contribution_role: ContributionRole;
      translator_type: TranslatorType;
      notification_type: NotificationType;
      report_status: ReportStatus;
    };
  };
}
