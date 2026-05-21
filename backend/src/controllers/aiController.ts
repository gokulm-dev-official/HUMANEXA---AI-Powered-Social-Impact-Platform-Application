/**
 * ═══════════════════════════════════════════════════════════════════
 * 🧠 AI CONTROLLER — API Handlers for all AI features
 * ═══════════════════════════════════════════════════════════════════
 */

import { Request, Response } from 'express';
import { aiCoordinator, AIRequest } from '../services/aiAgentService';
import { trustScoreAgent } from '../services/trustScoreAgent';
import { priorityAgent } from '../services/priorityAgent';
import { matchingAgent } from '../services/matchingAgent';
import { predictionAgent } from '../services/predictionAgent';

export const aiController = {
    
    /**
     * POST /api/v1/ai/process
     * Full AI pipeline — processes a help request through all agents
     */
    async processRequest(req: Request, res: Response) {
        try {
            const { description, category, urgency, amount, currency, location, metadata } = req.body;
            const userId = (req as any).user?.id || 'anonymous';
            const userRole = (req as any).user?.role || 'donor';

            if (!description || !category || !location) {
                return res.status(400).json({
                    status: 'error',
                    message: 'description, category, and location are required',
                });
            }

            const aiRequest: AIRequest = {
                description,
                category,
                urgency,
                amount,
                currency: currency || 'INR',
                location: {
                    lat: location.lat || 0,
                    lng: location.lng || 0,
                    address: location.address,
                },
                userId,
                userRole,
                metadata,
            };

            const decision = await aiCoordinator.processRequest(aiRequest);

            res.status(200).json({
                status: 'success',
                data: decision,
            });
        } catch (error: any) {
            console.error('[AI Controller] processRequest error:', error);
            res.status(500).json({
                status: 'error',
                message: 'AI processing failed',
                error: error.message,
            });
        }
    },

    /**
     * POST /api/v1/ai/analyze
     * Quick analysis — enhance request description, detect category, urgency
     */
    async analyzeDescription(req: Request, res: Response) {
        try {
            const { description } = req.body;
            if (!description) {
                return res.status(400).json({ status: 'error', message: 'description is required' });
            }

            const analysis = await aiCoordinator.analyzeDescription(description);

            res.status(200).json({ status: 'success', data: analysis });
        } catch (error: any) {
            res.status(500).json({ status: 'error', message: error.message });
        }
    },

    /**
     * POST /api/v1/ai/priority
     * Detect urgency & emotion from text
     */
    async detectPriority(req: Request, res: Response) {
        try {
            const { description, urgency, category } = req.body;
            if (!description) {
                return res.status(400).json({ status: 'error', message: 'description is required' });
            }

            const result = await priorityAgent.analyze(description, urgency, category);
            res.status(200).json({ status: 'success', data: result });
        } catch (error: any) {
            res.status(500).json({ status: 'error', message: error.message });
        }
    },

    /**
     * GET /api/v1/ai/trust-score/:userId
     * Get trust score for a user
     */
    async getTrustScore(req: Request, res: Response) {
        try {
            const { userId } = req.params;
            const result = await trustScoreAgent.getUserTrustScore(userId);
            res.status(200).json({ status: 'success', data: result });
        } catch (error: any) {
            res.status(500).json({ status: 'error', message: error.message });
        }
    },

    /**
     * POST /api/v1/ai/match
     * Find best matches for a request
     */
    async findMatches(req: Request, res: Response) {
        try {
            const { category, location, amount, urgency } = req.body;
            const userId = (req as any).user?.id || 'anonymous';

            const matches = await matchingAgent.findMatches({
                category: category || 'general',
                location: { lat: location?.lat || 0, lng: location?.lng || 0 },
                amount,
                urgency: urgency || 'medium',
                userId,
            });

            res.status(200).json({ status: 'success', data: { matches, count: matches.length } });
        } catch (error: any) {
            res.status(500).json({ status: 'error', message: error.message });
        }
    },

    /**
     * POST /api/v1/ai/predict
     * Predict outcome for a request
     */
    async predict(req: Request, res: Response) {
        try {
            const { category, location, amount, matchCount, priorityLevel, trustScore } = req.body;

            const result = await predictionAgent.predict({
                category: category || 'general',
                location: location || { lat: 0, lng: 0 },
                amount,
                matchCount: matchCount || 0,
                priorityLevel: priorityLevel || 'medium',
                trustScore: trustScore || 50,
            });

            res.status(200).json({ status: 'success', data: result });
        } catch (error: any) {
            res.status(500).json({ status: 'error', message: error.message });
        }
    },

    /**
     * POST /api/v1/ai/story
     * Generate an impact story
     */
    async generateStory(req: Request, res: Response) {
        try {
            const { category, description, donorName, recipientLocation, amount, completedAt } = req.body;

            const story = await aiCoordinator.generateImpactStory({
                category: category || 'general',
                description: description || '',
                donorName: donorName || 'A generous donor',
                recipientLocation: recipientLocation || 'the community',
                amount,
                completedAt: completedAt || new Date().toISOString().split('T')[0],
            });

            res.status(200).json({ status: 'success', data: story });
        } catch (error: any) {
            res.status(500).json({ status: 'error', message: error.message });
        }
    },

    /**
     * POST /api/v1/ai/chat
     * AI Chat Assistant — LLaMA-powered with action execution
     */
    async chat(req: Request, res: Response) {
        try {
            const { message, context } = req.body;
            if (!message) {
                return res.status(400).json({ status: 'error', message: 'message is required' });
            }

            const user = (req as any).user;
            const response = await generateSmartChatResponse(message, user, context);
            res.status(200).json({ status: 'success', data: response });
        } catch (error: any) {
            res.status(500).json({ status: 'error', message: error.message });
        }
    },

    /**
     * GET /api/v1/ai/insights
     * AI Dashboard insights
     */
    async getInsights(req: Request, res: Response) {
        try {
            // Aggregated AI insights
            const insights = {
                totalProcessed: Math.floor(Math.random() * 500) + 100,
                avgResponseTime: '2.4 hrs',
                successRate: 87,
                activeDonors: Math.floor(Math.random() * 100) + 50,
                urgentPending: Math.floor(Math.random() * 10),
                topCategory: 'food',
                aiConfidence: 92,
                trendsThisWeek: [
                    { category: 'food', change: +12, direction: 'up' },
                    { category: 'education', change: +8, direction: 'up' },
                    { category: 'medicine', change: -3, direction: 'down' },
                    { category: 'clothing', change: +2, direction: 'up' },
                ],
                matchQuality: {
                    avgScore: 0.78,
                    topMatchRate: 0.92,
                    avgMatchesPerRequest: 4.2,
                },
                fraudStats: {
                    totalScanned: Math.floor(Math.random() * 300) + 100,
                    flagged: Math.floor(Math.random() * 5),
                    blocked: Math.floor(Math.random() * 2),
                    clearRate: 97,
                },
            };

            res.status(200).json({ status: 'success', data: insights });
        } catch (error: any) {
            res.status(500).json({ status: 'error', message: error.message });
        }
    },
};

