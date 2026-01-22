export interface WaGroupPool {
  id: number;
  slug: string;
  title: string;
  instance_name: string;
  threshold: number;
  photo_url: string | null;
  description: string | null;
  current_group_id: number | null;
  next_sequence: number;
  created_at: Date;
  updated_at: Date;
}

export interface WaGroup {
  id: number;
  pool_id: number;
  sequence: number;
  wa_group_jid: string;
  invite_url: string | null;
  member_count: number;
  status: 'ACTIVE' | 'FULL';
  created_at: Date;
  updated_at: Date;
}

export interface EvolutionGroupInfo {
  id: string;
  subject: string;
  size: number;
  creation: number;
  owner: string;
  desc: string;
  descId: string;
  descOwner: string;
  descTime: number;
  restrict: boolean;
  announce: boolean;
  participants: any[];
}

export interface EvolutionCreateGroupResponse {
  id?: string; // Group JID (formato: 120363423328612694@g.us)
  gid?: string; // Alias para id (compatibilidade)
  subject: string;
  creation?: number;
  size?: number;
  participants?: any[];
}

export interface EvolutionCreateInviteResponse {
  code?: string;
  invite?: string;
  inviteUrl?: string;
  url?: string;
}
