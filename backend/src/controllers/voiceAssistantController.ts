/**
 * ═══════════════════════════════════════════════════════════════════
 * 🎤 HUMANEXA AI VOICE ASSISTANT CONTROLLER
 * Uses Ollama (LLaMA 3.2 3B) for multilingual intent classification
 * with rule-based fallback for reliability
 * ═══════════════════════════════════════════════════════════════════
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import BloodRequest from '../models/BloodRequest';
import EmergencyAlert from '../models/EmergencyAlert';
import HelperLocation from '../models/HelperLocation';
import User from '../models/User';
import NotificationService from '../services/notificationService';
import { getIo } from '../socket';

// ── Ollama Integration ──
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';

const SYSTEM_PROMPT = `You are Humanexa AI Voice Assistant - an intelligent multilingual emergency response system.

Your mission: Understand user voice input, detect emergency intent, extract entities, classify priority, and respond in the user's language.

SUPPORTED LANGUAGES: Tamil (தமிழ்), English, Tanglish (Tamil in English script)
- If input contains Tamil Unicode (அ-ஹ) → language: "ta"
- If Tanglish → language: "ta", respond in Tamil
- If English → language: "en"

INTENTS: call_ambulance, blood_request, accident_report, fire_emergency, heart_attack, breathing_problem, unconscious_patient, find_nearby_donor, hospital_search, medicine_request, oxygen_request, doctor_consultation, send_help_request, contact_volunteer, register_emergency, send_location, cancel_request, women_safety_alert, elder_help_request, food_request, disaster_support, mental_health_support, unknown

PRIORITY: critical (life-threatening), high (urgent medical), medium (standard help), low (informational)

ENTITIES TO EXTRACT: blood_group (O+, A-, B+, AB-, etc.), location, hospital_name, phone_number, patient_name, emergency_type

OUTPUT: Pure JSON only. No markdown, no explanation.
{
  "language": "ta|en",
  "intent": "intent_name",
  "priority": "critical|high|medium|low",
  "blood_group": "",
  "location": "",
  "hospital_name": "",
  "phone_number": "",
  "patient_name": "",
  "emergency_type": "",
  "response_text": "Max 15 words, in user's language, supportive and action-oriented",
  "action_required": true,
  "extracted_entities": {
    "mentioned_items": [],
    "time_sensitivity": "",
    "additional_notes": ""
  }
}`;

// ── Ollama Call ──
async function callOllama(userText: string): Promise<any> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);

        const res = await fetch(`${OLLAMA_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: MODEL,
                prompt: userText,
                system: SYSTEM_PROMPT,
                stream: false,
                options: { temperature: 0.1, num_predict: 512 },
            }),
            signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) throw new Error(`Ollama returned ${res.status}`);
        const data = await res.json();
        const raw = data.response?.trim() || '';

        // Extract JSON from response
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON in Ollama response');
        return JSON.parse(jsonMatch[0]);
    } catch (err: any) {
        console.warn('[Voice AI] Ollama failed, using rule-based fallback:', err.message);
        return null;
    }
}

// ── Rule-Based Fallback ──
function ruleBasedClassify(text: string): any {
    const lower = text.toLowerCase();
    const hasTamil = /[\u0B80-\u0BFF]/.test(text);
    const language = hasTamil ? 'ta' : 'en';

    // Blood group extraction
    const bgMatch = lower.match(/\b(o|a|b|ab)\s*(\+|-|positive|negative|pos|neg)\b/i);
    let blood_group = '';
    if (bgMatch) {
        const group = bgMatch[1].toUpperCase();
        const sign = bgMatch[2].startsWith('p') || bgMatch[2] === '+' ? '+' : '-';
        blood_group = `${group}${sign}`;
    }

    // Phone extraction
    const phoneMatch = text.match(/\b(\d{10})\b/) || text.match(/\+91\s*(\d{10})\b/);
    const phone_number = phoneMatch ? phoneMatch[1] : '';

    // Location extraction
    let location = '';
    const locationPatterns = [
        /(?:near|at|in|opposite|beside)\s+(.+?)(?:\.|,|$)/i,
        /(?:location|address|place)\s*[:=]?\s*(.+?)(?:\.|,|$)/i,
    ];
    for (const p of locationPatterns) {
        const m = text.match(p);
        if (m) { location = m[1].trim(); break; }
    }

    // Hospital extraction
    let hospital_name = '';
    const hospMatch = text.match(/([\w\s]+(?:hospital|medical|clinic|nursing home|ஆஸ்பத்திரி|மருத்துவமனை))/i);
    if (hospMatch) hospital_name = hospMatch[1].trim();

    // Patient name
    let patient_name = '';
    const nameMatch = text.match(/(?:for|patient|name)\s+(\w+)/i);
    if (nameMatch) patient_name = nameMatch[1];

    // Intent + Priority
    let intent = 'unknown';
    let priority = 'low';
    let emergency_type = '';
    let response_text = '';

    // CRITICAL
    if (/ambulance|அம்புலன்ஸ்|ஆம்புலன்ஸ்|108/i.test(lower)) {
        intent = 'call_ambulance'; priority = 'critical'; emergency_type = 'medical';
        response_text = language === 'ta' ? 'அம்புலன்ஸ் அழைக்கப்படுகிறது. அமைதியாக இருங்கள்.' : 'Ambulance being dispatched. Stay calm.';
    } else if (/accident|crash|collision|விபத்து|விழுந்து/i.test(lower)) {
        intent = 'accident_report'; priority = 'critical'; emergency_type = 'accident';
        response_text = language === 'ta' ? 'அவசர உதவி அனுப்பப்படுகிறது. அமைதியாக இருங்கள்.' : 'Emergency help dispatched. Stay calm.';
    } else if (/fire|burning|smoke|flames|தீ|நெருப்பு|எரி/i.test(lower)) {
        intent = 'fire_emergency'; priority = 'critical'; emergency_type = 'fire';
        response_text = language === 'ta' ? 'தீயணைப்புத் துறை தொடர்பு கொள்ளப்படுகிறது.' : 'Fire department being contacted. Move to safety.';
    } else if (/heart attack|chest pain|cardiac|மார்பு வலி|இதய/i.test(lower)) {
        intent = 'heart_attack'; priority = 'critical'; emergency_type = 'cardiac emergency';
        response_text = language === 'ta' ? 'இதய அவசர உதவி அனுப்பப்படுகிறது.' : 'Cardiac emergency alert sent. Help coming.';
    } else if (/can'?t breathe|suffocating|oxygen|breathing|மூச்சு|ஆக்ஸிஜன்|சுவாசம்/i.test(lower)) {
        intent = 'breathing_problem'; priority = 'critical'; emergency_type = 'breathing emergency';
        response_text = language === 'ta' ? 'அவசர ஆக்ஸிஜன் உதவி அனுப்பப்படுகிறது.' : 'Emergency oxygen help dispatched.';
    } else if (/unconscious|fainted|collapsed|not responding|மயக்கம்|சுய நினைவு/i.test(lower)) {
        intent = 'unconscious_patient'; priority = 'critical'; emergency_type = 'medical';
        response_text = language === 'ta' ? 'அவசர மருத்துவ உதவி அனுப்பப்படுகிறது.' : 'Medical emergency help dispatched.';
    } else if (/women.*safety|follow|harass|unsafe|பெண்கள் பாதுகாப்பு|துன்புறுத்தல்/i.test(lower)) {
        intent = 'women_safety_alert'; priority = 'critical'; emergency_type = 'women safety emergency';
        response_text = language === 'ta' ? 'காவல்துறை தொடர்பு கொள்ளப்படுகிறது. பாதுகாப்பான இடத்தில் இருங்கள்.' : 'Police being contacted. Stay in public area.';
    }
    // HIGH
    else if (/blood|இரத்தம்|ரத்தம்|blood group|blood request/i.test(lower)) {
        intent = 'blood_request'; priority = blood_group ? 'high' : 'medium'; emergency_type = 'blood emergency';
        response_text = language === 'ta'
            ? `இரத்த கோரிக்கை பதிவானது.${blood_group ? ` ${blood_group} நன்கொடையாளர்கள் தேடப்படுகின்றனர்.` : ''}`
            : `Blood request registered.${blood_group ? ` Searching ${blood_group} donors.` : ''}`;
    } else if (/oxygen.*cylinder|ஆக்ஸிஜன்.*சிலிண்டர்/i.test(lower)) {
        intent = 'oxygen_request'; priority = 'high'; emergency_type = 'oxygen emergency';
        response_text = language === 'ta' ? 'ஆக்ஸிஜன் கோரிக்கை பதிவானது.' : 'Oxygen request registered.';
    }
    // MEDIUM
    else if (/donor|நன்கொடையாளர்|டோனர்|find.*donor/i.test(lower)) {
        intent = 'find_nearby_donor'; priority = 'medium'; emergency_type = 'donor search';
        response_text = language === 'ta' ? 'அருகிலுள்ள நன்கொடையாளர்கள் தேடப்படுகின்றனர்.' : 'Finding nearby donors for you.';
    } else if (/hospital|clinic|மருத்துவமனை|ஆஸ்பத்திரி/i.test(lower)) {
        intent = 'hospital_search'; priority = 'medium'; emergency_type = 'hospital search';
        response_text = language === 'ta' ? 'அருகிலுள்ள மருத்துவமனைகள் தேடப்படுகின்றன.' : 'Searching nearby hospitals.';
    } else if (/doctor|மருத்துவர்|டாக்டர்/i.test(lower)) {
        intent = 'doctor_consultation'; priority = 'medium'; emergency_type = 'doctor consultation';
        response_text = language === 'ta' ? 'மருத்துவ ஆலோசனை ஏற்பாடு செய்யப்படுகிறது.' : 'Doctor consultation being arranged.';
    } else if (/medicine|tablets|pharmacy|மருந்து|மாத்திரை/i.test(lower)) {
        intent = 'medicine_request'; priority = 'medium'; emergency_type = 'medicine request';
        response_text = language === 'ta' ? 'மருந்து கோரிக்கை பதிவானது.' : 'Medicine request registered.';
    } else if (/help|உதவி|support|assistance/i.test(lower)) {
        intent = 'send_help_request'; priority = 'medium'; emergency_type = 'general help';
        response_text = language === 'ta' ? 'உங்கள் உதவி கோரிக்கை அனுப்பப்பட்டுள்ளது.' : 'Help request sent successfully.';
    } else if (/food|hungry|உணவு|பசி|சாப்பாடு/i.test(lower)) {
        intent = 'food_request'; priority = 'medium'; emergency_type = 'food request';
        response_text = language === 'ta' ? 'உணவு கோரிக்கை பதிவானது.' : 'Food request registered.';
    } else if (/cancel|stop|ரத்து|வேண்டாம்|நிறுத்து/i.test(lower)) {
        intent = 'cancel_request'; priority = 'low'; emergency_type = '';
        response_text = language === 'ta' ? 'உங்கள் கோரிக்கை ரத்து செய்யப்பட்டுள்ளது.' : 'Request cancelled.';
    } else if (/emergency|அவசரம்|urgent|உடனடி/i.test(lower)) {
        intent = 'register_emergency'; priority = 'high'; emergency_type = 'general emergency';
        response_text = language === 'ta' ? 'அவசர கோரிக்கை பதிவு செய்யப்பட்டது. உதவி வருகிறது.' : 'Emergency registered. Help is on the way.';
    } else if (/flood|earthquake|cyclone|வெள்ளம்|புயல்|பேரிடர்/i.test(lower)) {
        intent = 'disaster_support'; priority = 'critical'; emergency_type = 'natural disaster';
        response_text = language === 'ta' ? 'பேரிடர் உதவி அனுப்பப்படுகிறது.' : 'Disaster support dispatched.';
    } else if (/depression|suicide|mental health|மன உளைச்சல்|தற்கொலை/i.test(lower)) {
        intent = 'mental_health_support'; priority = 'high'; emergency_type = 'mental health';
        response_text = language === 'ta' ? 'மனநல ஆதரவு வரிசையில் இணைக்கப்படுகிறது.' : 'Connecting you to mental health support.';
    } else {
        intent = 'unknown'; priority = 'low';
        response_text = language === 'ta' ? 'தயவுசெய்து உங்கள் கோரிக்கையை தெளிவாக கூறுங்கள்.' : 'Please state your request clearly.';
    }

    // Priority elevation
    if (/urgent|immediately|dying|death|உடனடி|இறக்கிறார்/i.test(lower)) {
        if (priority === 'medium') priority = 'high';
        if (priority === 'low') priority = 'medium';
    }

    return {
        language,
        intent,
        priority,
        blood_group,
        location,
        hospital_name,
        phone_number,
        patient_name,
        emergency_type,
        response_text,
        action_required: intent !== 'unknown' && intent !== 'cancel_request',
        extracted_entities: {
            mentioned_items: [],
            time_sensitivity: /immediate|urgent|உடனடி/i.test(lower) ? 'immediate' : '',
            additional_notes: '',
        },
    };
}

// ── Action Executor ──
async function executeAction(parsed: any, user: any) {
    const results: any = { action: parsed.intent, executed: false, details: {} };

    try {
        switch (parsed.intent) {
            case 'blood_request': {
                if (!parsed.blood_group) {
                    results.details = { message: 'Blood group needed. Please specify blood type.' };
                    break;
                }
                // Get user location
                const userDoc = await User.findById(user._id);
                const coords = userDoc?.address?.coordinates?.coordinates || [0, 0];

                const request = await BloodRequest.create({
                    requesterId: user._id,
                    bloodGroup: parsed.blood_group,
                    urgency: parsed.priority === 'critical' ? 'critical' : parsed.priority === 'high' ? 'urgent' : 'normal',
                    unitsNeeded: 1,
                    hospitalName: parsed.hospital_name || 'Not specified',
                    contactNumber: parsed.phone_number || user.phoneNumber || '',
                    description: `Voice request: ${parsed.emergency_type}`,
                    location: { type: 'Point', coordinates: coords, address: parsed.location || '' },
                    status: 'active',
                });
                results.executed = true;
                results.details = { requestId: request._id, bloodGroup: parsed.blood_group };
                break;
            }

            case 'call_ambulance':
            case 'accident_report':
            case 'fire_emergency':
            case 'heart_attack':
            case 'breathing_problem':
            case 'unconscious_patient':
            case 'women_safety_alert':
            case 'disaster_support': {
                // Create emergency alert
                const userDoc = await User.findById(user._id);
                const lat = userDoc?.address?.coordinates?.coordinates?.[1] || 0;
                const lon = userDoc?.address?.coordinates?.coordinates?.[0] || 0;

                const typeMap: Record<string, string> = {
                    call_ambulance: 'MEDICAL', accident_report: 'ACCIDENT',
                    fire_emergency: 'FIRE', heart_attack: 'MEDICAL',
                    breathing_problem: 'MEDICAL', unconscious_patient: 'MEDICAL',
                    women_safety_alert: 'PERSON_IN_DISTRESS', disaster_support: 'OTHER',
                };

                const alertId = `EMG-${Date.now()}`;
                const alert = await EmergencyAlert.create({
                    alertId,
                    donorId: user._id,
                    donorName: user.profile?.fullName || 'Anonymous',
                    donorPhone: user.phoneNumber || '',
                    emergencyType: typeMap[parsed.intent] || 'OTHER',
                    description: parsed.extracted_entities?.additional_notes || `Voice: ${parsed.emergency_type}`,
                    location: {
                        latitude: lat, longitude: lon,
                        address: parsed.location || 'Voice-detected location',
                        accuracy: 100,
                        coordinates: { type: 'Point', coordinates: [lon, lat] },
                    },
                    status: 'ACTIVE',
                    notifiedHelpers: [],
                    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
                });

                // Notify nearby helpers
                const helpers = await HelperLocation.find({ isAvailable: true }).limit(10);
                const io = getIo();
                for (const h of helpers) {
                    if (io) io.to(h.helperId.toString()).emit('emergency-alert', {
                        alertId: alert._id, emergencyType: typeMap[parsed.intent],
                        location: { latitude: lat, longitude: lon },
                    });
                }

                results.executed = true;
                results.details = { alertId, emergencyType: typeMap[parsed.intent], notifiedHelpers: helpers.length };
                break;
            }

            case 'send_help_request':
            case 'food_request':
            case 'medicine_request':
            case 'oxygen_request': {
                results.executed = true;
                results.details = { message: 'Request registered. Volunteers will be notified.' };
                break;
            }

            case 'find_nearby_donor':
            case 'hospital_search':
            case 'doctor_consultation':
            case 'contact_volunteer': {
                results.executed = true;
                results.details = { message: 'Search initiated. Results will be shown.' };
                break;
            }

            case 'cancel_request': {
                results.executed = true;
                results.details = { message: 'Request cancellation processed.' };
                break;
            }

            default: {
                results.details = { message: 'Intent unclear. Please try again.' };
            }
        }
    } catch (err: any) {
        console.error('[Voice AI] Action execution error:', err);
        results.error = err.message;
    }

    return results;
}

// ── Main Controller ──
export const processVoiceCommand = async (req: AuthRequest, res: Response) => {
    try {
        const { text, location } = req.body;
        if (!text || text.trim().length < 2) {
            return res.status(400).json({ status: 'fail', message: 'Voice text is required.' });
        }

        console.log(`[Voice AI] Processing: "${text}" from ${req.user?.profile?.fullName}`);

        // Try Ollama first, fallback to rule-based
        let parsed = await callOllama(text);
        const source = parsed ? 'ollama' : 'rules';
        if (!parsed) parsed = ruleBasedClassify(text);

        // Enrich with user location if provided
        if (location?.latitude && !parsed.location) {
            parsed.location = `${location.latitude}, ${location.longitude}`;
        }

        // Execute the action
        const actionResult = await executeAction(parsed, req.user);

        console.log(`[Voice AI] Result: intent=${parsed.intent}, priority=${parsed.priority}, source=${source}, executed=${actionResult.executed}`);

        res.status(200).json({
            status: 'success',
            data: {
                ...parsed,
                source,
                actionResult,
            },
        });
    } catch (err: any) {
        console.error('[Voice AI] Controller error:', err);
        res.status(500).json({ status: 'error', message: err.message || 'Voice processing failed.' });
    }
};
