/**
 * ═══════════════════════════════════════════════════════════════════
 * 🎤 HUMANEXA AI VOICE ASSISTANT — Premium Floating Component
 * Speech Recognition → AI Processing → Auto-Action → Speech Response
 * ═══════════════════════════════════════════════════════════════════
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Loader2, CheckCircle2, AlertTriangle, Volume2, Zap, Globe } from 'lucide-react';
import api from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

// ── Types ──
interface VoiceResult {
    language: string;
    intent: string;
    priority: string;
    blood_group: string;
    location: string;
    hospital_name: string;
    phone_number: string;
    patient_name: string;
    emergency_type: string;
    response_text: string;
    action_required: boolean;
    source: string;
    actionResult?: {
        action: string;
        executed: boolean;
        details: any;
    };
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'result' | 'error';

// ── Speech Recognition Setup ──
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

// ── Priority Colors ──
const priorityConfig: Record<string, { bg: string; text: string; border: string; glow: string; label: string }> = {
    critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', glow: 'shadow-red-200/60', label: '🔴 CRITICAL' },
    high: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', glow: 'shadow-orange-200/60', label: '🟠 HIGH' },
    medium: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', glow: 'shadow-amber-200/60', label: '🟡 MEDIUM' },
    low: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', glow: 'shadow-emerald-200/60', label: '🟢 LOW' },
};

const intentLabels: Record<string, string> = {
    blood_request: '🩸 Blood Request',
    call_ambulance: '🚑 Ambulance',
    accident_report: '🚗 Accident',
    fire_emergency: '🔥 Fire Emergency',
    heart_attack: '❤️ Heart Attack',
    breathing_problem: '💨 Breathing',
    unconscious_patient: '😶 Unconscious',
    find_nearby_donor: '🔍 Find Donor',
    hospital_search: '🏥 Hospital',
    medicine_request: '💊 Medicine',
    oxygen_request: '🫁 Oxygen',
    doctor_consultation: '👨‍⚕️ Doctor',
    send_help_request: '🤝 Help Request',
    food_request: '🍽️ Food Request',
    women_safety_alert: '🛡️ Women Safety',
    disaster_support: '🌊 Disaster',
    mental_health_support: '🧠 Mental Health',
    cancel_request: '❌ Cancel',
    unknown: '❓ Unknown',
};

const VoiceAssistant: React.FC = () => {
    const { showToast } = useNotifications();
    const navigate = useNavigate();

    const [isOpen, setIsOpen] = useState(false);
    const [state, setState] = useState<VoiceState>('idle');
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [result, setResult] = useState<VoiceResult | null>(null);
    const [error, setError] = useState('');
    const [language, setLanguage] = useState<'en-IN' | 'ta-IN'>('en-IN');
    const [pulseAnimation, setPulseAnimation] = useState(false);
    const [waveform, setWaveform] = useState<number[]>([3, 5, 8, 12, 8, 5, 3]);

    const recognitionRef = useRef<any>(null);
    const waveIntervalRef = useRef<any>(null);
    const transcriptRef = useRef('');
    const interimRef = useRef('');

    // ── Waveform Animation ──
    useEffect(() => {
        if (state === 'listening') {
            waveIntervalRef.current = setInterval(() => {
                setWaveform(Array.from({ length: 7 }, () => Math.random() * 28 + 4));
            }, 120);
        } else {
            if (waveIntervalRef.current) clearInterval(waveIntervalRef.current);
            setWaveform([3, 5, 8, 12, 8, 5, 3]);
        }
        return () => { if (waveIntervalRef.current) clearInterval(waveIntervalRef.current); };
    }, [state]);

    // ── Speak Response (Sweet Female Voice) ──
    const speakResponse = useCallback((text: string, lang: string) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang === 'ta' ? 'ta-IN' : 'en-IN';
        utterance.rate = 0.9;   // Slightly slower for warmth
        utterance.pitch = 1.15; // Higher pitch for sweet female tone
        utterance.volume = 1;

        const trySpeak = () => {
            const voices = window.speechSynthesis.getVoices();
            const langPrefix = lang === 'ta' ? 'ta' : 'en';

            // Preferred sweet female voice names (browser-specific)
            const preferredFemaleNames = [
                'Microsoft Zira',         // Windows - sweet English female
                'Google UK English Female', // Chrome - clear female
                'Google US English',       // Chrome fallback
                'Samantha',               // macOS - sweet female
                'Karen',                  // macOS AU
                'Moira',                  // macOS Irish
                'Tessa',                  // macOS SA
                'Victoria',               // macOS
                'Microsoft Heera',        // Windows - Hindi female
            ];

            // First: try to find a preferred female voice matching language
            let selectedVoice = voices.find(v => 
                v.lang.startsWith(langPrefix) && 
                preferredFemaleNames.some(name => v.name.includes(name))
            );

            // Second: any female voice matching language (look for female keywords)
            if (!selectedVoice) {
                selectedVoice = voices.find(v => 
                    v.lang.startsWith(langPrefix) && 
                    /female|woman|zira|samantha|karen|heera|tessa|victoria/i.test(v.name)
                );
            }

            // Third: any voice with the right language
            if (!selectedVoice) {
                selectedVoice = voices.find(v => v.lang.startsWith(langPrefix));
            }

            // Fourth: any English female voice as last resort
            if (!selectedVoice) {
                selectedVoice = voices.find(v => 
                    v.lang.startsWith('en') && 
                    /female|woman|zira|samantha/i.test(v.name)
                );
            }

            if (selectedVoice) {
                utterance.voice = selectedVoice;
                console.log('[Voice] Using voice:', selectedVoice.name, selectedVoice.lang);
            }
            window.speechSynthesis.speak(utterance);
        };

        // Voices may not be loaded yet
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            trySpeak();
        } else {
            window.speechSynthesis.onvoiceschanged = trySpeak;
        }
    }, []);

    // ── Process Voice Text ──
    const processText = useCallback(async (text: string) => {
        if (!text.trim()) return;
        setState('processing');
        setTranscript(text);

        try {
            // Get user location for context
            let loc: any = null;
            try {
                const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                });
                loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
            } catch { }

            const res = await api.post('/ai/voice-command', { text, location: loc });
            const data = res.data?.data;

            if (data) {
                setResult(data);
                setState('result');
                setPulseAnimation(true);
                setTimeout(() => setPulseAnimation(false), 2000);

                // Speak the response
                speakResponse(data.response_text, data.language);

                // Show toast for executed actions
                if (data.actionResult?.executed) {
                    showToast(`✅ ${intentLabels[data.intent] || data.intent} — Action executed!`, 'success');
                }
            } else {
                throw new Error('No data in response');
            }
        } catch (err: any) {
            console.error('Voice processing error:', err);
            setError(err.response?.data?.message || 'Failed to process voice command');
            setState('error');
        }
    }, [speakResponse, showToast]);

    // ── Start Listening ──
    const startListening = useCallback(() => {
        if (!SpeechRecognition) {
            setError('Speech recognition not supported in this browser. Use Chrome or Edge.');
            setState('error');
            return;
        }

        // Reset refs
        transcriptRef.current = '';
        interimRef.current = '';

        const recognition = new SpeechRecognition();
        recognition.lang = language;
        recognition.interimResults = true;
        recognition.continuous = true; // Keep listening until user taps stop
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setState('listening');
            setTranscript('');
            setInterimTranscript('');
            setResult(null);
            setError('');
        };

        recognition.onresult = (event: any) => {
            let final = '';
            let interim = '';
            for (let i = 0; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    final += event.results[i][0].transcript;
                } else {
                    interim += event.results[i][0].transcript;
                }
            }
            // Update BOTH ref and state — ref for onend, state for UI
            if (final) {
                transcriptRef.current = final;
                setTranscript(final);
            }
            interimRef.current = interim;
            setInterimTranscript(interim);
        };

        recognition.onend = () => {
            // Read from refs (always current), NOT from state (stale closure)
            const finalText = transcriptRef.current || interimRef.current;
            console.log('[VoiceAssistant] onend — final:', transcriptRef.current, '| interim:', interimRef.current);
            if (finalText.trim()) {
                processText(finalText.trim());
            } else {
                setState('idle');
            }
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'no-speech') {
                setError('No speech detected. Please try again.');
            } else if (event.error === 'not-allowed') {
                setError('Microphone access denied. Please allow microphone access in browser settings.');
            } else if (event.error === 'aborted') {
                // User cancelled — don't show error
                return;
            } else {
                setError(`Speech error: ${event.error}`);
            }
            setState('error');
        };

        recognitionRef.current = recognition;
        recognition.start();
    }, [language, processText]);

    // ── Stop Listening ──
    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, []);

    // ── Reset ──
    const reset = () => {
        setState('idle');
        setTranscript('');
        setInterimTranscript('');
        setResult(null);
        setError('');
        window.speechSynthesis?.cancel();
    };

    // ── Navigate based on intent ──
    const navigateForIntent = (intent: string) => {
        const routeMap: Record<string, string> = {
            blood_request: '/blood-donation',
            call_ambulance: '/emergency',
            accident_report: '/emergency',
            fire_emergency: '/emergency',
            heart_attack: '/emergency',
            find_nearby_donor: '/donor-discovery',
            hospital_search: '/donor-discovery',
            send_help_request: '/create-request',
            food_request: '/create-request',
        };
        const route = routeMap[intent];
        if (route) {
            setIsOpen(false);
            navigate(route);
        }
    };

    const pCfg = result ? (priorityConfig[result.priority] || priorityConfig.low) : priorityConfig.low;

    return (
        <>
            {/* ═══ Floating Mic Button ═══ */}
            <motion.button
                onClick={() => { setIsOpen(true); reset(); }}
                className="fixed bottom-24 right-6 z-[100] w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-2xl shadow-violet-300/50 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                title="Humanexa Voice Assistant"
            >
                <Mic size={22} />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white flex items-center justify-center">
                    <Zap size={8} className="text-white" />
                </div>
            </motion.button>

            {/* ═══ Voice Modal ═══ */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-6"
                        onClick={() => { setIsOpen(false); stopListening(); }}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 100, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 100, scale: 0.9 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
                        >
                            {/* Header */}
                            <div className="relative bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 px-6 pt-6 pb-8">
                                <button onClick={() => { setIsOpen(false); stopListening(); }}
                                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 backdrop-blur-sm">
                                    <X size={16} />
                                </button>
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                        <Mic size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">Humanexa AI</h2>
                                        <p className="text-[11px] text-white/70">Voice Assistant • Multilingual</p>
                                    </div>
                                </div>

                                {/* Language Toggle */}
                                <div className="flex gap-2 mt-4">
                                    {[
                                        { code: 'en-IN' as const, label: 'English', flag: '🇬🇧' },
                                        { code: 'ta-IN' as const, label: 'தமிழ்', flag: '🇮🇳' },
                                    ].map(l => (
                                        <button key={l.code} onClick={() => setLanguage(l.code)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${language === l.code
                                                ? 'bg-white text-violet-700 shadow-lg'
                                                : 'bg-white/15 text-white/80 hover:bg-white/25'
                                                }`}>
                                            <span>{l.flag}</span> {l.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-5">

                                {/* ═══ IDLE STATE ═══ */}
                                {state === 'idle' && (
                                    <div className="text-center space-y-5">
                                        <p className="text-[13px] text-gray-500">
                                            Tap the microphone and speak your request
                                        </p>
                                        <motion.button
                                            onClick={startListening}
                                            className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-violet-300/50 hover:shadow-violet-400/60"
                                            whileHover={{ scale: 1.08 }}
                                            whileTap={{ scale: 0.92 }}
                                        >
                                            <Mic size={32} />
                                        </motion.button>
                                        <div className="text-[11px] text-gray-400 space-y-1">
                                            <p className="font-bold text-gray-500">Try saying:</p>
                                            <p>"Send O positive blood request"</p>
                                            <p>"I need an ambulance urgently"</p>
                                            <p>"எனக்கு O positive blood தேவை"</p>
                                        </div>
                                    </div>
                                )}

                                {/* ═══ LISTENING STATE ═══ */}
                                {state === 'listening' && (
                                    <div className="text-center space-y-5">
                                        <div className="relative">
                                            <motion.button
                                                onClick={stopListening}
                                                className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-pink-600 text-white flex items-center justify-center shadow-2xl shadow-red-300/50 relative z-10"
                                                animate={{ scale: [1, 1.05, 1] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                            >
                                                <MicOff size={28} />
                                            </motion.button>
                                            {/* Ripple */}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-24 h-24 rounded-full border-2 border-red-300 animate-ping opacity-30" />
                                            </div>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-28 h-28 rounded-full border border-red-200 animate-ping opacity-20" style={{ animationDelay: '0.3s' }} />
                                            </div>
                                        </div>

                                        {/* Waveform */}
                                        <div className="flex items-center justify-center gap-1 h-10">
                                            {waveform.map((h, i) => (
                                                <motion.div
                                                    key={i}
                                                    className="w-1.5 bg-gradient-to-t from-violet-500 to-indigo-400 rounded-full"
                                                    animate={{ height: h }}
                                                    transition={{ duration: 0.1 }}
                                                />
                                            ))}
                                        </div>

                                        <p className="text-sm font-bold text-red-600 animate-pulse">
                                            🎙️ Listening... Tap to stop
                                        </p>

                                        {/* Live Transcript */}
                                        {(transcript || interimTranscript) && (
                                            <div className="bg-gray-50 rounded-xl p-3 text-left">
                                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Heard:</p>
                                                <p className="text-[14px] text-gray-800 font-medium">
                                                    {transcript}
                                                    <span className="text-gray-400 italic">{interimTranscript}</span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ═══ PROCESSING STATE ═══ */}
                                {state === 'processing' && (
                                    <div className="text-center space-y-5 py-4">
                                        <div className="mx-auto w-16 h-16 rounded-full bg-violet-50 flex items-center justify-center">
                                            <Loader2 size={32} className="text-violet-600 animate-spin" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-700">Processing with AI...</p>
                                            <p className="text-[11px] text-gray-400 mt-1">Analyzing intent, language, and entities</p>
                                        </div>
                                        {transcript && (
                                            <div className="bg-gray-50 rounded-xl p-3 text-left">
                                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Your Input:</p>
                                                <p className="text-[14px] text-gray-800 font-medium">"{transcript}"</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ═══ RESULT STATE ═══ */}
                                {state === 'result' && result && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                        {/* What you said */}
                                        <div className="bg-gray-50 rounded-xl p-3">
                                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">You said:</p>
                                            <p className="text-[14px] text-gray-800 font-medium">"{transcript}"</p>
                                        </div>

                                        {/* AI Response */}
                                        <motion.div
                                            className={`rounded-xl p-4 border ${pCfg.bg} ${pCfg.border} ${pulseAnimation ? `shadow-lg ${pCfg.glow}` : ''}`}
                                            animate={pulseAnimation ? { scale: [1, 1.02, 1] } : {}}
                                            transition={{ duration: 0.5 }}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`text-[11px] font-black uppercase tracking-wider ${pCfg.text}`}>
                                                    {pCfg.label}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/80 text-gray-500 font-bold">
                                                        {result.language === 'ta' ? '🇮🇳 Tamil' : '🇬🇧 English'}
                                                    </span>
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/80 text-violet-600 font-bold flex items-center gap-1">
                                                        <Zap size={8} /> {result.source === 'ollama' ? 'AI' : 'Rules'}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className={`text-[15px] font-bold ${pCfg.text}`}>
                                                {result.response_text}
                                            </p>
                                        </motion.div>

                                        {/* Intent & Entities */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-violet-50 rounded-xl p-3">
                                                <p className="text-[10px] text-violet-500 font-bold uppercase">Intent</p>
                                                <p className="text-[13px] font-bold text-violet-700 mt-0.5">
                                                    {intentLabels[result.intent] || result.intent}
                                                </p>
                                            </div>
                                            {result.blood_group && (
                                                <div className="bg-red-50 rounded-xl p-3">
                                                    <p className="text-[10px] text-red-500 font-bold uppercase">Blood Group</p>
                                                    <p className="text-[16px] font-black text-red-700 mt-0.5">{result.blood_group}</p>
                                                </div>
                                            )}
                                            {result.hospital_name && (
                                                <div className="bg-blue-50 rounded-xl p-3">
                                                    <p className="text-[10px] text-blue-500 font-bold uppercase">Hospital</p>
                                                    <p className="text-[13px] font-bold text-blue-700 mt-0.5">{result.hospital_name}</p>
                                                </div>
                                            )}
                                            {result.patient_name && (
                                                <div className="bg-emerald-50 rounded-xl p-3">
                                                    <p className="text-[10px] text-emerald-500 font-bold uppercase">Patient</p>
                                                    <p className="text-[13px] font-bold text-emerald-700 mt-0.5">{result.patient_name}</p>
                                                </div>
                                            )}
                                            {result.location && (
                                                <div className="bg-amber-50 rounded-xl p-3 col-span-2">
                                                    <p className="text-[10px] text-amber-500 font-bold uppercase">Location</p>
                                                    <p className="text-[13px] font-bold text-amber-700 mt-0.5">{result.location}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Status */}
                                        {result.actionResult && (
                                            <div className={`rounded-xl p-3 border ${result.actionResult.executed
                                                ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                                                <div className="flex items-center gap-2">
                                                    {result.actionResult.executed
                                                        ? <CheckCircle2 size={16} className="text-emerald-600" />
                                                        : <AlertTriangle size={16} className="text-amber-600" />
                                                    }
                                                    <p className={`text-[13px] font-bold ${result.actionResult.executed ? 'text-emerald-700' : 'text-amber-700'}`}>
                                                        {result.actionResult.executed
                                                            ? '✅ Action Executed Successfully'
                                                            : result.actionResult.details?.message || 'Action pending'
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex gap-2">
                                            <button onClick={() => speakResponse(result.response_text, result.language)}
                                                className="flex-1 h-10 rounded-xl bg-violet-50 text-violet-600 font-bold text-[12px] flex items-center justify-center gap-1.5 hover:bg-violet-100 transition-colors">
                                                <Volume2 size={14} /> Replay
                                            </button>
                                            <button onClick={reset}
                                                className="flex-1 h-10 rounded-xl bg-gray-100 text-gray-600 font-bold text-[12px] flex items-center justify-center gap-1.5 hover:bg-gray-200 transition-colors">
                                                <Mic size={14} /> New Command
                                            </button>
                                            {result.intent !== 'unknown' && (
                                                <button onClick={() => navigateForIntent(result.intent)}
                                                    className="flex-1 h-10 rounded-xl bg-indigo-600 text-white font-bold text-[12px] flex items-center justify-center gap-1.5 hover:bg-indigo-700 transition-colors">
                                                    <Globe size={14} /> Open Page
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {/* ═══ ERROR STATE ═══ */}
                                {state === 'error' && (
                                    <div className="text-center space-y-4 py-4">
                                        <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                                            <AlertTriangle size={24} className="text-red-500" />
                                        </div>
                                        <p className="text-[14px] font-bold text-red-600">{error}</p>
                                        <button onClick={reset}
                                            className="mx-auto px-6 h-10 rounded-xl bg-gray-100 text-gray-600 font-bold text-[13px] hover:bg-gray-200 transition-colors">
                                            Try Again
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-6 pb-4 pt-0">
                                <p className="text-[10px] text-gray-300 text-center">
                                    Powered by Humanexa AI • LLaMA 3.2 • {!SpeechRecognition ? '⚠️ Speech not supported' : '🎤 Speech Ready'}
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default VoiceAssistant;
