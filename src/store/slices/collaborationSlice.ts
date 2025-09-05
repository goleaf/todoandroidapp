import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Team, TeamMember, Project, User, Comment } from '../../types';

interface CollaborationState {
  teams: Team[];
  projects: Project[];
  teamMembers: Record<string, TeamMember[]>; // teamId -> members
  projectMembers: Record<string, string[]>; // projectId -> userIds
  invitations: Invitation[];
  currentTeam: string | null;
  currentProject: string | null;
  onlineUsers: string[];
  realtimeUpdates: RealtimeUpdate[];
  loading: boolean;
  error: string | null;
}

interface Invitation {
  id: string;
  teamId: string;
  projectId?: string;
  invitedBy: string;
  invitedUser: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
  expiresAt: Date;
}

interface RealtimeUpdate {
  id: string;
  type: 'task_created' | 'task_updated' | 'task_completed' | 'comment_added' | 'user_joined' | 'user_left';
  userId: string;
  userName: string;
  entityId: string; // todoId, commentId, etc.
  data: any;
  timestamp: Date;
}

const initialState: CollaborationState = {
  teams: [],
  projects: [],
  teamMembers: {},
  projectMembers: {},
  invitations: [],
  currentTeam: null,
  currentProject: null,
  onlineUsers: [],
  realtimeUpdates: [],
  loading: false,
  error: null,
};

