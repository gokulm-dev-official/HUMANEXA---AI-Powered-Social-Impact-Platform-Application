import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bot, X, Send, Mic, MicOff, Sparkles, Brain, ShieldCheck,
    MapPin, TrendingUp, AlertTriangle, Zap, ChevronRight,
    MessageCircle, BarChart3, Target, Users, Clock, Activity
} from 'lucide-react';
import aiService, { AIChatResponse } from '../../services/aiService';
import api from '../../services/api';
import { cn } from '../../utils/cn';

// ── Sweet Female Voice Helper ──
const speakFemale = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/\*\*/g, '').replace(/[•🩸🚨🔍📋📊✅🏛️❤️💊🫁🧠🌊🛡️🍽️]/g, '').trim();
    if (!clean || clean.length > 250) return;
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = 'en-IN'; u.rate = 0.9; u.pitch = 1.15; u.volume = 1;
    const go = () => {
        const v = window.speechSynthesis.getVoices();
        const fem = v.find(x => x.lang.startsWith('en') && /zira|female|samantha|google.*female/i.test(x.name))
            || v.find(x => x.lang.startsWith('en'));
        if (fem) u.voice = fem;
        window.speechSynthesis.speak(u);
    };
    window.speechSynthesis.getVoices().length ? go() : (window.speechSynthesis.onvoiceschanged = go);
};

interface ProfileData {
    _id: string; fullName: string; avatar: string | null; bio: string;
    bloodGroup: string; gender: string; role: string; city: string; state: string;
    address: string; trustScore: number; rank: string; level: number;
    streak: { current: number; longest: number };
    totalDonations: number; totalHelps: number; successRate: number;
    verified: boolean; distance: number | null;
    badges: { name: string; icon: string }[];
    certificates: { name: string; type: string; tier?: string }[];
}

interface ChatMessage {
    id: string;
    role: 'user' | 'ai';
    content: string;
    intent?: string;
    suggestions?: string[];
    timestamp: Date;
    actionExecuted?: boolean;
    actionDetails?: any;
    source?: string;
}

/**
 * AI Command Hub — The floating brain interface
 * Features: Chat, Voice, Quick Actions, Insights
 */
