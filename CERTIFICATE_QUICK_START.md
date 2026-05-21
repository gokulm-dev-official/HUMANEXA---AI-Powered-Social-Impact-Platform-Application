# 🚀 QUICK START GUIDE - Premium Certificates

## Get Started in 3 Minutes

### 1. Import the Component (30 seconds)

**Option A - Import from index**:
```tsx
import { PremiumCertificate } from '@/components/certificates';
```

**Option B - Direct import**:
```tsx
import { PremiumCertificate } from '@/components/certificates/PremiumCertificate';
```

---

### 2. Use in Your Page (2 minutes)

#### Minimal Example:
```tsx
<PremiumCertificate
  tier="welcome"
  recipientName="Priya Menon"
  date="February 2, 2026"
  metrics={{
    activities: 1,
    points: 150,
  }}
/>
```

#### Complete Example:
```tsx
<PremiumCertificate
  tier="gold"
  recipientName="Vikram Malhotra"
  date="February 2, 2026"
  metrics={{
    // Welcome tier needs:
    activities: 50,
    points: 2500,
    livesImpacted: 412,
    location: 'Mumbai, Maharashtra',
    firstAct: 'Food Distribution to 12 families',
    communityMember: '12,847',
    
    // Gold tier also needs:
    territories: '15 cities across 6 states',
    categories: 'Food, Medicine, Shelter, Education',
    trustScore: '994/1000',
    activeDays: 134,
    ranking: 'Top 2% (Elite Tier)',
    verificationSuccess: '99.2%',
  }}
  isLocked={false}
/>
```

---

### 3. Test It (30 seconds)

1. **View**: Click the certificate card
2. **Download**: Click "Download PDF" button
3. **Share**: Click "Share" button
4. **Verify**: Scan the QR code

---

## Real-World Integration

### Replace Old TieredCertificate

**Before** (old component):
```tsx
<TieredCertificate
  tier="gold"
  recipientName={userName}
  date={date}
  activitySummary="50 acts completed"
  metrics={metrics}
/>
```

**After** (new premium component):
```tsx
<PremiumCertificate
  tier="gold"
  recipientName={userName}
  date={date}
  metrics={{
    activities: 50,
    points: 2500,
    livesImpacted: 412,
    territories: '15 cities across 6 states',
    categories: 'Food, Medicine, Shelter, Education',
    trustScore: '994/1000',
    activeDays: 134,
    ranking: 'Top 2% (Elite Tier)',
    verificationSuccess: '99.2%',
  }}
  isLocked={totalActs < 50}
/>
```

---

## Available Tiers

| Tier | Acts | Status | Use Like This |
|------|------|--------|---------------|
| **welcome** | 1+ | ✅ Ready | `tier="welcome"` |
| **bronze** | 5+ | 🚧 TODO | `tier="bronze"` |
| **silver** | 25+ | 🚧 TODO | `tier="silver"` |
| **gold** | 50+ | ✅ Ready | `tier="gold"` |
| **platinum** | 100+ | 🚧 TODO | `tier="platinum"` |
| **diamond** | 250+ | 🚧 TODO | `tier="diamond"` |

---

## Automatic Features

The component automatically handles:

✅ **QR Code Generation** - No setup needed  
✅ **PDF Export** - 300 DPI, A4 format  
✅ **Certificate ID** - Unique, formatted  
✅ **Blockchain Hash** - Mock for now  
✅ **Modal Preview** - Fullscreen view  
✅ **Share Functionality** - Native + fallback  
✅ **Locked States** - Gray + lock icon  
✅ **Responsive Design** - Mobile-friendly  

---

## Common Patterns

### Dynamic Tier Based on Acts
```tsx
import { getTierByActs } from '@/constants/certificateDesign';

const currentTier = getTierByActs(user.totalActs);

<PremiumCertificate
  tier={currentTier.toLowerCase()}
  // ...
/>
```

### Certificate Gallery
```tsx
const certificates = ['welcome', 'bronze', 'silver', 'gold', 'platinum', 'diamond'];

<div className="grid grid-cols-3 gap-8">
  {certificates.map(tier => (
    <PremiumCertificate
      key={tier}
      tier={tier}
      recipientName={userName}
      date={new Date().toLocaleDateString()}
      metrics={getMetricsForTier(tier)}
      isLocked={!hasUnlocked(tier)}
    />
  ))}
</div>
```

### Single Certificate Page
```tsx
export default function CertificatePage() {
  const { user } = useAuth();
  const tier = getTierByActs(user.acts);
  
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <PremiumCertificate
        tier={tier}
        recipientName={user.name}
        date={new Date().toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })}
        metrics={getUserMetrics(user)}
      />
    </div>
  );
}
```

---

## Troubleshooting

### "Cannot find module '@/components/certificates'"
**Solution**: Check your import path. Use relative path instead:
```tsx
import { PremiumCertificate } from '../components/certificates';
```

### QR Code not showing
**Solution**: Ensure `qrcode` package is installed:
```bash
npm install qrcode @types/qrcode
```

### PDF download not working
**Solution**: Check browser console. Ensure `html2canvas` and `jspdf` are installed:
```bash
npm install html2canvas jspdf
```

### Certificate appears tiny/huge
**Solution**: The component uses absolute positioning. Wrap it in a container:
```tsx
<div style={{ width: '300px' }}>
  <PremiumCertificate {...props} />
</div>
```

### Colors don't match specification
**Solution**: The component uses exact HEX values from PANTONE. For printing, use the CMYK values in the design constants file.

---

## Performance Tips

### 1. Lazy Load
```tsx
const PremiumCertificate = lazy(() => import('@/components/certificates'));

<Suspense fallback={<LoadingSpinner />}>
  <PremiumCertificate {...props} />
</Suspense>
```

### 2. Memoize Props
```tsx
const metrics = useMemo(() => ({
  activities: user.acts,
  points: user.points,
  // ...
}), [user.acts, user.points]);

<PremiumCertificate metrics={metrics} {...otherProps} />
```

### 3. Conditional Rendering
```tsx
{hasUnlocked(tier) && (
  <PremiumCertificate tier={tier} {...props} />
)}
```

---

## Next Steps

1. ✅ **Test with real data**: Replace mock metrics with actual user data
2. ✅ **Integrate into pages**: Add to CertificatesPage, ProfilePage, etc.
3. 🚧 **Implement remaining tiers**: Bronze, Silver, Platinum, Diamond
4. 🚧 **Backend integration**: Connect to certificate generation API
5. 🚧 **Email delivery**: Auto-send PDFs to users
6. 🚧 **Print testing**: Verify on actual paper stock

---

## Need Help?

📖 **Full Documentation**: `frontend/src/components/certificates/README.md`  
🎨 **Visual Guide**: `CERTIFICATE_VISUAL_GUIDE.md`  
📋 **Implementation Summary**: `CERTIFICATE_IMPLEMENTATION_SUMMARY.md`  
💡 **Example Integration**: `frontend/src/examples/CertificateIntegration.example.tsx`  
🔧 **Design Constants**: `frontend/src/constants/certificateDesign.ts`  

---

## Quick Commands

```bash
# Install dependencies
npm install qrcode @types/qrcode html2canvas jspdf

# Run development server
npm run dev

# Build for production
npm run build

# View in browser
http://localhost:3000/certificates
```

---

**You're ready to create museum-quality certificates!** 🎉

💎 **Welcome & Gold tiers are production-ready**  
✨ **4 more tiers coming soon**  
🚀 **Start using it today!**

