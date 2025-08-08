# Content Approval App

A modern content approval system built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## Features

- 🎨 Modern, responsive UI with Tailwind CSS
- 🔐 Supabase authentication and database
- 📝 Content management and approval workflows
- 🎯 TypeScript for type safety
- ⚡ Fast development with Next.js 14
- 🎭 Beautiful animations with Framer Motion
- 📋 Form handling with React Hook Form

## Tech Stack

- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase
- **Authentication:** Supabase Auth
- **Forms:** React Hook Form + Zod
- **Icons:** Lucide React
- **Animations:** Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd content-approval-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://fjxrxxzspjdlfefsnrnx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

4. Get your Supabase credentials:
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Create a new project or use existing one
   - Go to Settings > API
   - Copy the Project URL and anon/public key
   - Update your `.env.local` file

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js 14 app router
│   ├── dashboard/         # Dashboard page
│   ├── content/          # Content management pages
│   ├── approvals/        # Approval workflow pages
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/           # Reusable components
│   ├── ui/              # UI components (Button, etc.)
│   └── layout/          # Layout components (Header, Footer)
├── lib/                 # Utility functions and configurations
│   ├── supabase.ts      # Supabase client configuration
│   └── utils.ts         # Utility functions
└── types/               # TypeScript type definitions
    └── index.ts         # Main type definitions
```

## Key Features

### Content Management
- Create, edit, and organize content
- Draft, pending, approved, and rejected statuses
- Rich text editing capabilities
- File upload support

### Approval Workflow
- Streamlined approval process
- Reviewer assignments
- Status tracking and notifications
- Comments and feedback system

### Dashboard
- Overview of content statistics
- Recent activity feed
- Quick actions for common tasks
- Performance metrics

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Style

This project uses:
- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Tailwind CSS for styling

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