export const AICommandHub: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'chat' | 'profiles' | 'insights' | 'analyze'>('chat');
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            role: 'ai',
            content: 'Hello! I\'m **Humanexa AI** — your intelligent assistant. I can help you:\n\n• 🩸 Send blood requests — "Send O+ blood request"\n• 🚨 Trigger emergencies — "Send emergency signal"\n• 🔍 Find donors near you\n• 📋 Track your impact\n\nJust type what you need!',
            suggestions: ['Send O+ blood request', 'Emergency help', 'Find donors near me', 'Track my request'],
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [analyzeInput, setAnalyzeInput] = useState('');
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [profiles, setProfiles] = useState<ProfileData[]>([]);
    const [profileSearch, setProfileSearch] = useState('');
    const [profileFilter, setProfileFilter] = useState('');
    const [profilesLoading, setProfilesLoading] = useState(false);
    const [profilesTotal, setProfilesTotal] = useState(0);
    const [selectedProfile, setSelectedProfile] = useState<ProfileData | null>(null);
    const transcriptRef = useRef('');

    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Voice Recognition Setup (continuous + auto-send)
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            const r = new SR();
            r.continuous = true; r.interimResults = true; r.lang = 'en-IN';
            r.onresult = (e: any) => {
                let f = '', im = '';
                for (let i = 0; i < e.results.length; i++) {
                    if (e.results[i].isFinal) f += e.results[i][0].transcript;
                    else im += e.results[i][0].transcript;
                }
                if (f) { transcriptRef.current = f; setInput(f); }
                else if (im) { transcriptRef.current = im; setInput(im); }
            };
            r.onend = () => {
                setIsListening(false);
                const t = transcriptRef.current.trim();
                if (t) { transcriptRef.current = ''; sendMessage(t); }
            };
            r.onerror = (e: any) => { if (e.error !== 'aborted') setIsListening(false); };
            recognitionRef.current = r;
        }
    }, []);

    // Fetch profiles
    const fetchProfiles = async (search?: string, bg?: string) => {
        setProfilesLoading(true);
        try {
            let url = '/ai/profiles?limit=20';
            if (search) url += `&search=${encodeURIComponent(search)}`;
            if (bg) url += `&bloodGroup=${encodeURIComponent(bg)}`;
            try {
                const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 }));
                url += `&lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`;
            } catch {}
            const res = await api.get(url);
            setProfiles(res.data?.data?.profiles || []);
            setProfilesTotal(res.data?.data?.total || 0);
        } catch { setProfiles([]); }
        setProfilesLoading(false);
    };

    const toggleVoice = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const sendMessage = async (text?: string) => {
        const messageText = text || input.trim();
        if (!messageText) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: messageText,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await aiService.chat(messageText);
            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                content: response.message,
                intent: response.intent,
                suggestions: response.suggestions,
                timestamp: new Date(),
                actionExecuted: (response as any).action_executed || false,
                actionDetails: (response as any).action_details || null,
                source: (response as any).source || 'rules',
            };
            setMessages(prev => [...prev, aiMsg]);
            speakFemale(response.message);

            // Auto-switch to profiles tab if user asks about donors/profiles
            if (['find_donors', 'profiles', 'find_nearby_donor'].includes(response.intent)) {
                setActiveTab('profiles');
                fetchProfiles();
            }
        } catch (error) {
            const fallbackMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                content: 'I\'m processing your request. The AI service is currently connecting. Please try again in a moment, or use the quick actions below.',
                suggestions: ['Send O+ blood request', 'Find donors', 'Emergency help'],
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, fallbackMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnalyze = async () => {
        if (!analyzeInput.trim()) return;
        setIsAnalyzing(true);
        try {
            const result = await aiService.analyzeDescription(analyzeInput);
            setAnalysisResult(result);
        } catch {
            // Smart local fallback analysis
            const lower = analyzeInput.toLowerCase();
            const categories = ['food', 'medicine', 'education', 'clothing', 'shelter', 'emergency', 'blood'];
            const detected = categories.find(c => lower.includes(c)) || 'general';
            const isUrgent = ['urgent', 'emergency', 'help', 'please', 'immediately'].some(w => lower.includes(w));
            setAnalysisResult({
                category: detected,
                isUrgent,
                keywords: lower.split(/\s+/).filter((w: string) => w.length > 3).slice(0, 5),
                emotions: isUrgent ? ['stress'] : [],
                suggestedFields: { urgency: isUrgent ? 'high' : 'medium', category: detected },
                enhancedDescription: analyzeInput.length < 30
                    ? `Request for ${detected} assistance: ${analyzeInput}`
                    : analyzeInput,
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const TABS = [
        { id: 'chat', label: 'Chat', icon: MessageCircle },
        { id: 'profiles', label: 'Profiles', icon: Users },
        { id: 'analyze', label: 'Analyze', icon: Brain },
        { id: 'insights', label: 'Insights', icon: BarChart3 },
    ] as const;

    return (
        <>
            {/* Floating AI Button */}
            <motion.button
                onClick={() => setIsOpen(true)}
                className={cn(
                    "fixed bottom-6 right-6 z-[9990] w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center transition-all duration-300",
                    "bg-[var(--color-primary)] hover:scale-105 active:scale-95",
                    isOpen && "opacity-0 pointer-events-none"
                )}
                whileHover={{ y: -2 }}
                animate={{ boxShadow: ['0 8px 24px rgba(0,0,0,0.15)', '0 8px 24px rgba(0,113,227,0.3)', '0 8px 24px rgba(0,0,0,0.15)'] }}
                transition={{ duration: 3, repeat: Infinity }}
            >
                <Bot size={22} className="text-white" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
            </motion.button>

            {/* AI Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                        className="fixed bottom-6 right-6 z-[9991] w-[420px] h-[600px] bg-white rounded-3xl shadow-2xl border border-black/[0.06] flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-black/[0.04] flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)] flex items-center justify-center">
                                    <Sparkles size={16} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-[14px] font-semibold text-[var(--color-primary)]">AI Command Hub</h3>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        <span className="text-[11px] text-[var(--color-secondary)]">10 agents active</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-8 h-8 rounded-xl bg-black/[0.03] flex items-center justify-center text-black/40 hover:text-black/70 hover:bg-black/[0.06] transition-all"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Tab Bar */}
                        <div className="px-4 py-2 border-b border-black/[0.03] flex gap-1 shrink-0">
                            {TABS.map(tab => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={cn(
                                            "flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all",
                                            activeTab === tab.id
                                                ? "bg-[var(--color-primary)] text-white"
                                                : "text-[var(--color-secondary)] hover:bg-black/[0.03]"
                                        )}
                                    >
                                        <Icon size={13} />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto">
                            {activeTab === 'chat' && (
                                <div className="flex flex-col h-full">
                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                        {messages.map(msg => (
                                            <div key={msg.id} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                                                <div className={cn(
                                                    "max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed",
                                                    msg.role === 'user'
                                                        ? "bg-[var(--color-primary)] text-white rounded-br-md"
                                                        : "bg-black/[0.03] text-[var(--color-primary)] rounded-bl-md"
                                                )}>
                                                    <div className="whitespace-pre-line" style={{ fontSize: '13px' }}>
                                                        {msg.content.split('**').map((part, i) =>
                                                            i % 2 === 1
                                                                ? <strong key={i}>{part}</strong>
                                                                : <span key={i}>{part}</span>
                                                        )}
                                                    </div>
                                                    {/* Action Executed Badge */}
                                                    {msg.actionExecuted && (
                                                        <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-1.5">
                                                            <span className="text-emerald-600 text-[10px]">✅</span>
                                                            <span className="text-[10px] font-bold text-emerald-700">Action Executed</span>
                                                            {msg.source && (
                                                                <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-600 font-bold">
                                                                    {msg.source === 'llama' ? '🧠 AI' : '⚡ Rules'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {/* Source badge for non-action messages */}
                                                    {!msg.actionExecuted && msg.source && msg.role === 'ai' && (
                                                        <div className="mt-1.5 flex justify-end">
                                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/[0.04] text-black/30 font-medium">
                                                                {msg.source === 'llama' ? '🧠 LLaMA' : '⚡ Quick'}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {msg.suggestions && msg.suggestions.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5 mt-3">
                                                            {msg.suggestions.map((s, i) => (
                                                                <button
                                                                    key={i}
                                                                    onClick={() => sendMessage(s)}
                                                                    className="px-3 py-1 rounded-lg bg-white border border-black/[0.06] text-[11px] font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white transition-all"
                                                                >
                                                                    {s}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {isLoading && (
                                            <div className="flex justify-start">
                                                <div className="bg-black/[0.03] rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
                                                    {[0, 1, 2].map(i => (
                                                        <motion.div key={i}
                                                            className="w-2 h-2 rounded-full bg-[var(--color-accent)]"
                                                            animate={{ opacity: [0.3, 1, 0.3] }}
                                                            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <div ref={chatEndRef} />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'profiles' && (
                                <div className="flex flex-col h-full">
                                    {/* ── Profile Detail View ── */}
                                    {selectedProfile ? (
                                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 overflow-y-auto">
                                            {/* Header with gradient */}
                                            <div className="relative bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 px-5 pt-5 pb-12">
                                                <button onClick={() => setSelectedProfile(null)} className="absolute top-3 left-3 w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center text-[12px] hover:bg-white/30 backdrop-blur-sm">←</button>
                                                {selectedProfile.verified && <span className="absolute top-3 right-3 text-[10px] px-2 py-1 rounded-full bg-emerald-400/90 text-white font-bold flex items-center gap-1"><ShieldCheck size={10} /> Verified</span>}
                                            </div>
                                            {/* Avatar */}
                                            <div className="flex justify-center -mt-10 relative z-10">
                                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-[28px] font-bold ring-4 ring-white shadow-xl">
                                                    {selectedProfile.avatar ? <img src={selectedProfile.avatar} className="w-full h-full rounded-full object-cover" /> : selectedProfile.fullName.charAt(0).toUpperCase()}
                                                </div>
                                            </div>
                                            <div className="px-5 pt-3 pb-4 space-y-4">
                                                {/* Name & Role */}
                                                <div className="text-center">
                                                    <h3 className="text-[16px] font-black text-[var(--color-primary)]">{selectedProfile.fullName}</h3>
                                                    <div className="flex items-center justify-center gap-2 mt-1">
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 font-bold capitalize">{selectedProfile.role}</span>
                                                        {selectedProfile.bloodGroup && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-black">{selectedProfile.bloodGroup}</span>}
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold">Lv.{selectedProfile.level}</span>
                                                    </div>
                                                    {selectedProfile.bio && <p className="text-[11px] text-black/50 mt-2 italic">"{selectedProfile.bio}"</p>}
                                                </div>
                                                {/* Location */}
                                                <div className="flex items-center justify-center gap-1.5 text-[11px] text-black/40">
                                                    <MapPin size={11} />
                                                    <span>{selectedProfile.address || 'Location not set'}</span>
                                                    {selectedProfile.distance !== null && <span className="text-emerald-600 font-bold">• {selectedProfile.distance} km away</span>}
                                                </div>
                                                {/* Rank Banner */}
                                                <div className="text-center py-2 rounded-xl bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border border-amber-100">
                                                    <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Current Rank</p>
                                                    <p className="text-[20px] font-black text-amber-700">{selectedProfile.rank}</p>
                                                    <p className="text-[11px] text-amber-500 font-bold">{selectedProfile.trustScore} Trust Points</p>
                                                </div>
                                                {/* Stats Grid */}
                                                <div className="grid grid-cols-3 gap-2">
                                                    {[
                                                        { label: 'Donations', value: selectedProfile.totalDonations, color: 'text-violet-600', bg: 'bg-violet-50' },
                                                        { label: 'Helps', value: selectedProfile.totalHelps, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                                        { label: 'Success', value: `${selectedProfile.successRate}%`, color: 'text-blue-600', bg: 'bg-blue-50' },
                                                    ].map((s, i) => (
                                                        <div key={i} className={`${s.bg} rounded-xl p-2.5 text-center border border-black/[0.03]`}>
                                                            <p className={`text-[16px] font-black ${s.color}`}>{s.value}</p>
                                                            <p className="text-[9px] text-black/40 font-bold uppercase tracking-wider">{s.label}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                                {/* Streak */}
                                                <div className="flex gap-2">
                                                    <div className="flex-1 rounded-xl bg-orange-50 border border-orange-100 p-2.5 text-center">
                                                        <p className="text-[14px] font-black text-orange-600">🔥 {selectedProfile.streak.current}</p>
                                                        <p className="text-[9px] text-orange-400 font-bold uppercase">Current Streak</p>
                                                    </div>
                                                    <div className="flex-1 rounded-xl bg-purple-50 border border-purple-100 p-2.5 text-center">
                                                        <p className="text-[14px] font-black text-purple-600">⭐ {selectedProfile.streak.longest}</p>
                                                        <p className="text-[9px] text-purple-400 font-bold uppercase">Best Streak</p>
                                                    </div>
                                                </div>
                                                {/* Badges */}
                                                {selectedProfile.badges.length > 0 && (
                                                    <div>
                                                        <p className="text-[10px] text-black/40 font-bold uppercase tracking-wider mb-2">Badges</p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {selectedProfile.badges.map((b, i) => (
                                                                <span key={i} className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 text-[10px] font-bold text-indigo-700">
                                                                    {b.icon} {b.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {/* Certificates */}
                                                {selectedProfile.certificates.length > 0 && (
                                                    <div>
                                                        <p className="text-[10px] text-black/40 font-bold uppercase tracking-wider mb-2">Certificates</p>
                                                        <div className="space-y-1.5">
                                                            {selectedProfile.certificates.map((c, i) => (
                                                                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100">
                                                                    <span className="text-[12px]">{c.tier === 'diamond' ? '💎' : c.tier === 'gold' ? '🥇' : c.tier === 'elite' ? '✨' : '🏅'}</span>
                                                                    <span className="text-[11px] font-bold text-amber-800">{c.name}</span>
                                                                    <span className="ml-auto text-[9px] text-amber-500 uppercase font-bold">{c.tier || c.type}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ) : (
                                        /* ── Profile List View ── */
                                        <div className="p-3 space-y-3 flex flex-col flex-1">
                                            <div className="flex gap-2">
                                                <input value={profileSearch} onChange={e => setProfileSearch(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && fetchProfiles(profileSearch, profileFilter)}
                                                    placeholder="Search by name..." className="flex-1 h-9 rounded-lg border border-black/[0.06] px-3 text-[12px] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20" />
                                                <select value={profileFilter} onChange={e => { setProfileFilter(e.target.value); fetchProfiles(profileSearch, e.target.value); }}
                                                    className="h-9 rounded-lg border border-black/[0.06] px-2 text-[11px] bg-white">
                                                    <option value="">All Blood</option>
                                                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => <option key={g} value={g}>{g}</option>)}
                                                </select>
                                                <button onClick={() => fetchProfiles(profileSearch, profileFilter)}
                                                    className="h-9 px-3 rounded-lg bg-[var(--color-primary)] text-white text-[11px] font-bold hover:opacity-90">
                                                    <Users size={13} />
                                                </button>
                                            </div>
                                            {!profiles.length && !profilesLoading && (
                                                <div className="text-center py-8">
                                                    <Users size={32} className="mx-auto text-black/20 mb-2" />
                                                    <p className="text-[12px] text-black/40 font-medium">Discover donor & helper profiles</p>
                                                    <button onClick={() => fetchProfiles()} className="mt-3 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-[12px] font-bold hover:opacity-90">
                                                        Load All Profiles
                                                    </button>
                                                </div>
                                            )}
                                            {profilesLoading && (
                                                <div className="flex justify-center py-8">
                                                    <motion.div className="w-8 h-8 border-3 border-[var(--color-accent)] border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                                                </div>
                                            )}
                                            {profiles.length > 0 && (
                                                <div className="flex-1 overflow-y-auto space-y-2">
                                                    <p className="text-[10px] text-black/40 font-bold uppercase tracking-wider">{profilesTotal} profiles found</p>
                                                    {profiles.map(p => (
                                                        <motion.div key={p._id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                                                            onClick={() => setSelectedProfile(p)}
                                                            className="flex items-center gap-3 p-3 rounded-xl bg-black/[0.02] border border-black/[0.04] hover:bg-black/[0.04] hover:border-black/[0.08] transition-all cursor-pointer group">
                                                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-[14px] font-bold shrink-0 ring-2 ring-white shadow-sm">
                                                                {p.avatar ? <img src={p.avatar} className="w-full h-full rounded-full object-cover" /> : p.fullName.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-[13px] font-bold text-[var(--color-primary)] truncate">{p.fullName}</span>
                                                                    {p.verified && <ShieldCheck size={12} className="text-blue-500 shrink-0" />}
                                                                </div>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    {p.bloodGroup && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 font-black">{p.bloodGroup}</span>}
                                                                    <span className="text-[10px] text-black/40 capitalize">{p.role}</span>
                                                                    {p.city && <span className="text-[10px] text-black/30 flex items-center gap-0.5"><MapPin size={8} />{p.city}</span>}
                                                                </div>
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <div className="text-[11px] font-bold text-[var(--color-accent)]">{p.trustScore} pts</div>
                                                                <div className="text-[9px] text-black/30 font-medium">{p.rank}</div>
                                                                {p.distance !== null && <div className="text-[9px] text-emerald-600 font-bold mt-0.5">{p.distance} km</div>}
                                                            </div>
                                                            <ChevronRight size={14} className="text-black/20 group-hover:text-black/40 shrink-0" />
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'analyze' && (
                                <div className="p-4 space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[12px] font-semibold text-[var(--color-secondary)] uppercase tracking-wider">
                                            Paste or type a request description
                                        </label>
                                        <textarea
                                            value={analyzeInput}
                                            onChange={(e) => setAnalyzeInput(e.target.value)}
                                            placeholder='e.g. "Student needs ₹20,000 for education fees urgently"'
                                            className="w-full h-28 rounded-xl border border-black/[0.06] bg-black/[0.01] p-3 text-[13px] text-[var(--color-primary)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20"
                                        />
                                        <button
                                            onClick={handleAnalyze}
                                            disabled={isAnalyzing || !analyzeInput.trim()}
                                            className="w-full h-10 rounded-xl bg-[var(--color-primary)] text-white text-[13px] font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-30 transition-all"
                                        >
                                            <Brain size={14} />
                                            {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
                                        </button>
                                    </div>

                                    {analysisResult && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-3"
                                        >
                                            <h4 className="text-[12px] font-bold text-[var(--color-secondary)] uppercase tracking-wider">AI Analysis</h4>

                                            <div className="grid grid-cols-2 gap-2">
                                                <AnalysisCard icon={<Target size={13} />} label="Category" value={analysisResult.category} />
                                                <AnalysisCard icon={<Zap size={13} />} label="Urgency" value={analysisResult.isUrgent ? 'HIGH' : 'Normal'}
                                                    color={analysisResult.isUrgent ? 'text-red-600' : undefined} />
                                            </div>

                                            {analysisResult.emotions?.length > 0 && (
                                                <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <AlertTriangle size={13} className="text-amber-600" />
                                                        <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Emotion Detected</span>
                                                    </div>
                                                    <p className="text-[12px] text-amber-700">{analysisResult.emotions.join(', ')}</p>
                                                </div>
                                            )}

                                            {analysisResult.keywords?.length > 0 && (
                                                <div>
                                                    <p className="text-[11px] font-semibold text-[var(--color-secondary)] mb-1.5">Keywords</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {analysisResult.keywords.map((k: string, i: number) => (
                                                            <span key={i} className="px-2 py-0.5 rounded-md bg-black/[0.03] text-[11px] text-[var(--color-primary)] font-medium">
                                                                {k}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {analysisResult.enhancedDescription && (
                                                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                                                    <p className="text-[11px] font-bold text-blue-800 uppercase tracking-wider mb-1">Enhanced Description</p>
                                                    <p className="text-[12px] text-blue-700">{analysisResult.enhancedDescription}</p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'insights' && (
                                <div className="p-4 space-y-4">
                                    <h4 className="text-[12px] font-bold text-[var(--color-secondary)] uppercase tracking-wider">AI System Status</h4>

                                    <div className="grid grid-cols-2 gap-2">
                                        <InsightCard icon={<Activity size={13} />} label="Success Rate" value="87%" color="text-emerald-600" />
                                        <InsightCard icon={<Clock size={13} />} label="Avg Response" value="2.4 hrs" />
                                        <InsightCard icon={<Users size={13} />} label="Active Donors" value="142" />
                                        <InsightCard icon={<ShieldCheck size={13} />} label="AI Confidence" value="92%" color="text-[var(--color-accent)]" />
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-[11px] font-bold text-[var(--color-secondary)] uppercase tracking-wider">Active Agents</p>
                                        {[
                                            { name: 'Coordinator Agent', status: 'active', icon: '🧠' },
                                            { name: 'Matching Agent', status: 'active', icon: '🔗' },
                                            { name: 'Verification Agent', status: 'active', icon: '🔍' },
                                            { name: 'Priority Agent', status: 'active', icon: '⚡' },
                                            { name: 'Routing Agent', status: 'active', icon: '📡' },
                                            { name: 'Collaboration Agent', status: 'standby', icon: '🤝' },
                                            { name: 'Prediction Agent', status: 'active', icon: '🔮' },
                                            { name: 'Story Agent', status: 'standby', icon: '📝' },
                                            { name: 'Impact Agent', status: 'active', icon: '📊' },
                                            { name: 'Assistant Agent', status: 'active', icon: '💬' },
                                        ].map((agent, i) => (
                                            <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-black/[0.02] transition-colors">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="text-[14px]">{agent.icon}</span>
                                                    <span className="text-[12px] font-medium text-[var(--color-primary)]">{agent.name}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <div className={cn("w-1.5 h-1.5 rounded-full", agent.status === 'active' ? "bg-emerald-500" : "bg-amber-400")} />
                                                    <span className="text-[10px] font-medium text-[var(--color-secondary)]">{agent.status}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Bar (always visible on chat tab) */}
                        {activeTab === 'chat' && (
                            <div className="px-4 py-3 border-t border-black/[0.04] shrink-0">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={toggleVoice}
                                        className={cn(
                                            "w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-all",
                                            isListening ? "bg-red-500 text-white animate-pulse" : "bg-black/[0.03] text-black/40 hover:bg-black/[0.06]"
                                        )}
                                    >
                                        {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                                    </button>
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                        placeholder={isListening ? "Listening..." : "Ask me anything..."}
                                        className="flex-1 h-10 rounded-xl border border-black/[0.06] px-4 text-[13px] text-[var(--color-primary)] bg-black/[0.01] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20"
                                    />
                                    <button
                                        onClick={() => sendMessage()}
                                        disabled={!input.trim()}
                                        className="w-10 h-10 shrink-0 rounded-xl bg-[var(--color-primary)] text-white flex items-center justify-center disabled:opacity-30 hover:opacity-90 transition-all"
                                    >
                                        <Send size={15} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

// ─── Helper Components ───

const AnalysisCard = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color?: string }) => (
    <div className="p-3 rounded-xl bg-black/[0.02] border border-black/[0.04]">
        <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[var(--color-secondary)]">{icon}</span>
            <span className="text-[10px] font-semibold text-[var(--color-secondary)] uppercase tracking-wider">{label}</span>
        </div>
        <p className={cn("text-[16px] font-bold capitalize", color || "text-[var(--color-primary)]")}>{value}</p>
    </div>
);

const InsightCard = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color?: string }) => (
    <div className="p-3 rounded-xl bg-black/[0.02] border border-black/[0.04] text-center">
        <div className="flex items-center justify-center gap-1.5 mb-1">
            <span className="text-[var(--color-secondary)]">{icon}</span>
        </div>
        <p className={cn("text-[18px] font-bold", color || "text-[var(--color-primary)]")}>{value}</p>
        <p className="text-[10px] font-medium text-[var(--color-secondary)] mt-0.5">{label}</p>
    </div>
);
