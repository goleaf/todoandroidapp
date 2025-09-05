import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Team, Project, TeamMember, Comment, User } from '../../types';

interface CollaborationState {
  teams: Team[];
  projects: Project[];
  teamMembers: Record<string, TeamMember[]>; // teamId -> members
  projectMembers: Record<string, User[]>; // projectId -> members
  comments: Comment[];
  invitations: Invitation[];
  currentTeam: Team | null;
  currentProject: Project | null;
  onlineUsers: string[]; // User IDs currently online
  loading: boolean;
  error: string | null;
}

interface Invitation {
  id: string;
  type: 'team' | 'project';
  targetId: string; // team or project ID
  inviterId: string;
  inviterName: string;
  inviteeEmail: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
  expiresAt: Date;
}

const initialState: CollaborationState = {
  teams: [],
  projects: [],
  teamMembers: {},
  projectMembers: {},
  comments: [],
  invitations: [],
  currentTeam: null,
  currentProject: null,
  onlineUsers: [],
  loading: false,
  error: null,
};

const collaborationSlice = createSlice({
  name: 'collaboration',
  initialState,
  reducers: {
    // Team management
    addTeam: (state, action: PayloadAction<Team>) => {
      state.teams.push(action.payload);
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
    },
    setCurrentTeam: (state, action: PayloadAction<Team | null>) => {
      state.currentTeam = action.payload;
    },
    
    // Project management
    addProject: (state, action: PayloadAction<Project>) => {
      state.projects.push(action.payload);
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
    setCurrentProject: (state, action: PayloadAction<Project | null>) => {
      state.currentProject = action.payload;
    },
    updateProjectProgress: (state, action: PayloadAction<{ projectId: string; progress: number }>) => {
      const project = state.projects.find(p => p.id === action.payload.projectId);
      if (project) {
        project.progress = action.payload.progress;
        project.updatedAt = new Date();
      }
    },
    
    // Member management
    setTeamMembers: (state, action: PayloadAction<{ teamId: string; members: TeamMember[] }>) => {
      state.teamMembers[action.payload.teamId] = action.payload.members;
    },
    addTeamMember: (state, action: PayloadAction<{ teamId: string; member: TeamMember }>) => {
      const { teamId, member } = action.payload;
      if (!state.teamMembers[teamId]) {
        state.teamMembers[teamId] = [];
      }
      state.teamMembers[teamId].push(member);
      
      // Update team member count
      const team = state.teams.find(t => t.id === teamId);
      if (team) {
        team.members = state.teamMembers[teamId];
        team.updatedAt = new Date();
      }
    },
    removeTeamMember: (state, action: PayloadAction<{ teamId: string; userId: string }>) => {
      const { teamId, userId } = action.payload;
      if (state.teamMembers[teamId]) {
        state.teamMembers[teamId] = state.teamMembers[teamId].filter(m => m.userId !== userId);
        
        // Update team
        const team = state.teams.find(t => t.id === teamId);
        if (team) {
          team.members = state.teamMembers[teamId];
          team.updatedAt = new Date();
        }
      }
    },
    updateTeamMemberRole: (state, action: PayloadAction<{ teamId: string; userId: string; role: TeamMember['role'] }>) => {
      const { teamId, userId, role } = action.payload;
      const member = state.teamMembers[teamId]?.find(m => m.userId === userId);
      if (member) {
        member.role = role;
      }
    },
    
    setProjectMembers: (state, action: PayloadAction<{ projectId: string; members: User[] }>) => {
      state.projectMembers[action.payload.projectId] = action.payload.members;
    },
    addProjectMember: (state, action: PayloadAction<{ projectId: string; user: User }>) => {
      const { projectId, user } = action.payload;
      if (!state.projectMembers[projectId]) {
        state.projectMembers[projectId] = [];
      }
      
      // Check if user is already a member
      const existing = state.projectMembers[projectId].find(m => m.id === user.id);
      if (!existing) {
        state.projectMembers[projectId].push(user);
        
        // Update project member list
        const project = state.projects.find(p => p.id === projectId);
        if (project && !project.members.includes(user.id)) {
          project.members.push(user.id);
          project.updatedAt = new Date();
        }
      }
    },
    removeProjectMember: (state, action: PayloadAction<{ projectId: string; userId: string }>) => {
      const { projectId, userId } = action.payload;
      if (state.projectMembers[projectId]) {
        state.projectMembers[projectId] = state.projectMembers[projectId].filter(m => m.id !== userId);
        
        // Update project
        const project = state.projects.find(p => p.id === projectId);
        if (project) {
          project.members = project.members.filter(id => id !== userId);
          project.updatedAt = new Date();
        }
      }
    },
    
    // Comment management
    addComment: (state, action: PayloadAction<Comment>) => {
      state.comments.push(action.payload);
    },
    updateComment: (state, action: PayloadAction<Comment>) => {
      const index = state.comments.findIndex(comment => comment.id === action.payload.id);
      if (index !== -1) {
        state.comments[index] = action.payload;
      }
    },
    deleteComment: (state, action: PayloadAction<string>) => {
      state.comments = state.comments.filter(comment => comment.id !== action.payload);
    },
    
    // Invitation management
    addInvitation: (state, action: PayloadAction<Invitation>) => {
      state.invitations.push(action.payload);
    },
    updateInvitationStatus: (state, action: PayloadAction<{ invitationId: string; status: Invitation['status'] }>) => {
      const invitation = state.invitations.find(inv => inv.id === action.payload.invitationId);
      if (invitation) {
        invitation.status = action.payload.status;
      }
    },
    removeInvitation: (state, action: PayloadAction<string>) => {
      state.invitations = state.invitations.filter(inv => inv.id !== action.payload);
    },
    
    // Real-time features
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
    
    // Bulk operations
    setTeams: (state, action: PayloadAction<Team[]>) => {
      state.teams = action.payload;
    },
    setProjects: (state, action: PayloadAction<Project[]>) => {
      state.projects = action.payload;
    },
    setComments: (state, action: PayloadAction<Comment[]>) => {
      state.comments = action.payload;
    },
    setInvitations: (state, action: PayloadAction<Invitation[]>) => {
      state.invitations = action.payload;
    },
    
    // UI state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    // Reset
    resetCollaboration: () => initialState,
  },
});

export const {
  // Team management
  addTeam,
  updateTeam,
  deleteTeam,
  setCurrentTeam,
  
  // Project management
  addProject,
  updateProject,
  deleteProject,
  setCurrentProject,
  updateProjectProgress,
  
  // Member management
  setTeamMembers,
  addTeamMember,
  removeTeamMember,
  updateTeamMemberRole,
  setProjectMembers,
  addProjectMember,
  removeProjectMember,
  
  // Comment management
  addComment,
  updateComment,
  deleteComment,
  
  // Invitation management
  addInvitation,
  updateInvitationStatus,
  removeInvitation,
  
  // Real-time features
  setOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
  
  // Bulk operations
  setTeams,
  setProjects,
  setComments,
  setInvitations,
  
  // UI state
  setLoading,
  setError,
  
  // Reset
  resetCollaboration,
} = collaborationSlice.actions;

export default collaborationSlice.reducer;
