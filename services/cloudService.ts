
import { Project, Collaborator, LockInfo } from '../types/index';
import { DbType } from '../types/index';

// SERVICE: Interaction with DB Studio Pro Server & Team Cloud API

// Simulierter Lock-State
let mockLocks: Record<string, LockInfo> = {
    'sys_users': { objectId: 'sys_users', userId: 'u3', userName: 'Tom H.', lockedAt: Date.now() }
};

export const cloudService = {
    async getProjects(): Promise<Project[]> {
        try {
            const res = await fetch('/api/team/projects');
            if (res.ok) {
                const teamProjs = await res.json();
                if (Array.isArray(teamProjs) && teamProjs.length > 0) {
                    return teamProjs.map((tp: any) => ({
                        id: tp.id || 'proj_' + Math.random().toString(36).substring(2, 7),
                        name: tp.name || 'Unbenanntes Cloud-Projekt',
                        lastModified: tp.created || Date.now(),
                        isCloud: true,
                        owner: tp.owner || 'Team Owner',
                        collaborators: tp.teamMembers ? tp.teamMembers.map((m: any) => m.name) : [],
                        data: tp.data || {
                            tables: [], queries: [], reports: [], forms: [], relationships: [], layout: [], tableGroups: [],
                            backendConfig: { 
                                language: 'dotnet', dbType: DbType.SQL, projectName: (tp.name || 'CloudProj').replace(/\s+/g, ''), port: 5000, backendVersion: '10.0',
                                dbConnection: '', useSwagger: true, frontendFramework: 'react' 
                            }
                        }
                    }));
                }
            }
        } catch (e) {
            console.warn('Backend team projects fetch failed:', e);
        }
        return [];
    },

    async createProject(project: Project): Promise<Project> {
        try {
            const res = await fetch('/api/team/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: project.name,
                    description: 'Echtes Team Cloud Projekt',
                    ownerEmail: project.owner || 'admin@company.com',
                    ownerName: project.owner || 'Project Owner'
                })
            });
            if (res.ok) {
                const created = await res.json();
                return {
                    ...project,
                    id: created.id || project.id
                };
            }
        } catch (e) {
            console.warn('Failed to post project to /api/team/projects:', e);
        }
        return project;
    },

    async pushToGit(projectId: string, files: any[], commitMessage: string): Promise<boolean> {
        console.log(`[Cloud] Pushing ${files.length} files to Git for project ${projectId}. Msg: ${commitMessage}`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        return true;
    },

    getCollaborators(projectId: string): Collaborator[] {
        return [
            { id: 'u1', name: 'Du', color: '#3b82f6', isOnline: true },
            { id: 'u2', name: 'Sarah Lee', color: '#10b981', isOnline: true, currentAction: 'Bearbeitet Tabelle Customers' },
            { id: 'u3', name: 'Tom H.', color: '#f59e0b', isOnline: true, currentAction: 'Bearbeitet Tabelle Users' }
        ];
    },

    async checkLock(objectId: string): Promise<LockInfo | null> {
        return mockLocks[objectId] || null;
    },

    async acquireLock(objectId: string, userId: string, userName: string): Promise<boolean> {
        if (mockLocks[objectId] && mockLocks[objectId].userId !== userId) {
            return false;
        }
        mockLocks[objectId] = { objectId, userId, userName, lockedAt: Date.now() };
        return true;
    },

    async releaseLock(objectId: string, userId: string): Promise<void> {
        if (mockLocks[objectId] && mockLocks[objectId].userId === userId) {
            delete mockLocks[objectId];
        }
    }
};

