# 💎 QUICK REFERENCE CARD

**Ultra-Premium Certificate System - At a Glance**

---

## 🎯 ONE-PAGE SUMMARY

### Import & Use
```tsx
import { PremiumCertificate } from '@/components/certificates';

<PremiumCertificate
  tier="welcome"              // welcome | bronze | silver | gold | platinum | diamond
  recipientName="John Doe"
  date="February 3, 2026"
  metrics={{...}}             // See metrics below
  isLocked={false}
/>
```

---

## 📊 TIER QUICK REFERENCE

| Tier | Acts | Rank | Colors | Icon | Code |
|------|------|------|--------|------|------|
| **Welcome** | 1+ | New | Blue+Green | 🌱 | `tier="welcome"` |
| **Bronze** | 5+ | Rising | Bronze+Gold | 🏆 | `tier="bronze"` |
| **Silver** | 25+ | Top 10% | Silver+Gray | 🥈 | `tier="silver"` |
| **Gold** | 50+ | Top 2% | 4 Golds | 👑 | `tier="gold"` |
| **Platinum** | 100+ | Top 1% | Platinum+Blue | 👑✨ | `tier="platinum"` |
| **Diamond** | 250+ | #1 | Rainbow | 💎 | `tier="diamond"` |

---

## 📝 METRICS TEMPLATES

### Welcome (Minimal - 5 fields)
```tsx
{
  activities: 1,
  points: 150,
  livesImpacted: 12,
  location: 'Mumbai, Maharashtra',
  firstAct: 'Food Distribution'
}
```

### Bronze (Basic - 6 fields)
```tsx
{
  activities: 5,
  points: 250,
  livesImpacted: 15,
  location: 'India',
  categories: 'Food, Education',
  consecutiveDays: 12
}
```

### Silver (Standard - 8 fields)
```tsx
{
  activities: 25,
  points: 1250,
  livesImpacted: 125,
  territories: '8 cities, 3 states',
  categories: 'Food, Health, Education',
  trustScore: '972/1000',
  activeDays: 67,
  ranking: 'Top 10%'
}
```

### Gold (Enhanced - 8 fields)
```tsx
{
  activities: 50,
  points: 2500,
  livesImpacted: 412,
  territories: '15 cities, 6 states',
  categories: 'Food, Medicine, Shelter, Education',
  trustScore: '994/1000',
  activeDays: 134,
  ranking: 'Top 2%'
}
```

### Platinum (Premium - 12 fields)
```tsx
{
  activities: 100,
  points: 5000,
  livesImpacted: 850,
  territories: '25 cities, 12 states',
  categories: 'All Major Sectors',
  trustScore: '998/1000',
  activeDays: 287,
  globalRank: 'Top 1%',
  impactScore: '9.8/10',
  verificationRate: '99.8%',
  innovationIndex: '95/100',
  ranking: 'Top 0.5%'
}
```

### Diamond (Ultimate - 14 fields)
```tsx
{
  activities: 250,
  points: 12500,
  livesImpacted: 2500,
  continents: '6 of 7',
  countries: '42 nations',
  categories: 'All Humanitarian',
  trustScore: '1000/1000',
  activeDays: 687,
  globalRank: '#1',
  impactScore: '10/10',
  verificationRate: '100%',
  innovationIndex: '100/100',
  legacyProjects: '12 global',
  awardsReceived: '25+'
}
```

---

## 🎨 COLOR CODES (PANTONE → HEX)

```
Welcome:  #0072CE (Blue) + #00B140 (Green)
Bronze:   #A77C52 (Bronze) + #E3A830 (Gold Bronze)
Silver:   #B3BCBF (Silver) + #7C878E (Cool Gray)
Gold:     #D4AF37 + #FFB81C + #A77C52 + #FFD700 (4 golds)
Platinum: #C0C0C0 (Platinum) + #0072CE (Royal Blue)
Diamond:  Rainbow (#FF0080, #FF8C00, #FFD700, #00FF00, #00BFFF, #8A2BE2)
```

---

## 📐 KEY DIMENSIONS

```
Canvas: 210mm × 297mm (A4)
Resolution: 300 DPI (2480px × 3508px)

QR Codes:
  Welcome: 30mm   Bronze: 40mm   Silver: 50mm
  Gold: 130mm     Platinum: 60mm  Diamond: 70mm

Seals:
  Welcome: 30mm   Bronze: 40mm   Silver: 50mm
  Gold: 130mm     Platinum: 60mm  Diamond: 70mm

Name Font:
  Welcome: 56pt   Bronze: 62pt   Silver: 68pt
  Gold: 72pt      Platinum: 74pt  Diamond: 80pt
```

