# Shine Frontend

Video testimonial platform frontend built with Next.js 15, TypeScript, and Tailwind CSS.

## Features

- **Dynamic Interview Sessions**: Questions are dynamically loaded per session (not hardcoded)
- **Brand Customization**: Full theming with custom colors, fonts, button styles, and corner radius
- **Light/Dark Mode**: Toggle between warm cream and deep black backgrounds with localStorage persistence
- **Responsive Design**: Mobile-first approach with desktop optimizations
- **Face Guide Overlay**: SVG guide for proper camera positioning (hidden when recording)
- **Progress Tracking**: Visual progress bar with dynamic time estimates
- **Question Navigation**: Navigate through questions with redo functionality
- **Real-time Customization**: Brand changes update immediately with CSS custom properties

## Tech Stack

- **Next.js 15**: App Router, Server Components, TypeScript
- **Tailwind CSS**: Utility-first styling with custom theme extension
- **Lucide React**: Icon library
- **React Context**: State management for theme and interview state

## Project Structure

```
shine-frontend/
├── app/
│   ├── interview/
│   │   └── [session_id]/
│   │       └── page.tsx          # Dynamic interview page
│   ├── layout.tsx                 # Root layout with fonts
│   ├── page.tsx                   # Homepage with demo links
│   └── globals.css                # Tailwind + global styles
├── components/
│   ├── interview/
│   │   ├── QuestionsSidebar.tsx   # Left sidebar (desktop only)
│   │   ├── MainContent.tsx        # Right content area
│   │   ├── BrandPanel.tsx         # Brand customization panel
│   │   ├── CompanyBranding.tsx    # Logo + company name
│   │   ├── QuestionsList.tsx      # Questions list
│   │   ├── SidebarActions.tsx     # Theme toggle + Redo button
│   │   ├── ProgressBar.tsx        # Progress bar + time estimate
│   │   ├── QuestionDisplay.tsx    # Current question + intent
│   │   ├── VideoContainer.tsx     # Video + face guide
│   │   ├── FaceGuide.tsx          # SVG overlay
│   │   ├── CameraStatus.tsx       # Status badge
│   │   └── RecordingControls.tsx  # Buttons + device controls
│   └── providers/
│       ├── ThemeProvider.tsx      # Theme context + state
│       └── InterviewProvider.tsx  # Interview state management
├── lib/
│   ├── hooks/
│   │   ├── useTheme.ts            # Theme hook
│   │   ├── useInterview.ts        # Interview state hook
│   │   ├── useBrandCustomization.ts # Brand customization hook
│   │   └── useLocalStorage.ts     # LocalStorage hook
│   ├── types/
│   │   ├── interview.ts           # Interview types
│   │   └── theme.ts               # Theme types
│   ├── constants/
│   │   └── mockSessions.ts        # Mock data for development
│   └── utils/
│       └── sessionHelpers.ts      # Session utilities
└── public/                        # Static assets

```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## Demo Sessions

Three mock sessions are available for testing:

- **session_abc123**: Acme Corp - 12 questions (gradient button style)
- **session_xyz789**: TechStartup Inc - 5 questions (solid button style, custom colors)
- **session_demo**: Demo Company - 6 questions (default theme)

Access them at:
- http://localhost:3000/interview/session_abc123
- http://localhost:3000/interview/session_xyz789
- http://localhost:3000/interview/session_demo

## Architecture

### Dynamic Questions

Questions are provided per session, not hardcoded:

```typescript
// Each session has its own question set
const session = {
  session_id: "session_abc123",
  company_name: "Acme Corp",
  questions: [
    // Dynamic array of questions selected for this campaign
  ]
}
```

### State Management

- **ThemeProvider**: Manages light/dark mode with localStorage persistence
- **InterviewProvider**: Manages interview state (current question, recording status, navigation)
- **useBrandCustomization**: Manages brand customization with real-time CSS variable updates

### Styling

- Tailwind CSS for utility-first styling
- CSS Custom Properties for dynamic brand customization
- All original CSS variables mapped to tailwind.config.ts
- Dark mode using Tailwind's `class` strategy

## Brand Customization

The BrandPanel allows real-time customization of:

- **Brand Assets**: Light/dark mode logos
- **Color System**: Primary, Secondary, Tertiary colors
- **Button Style**: Solid or Gradient
- **Corner Radius**: 5 options (4px to 24px)
- **Typography**: 8 Google Fonts

All changes are saved to localStorage and applied via CSS custom properties.

## Future Backend Integration

To connect to a real backend:

1. Replace `getMockSession()` in `app/interview/[session_id]/page.tsx` with an API call:

```typescript
// Current (mock data):
const session = getMockSession(sessionId);

// Future (real API):
const session = await fetch(`/api/sessions/${sessionId}`).then(r => r.json());
```

2. Update the `InterviewProvider` to save completed recordings to the backend

3. Connect brand customization to campaign settings

## Notes for Backend Integration

- Session ID comes from URL parameter `[session_id]`
- Questions array is dynamic (not a fixed set of 12)
- Brand customization can be pre-loaded from campaign settings
- Recording state transitions: Ready → Recording → Processing → Completed

## License

Proprietary - All rights reserved