const collaborationSlice = createSlice({
  name: 'collaboration',
  initialState,
  reducers: {
    // Team Management
    createTeam: (state, action: PayloadAction<Team>) => {
      state.teams.push(action.payload);
      state.teamMembers[action.payload.id] = [{
        userId: action.payload.createdBy,
        role: 'owner',
        joinedAt: new Date(),
        permissions: {
          canCreateTasks: true,
          canEditTasks: true,
          canDeleteTasks: true,
          canManageCategories: true,
          canInviteMembers: true,
          canManageRoles: true,
        },
      }];
    },
    
    updateTeam: (state, action: PayloadAction<Team>) => {
      const index = state.teams.findIndex(team => team.id === action.payload.id);
      if (index !== -1) {
        state.teams[index] = action.payload;
      }
    },
    
    deleteTeam: (state, action: PayloadAction<string>) => {
      state.teams = state.teams.filter(team => team.id !== action.payload);
      delete state.teamMembers[action.payload];
      // Remove associated projects
      state.projects = state.projects.filter(project => project.teamId !== action.payload);
    },
    
    setCurrentTeam: (state, action: PayloadAction<string | null>) => {
      state.currentTeam = action.payload;
    },
    
    // Team Member Management
    addTeamMember: (state, action: PayloadAction<{ teamId: string; member: TeamMember }>) => {
      const { teamId, member } = action.payload;
      if (!state.teamMembers[teamId]) {
        state.teamMembers[teamId] = [];
      }
      
      const existingMember = state.teamMembers[teamId].find(m => m.userId === member.userId);
      if (!existingMember) {
        state.teamMembers[teamId].push(member);
        
        // Add to team's members array
        const team = state.teams.find(t => t.id === teamId);
        if (team && !team.members.some(m => m.userId === member.userId)) {
          team.members.push(member);
        }
      }
    },
    
    updateTeamMember: (state, action: PayloadAction<{ teamId: string; userId: string; updates: Partial<TeamMember> }>) => {
      const { teamId, userId, updates } = action.payload;
      const members = state.teamMembers[teamId];
      if (members) {
        const memberIndex = members.findIndex(m => m.userId === userId);
        if (memberIndex !== -1) {
          members[memberIndex] = { ...members[memberIndex], ...updates };
          
          // Update in team's members array
          const team = state.teams.find(t => t.id === teamId);
          if (team) {
            const teamMemberIndex = team.members.findIndex(m => m.userId === userId);
            if (teamMemberIndex !== -1) {
              team.members[teamMemberIndex] = members[memberIndex];
            }
          }
        }
      }
    },
    
    removeTeamMember: (state, action: PayloadAction<{ teamId: string; userId: string }>) => {
      const { teamId, userId } = action.payload;
      if (state.teamMembers[teamId]) {
        state.teamMembers[teamId] = state.teamMembers[teamId].filter(m => m.userId !== userId);
        
        // Remove from team's members array
        const team = state.teams.find(t => t.id === teamId);
        if (team) {
          team.members = team.members.filter(m => m.userId !== userId);
        }
      }
    },
    
    // Project Management
    createProject: (state, action: PayloadAction<Project>) => {
      state.projects.push(action.payload);
      state.projectMembers[action.payload.id] = [action.payload.ownerId];
    },
    
    updateProject: (state, action: PayloadAction<Project>) => {
      const index = state.projects.findIndex(project => project.id === action.payload.id);
      if (index !== -1) {
        state.projects[index] = action.payload;
      }
    },
    
    deleteProject: (state, action: PayloadAction<string>) => {
      state.projects = state.projects.filter(project => project.id !== action.payload);
      delete state.projectMembers[action.payload];
    },
    
    setCurrentProject: (state, action: PayloadAction<string | null>) => {
      state.currentProject = action.payload;
    },
    
    addProjectMember: (state, action: PayloadAction<{ projectId: string; userId: string }>) => {
      const { projectId, userId } = action.payload;
      if (!state.projectMembers[projectId]) {
        state.projectMembers[projectId] = [];
      }
      
      if (!state.projectMembers[projectId].includes(userId)) {
        state.projectMembers[projectId].push(userId);
        
        // Add to project's members array
        const project = state.projects.find(p => p.id === projectId);
        if (project && !project.members.includes(userId)) {
          project.members.push(userId);
        }
      }
    },
    
    removeProjectMember: (state, action: PayloadAction<{ projectId: string; userId: string }>) => {
      const { projectId, userId } = action.payload;
      if (state.projectMembers[projectId]) {
        state.projectMembers[projectId] = state.projectMembers[projectId].filter(id => id !== userId);
        
        // Remove from project's members array
        const project = state.projects.find(p => p.id === projectId);
        if (project) {
          project.members = project.members.filter(id => id !== userId);
        }
      }
    },
    
    // Invitation Management
    createInvitation: (state, action: PayloadAction<Invitation>) => {
      state.invitations.push(action.payload);
    },
    
    updateInvitation: (state, action: PayloadAction<{ invitationId: string; status: 'accepted' | 'declined' }>) => {
      const { invitationId, status } = action.payload;
      const invitation = state.invitations.find(inv => inv.id === invitationId);
      if (invitation) {
        invitation.status = status;
        
        // If accepted, add member to team/project
        if (status === 'accepted') {
          const member: TeamMember = {
            userId: invitation.invitedUser,
            role: invitation.role,
            joinedAt: new Date(),
            permissions: {
              canCreateTasks: invitation.role !== 'viewer',
              canEditTasks: invitation.role !== 'viewer',
              canDeleteTasks: invitation.role === 'owner' || invitation.role === 'admin',
              canManageCategories: invitation.role === 'owner' || invitation.role === 'admin',
              canInviteMembers: invitation.role === 'owner' || invitation.role === 'admin',
              canManageRoles: invitation.role === 'owner',
            },
          };
          
          collaborationSlice.caseReducers.addTeamMember(state, {
            payload: { teamId: invitation.teamId, member },
            type: 'collaboration/addTeamMember'
          });
          
          if (invitation.projectId) {
            collaborationSlice.caseReducers.addProjectMember(state, {
              payload: { projectId: invitation.projectId, userId: invitation.invitedUser },
              type: 'collaboration/addProjectMember'
            });
          }
        }
      }
    },
    
    deleteInvitation: (state, action: PayloadAction<string>) => {
      state.invitations = state.invitations.filter(inv => inv.id !== action.payload);
    },
    
    // Real-time Features
    addRealtimeUpdate: (state, action: PayloadAction<RealtimeUpdate>) => {
      state.realtimeUpdates.unshift(action.payload);
      // Keep only last 100 updates
      if (state.realtimeUpdates.length > 100) {
        state.realtimeUpdates = state.realtimeUpdates.slice(0, 100);
      }
    },
    
    setOnlineUsers: (state, action: PayloadAction<string[]>) => {
      state.onlineUsers = action.payload;
    },
    
    addOnlineUser: (state, action: PayloadAction<string>) => {
      if (!state.onlineUsers.includes(action.payload)) {
        state.onlineUsers.push(action.payload);
      }
    },
    
    removeOnlineUser: (state, action: PayloadAction<string>) => {
      state.onlineUsers = state.onlineUsers.filter(userId => userId !== action.payload);
    },
    
    // Permission Checks
    updateMemberPermissions: (state, action: PayloadAction<{ teamId: string; userId: string; permissions: Partial<TeamMember['permissions']> }>) => {
      const { teamId, userId, permissions } = action.payload;
      const members = state.teamMembers[teamId];
      if (members) {
        const member = members.find(m => m.userId === userId);
        if (member) {
          member.permissions = { ...member.permissions, ...permissions };
        }
      }
    },
    
    // Sync and Conflict Resolution
    syncTeamData: (state, action: PayloadAction<{ teams: Team[]; projects: Project[]; members: Record<string, TeamMember[]> }>) => {
      const { teams, projects, members } = action.payload;
      
      // Merge teams
      teams.forEach(team => {
        const existingIndex = state.teams.findIndex(t => t.id === team.id);
        if (existingIndex !== -1) {
          // Update existing team if remote version is newer
          if (new Date(team.updatedAt) > new Date(state.teams[existingIndex].updatedAt)) {
            state.teams[existingIndex] = team;
          }
        } else {
          state.teams.push(team);
        }
      });
      
      // Merge projects
      projects.forEach(project => {
        const existingIndex = state.projects.findIndex(p => p.id === project.id);
        if (existingIndex !== -1) {
          if (new Date(project.updatedAt) > new Date(state.projects[existingIndex].updatedAt)) {
            state.projects[existingIndex] = project;
          }
        } else {
          state.projects.push(project);
        }
      });
      
      // Merge members
      Object.entries(members).forEach(([teamId, teamMembers]) => {
        state.teamMembers[teamId] = teamMembers;
      });
    },
    
    resolveConflict: (state, action: PayloadAction<{ entityType: 'team' | 'project'; entityId: string; resolution: 'local' | 'remote'; remoteData?: any }>) => {
      const { entityType, entityId, resolution, remoteData } = action.payload;
      
      if (resolution === 'remote' && remoteData) {
        if (entityType === 'team') {
          const index = state.teams.findIndex(t => t.id === entityId);
          if (index !== -1) {
            state.teams[index] = remoteData;
          }
        } else if (entityType === 'project') {
          const index = state.projects.findIndex(p => p.id === entityId);
          if (index !== -1) {
            state.projects[index] = remoteData;
          }
        }
      }
    },
    
    // Cleanup
    clearRealtimeUpdates: (state) => {
      state.realtimeUpdates = [];
    },
    
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    resetCollaboration: () => initialState,
  },
});

export const {
  createTeam,
  updateTeam,
  deleteTeam,
  setCurrentTeam,
  addTeamMember,
  updateTeamMember,
  removeTeamMember,
  createProject,
  updateProject,
  deleteProject,
  setCurrentProject,
  addProjectMember,
  removeProjectMember,
  createInvitation,
  updateInvitation,
  deleteInvitation,
  addRealtimeUpdate,
  setOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
  updateMemberPermissions,
  syncTeamData,
  resolveConflict,
  clearRealtimeUpdates,
  setLoading,
  setError,
  resetCollaboration,
} = collaborationSlice.actions;

export default collaborationSlice.reducer;