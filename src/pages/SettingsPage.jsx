import React, { useState } from 'react';
import { Settings, User, Shield, Bell, Key, Database, ChevronRight } from 'lucide-react';

export const SettingsPage = () => {
    const [activeTab, setActiveTab] = useState('Profile');
    
    const tabs = [
        { name: 'Profile', icon: User },
        { name: 'Security', icon: Shield },
        { name: 'Notifications', icon: Bell },
        { name: 'API Keys', icon: Key },
        { name: 'Data', icon: Database },
    ];
    
    return (
        <div className="h-full flex flex-col gap-6 p-8 overflow-y-auto">
            <div>
                <h1 className="text-3xl text-white font-bold tracking-tight mb-2">Settings</h1>
                <p className="text-gray-400">Manage your account preferences, security, and API configurations.</p>
            </div>
            
            <div className="flex flex-1 gap-8 mt-4">
                {/* Settings Sidebar */}
                <div className="w-64 shrink-0 flex flex-col gap-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.name}
                            onClick={() => setActiveTab(tab.name)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                                activeTab === tab.name 
                                    ? 'bg-[#1C212D] text-white shadow-sm border border-gray-700/50' 
                                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#1C212D]/50 border border-transparent'
                            }`}
                        >
                            <tab.icon className={`w-5 h-5 ${activeTab === tab.name ? 'text-[#00E6A8]' : 'text-gray-500'}`} />
                            {tab.name}
                        </button>
                    ))}
                </div>
                
                {/* Settings Content area */}
                <div className="flex-1 bg-[#131722] border border-[#1C212D] rounded-2xl shadow-sm p-8">
                    <div className="border-b border-[#1C212D] pb-5 mb-8">
                        <h2 className="text-xl text-white font-bold">{activeTab} Settings</h2>
                    </div>
                    
                    {activeTab === 'Profile' && (
                        <div className="max-w-2xl">
                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-[#00E6A8] p-1 shadow-lg">
                                    <div className="w-full h-full bg-[#0B0E14] rounded-full flex items-center justify-center border-2 border-[#131722]">
                                        <User className="w-8 h-8 text-gray-400" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1">User Profile</h3>
                                    <p className="text-xs text-gray-500 mb-3">Update your photo and personal details.</p>
                                    <div className="flex gap-3">
                                        <button className="px-4 py-2 bg-[#1C212D] hover:bg-gray-800 text-white text-xs font-medium rounded-lg transition-colors border border-gray-700">Change Photo</button>
                                        <button className="px-4 py-2 text-rose-500 hover:bg-rose-500/10 text-xs font-medium rounded-lg transition-colors">Remove</button>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-2">Display Name</label>
                                    <input type="text" defaultValue="Guest User" className="w-full bg-[#0B0E14] border border-[#1C212D] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00E6A8] transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-2">Email Address</label>
                                    <input type="email" defaultValue="user@example.com" disabled className="w-full bg-[#0B0E14] border border-[#1C212D] rounded-xl px-4 py-3 text-sm text-gray-400 opacity-70 cursor-not-allowed" />
                                </div>
                                <div className="pt-4">
                                    <button className="px-6 py-2.5 bg-[#00E6A8] hover:bg-[#00c58f] text-[#0B0E14] font-bold text-sm rounded-xl transition-colors shadow-lg shadow-[#00E6A8]/20">Save Changes</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab !== 'Profile' && (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <div className="w-16 h-16 bg-[#1C212D] rounded-full flex items-center justify-center mb-4">
                                <Settings className="w-8 h-8 text-gray-500" />
                            </div>
                            <h3 className="text-lg text-gray-300 font-bold mb-2">{activeTab} configuration is coming soon</h3>
                            <p className="text-sm text-gray-500 max-w-sm">We are actively building these advanced configurations. Stay tuned for the next update.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
