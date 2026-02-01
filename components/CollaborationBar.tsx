
import React from 'react';
import { Collaborator } from '../types/index';

interface CollaborationBarProps {
    collaborators: Collaborator[];
}

export const CollaborationBar: React.FC<CollaborationBarProps> = ({ collaborators }) => {
    return (
        <div className="flex items-center -space-x-2 mr-4">
            {collaborators.filter(c => c.isOnline).map((user) => (
                <div 
                    key={user.id} 
                    className="relative group cursor-default"
                    title={user.currentAction || user.name}
                >
                    <div 
                        className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-sm"
                        style={{ backgroundColor: user.color }}
                    >
                        {user.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    {/* Status Dot */}
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                    
                    {/* Tooltip */}
                    <div className="absolute top-full mt-1 right-0 hidden group-hover:block bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 shadow-lg">
                        <p className="font-bold">{user.name}</p>
                        {user.currentAction && <p className="font-normal opacity-80">{user.currentAction}</p>}
                    </div>
                </div>
            ))}
            {collaborators.length > 3 && (
                <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 shadow-sm">
                    +{collaborators.length - 3}
                </div>
            )}
        </div>
    );
};
