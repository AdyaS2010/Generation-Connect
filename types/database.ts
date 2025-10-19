export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'senior' | 'student'
          full_name: string
          phone: string | null
          created_at: string
        }
        Insert: {
          id: string
          role: 'senior' | 'student'
          full_name: string
          phone?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          role?: 'senior' | 'student'
          full_name?: string
          phone?: string | null
          created_at?: string
        }
      }
      student_profiles: {
        Row: {
          id: string
          school_name: string
          skills: string[]
          verification_status: 'pending' | 'approved' | 'rejected'
          school_id_url: string | null
          parent_consent_url: string | null
          total_hours: number
          created_at: string
        }
        Insert: {
          id: string
          school_name: string
          skills?: string[]
          verification_status?: 'pending' | 'approved' | 'rejected'
          school_id_url?: string | null
          parent_consent_url?: string | null
          total_hours?: number
          created_at?: string
        }
        Update: {
          id?: string
          school_name?: string
          skills?: string[]
          verification_status?: 'pending' | 'approved' | 'rejected'
          school_id_url?: string | null
          parent_consent_url?: string | null
          total_hours?: number
          created_at?: string
        }
      }
      help_requests: {
        Row: {
          id: string
          senior_id: string
          student_id: string | null
          title: string
          description: string
          category: string
          status: 'open' | 'claimed' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          claimed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          senior_id: string
          student_id?: string | null
          title: string
          description: string
          category: string
          status?: 'open' | 'claimed' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          claimed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          senior_id?: string
          student_id?: string | null
          title?: string
          description?: string
          category?: string
          status?: 'open' | 'claimed' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          claimed_at?: string | null
          created_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          request_id: string
          student_id: string
          senior_id: string
          scheduled_time: string
          duration_minutes: number
          actual_duration_minutes: number | null
          meeting_link: string | null
          status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          senior_signed_off: boolean
          notes: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          request_id: string
          student_id: string
          senior_id: string
          scheduled_time: string
          duration_minutes?: number
          actual_duration_minutes?: number | null
          meeting_link?: string | null
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          senior_signed_off?: boolean
          notes?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          request_id?: string
          student_id?: string
          senior_id?: string
          scheduled_time?: string
          duration_minutes?: number
          actual_duration_minutes?: number | null
          meeting_link?: string | null
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          senior_signed_off?: boolean
          notes?: string | null
          created_at?: string
          completed_at?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          request_id: string
          sender_id: string
          receiver_id: string
          content: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          request_id: string
          sender_id: string
          receiver_id: string
          content: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          sender_id?: string
          receiver_id?: string
          content?: string
          read?: boolean
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          session_id: string
          reviewer_id: string
          reviewee_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          reviewer_id: string
          reviewee_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          reviewer_id?: string
          reviewee_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