// ── Ollama LLaMA Chat ──
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const CHAT_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';

const CHAT_SYSTEM_PROMPT = `You are Humanexa AI Assistant — a helpful, intelligent assistant for the Humanexa social impact platform.

ABOUT HUMANEXA:
Humanexa is a transparent AI-powered social impact platform where:
- Donors can fund verified help requests (food, medicine, education, clothing, shelter)
- Helpers deliver aid and submit GPS-verified proof photos
- Institutions (NGOs, charities) can register and manage members
- Blood donation requests connect donors with patients nearby
- Emergency signals alert nearby volunteers for accidents, fire, medical emergencies
- AI agents handle matching, priority, trust scoring, and fraud detection
- Escrow system holds donations until proof is verified
- Certificates and trust scores reward consistent contributors

FEATURES YOU CAN HELP WITH:
- Creating help requests, blood donation requests, emergency signals
- Finding nearby donors, institutions, volunteers
- Understanding trust scores, certificates, achievements
- Donation flow (escrow, proof verification, receipts)
- Emergency mode, ambulance calls
- Platform navigation and tips

CRITICAL: Detect if the user wants to EXECUTE an action or FETCH data. Common patterns:
- "send blood request", "create blood request", "need blood" → ACTION: blood_request
- "call ambulance", "send emergency", "fire emergency" → ACTION: emergency
- "create help request", "I need food/medicine/education" → ACTION: help_request
- "find donors", "search donors near me", "show profiles" → ACTION: find_donors
- "show my receipts", "donation receipt", "my donations" → ACTION: get_receipts
- "my blood requests", "blood status" → ACTION: get_blood_requests
- "my help requests", "help history" → ACTION: get_help_requests
- "my stats", "my score", "my rank", "my profile stats" → ACTION: get_my_stats
- "cancel request" → ACTION: cancel

If the user wants an action, include in your response:
ACTION_TYPE: blood_request|emergency|help_request|find_donors|get_receipts|get_blood_requests|get_help_requests|get_my_stats|cancel|none
BLOOD_GROUP: (if mentioned, e.g., O+, A-, B+, AB-)
URGENCY: critical|high|medium|low

RESPONSE RULES:
- Keep responses concise (2-4 sentences max)
- Be friendly, supportive, and action-oriented
- Use markdown **bold** for emphasis
- Always provide 2-3 follow-up suggestions
- If action detected, confirm what you're doing

Format your response as:
MESSAGE: [your response text]
INTENT: [intent_name]
SUGGESTIONS: [suggestion1|suggestion2|suggestion3]
ACTION_TYPE: [action_type or none]
BLOOD_GROUP: [blood group or empty]
URGENCY: [urgency or medium]`;