---

## 🔐 BLOCKCHAIN CHAINS

```
Welcome:  1 chain (Ethereum)
Bronze:   1 chain (Ethereum)
Silver:   2 chains (Ethereum + Polygon)
Gold:     2 chains (Ethereum + Polygon)
Platinum: 3 chains (Ethereum + Polygon + BSC)
Diamond:  6 chains (ETH + Polygon + BSC + Solana + Avalanche + Cardano)
```

---

## 📂 FILE LOCATIONS

```
Components:
  /frontend/src/components/certificates/
    - PremiumCertificate.tsx (Main wrapper)
    - index.ts (Exports)
    - tiers/
      - WelcomeCertificate.tsx
      - BronzeCertificate.tsx
      - SilverCertificate.tsx
      - GoldCertificate.tsx
      - PlatinumCertificate.tsx
      - DiamondCertificate.tsx

Constants:
  /frontend/src/constants/certificateDesign.ts

Documentation:
  /frontend/src/components/certificates/README.md
  /CERTIFICATE_VISUAL_GUIDE.md
  /CERTIFICATE_QUICK_START.md
  /ALL_TIERS_COMPLETE.md
  /TIER_VISUAL_COMPARISON.md
  /IMPLEMENTATION_CHECKLIST.md

Examples:
  /frontend/src/examples/CertificateIntegration.example.tsx
```

---

## 🚀 COMMON PATTERNS

### Gallery Display
```tsx
const tiers = ['welcome', 'bronze', 'silver', 'gold', 'platinum', 'diamond'];

<div className="grid grid-cols-3 gap-8">
  {tiers.map(tier => (
    <PremiumCertificate key={tier} tier={tier} {...props} />
  ))}
</div>
```

### Dynamic Tier
```tsx
import { getTierByActs } from '@/constants/certificateDesign';

const tier = getTierByActs(user.totalActs); // Returns tier name
<PremiumCertificate tier={tier.toLowerCase()} {...props} />
```

### With Lock State
```tsx
<PremiumCertificate
  tier="gold"
  {...props}
  isLocked={user.totalActs < 50}  // Locked if criteria not met
/>
```

---

## 🎯 FEATURE BUTTONS

```tsx
// Built-in features (automatic):
✅ Click card → Open fullscreen modal
✅ "Download PDF" button → Export 300 DPI PDF
✅ "Share" button → Native share or fallback
✅ QR code → Scan to verify
✅ Lock icon → Shows when isLocked={true}
```

---

## 💡 TIPS

**Performance**:
- Use `lazy()` for code splitting
- Memoize metrics object
- Conditionally render locked certificates

**Styling**:
- Certificates use absolute positioning
- Wrap in container for sizing: `<div style={{width: '300px'}}>`
- Don't override internal styles

**Testing**:
- Test PDF export in production build
- Verify QR codes scan correctly
- Check colors on actual displays
- Print test on photo paper

---

## 🔧 DEPENDENCIES

```bash
npm install qrcode @types/qrcode        # QR generation
# Already installed: html2canvas jspdf framer-motion lucide-react
```

---

## 📚 DOCUMENTATION LINKS

- **Full Docs**: `frontend/src/components/certificates/README.md`
- **Quick Start**: `CERTIFICATE_QUICK_START.md`
- **Visual Guide**: `CERTIFICATE_VISUAL_GUIDE.md`
- **All Tiers**: `ALL_TIERS_COMPLETE.md`
- **Comparison**: `TIER_VISUAL_COMPARISON.md`
- **Checklist**: `IMPLEMENTATION_CHECKLIST.md`

---

## ⚡ QUICK DEBUG

**Certificate not showing?**
→ Check tier name is lowercase

**PDF export failing?**
→ Ensure build includes html2canvas & jspdf

**QR code missing?**
→ Verify qrcode package installed

**Colors look wrong?**
→ Use exact HEX values from constants

**Layout broken?**
→ Ensure container doesn't override absolute positioning

---

## 🎉 READY TO USE!

```tsx
import { PremiumCertificate } from '@/components/certificates';

function MyPage() {
  return (
    <PremiumCertificate
      tier="welcome"
      recipientName="Amazing Person"
      date="February 3, 2026"
      metrics={{
        activities: 1,
        points: 150,
        livesImpacted: 12,
        location: 'Mumbai, Maharashtra',
        firstAct: 'Food Distribution'
      }}
      isLocked={false}
    />
  );
}
```

**That's it! You're ready to create museum-quality certificates!** 💎✨

---

*Keep this card handy for quick reference!* 📌

