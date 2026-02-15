

# Video Player Fix, Logo Loading, Breadcrumbs & Supabase Verification Plan

## Build Error Fix (Critical - First)

The "no package.json found" error is caused by a stale `.env` file that was auto-created in a previous edit but no longer exists. The `package.json` file is present and valid. The fix is to ensure the `.env` file exists with the correct Supabase environment variables (it was deleted/missing).

**File:** Create `.env` with the 3 VITE variables.

---

## 1. Video Player Cleanup (MahimaGhostPlayer.tsx)

Based on the uploaded reference image, the current player has unnecessary masking overlays (red circle area on left, white circle on right). The fix:

**Remove these overlay blocks (lines 647-665):**
- The extra solid black strip at bottom (line 648-651)
- The right-side 160px black block (line 652-656)
- The left-side fake share button with "three dots" icon (line 657-665)

**Replace with clean watermark layout:**
- **Left bottom**: Copy the uploaded `Refresh.png` to `src/assets/refresh-logo.png` (replacing existing). Display it at bottom-left (32x32px) over the YouTube share button area. Use `pointer-events: auto` so it blocks clicks on YouTube's share.
- **Right bottom**: Keep "Mahima Academy" text watermark (already exists in the gradient bar).
- **Expand display area**: The gradient bar height stays at 56px but remove redundant black blocks that eat into the video display area. The video iframe will now use the full aspect-video container.

**Updated watermark section (lines 622-665) becomes:**
```
- Full-width gradient bar at bottom: 0 (height 48px instead of 56px for more video space)
- Left side: Refresh.png logo (32x32) + clickable blocker over YouTube share
- Right side: "Mahima Academy" text
- No extra black strips or fake three-dot menus
```

---

## 2. Replace Loading Spinner Logo

**File:** Copy uploaded `Refresh.png` to `src/assets/refresh-logo.png` (overwrite existing).

**File:** `src/components/ui/loading-spinner.tsx`
- Replace `animate-spin` with `mahima-loader-logo` class (pulse animation instead of spin -- more professional).
- Add the ring effect (`mahima-loader-ring`) around it.

**File:** `src/App.tsx` (PageLoader)
- Replace `mahimaLogo` import with `refreshLogo` from `@/assets/refresh-logo.png`.
- Keep the existing pulse animation.

**File:** `src/pages/Dashboard.tsx` (loading state)
- Same: use `refreshLogo` instead of `mahimaLogo` for the loader.

---

## 3. Breadcrumbs: All Classes > Subject > Chapter > Content

The breadcrumb chain is already partially implemented. Minor modifications needed:

**`src/pages/AllClasses.tsx`** - Already has: `Dashboard > All Classes`. No change needed.

**`src/pages/ChapterView.tsx`** - Currently: `All Classes > [Course Title]`. 
- Add "Overview / Syllabus" as a label concept (the tab bar already shows "Chapters" and "Study Material" tabs -- this serves the "Overview Syllabus" concept).
- Breadcrumb stays: `All Classes > [Subject Name] > Chapters`.

**`src/pages/LectureListing.tsx`** - Already has: `All Classes > [Course] > [Chapter]`. 
- Verify it shows content tabs (Lectures, PDFs, DPP, Notes, Tests) correctly.

**`src/pages/Courses.tsx`** - Needs breadcrumbs added:
- Add: `Dashboard > Courses`
- When clicking a course, same flow as All Classes: navigate to `/classes/{id}/chapters`

**`src/pages/MyCourseDetail.tsx`** - Already has breadcrumbs via `<Breadcrumbs>` component. Verify chain: `My Courses > [Course Name] > [Content]`.

---

## 4. Courses Page: Same Structure as All Classes

**File:** `src/pages/Courses.tsx`

Currently shows a grid of CourseCards. Modify to match AllClasses structure:
- Add breadcrumb: `Dashboard > Courses`
- Add BatchSelector (if applicable)
- Keep existing enrollment-based routing logic (free/enrolled -> chapters, paid -> buy)
- Add search and sort controls matching AllClasses

---

## 5. Admin Upload Connection Verification

**File:** `src/pages/Admin.tsx`

The admin panel already has:
- Chapter selection dropdown (line 77-78)
- Link vs File toggle (line 79)
- Content types: VIDEO, PDF, DPP, NOTES, TEST (line 73)
- Supabase insert logic for lessons

Verify and fix:
- Ensure `chapter_id` is included in the Supabase insert when uploading content
- Ensure all 5 types (Video, PDF, DPP, Notes, Test) appear in the content listing tab
- Ensure inline edit saves correctly via Supabase update

---

## 6. UnifiedVideoPlayer: Apply Same Watermark Fix

**File:** `src/components/video/UnifiedVideoPlayer.tsx`

The `BrandingOverlay` component (line 127-138) already shows "Mahima Academy" branding. Update:
- Add Refresh.png logo on left side of the overlay
- Keep "Mahima Academy" on right side

---

## Files to Modify/Create

| File | Changes |
|---|---|
| `.env` | Recreate with VITE_SUPABASE variables (fixes build) |
| `src/assets/refresh-logo.png` | Copy uploaded Refresh.png (overwrite) |
| `src/components/video/MahimaGhostPlayer.tsx` | Remove extra black blocks, clean watermark with Refresh.png left + Mahima Academy right |
| `src/components/video/UnifiedVideoPlayer.tsx` | Update BrandingOverlay with Refresh.png |
| `src/components/ui/loading-spinner.tsx` | Replace spin animation with pulse animation |
| `src/App.tsx` | Use Refresh.png for PageLoader |
| `src/pages/Dashboard.tsx` | Use Refresh.png for loading state |
| `src/pages/Courses.tsx` | Add breadcrumbs, search, BatchSelector matching AllClasses |
| `src/pages/Admin.tsx` | Verify chapter_id in upload, fix any missing fields |

## End-to-End Verification Steps

After implementation:
1. **Admin login** (naveenbharatprism@gmail.com / Ceomahima26) -> verify "Welcome back!" toast
2. **Admin /admin** -> stats cards clickable, upload tab with chapter selection
3. **Student login** (anujkumar75yadav@gmail.com / 12345678) -> verify dashboard with BatchSelector
4. **All Classes** -> filter by batch -> click subject -> chapters -> content (breadcrumb chain works)
5. **Courses** -> same flow with breadcrumbs
6. **Video player** -> clean watermark, Refresh.png on left, "Mahima Academy" on right, no red/white circles
7. **Loading screens** -> Refresh.png with pulse animation (not spin)

## What Will NOT Change
- Authentication logic
- Payment/enrollment flow
- Sidebar navigation
- Landing page design
- Video player custom controls (play/pause/seek/volume/speed)