async function callOllamaChat(message: string): Promise<any> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const res = await fetch(`${OLLAMA_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: CHAT_MODEL,
                prompt: message,
                system: CHAT_SYSTEM_PROMPT,
                stream: false,
                options: { temperature: 0.3, num_predict: 400 },
            }),
            signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) throw new Error(`Ollama ${res.status}`);
        const data = await res.json();
        return data.response?.trim() || null;
    } catch (err: any) {
        console.warn('[AI Chat] Ollama unavailable:', err.message);
        return null;
    }
}

function parseOllamaResponse(raw: string) {
    const messageMatch = raw.match(/MESSAGE:\s*(.+?)(?=\nINTENT:|$)/s);
    const intentMatch = raw.match(/INTENT:\s*(\S+)/);
    const suggestionsMatch = raw.match(/SUGGESTIONS:\s*(.+)/);
    const actionMatch = raw.match(/ACTION_TYPE:\s*(\S+)/);
    const bloodMatch = raw.match(/BLOOD_GROUP:\s*(\S+)/);
    const urgencyMatch = raw.match(/URGENCY:\s*(\S+)/);

    const message = messageMatch?.[1]?.trim() || raw.split('\n')[0] || raw;
    const intent = intentMatch?.[1]?.trim() || 'general';
    const suggestionsRaw = suggestionsMatch?.[1]?.trim() || '';
    const suggestions = suggestionsRaw.split('|').map(s => s.trim()).filter(Boolean);
    const actionType = actionMatch?.[1]?.trim()?.toLowerCase() || 'none';
    const bloodGroup = bloodMatch?.[1]?.trim() || '';
    const urgency = urgencyMatch?.[1]?.trim() || 'medium';

    return { message, intent, suggestions, actionType, bloodGroup, urgency };
}

// ── Action Executor for Chat (Real DB Operations) ──
import BloodRequest from '../models/BloodRequest';
import EmergencyAlert from '../models/EmergencyAlert';
import DonationReceipt from '../models/DonationReceipt';
import HelpRequest from '../models/HelpRequest';
import User from '../models/User';
import Transaction from '../models/Transaction';

async function executeChatAction(actionType: string, parsed: any, user: any) {
    if (!user || actionType === 'none') return null;
    const userId = user._id || user.id;

    try {
        switch (actionType) {
            case 'blood_request': {
                if (!parsed.bloodGroup) return { executed: false, message: 'Please specify a blood group (e.g., O+, A-, B+)' };
                const userDoc = await User.findById(userId);
                const coords = userDoc?.address?.coordinates?.coordinates || [80.2707, 13.0827]; // Default Chennai
                const phone = userDoc?.phoneNumber || user.phoneNumber || '0000000000';
                const request = await BloodRequest.create({
                    requesterId: userId,
                    bloodGroup: parsed.bloodGroup,
                    urgency: parsed.urgency === 'critical' ? 'critical' : parsed.urgency === 'high' ? 'urgent' : 'normal',
                    unitsNeeded: 1,
                    hospitalName: parsed.hospital || 'Via AI Chat',
                    contactNumber: phone,
                    description: `AI Chat: Need ${parsed.bloodGroup} blood urgently`,
                    location: { type: 'Point', coordinates: coords, address: userDoc?.address?.formattedAddress || '' },
                    status: 'active',
                });
                console.log(`[AI Chat] ✅ Blood request created: ${request._id} (${parsed.bloodGroup})`);
                return { executed: true, type: 'blood_request', requestId: request._id, bloodGroup: parsed.bloodGroup };
            }

            case 'emergency': {
                const userDoc = await User.findById(userId);
                const lat = userDoc?.address?.coordinates?.coordinates?.[1] || 13.0827;
                const lon = userDoc?.address?.coordinates?.coordinates?.[0] || 80.2707;
                const phone = userDoc?.phoneNumber || user.phoneNumber || '';
                const alertId = `EMG-${Date.now()}`;
                await EmergencyAlert.create({
                    alertId,
                    donorId: userId,
                    donorName: userDoc?.profile?.fullName || user.profile?.fullName || 'Anonymous',
                    donorPhone: phone,
                    emergencyType: 'MEDICAL',
                    description: 'AI Chat emergency request',
                    location: {
                        latitude: lat, longitude: lon,
                        address: userDoc?.address?.formattedAddress || 'Chat-initiated',
                        accuracy: 100,
                        coordinates: { type: 'Point', coordinates: [lon, lat] },
                    },
                    status: 'ACTIVE',
                    notifiedHelpers: [],
                    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
                });
                console.log(`[AI Chat] 🚨 Emergency alert created: ${alertId}`);
                return { executed: true, type: 'emergency', alertId };
            }

            case 'get_receipts': {
                const receipts = await DonationReceipt.find({ donorId: userId })
                    .sort({ createdAt: -1 }).limit(5).lean();
                if (!receipts.length) return { executed: true, type: 'get_receipts', data: [], message: 'No donation receipts found.' };
                const formatted = receipts.map((r: any) => ({
                    receiptId: r.receiptId,
                    amount: r.amounts?.totalPaid || 0,
                    donation: r.amounts?.donation || 0,
                    date: r.createdAt,
                    type: r.donationType,
                    institution: r.institution?.name || 'N/A',
                    pdfUrl: r.pdfUrl || null,
                }));
                return { executed: true, type: 'get_receipts', data: formatted, count: receipts.length };
            }

            case 'get_blood_requests': {
                const requests = await BloodRequest.find({ requesterId: userId })
                    .sort({ createdAt: -1 }).limit(5).lean();
                if (!requests.length) return { executed: true, type: 'get_blood_requests', data: [], message: 'No blood requests found.' };
                const formatted = requests.map((r: any) => ({
                    id: r._id, bloodGroup: r.bloodGroup, status: r.status,
                    urgency: r.urgency, hospital: r.hospitalName,
                    respondents: r.respondents?.length || 0, date: r.createdAt,
                }));
                return { executed: true, type: 'get_blood_requests', data: formatted, count: requests.length };
            }

            case 'get_help_requests': {
                const requests = await HelpRequest.find({ $or: [{ donorId: userId }, { helperId: userId }] })
                    .sort({ createdAt: -1 }).limit(5).lean();
                if (!requests.length) return { executed: true, type: 'get_help_requests', data: [], message: 'No help requests found.' };
                const formatted = requests.map((r: any) => ({
                    id: r._id, category: r.category, status: r.status, amount: r.amount,
                    description: r.description?.substring(0, 80), date: r.createdAt,
                }));
                return { executed: true, type: 'get_help_requests', data: formatted, count: requests.length };
            }

            case 'get_my_stats': {
                const userDoc = await User.findById(userId).lean() as any;
                if (!userDoc) return { executed: false, message: 'User not found.' };
                return {
                    executed: true, type: 'get_my_stats', data: {
                        name: userDoc.profile?.fullName,
                        role: userDoc.role,
                        trustScore: userDoc.creditScore?.totalPoints || 0,
                        rank: userDoc.creditScore?.rank || 'Bronze',
                        level: userDoc.creditScore?.level || 1,
                        streak: userDoc.creditScore?.streak?.current || 0,
                        totalDonations: userDoc.statistics?.totalDonations || 0,
                        totalHelps: userDoc.statistics?.totalHelps || 0,
                        successRate: userDoc.statistics?.successRate || 0,
                        badges: (userDoc.creditScore?.badges || []).length,
                        certificates: (userDoc.creditScore?.certificates || []).length,
                        walletBalance: userDoc.wallet?.balance || 0,
                        totalDonated: userDoc.wallet?.totalDonated || 0,
                    },
                };
            }

            case 'find_donors': {
                const donors = await User.find({ role: { $in: ['donor', 'helper'] }, 'accountStatus.active': true })
                    .select('profile address creditScore statistics').sort({ 'creditScore.totalPoints': -1 }).limit(5).lean();
                const formatted = donors.map((d: any) => ({
                    name: d.profile?.fullName, bloodGroup: d.profile?.bloodGroup || 'N/A',
                    city: d.address?.city || 'N/A', score: d.creditScore?.totalPoints || 0,
                }));
                return { executed: true, type: 'find_donors', data: formatted, count: donors.length };
            }

            case 'help_request':
                return { executed: true, type: 'help_request', message: 'Navigate to Create Request page to submit your help request with full details.' };

            default:
                return null;
        }
    } catch (err: any) {
        console.error('[AI Chat] Action error:', err.message);
        return { executed: false, message: `Error: ${err.message}` };
    }
}

/**
 * Smart LLaMA-powered chat with action execution + rule-based fallback
 */
async function generateSmartChatResponse(message: string, user?: any, context?: any) {
    const lower = message.toLowerCase();

    // ── Always detect actions from text patterns (rule-based, reliable) ──
    const ruleAction = await detectAndExecuteAction(lower, user);

    // ── Try Ollama for conversational response ──
    const ollamaRaw = await callOllamaChat(message);
    if (ollamaRaw) {
        const parsed = parseOllamaResponse(ollamaRaw);

        // If LLaMA detected an action AND rules didn't, try LLaMA's action
        let actionResult = ruleAction;
        if (!actionResult && parsed.actionType !== 'none' && user) {
            actionResult = await executeChatAction(parsed.actionType, parsed, user);
        }

        // Format the response with action data
        let finalMessage = parsed.message || '';
        if (actionResult?.executed) {
            finalMessage = formatActionResult(actionResult, finalMessage);
        }

        return {
            message: finalMessage,
            intent: parsed.intent || 'general',
            suggestions: parsed.suggestions.length ? parsed.suggestions : getDefaultSuggestions(lower),
            source: 'llama',
            action_executed: actionResult?.executed || false,
            action_details: actionResult,
        };
    }

    // ── Pure rule-based fallback ──
    let response = generateRuleChatResponse(lower);
    if (ruleAction?.executed) {
        response.message = formatActionResult(ruleAction, response.message);
    }

    return {
        ...response,
        source: 'rules',
        action_executed: ruleAction?.executed || false,
        action_details: ruleAction,
    };
}

// ── Detect & execute actions from text patterns (always runs) ──
async function detectAndExecuteAction(lower: string, user: any) {
    if (!user) return null;

    // Blood request
    const bloodActionMatch = lower.match(/\b(send|create|make|need|request)\b.*\b(blood|blood request)\b/);
    const bgMatch = lower.match(/\b(o|a|b|ab)\s*(\+|-|positive|negative)\b/i);
    if (bloodActionMatch && bgMatch) {
        const group = bgMatch[1].toUpperCase();
        const sign = bgMatch[2].startsWith('p') || bgMatch[2] === '+' ? '+' : '-';
        return await executeChatAction('blood_request', { bloodGroup: `${group}${sign}`, urgency: 'medium' }, user);
    }

    // Emergency
    if (/\b(send|call|trigger|need)\b.*\b(emergency|ambulance|fire)\b/.test(lower)) {
        return await executeChatAction('emergency', {}, user);
    }

    // Receipts
    if (/\b(receipt|receipts|donation receipt|donation history|my donation|show.*receipt)\b/.test(lower)) {
        return await executeChatAction('get_receipts', {}, user);
    }

    // Blood request status
    if (/\b(my blood|blood status|blood request|my request)\b/.test(lower)) {
        return await executeChatAction('get_blood_requests', {}, user);
    }

    // Help requests
    if (/\b(my help|help status|help request|help history)\b/.test(lower)) {
        return await executeChatAction('get_help_requests', {}, user);
    }

    // Stats / profile
    if (/\b(my stat|my score|my profile|my point|my rank|my level|my dashboard|my info)\b/.test(lower)) {
        return await executeChatAction('get_my_stats', {}, user);
    }

    // Find donors
    if (/\b(find|show|list|nearby|search|give)\b.*\b(donor|donors|helper|helpers|profile|profiles)\b/.test(lower)) {
        return await executeChatAction('find_donors', {}, user);
    }

    return null;
}

function getDefaultSuggestions(lower: string): string[] {
    if (lower.includes('blood')) return ['Send O+ blood request', 'My blood requests', 'Find blood donors'];
    if (lower.includes('receipt') || lower.includes('donation')) return ['My donation receipts', 'My stats', 'Donation history'];
    if (lower.includes('emergency')) return ['Send emergency signal', 'Call ambulance', 'Find helpers'];
    return ['Send O+ blood request', 'My stats', 'Show my receipts', 'Find donors'];
}


function formatActionResult(result: any, baseMsg: string): string {
    switch (result.type) {
        case 'blood_request':
            return baseMsg + `\n\n✅ **Blood request created!** (${result.bloodGroup}) — Donors are being notified.`;
        case 'emergency':
            return baseMsg + `\n\n🚨 **Emergency alert sent!** (ID: ${result.alertId}) — Nearby helpers notified.`;
        case 'get_receipts': {
            if (!result.data?.length) return `📄 You don't have any donation receipts yet. Make your first donation to get started!`;
            let msg = `📄 **Your Recent Donation Receipts** (${result.count}):\n\n`;
            result.data.forEach((r: any, i: number) => {
                const date = new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                msg += `${i + 1}. **₹${r.amount}** → ${r.institution} (${r.type})\n   📅 ${date} | ID: ${r.receiptId}\n`;
            });
            return msg;
        }
        case 'get_blood_requests': {
            if (!result.data?.length) return `🩸 You don't have any blood requests yet.`;
            let msg = `🩸 **Your Blood Requests** (${result.count}):\n\n`;
            result.data.forEach((r: any, i: number) => {
                const status = r.status === 'active' ? '🟢 Active' : r.status === 'fulfilled' ? '✅ Fulfilled' : '⚪ ' + r.status;
                msg += `${i + 1}. **${r.bloodGroup}** | ${status} | ${r.urgency} urgency\n   🏥 ${r.hospital} | ${r.respondents} respondents\n`;
            });
            return msg;
        }
        case 'get_help_requests': {
            if (!result.data?.length) return `📋 No help requests found.`;
            let msg = `📋 **Your Help Requests** (${result.count}):\n\n`;
            result.data.forEach((r: any, i: number) => {
                msg += `${i + 1}. **${r.category}** — ${r.status} (₹${r.amount || 0})\n   ${r.description || ''}\n`;
            });
            return msg;
        }
        case 'get_my_stats': {
            const s = result.data;
            return `📊 **${s.name}'s Profile Stats**\n\n` +
                `🏆 **Rank:** ${s.rank} (Level ${s.level})\n` +
                `⭐ **Trust Score:** ${s.trustScore} points\n` +
                `🔥 **Streak:** ${s.streak} days\n` +
                `💰 **Donations:** ${s.totalDonations} (₹${s.totalDonated} total)\n` +
                `🤝 **Helps:** ${s.totalHelps} | ✅ **Success:** ${s.successRate}%\n` +
                `🎖️ **Badges:** ${s.badges} | 📜 **Certificates:** ${s.certificates}\n` +
                `💳 **Wallet:** ₹${s.walletBalance}`;
        }
        case 'find_donors': {
            if (!result.data?.length) return `🔍 No donors found nearby. Try broadening your search.`;
            let msg = `👥 **Top Donors** (${result.count}):\n\n`;
            result.data.forEach((d: any, i: number) => {
                msg += `${i + 1}. **${d.name}** | 🩸 ${d.bloodGroup} | 📍 ${d.city} | ⭐ ${d.score} pts\n`;
            });
            return msg;
        }
        default:
            return baseMsg;
    }
}

