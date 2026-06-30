
import { Project, Collaborator, LockInfo } from '../types/index';
import { DbType } from '../types/index';

// MOCK SERVICE: Simulates interaction with a DB Studio Pro Enterprise Server

const MOCK_CLOUD_PROJECTS: Project[] = [
    {
        id: 'cloud-1',
        name: 'Enterprise CRM (Team)',
        lastModified: Date.now(),
        isCloud: true,
        owner: 'Max Mustermann',
        collaborators: ['Sarah', 'Tom'],
        data: {
            tables: [], queries: [], reports: [], forms: [], relationships: [], layout: [], tableGroups: [],
            backendConfig: { 
                language: 'dotnet', dbType: DbType.SQL, projectName: 'EntCRM', port: 5000, 
                dbConnection: '', useSwagger: true, frontendFramework: 'react' 
            }
        }
    }
];

// Simulierter Lock-State
let mockLocks: Record<string, LockInfo> = {
    // Simuliert: 'sys_users' wird gerade von Tom bearbeitet
    'sys_users': { objectId: 'sys_users', userId: 'u3', userName: 'Tom H.', lockedAt: Date.now() }
};

export const cloudService = {
    async getProjects(): Promise<Project[]> {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        return MOCK_CLOUD_PROJECTS;
    },

    async pushToGit(projectId: string, files: any[], commitMessage: string): Promise<boolean> {
        console.log(`[Cloud] Pushing ${files.length} files to Git for project ${projectId}. Msg: ${commitMessage}`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate Git process
        return true;
    },

    // Simulation of WebSocket presence
    getCollaborators(projectId: string): Collaborator[] {
        return [
            { id: 'u1', name: 'Du (Max)', color: '#3b82f6', isOnline: true },
            { id: 'u2', name: 'Sarah Lee', color: '#10b981', isOnline: true, currentAction: 'Bearbeitet Tabelle Customers' },
            { id: 'u3', name: 'Tom H.', color: '#f59e0b', isOnline: true, currentAction: 'Bearbeitet Tabelle Users (LOCKED)' }
        ];
    },

    // --- LOCKING LOGIC (MOCK) ---
    
    // Prüft, ob ein Objekt gelockt ist
    async checkLock(objectId: string): Promise<LockInfo | null> {
        // In real app: call API
        return mockLocks[objectId] || null;
    },

    // Versucht, einen Lock zu setzen
    async acquireLock(objectId: string, userId: string, userName: string): Promise<boolean> {
        if (mockLocks[objectId] && mockLocks[objectId].userId !== userId) {
            return false; // Already locked by someone else
        }
        mockLocks[objectId] = { objectId, userId, userName, lockedAt: Date.now() };
        return true;
    },

    // Gibt Lock frei
    async releaseLock(objectId: string, userId: string): Promise<void> {
        if (mockLocks[objectId] && mockLocks[objectId].userId === userId) {
            delete mockLocks[objectId];
        }
    }
};
