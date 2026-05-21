/**
 * AI Routes — All AI agent endpoints
 */
import { Router, Request, Response } from 'express';
import { aiController } from '../controllers/aiController';
import { protect } from '../middleware/auth';
import User from '../models/User';

const router = Router();

// Full AI pipeline
router.post('/process', aiController.processRequest);

// Quick text analysis
router.post('/analyze', aiController.analyzeDescription);

// Priority & emotion detection
router.post('/priority', aiController.detectPriority);

// Trust score
router.get('/trust-score/:userId', aiController.getTrustScore);

// Matching
router.post('/match', aiController.findMatches);

// Prediction
router.post('/predict', aiController.predict);

// Story generation
router.post('/story', aiController.generateStory);

// Chat assistant
router.post('/chat', aiController.chat);

// AI Dashboard insights
router.get('/insights', aiController.getInsights);

// ── Profiles Discovery (Instagram-style) ──
router.get('/profiles', protect, async (req: Request, res: Response) => {
    try {
        const { search, bloodGroup, role, city, lat, lng, limit = '20', page = '1' } = req.query;
        const query: any = { 'accountStatus.active': true };

        // Role filter (default: donor + helper)
        if (role && role !== 'all') {
            query.role = role;
        } else {
            query.role = { $in: ['donor', 'helper'] };
        }

        // Search by name
        if (search) {
            query['profile.fullName'] = { $regex: search, $options: 'i' };
        }

        // Blood group filter
        if (bloodGroup) {
            query['profile.bloodGroup'] = bloodGroup;
        }

        // City filter
        if (city) {
            query['address.city'] = { $regex: city, $options: 'i' };
        }

        const pageNum = parseInt(page as string) || 1;
        const limitNum = Math.min(parseInt(limit as string) || 20, 50);
        const skip = (pageNum - 1) * limitNum;

        const [profiles, total] = await Promise.all([
            User.find(query)
                .select('profile address role creditScore statistics verificationStatus governmentId.verified')
                .sort({ 'creditScore.totalPoints': -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            User.countDocuments(query),
        ]);

        // Calculate distance if lat/lng provided
        const userLat = parseFloat(lat as string);
        const userLng = parseFloat(lng as string);

        const enriched = profiles.map((p: any) => {
            let distance = null;
            if (!isNaN(userLat) && !isNaN(userLng) && p.address?.coordinates?.coordinates) {
                const [pLng, pLat] = p.address.coordinates.coordinates;
                if (pLat && pLng) {
                    const R = 6371;
                    const dLat = (pLat - userLat) * Math.PI / 180;
                    const dLng = (pLng - userLng) * Math.PI / 180;
                    const a = Math.sin(dLat/2)**2 + Math.cos(userLat*Math.PI/180) * Math.cos(pLat*Math.PI/180) * Math.sin(dLng/2)**2;
                    distance = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
                }
            }
            return {
                _id: p._id,
                fullName: p.profile?.fullName || 'Anonymous',
                avatar: p.profile?.avatar || null,
                bio: p.profile?.bio || '',
                bloodGroup: p.profile?.bloodGroup || '',
                gender: p.profile?.gender || '',
                role: p.role,
                city: p.address?.city || '',
                state: p.address?.state || '',
                address: p.address?.formattedAddress || [p.address?.city, p.address?.state].filter(Boolean).join(', ') || 'Not set',
                trustScore: p.creditScore?.totalPoints || 0,
                rank: p.creditScore?.rank || 'Bronze',
                level: p.creditScore?.level || 1,
                streak: { current: p.creditScore?.streak?.current || 0, longest: p.creditScore?.streak?.longest || 0 },
                totalDonations: p.statistics?.totalDonations || 0,
                totalHelps: p.statistics?.totalHelps || 0,
                successRate: p.statistics?.successRate || 0,
                verified: p.governmentId?.verified || false,
                badges: (p.creditScore?.badges || []).slice(0, 6),
                certificates: (p.creditScore?.certificates || []).slice(0, 5),
                distance,
            };
        });

        // Sort by distance if available
        if (!isNaN(userLat) && !isNaN(userLng)) {
            enriched.sort((a: any, b: any) => (a.distance || 9999) - (b.distance || 9999));
        }

        res.json({
            status: 'success',
            data: {
                profiles: enriched,
                total,
                page: pageNum,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

export default router;

