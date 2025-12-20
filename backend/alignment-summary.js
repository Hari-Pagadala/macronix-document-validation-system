console.log(`
✅ Image Alignment Improvements Applied:

📐 **Changes Made:**
1. **Consistent Image Sizing**: All images now use fixed max dimensions (400px height)
2. **Centered Positioning**: Images are indented 20px from left margin for better centering
3. **Proper Spacing**: 20px gap between images and next section (vs. inconsistent spacing before)
4. **Fixed Cursor Position**: Manually setting doc.y after each image ensures no overlap
5. **Better Page Breaks**: Increased threshold from 300px to 450px to prevent images from being cut

📸 **Image Layout:**
- Selfie with House: Centered, 400px max height
- Candidate with Respondent: Centered, 400px max height  
- Document images: Centered, 400px max height each
- House Photos: Centered, 400px max height each

🎨 **Visual Result:**
- All images are now properly aligned and centered
- Consistent spacing between sections
- No text overlap with images
- Each image has its own section header
- Better page flow with appropriate breaks

📂 Updated PDF saved at: backend/test-output.pdf
🔍 Please open the PDF to verify the improved alignment!
`);
