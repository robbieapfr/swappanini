export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type SwapStatus =
  | 'pending'
  | 'accepted'
  | 'initiator_sent'
  | 'receiver_sent'
  | 'completed'
  | 'refused'
  | 'cancelled'

export type SwapMode = 'mail' | 'inperson'
export type SwapPreference = 'mail' | 'inperson' | 'both'
export type StickerType = 'Joueur' | 'Foil/Spécial' | "Photo d'équipe"

export interface Database {
  public: {
    Tables: {
      stickers: {
        Row: {
          id: number
          code: string
          country: string
          number: number
          name: string | null
          type: StickerType
          club: string | null
          image_url: string | null
        }
        Insert: Omit<Database['public']['Tables']['stickers']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['stickers']['Insert']>
      }
      users: {
        Row: {
          id: string
          pseudo: string
          first_name: string | null
          last_name: string | null
          country: string
          city: string | null
          supported_club: string | null
          swap_preference: SwapPreference
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          pseudo: string
          first_name?: string | null
          last_name?: string | null
          country: string
          city?: string | null
          supported_club?: string | null
          swap_preference?: SwapPreference
          avatar_url?: string | null
        }
        Update: {
          pseudo?: string
          first_name?: string | null
          last_name?: string | null
          country?: string
          city?: string | null
          supported_club?: string | null
          swap_preference?: SwapPreference
          avatar_url?: string | null
        }
      }
      user_stickers: {
        Row: {
          user_id: string
          sticker_id: number
          quantity: number
          wanted: boolean
          priority: number | null
        }
        Insert: Database['public']['Tables']['user_stickers']['Row']
        Update: Partial<Database['public']['Tables']['user_stickers']['Row']>
      }
      swaps: {
        Row: {
          id: string
          initiator_id: string
          receiver_id: string
          status: SwapStatus
          swap_mode: SwapMode
          message: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['swaps']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['swaps']['Insert']>
      }
      swap_items: {
        Row: {
          id: number
          swap_id: string
          sticker_id: number
          from_user_id: string
          quantity: number
        }
        Insert: Omit<Database['public']['Tables']['swap_items']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['swap_items']['Insert']>
      }
      swap_messages: {
        Row: {
          id: number
          swap_id: string
          sender_id: string
          content: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['swap_messages']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['swap_messages']['Insert']>
      }
      badges: {
        Row: {
          id: number
          name: string
          description: string | null
          condition_type: string
          condition_value: Json
          image_url: string | null
        }
        Insert: Omit<Database['public']['Tables']['badges']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['badges']['Insert']>
      }
      user_badges: {
        Row: {
          user_id: string
          badge_id: number
          earned_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_badges']['Row'], 'earned_at'>
        Update: never
      }
    }
    Functions: {
      get_matches: {
        Args: { me: string }
        Returns: {
          id: string
          pseudo: string
          city: string | null
          country: string
          swap_preference: SwapPreference
          i_give_count: number
          i_get_count: number
          priority_match_count: number
          match_score: number
        }[]
      }
    }
    Views: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
