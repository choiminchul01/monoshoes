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
      products: {
        Row: {
          brand: string
          category: string
          created_at: string
          description: string
          id: string
          images: string[]
          is_available: boolean
          name: string
          price: number
          stock: number
          updated_at: string
          is_best: boolean | null
          is_new: boolean | null
          discount_percent: number | null
          original_price: number | null
          detail_images: string[] | null
        }
        Insert: {
          brand: string
          category: string
          created_at?: string
          description: string
          id?: string
          images: string[]
          is_available?: boolean
          name: string
          price: number
          stock: number
          updated_at?: string
          is_best?: boolean | null
          is_new?: boolean | null
          discount_percent?: number | null
          original_price?: number | null
          detail_images?: string[] | null
        }
        Update: {
          brand?: string
          category?: string
          created_at?: string
          description?: string
          id?: string
          images?: string[]
          is_available?: boolean
          name?: string
          price?: number
          stock?: number
          updated_at?: string
          is_best?: boolean | null
          is_new?: boolean | null
          discount_percent?: number | null
          original_price?: number | null
          detail_images?: string[] | null
        }
      }
      reviews: {
        Row: {
          author_name: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_admin_created: boolean
          product_id: string
          rating: number
        }
        Insert: {
          author_name: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_admin_created?: boolean
          product_id: string
          rating?: number
        }
        Update: {
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_admin_created?: boolean
          product_id?: string
          rating?: number
        }
      }
      site_settings: {
        Row: {
          id: number
          main_banners: any[] | null
          created_at: string
        }
        Insert: {
          id?: number
          main_banners?: any[] | null
          created_at?: string
        }
        Update: {
          id?: number
          main_banners?: any[] | null
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
