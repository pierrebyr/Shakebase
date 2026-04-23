export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_events: {
        Row: {
          id: string
          is_admin_impersonation: boolean
          kind: string
          metadata: Json
          occurred_at: string
          session_id: string | null
          target_id: string | null
          target_label: string | null
          target_type: string | null
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          id?: string
          is_admin_impersonation?: boolean
          kind: string
          metadata?: Json
          occurred_at?: string
          session_id?: string | null
          target_id?: string | null
          target_label?: string | null
          target_type?: string | null
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          id?: string
          is_admin_impersonation?: boolean
          kind?: string
          metadata?: Json
          occurred_at?: string
          session_id?: string | null
          target_id?: string | null
          target_label?: string | null
          target_type?: string | null
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action: string
          actor_email: string | null
          actor_kind: string
          actor_user_id: string | null
          at: string
          id: string
          impersonating_admin_id: string | null
          ip: string | null
          meta: Json
          target_id: string | null
          target_kind: string | null
          target_label: string | null
          user_agent: string | null
          workspace_id: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_kind: string
          actor_user_id?: string | null
          at?: string
          id?: string
          impersonating_admin_id?: string | null
          ip?: string | null
          meta?: Json
          target_id?: string | null
          target_kind?: string | null
          target_label?: string | null
          user_agent?: string | null
          workspace_id?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_kind?: string
          actor_user_id?: string | null
          at?: string
          id?: string
          impersonating_admin_id?: string | null
          ip?: string | null
          meta?: Json
          target_id?: string | null
          target_kind?: string | null
          target_label?: string | null
          user_agent?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          target_id: string | null
          target_type: string | null
          workspace_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          workspace_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_suggestions: {
        Row: {
          abv: number | null
          allergens: string[] | null
          brand: string | null
          canonical_id: string | null
          category: string | null
          default_unit: string | null
          description: string | null
          expression: string | null
          id: string
          image_url: string | null
          kind: string
          name: string
          note: string | null
          origin: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          suggested_at: string
          suggested_by_user_id: string | null
          suggested_from_workspace_id: string | null
        }
        Insert: {
          abv?: number | null
          allergens?: string[] | null
          brand?: string | null
          canonical_id?: string | null
          category?: string | null
          default_unit?: string | null
          description?: string | null
          expression?: string | null
          id?: string
          image_url?: string | null
          kind: string
          name: string
          note?: string | null
          origin?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          suggested_at?: string
          suggested_by_user_id?: string | null
          suggested_from_workspace_id?: string | null
        }
        Update: {
          abv?: number | null
          allergens?: string[] | null
          brand?: string | null
          canonical_id?: string | null
          category?: string | null
          default_unit?: string | null
          description?: string | null
          expression?: string | null
          id?: string
          image_url?: string | null
          kind?: string
          name?: string
          note?: string | null
          origin?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          suggested_at?: string
          suggested_by_user_id?: string | null
          suggested_from_workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_suggestions_suggested_from_workspace_id_fkey"
            columns: ["suggested_from_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      cocktail_ingredients: {
        Row: {
          amount: number | null
          amount_text: string | null
          cocktail_id: string
          custom_name: string | null
          global_ingredient_id: string | null
          global_product_id: string | null
          id: string
          notes: string | null
          position: number
          unit: string | null
          workspace_ingredient_id: string | null
        }
        Insert: {
          amount?: number | null
          amount_text?: string | null
          cocktail_id: string
          custom_name?: string | null
          global_ingredient_id?: string | null
          global_product_id?: string | null
          id?: string
          notes?: string | null
          position: number
          unit?: string | null
          workspace_ingredient_id?: string | null
        }
        Update: {
          amount?: number | null
          amount_text?: string | null
          cocktail_id?: string
          custom_name?: string | null
          global_ingredient_id?: string | null
          global_product_id?: string | null
          id?: string
          notes?: string | null
          position?: number
          unit?: string | null
          workspace_ingredient_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cocktail_ingredients_cocktail_id_fkey"
            columns: ["cocktail_id"]
            isOneToOne: false
            referencedRelation: "cocktails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cocktail_ingredients_global_ingredient_id_fkey"
            columns: ["global_ingredient_id"]
            isOneToOne: false
            referencedRelation: "global_ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cocktail_ingredients_global_product_id_fkey"
            columns: ["global_product_id"]
            isOneToOne: false
            referencedRelation: "global_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cocktail_ingredients_workspace_ingredient_id_fkey"
            columns: ["workspace_ingredient_id"]
            isOneToOne: false
            referencedRelation: "workspace_ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      cocktails: {
        Row: {
          base_product_id: string | null
          category: string | null
          cost_cents: number | null
          created_at: string | null
          created_by: string | null
          creator_id: string | null
          currency: string | null
          event_origin: string | null
          featured: boolean
          flavor_profile: string[] | null
          garnish: string | null
          glass_type: string | null
          id: string
          image_url: string | null
          images: string[]
          menu_price_cents: number | null
          method_steps: Json | null
          name: string
          occasions: string[] | null
          orb_from: string | null
          orb_to: string | null
          pinned: boolean
          season: string[] | null
          slug: string
          spirit_base: string | null
          status: string
          tasting_notes: string | null
          updated_at: string | null
          venue: string | null
          workspace_id: string
        }
        Insert: {
          base_product_id?: string | null
          category?: string | null
          cost_cents?: number | null
          created_at?: string | null
          created_by?: string | null
          creator_id?: string | null
          currency?: string | null
          event_origin?: string | null
          featured?: boolean
          flavor_profile?: string[] | null
          garnish?: string | null
          glass_type?: string | null
          id?: string
          image_url?: string | null
          images?: string[]
          menu_price_cents?: number | null
          method_steps?: Json | null
          name: string
          occasions?: string[] | null
          orb_from?: string | null
          orb_to?: string | null
          pinned?: boolean
          season?: string[] | null
          slug: string
          spirit_base?: string | null
          status?: string
          tasting_notes?: string | null
          updated_at?: string | null
          venue?: string | null
          workspace_id: string
        }
        Update: {
          base_product_id?: string | null
          category?: string | null
          cost_cents?: number | null
          created_at?: string | null
          created_by?: string | null
          creator_id?: string | null
          currency?: string | null
          event_origin?: string | null
          featured?: boolean
          flavor_profile?: string[] | null
          garnish?: string | null
          glass_type?: string | null
          id?: string
          image_url?: string | null
          images?: string[]
          menu_price_cents?: number | null
          method_steps?: Json | null
          name?: string
          occasions?: string[] | null
          orb_from?: string | null
          orb_to?: string | null
          pinned?: boolean
          season?: string[] | null
          slug?: string
          spirit_base?: string | null
          status?: string
          tasting_notes?: string | null
          updated_at?: string | null
          venue?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cocktails_base_product_id_fkey"
            columns: ["base_product_id"]
            isOneToOne: false
            referencedRelation: "global_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cocktails_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cocktails_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_cocktails: {
        Row: {
          added_at: string
          cocktail_id: string
          collection_id: string
          position: number
        }
        Insert: {
          added_at?: string
          cocktail_id: string
          collection_id: string
          position?: number
        }
        Update: {
          added_at?: string
          cocktail_id?: string
          collection_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "collection_cocktails_cocktail_id_fkey"
            columns: ["cocktail_id"]
            isOneToOne: false
            referencedRelation: "cocktails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_cocktails_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          cover_from: string
          cover_to: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          pinned: boolean
          updated_at: string
          workspace_id: string
        }
        Insert: {
          cover_from?: string
          cover_to?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          pinned?: boolean
          updated_at?: string
          workspace_id: string
        }
        Update: {
          cover_from?: string
          cover_to?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          pinned?: boolean
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      creators: {
        Row: {
          avatar_hue: number | null
          awards: Json | null
          bio: string | null
          book: Json | null
          career: Json | null
          certifications: Json | null
          city: string | null
          competitions: Json | null
          country: string | null
          created_at: string | null
          deleted_at: string | null
          id: string
          joined_year: string | null
          languages: string[] | null
          mentors: string[] | null
          name: string
          philosophy: string | null
          photo_url: string | null
          press: Json | null
          pronouns: string | null
          role: string | null
          signature: string | null
          socials: Json | null
          specialties: string[] | null
          venue: string | null
          workspace_id: string
        }
        Insert: {
          avatar_hue?: number | null
          awards?: Json | null
          bio?: string | null
          book?: Json | null
          career?: Json | null
          certifications?: Json | null
          city?: string | null
          competitions?: Json | null
          country?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          joined_year?: string | null
          languages?: string[] | null
          mentors?: string[] | null
          name: string
          philosophy?: string | null
          photo_url?: string | null
          press?: Json | null
          pronouns?: string | null
          role?: string | null
          signature?: string | null
          socials?: Json | null
          specialties?: string[] | null
          venue?: string | null
          workspace_id: string
        }
        Update: {
          avatar_hue?: number | null
          awards?: Json | null
          bio?: string | null
          book?: Json | null
          career?: Json | null
          certifications?: Json | null
          city?: string | null
          competitions?: Json | null
          country?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          joined_year?: string | null
          languages?: string[] | null
          mentors?: string[] | null
          name?: string
          philosophy?: string | null
          photo_url?: string | null
          press?: Json | null
          pronouns?: string | null
          role?: string | null
          signature?: string | null
          socials?: Json | null
          specialties?: string[] | null
          venue?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creators_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      global_ingredients: {
        Row: {
          allergens: string[] | null
          category: string | null
          created_at: string | null
          default_unit: string | null
          id: string
          name: string
        }
        Insert: {
          allergens?: string[] | null
          category?: string | null
          created_at?: string | null
          default_unit?: string | null
          id?: string
          name: string
        }
        Update: {
          allergens?: string[] | null
          category?: string | null
          created_at?: string | null
          default_unit?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      global_products: {
        Row: {
          abv: number | null
          brand: string
          category: string
          color_hex: string | null
          created_at: string | null
          description: string | null
          expression: string
          id: string
          image_url: string | null
          origin: string | null
          provenance: Json | null
          suggested_cost_cents: number | null
          suggested_price_cents: number | null
          tagline: string | null
          tasting_notes: string | null
          volume_ml: number | null
        }
        Insert: {
          abv?: number | null
          brand: string
          category: string
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          expression: string
          id?: string
          image_url?: string | null
          origin?: string | null
          provenance?: Json | null
          suggested_cost_cents?: number | null
          suggested_price_cents?: number | null
          tagline?: string | null
          tasting_notes?: string | null
          volume_ml?: number | null
        }
        Update: {
          abv?: number | null
          brand?: string
          category?: string
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          expression?: string
          id?: string
          image_url?: string | null
          origin?: string | null
          provenance?: Json | null
          suggested_cost_cents?: number | null
          suggested_price_cents?: number | null
          tagline?: string | null
          tasting_notes?: string | null
          volume_ml?: number | null
        }
        Relationships: []
      }
      memberships: {
        Row: {
          created_at: string
          id: string
          invitation_email: string | null
          invitation_expires_at: string | null
          invitation_token: string | null
          invited_by: string | null
          joined_at: string | null
          role: string
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invitation_email?: string | null
          invitation_expires_at?: string | null
          invitation_token?: string | null
          invited_by?: string | null
          joined_at?: string | null
          role: string
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invitation_email?: string | null
          invitation_expires_at?: string | null
          invitation_token?: string | null
          invited_by?: string | null
          joined_at?: string | null
          role?: string
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_label: string | null
          actor_user_id: string | null
          body: string | null
          created_at: string
          id: string
          kind: string
          meta: Json
          read_at: string | null
          recipient_user_id: string
          title: string
          url: string | null
          workspace_id: string | null
        }
        Insert: {
          actor_label?: string | null
          actor_user_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          meta?: Json
          read_at?: string | null
          recipient_user_id: string
          title: string
          url?: string | null
          workspace_id?: string | null
        }
        Update: {
          actor_label?: string | null
          actor_user_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          meta?: Json
          read_at?: string | null
          recipient_user_id?: string
          title?: string
          url?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          department: string | null
          full_name: string | null
          id: string
          job_title: string | null
          language: string | null
          time_zone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          full_name?: string | null
          id: string
          job_title?: string | null
          language?: string | null
          time_zone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          language?: string | null
          time_zone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      stripe_webhook_events: {
        Row: {
          id: string
          payload: Json | null
          processed_at: string | null
          type: string
          workspace_id: string | null
        }
        Insert: {
          id: string
          payload?: Json | null
          processed_at?: string | null
          type: string
          workspace_id?: string | null
        }
        Update: {
          id?: string
          payload?: Json | null
          processed_at?: string | null
          type?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_webhook_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_cocktail_favorites: {
        Row: {
          cocktail_id: string
          created_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          cocktail_id: string
          created_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          cocktail_id?: string
          created_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_cocktail_favorites_cocktail_id_fkey"
            columns: ["cocktail_id"]
            isOneToOne: false
            referencedRelation: "cocktails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_cocktail_favorites_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notification_prefs: {
        Row: {
          channel: string | null
          digest: boolean | null
          mentions: boolean | null
          stock_alerts: boolean | null
          submissions: boolean | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          channel?: string | null
          digest?: boolean | null
          mentions?: boolean | null
          stock_alerts?: boolean | null
          submissions?: boolean | null
          user_id: string
          workspace_id: string
        }
        Update: {
          channel?: string | null
          digest?: boolean | null
          mentions?: boolean | null
          stock_alerts?: boolean | null
          submissions?: boolean | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notification_prefs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_ingredients: {
        Row: {
          category: string | null
          default_unit: string | null
          deleted_at: string | null
          id: string
          name: string
          workspace_id: string
        }
        Insert: {
          category?: string | null
          default_unit?: string | null
          deleted_at?: string | null
          id?: string
          name: string
          workspace_id: string
        }
        Update: {
          category?: string | null
          default_unit?: string | null
          deleted_at?: string | null
          id?: string
          name?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_ingredients_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_products: {
        Row: {
          cost_cents: number | null
          deleted_at: string | null
          global_product_id: string
          id: string
          menu_price_cents: number | null
          notes: string | null
          par: number | null
          stock: number | null
          workspace_id: string
        }
        Insert: {
          cost_cents?: number | null
          deleted_at?: string | null
          global_product_id: string
          id?: string
          menu_price_cents?: number | null
          notes?: string | null
          par?: number | null
          stock?: number | null
          workspace_id: string
        }
        Update: {
          cost_cents?: number | null
          deleted_at?: string | null
          global_product_id?: string
          id?: string
          menu_price_cents?: number | null
          notes?: string | null
          par?: number | null
          stock?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_products_global_product_id_fkey"
            columns: ["global_product_id"]
            isOneToOne: false
            referencedRelation: "global_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_products_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_settings: {
        Row: {
          accent: string | null
          autosave: boolean | null
          default_units: string | null
          default_view: string | null
          density: string | null
          pricing_enabled: boolean
          reduce_motion: boolean | null
          show_costs: boolean | null
          theme: string | null
          typography: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          accent?: string | null
          autosave?: boolean | null
          default_units?: string | null
          default_view?: string | null
          density?: string | null
          pricing_enabled?: boolean
          reduce_motion?: boolean | null
          show_costs?: boolean | null
          theme?: string | null
          typography?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          accent?: string | null
          autosave?: boolean | null
          default_units?: string | null
          default_view?: string | null
          density?: string | null
          pricing_enabled?: boolean
          reduce_motion?: boolean | null
          show_costs?: boolean | null
          theme?: string | null
          typography?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          frozen_at: string | null
          id: string
          location: string | null
          name: string
          owner_user_id: string
          slug: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          frozen_at?: string | null
          id?: string
          location?: string | null
          name: string
          owner_user_id: string
          slug: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          frozen_at?: string | null
          id?: string
          location?: string | null
          name?: string
          owner_user_id?: string
          slug?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      workspace_ingredient_usage: {
        Row: {
          category: string | null
          global_ingredient_id: string | null
          name: string | null
          usage_count: number | null
          workspace_id: string | null
          workspace_ingredient_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cocktail_ingredients_global_ingredient_id_fkey"
            columns: ["global_ingredient_id"]
            isOneToOne: false
            referencedRelation: "global_ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cocktail_ingredients_workspace_ingredient_id_fkey"
            columns: ["workspace_ingredient_id"]
            isOneToOne: false
            referencedRelation: "workspace_ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cocktails_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_read_workspace: { Args: { ws: string }; Returns: boolean }
      can_write_workspace: { Args: { ws: string }; Returns: boolean }
      current_workspace_role: { Args: { ws: string }; Returns: string }
      is_super_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
