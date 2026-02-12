export interface Routine {
  id: string;
  npc_id: string;
  name: string;
  start_hour: number;
  end_hour: number;
  day_of_week: number[];
  location: string;
  activity: string;
  interruptible: boolean;
  priority: number;
  created_at: Date;
  updated_at: Date;
}

export type GoalType = 'personal' | 'professional' | 'social' | 'survival' | 'secret';

export type GoalStatus = 'active' | 'completed' | 'failed' | 'abandoned' | 'paused';

export interface Goal {
  id: string;
  npc_id: string;
  title: string;
  goal_type: GoalType;
  priority: number;
  progress: number;
  status: GoalStatus;
  success_criteria: string[];
  parent_goal_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export type RelationshipTargetType = 'player' | 'npc';

export interface InteractionEntry {
  timestamp: string;
  type: string;
  summary: string;
}

export interface Relationship {
  id: string;
  npc_id: string;
  target_type: RelationshipTargetType;
  target_id: string;
  affinity: number;
  trust: number;
  familiarity: number;
  interaction_history: InteractionEntry[];
  created_at: Date;
  updated_at: Date;
}