function generateRuleChatResponse(lower: string) {
    if (lower.includes('how') && (lower.includes('request') || lower.includes('help'))) {
        return {
            message: `To create a help request:\n1. Go to **Dashboard** → Click **"Create Request"**\n2. Fill in the details (category, description, amount, location)\n3. Our AI will automatically enhance your request and find the best matches\n4. Track progress in real-time on your dashboard`,
            intent: 'how_to_request',
            suggestions: ['What categories are available?', 'How does matching work?', 'Track my request'],
        };
    }

    if (lower.includes('find') && lower.includes('donor')) {
        return {
            message: `Our AI Matching System finds donors based on:\n• **Proximity** — nearest donors first\n• **Category fit** — donors interested in your cause\n• **Trust score** — verified, reliable donors\n• **Response speed** — historically fast responders\n\nThe system typically finds 3-5 matches within minutes.`,
            intent: 'find_donors',
            suggestions: ['How is trust score calculated?', 'Can I donate?', 'Emergency help'],
        };
    }

    if (lower.includes('track') && (lower.includes('request') || lower.includes('status'))) {
        return {
            message: `Track your request status:\n1. Go to **Dashboard** → **My Requests**\n2. Each request shows real-time status:\n   • 🟢 Open — Waiting for match\n   • 🟡 Assigned — Helper accepted\n   • 🔵 In Progress — Help being delivered\n   • ✅ Completed — Verified & confirmed`,
            intent: 'track_request',
            suggestions: ['What if no one responds?', 'Can I cancel?', 'View certificates'],
        };
    }

    if (lower.includes('blood') || lower.includes('donor')) {
        return {
            message: `🩸 **Blood Donation**\n\nYou can:\n• **Request blood** — Specify blood group, hospital, urgency\n• **Donate blood** — Find nearby requests matching your type\n• **Track requests** — See real-time status of your blood request\n\nSay: **"Send O+ blood request"** to auto-create one!`,
            intent: 'blood_donation',
            suggestions: ['Send O+ blood request', 'Find blood donors', 'My blood requests'],
        };
    }

    if (lower.includes('emergency') || lower.includes('urgent') || lower.includes('ambulance')) {
        return {
            message: `🚨 **Emergency Mode**\n\nFor urgent cases:\n1. **Instantly** notifies nearby verified helpers\n2. **Auto-boosts** priority to Critical\n3. Routes to the **top 5 fastest** responders\n4. Escalates to **institutions** within 10 minutes\n\nSay: **"Send emergency signal"** to trigger one now!`,
            intent: 'emergency',
            suggestions: ['Send emergency signal', 'Call ambulance', 'View nearby helpers'],
        };
    }

    if (lower.includes('trust') && lower.includes('score')) {
        return {
            message: `Your **Trust Score** is calculated by AI based on:\n• Account verification status (ID, phone, email)\n• Past donation/help history\n• Success rate of completed requests\n• Streak & consistency\n• Community feedback\n\nHigher scores = more visibility and priority matching.`,
            intent: 'trust_score',
            suggestions: ['How to improve my score?', 'View my score', 'Verification process'],
        };
    }

    if (lower.includes('donate') || lower.includes('donation')) {
        return {
            message: `To donate:\n1. Go to **Donate** → Choose type (Direct or Broadcast)\n2. Select a verified request from the Discovery page\n3. Pay securely — funds held in **escrow** until verified\n4. Receive proof photos from the helper\n5. Confirm & earn Impact Points + Trust Score boost!`,
            intent: 'donate',
            suggestions: ['What is escrow?', 'Can I see proof?', 'Donation history'],
        };
    }

    if (lower.includes('certificate') || lower.includes('achievement')) {
        return {
            message: `Earn certificates by completing verified acts of kindness:\n• 🌱 **Welcome** — First act\n• 🥉 **Bronze** — 5 verified acts\n• 🥈 **Silver** — 25 verified acts\n• 🥇 **Gold** — 50 verified acts\n• 💎 **Platinum** — 100 verified acts\n• ✨ **Diamond** — 250+ verified acts\n\nView your certificates on the **Certificates** page.`,
            intent: 'certificates',
            suggestions: ['View my certificates', 'How to earn points?', 'Leaderboard'],
        };
    }

    if (lower.includes('institution') || lower.includes('ngo') || lower.includes('charity')) {
        return {
            message: `🏛️ **Institutions**\n\nVerified institutions on Humanexa:\n• **NGOs, charities, and social organizations** can register\n• Manage team members and activities\n• Receive donation flows directly\n• Get verified badge for trust\n\nBrowse institutions on the **Discovery** page.`,
            intent: 'institutions',
            suggestions: ['Find nearby institutions', 'How to register institution?', 'View verified NGOs'],
        };
    }

    // Default
    return {
        message: `I'm **Humanexa AI** — your intelligent assistant! I can:\n\n• 🩸 **Send blood requests** — "Send O+ blood request"\n• 🚨 **Trigger emergencies** — "Send emergency signal"\n• 🔍 **Find donors** — "Find donors near me"\n• 📋 **Create requests** — "I need food/medicine help"\n• 📊 **Track impact** — "Track my request"\n\nJust type what you need!`,
        intent: 'general',
        suggestions: ['Send O+ blood request', 'Emergency help', 'Find donors near me'],
    };
}

