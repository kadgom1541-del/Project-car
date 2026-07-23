# Project Guidelines & Tech Stack

## Tech Stack
- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **UI/UX**: shadcn/ui components, Lucide React
- **Data Grid & Tables**: TanStack Table (สำหรับจัดการข้อมูลในตารางจำนวนมากๆ เช่น สต๊อกสินค้า หรือรายชื่อลูกค้า)
- **Forms & Validation**: React Hook Form + Zod
- **State Management**: Zustand (สำหรับจัดการข้อมูลชั่วคราวระหว่างหน้าเว็บ เช่น ตะกร้าสินค้า หรือฟอร์มใบเสนอราคาที่กำลังพิมพ์)
- **Date & Time**: date-fns หรือ Day.js (สำหรับคำนวณและจัดรูปแบบวันที่ วันครบกำหนดชำระเงิน ในเอกสาร)
- **Charts**: Recharts (ผ่าน shadcn/ui Charts)
- **Backend & DB**: Supabase (PostgreSQL) พร้อมใช้ Triggers สำหรับ Real-time calculation
- **Auth**: Supabase Auth + RLS (Row Level Security)
- **Storage**: Supabase Storage
- **PDF Generation**: @react-pdf/renderer
- **Code Quality & Tooling**: ESLint + Prettier ควบคู่กับ GitHub (เพื่อคุมมาตรฐานและจัดระเบียบโค้ด)
- **Hosting**: Render
