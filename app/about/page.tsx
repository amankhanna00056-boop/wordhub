// app/about/page.tsx
"use client";

import React, { useEffect, useState, useRef, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
// ✅ Fixed import path - using relative path like your original code
import { db, auth } from "../firebase";
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged,
  User 
} from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { 
  BookOpenIcon, 
  SparklesIcon, 
  AcademicCapIcon, 
  PencilSquareIcon,
  HeartIcon,
  EnvelopeIcon,
  CheckBadgeIcon
} from "@heroicons/react/24/outline";

// ============================================
// TYPES & INTERFACES
// ============================================
interface WordStats {
  total: number;
  categories: number;
}

interface Feature {
  icon: React.ReactNode;
  title: string;
  items: string[];
  color: string;
}

interface Testimonial {
  name: string;
  role: string;
  text: string;
  avatar: string;
}

interface TeamMember {
  name: string;
  role: string;
  icon: string;
  color: string;
}

interface RoadmapItem {
  status: "completed" | "in-progress" | "planned";
  title: string;
  description: string;
}

interface TechStack {
  name: string;
  icon: string;
  color: string;
}

// ============================================
// CONSTANTS
// ============================================
const FEATURES: Feature[] = [
  {
    icon: <BookOpenIcon className="w-8 h-8" />,
    title: "Dictionary",
    items: [
      "Word Definitions",
      "Pronunciation Guide",
      "Synonyms & Antonyms",
      "Example Sentences",
    ],
    color: "bg-blue-500/20 border-blue-500/30",
  },
  {
    icon: <SparklesIcon className="w-8 h-8" />,
    title: "Word Games",
    items: [
      "Daily Word Scramble",
      "Unscrambler Tool",
      "Word Finder",
      "Anagram Solver",
    ],
    color: "bg-purple-500/20 border-purple-500/30",
  },
  {
    icon: <PencilSquareIcon className="w-8 h-8" />,
    title: "Writing Tools",
    items: [
      "Rhyming Dictionary",
      "Word Counter",
      "Letter Counter",
      "Text Analyzer",
    ],
    color: "bg-green-500/20 border-green-500/30",
  },
  {
    icon: <AcademicCapIcon className="w-8 h-8" />,
    title: "Learning",
    items: [
      "Vocabulary Builder",
      "Flashcards System",
      "Daily Quiz",
      "Word of the Day",
    ],
    color: "bg-yellow-500/20 border-yellow-500/30",
  },
];

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Sarah Johnson",
    role: "English Teacher",
    text: "WordHub has transformed how my students learn vocabulary. The games and quizzes keep them engaged!",
    avatar: "👩‍🏫",
  },
  {
    name: "Michael Chen",
    role: "Software Engineer",
    text: "I use WordHub daily to improve my vocabulary. The word scramble game is my favorite!",
    avatar: "👨‍💻",
  },
  {
    name: "Emma Wilson",
    role: "University Student",
    text: "The dictionary is comprehensive and the flashcard system helped me ace my IELTS exam!",
    avatar: "👩‍🎓",
  },
];

const TEAM_MEMBERS: TeamMember[] = [
  { name: "Aman Khanna", role: "Founder & Developer", icon: "👨‍💻", color: "bg-blue-500/20" },
  { name: "Simran Kaur", role: "UX Designer", icon: "👩‍🎨", color: "bg-purple-500/20" },
  { name: "Raj Singh", role: "Content Manager", icon: "📝", color: "bg-green-500/20" },
];

const REASONS = [
  { icon: "⚡", title: "Fast Search", description: "Instant results" },
  { icon: "📚", title: "100K+ Words", description: "Huge database" },
  { icon: "🔍", title: "Powerful Filters", description: "Advanced search" },
  { icon: "🌙", title: "Dark Mode", description: "Easy on eyes" },
  { icon: "📱", title: "Mobile Friendly", description: "Responsive design" },
  { icon: "⭐", title: "Save Favorites", description: "Bookmark words" },
  { icon: "🎯", title: "Free to Use", description: "No hidden charges" },
  { icon: "🔄", title: "Sync Anywhere", description: "Across devices" },
];

const ROADMAP: RoadmapItem[] = [
  { status: "completed", title: "Dictionary", description: "Complete word lookup" },
  { status: "completed", title: "Word Finder", description: "Search & filter" },
  { status: "completed", title: "Unscrambler", description: "Word games" },
  { status: "in-progress", title: "AI Assistant", description: "Smart suggestions" },
  { status: "in-progress", title: "Grammar Checker", description: "Writing help" },
  { status: "planned", title: "Mobile App", description: "iOS & Android" },
  { status: "planned", title: "Browser Extension", description: "Chrome & Firefox" },
];

const USERS = [
  { icon: "👨‍🎓", label: "Students" },
  { icon: "📝", label: "Writers" },
  { icon: "👨‍🏫", label: "Teachers" },
  { icon: "🎮", label: "Gamers" },
  { icon: "📖", label: "English Learners" },
  { icon: "💼", label: "Professionals" },
];

const TECH_STACK: TechStack[] = [
  { name: "Next.js", icon: "▲", color: "text-white" },
  { name: "Firebase", icon: "🔥", color: "text-yellow-400" },
  { name: "TypeScript", icon: "TS", color: "text-blue-400" },
  { name: "Tailwind CSS", icon: "🎨", color: "text-cyan-400" },
  { name: "Dictionary API", icon: "📚", color: "text-green-400" },
];

// ============================================
// CUSTOM HOOKS
// ============================================
const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { user, loading };
};

const useWordStats = () => {
  const [stats, setStats] = useState<WordStats>({ total: 0, categories: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const snapshot = await getDocs(collection(db, "words"));
        const words = snapshot.docs.map((doc) => doc.data());
        const categories = new Set(words.map((w) => w.category || "General"));
        setStats({ total: snapshot.size, categories: categories.size });
      } catch (error) {
        console.error("Error fetching stats:", error);
        setStats({ total: 12500, categories: 48 });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return { stats, loading };
};

// ============================================
// COMPONENTS
// ============================================
const AnimatedCounter = memo(({ 
  target, 
  label, 
  suffix = "" 
}: { 
  target: number; 
  label: string; 
  suffix?: string;
}) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const duration = 2000;
    const step = Math.max(1, Math.floor(target / 60));

    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 30);

    return () => clearInterval(timer);
  }, [isVisible, target]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-5xl font-extrabold text-yellow-400">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-gray-300 font-medium mt-1">{label}</div>
    </div>
  );
});

AnimatedCounter.displayName = 'AnimatedCounter';

const SectionBadge = ({ 
  children, 
  color = "yellow" 
}: { 
  children: React.ReactNode; 
  color?: "yellow" | "blue" | "purple" | "green" | "pink" | "indigo" | "orange" | "cyan" | "red" | "amber";
}) => {
  const colorMap = {
    yellow: "bg-yellow-400/20 border-yellow-400/30 text-yellow-400",
    blue: "bg-blue-500/20 border-blue-500/30 text-blue-400",
    purple: "bg-purple-500/20 border-purple-500/30 text-purple-400",
    green: "bg-green-500/20 border-green-500/30 text-green-400",
    pink: "bg-pink-500/20 border-pink-500/30 text-pink-400",
    indigo: "bg-indigo-500/20 border-indigo-500/30 text-indigo-400",
    orange: "bg-orange-500/20 border-orange-500/30 text-orange-400",
    cyan: "bg-cyan-500/20 border-cyan-500/30 text-cyan-400",
    red: "bg-red-500/20 border-red-500/30 text-red-400",
    amber: "bg-amber-500/20 border-amber-500/30 text-amber-400",
  };

  return (
    <div className={`inline-block px-6 py-2 rounded-full border font-semibold text-sm mb-6 ${colorMap[color]}`}>
      {children}
    </div>
  );
};

const SectionTitle = ({ 
  children, 
  highlight 
}: { 
  children: string; 
  highlight?: string;
}) => {
  if (highlight && children.includes(highlight)) {
    const parts = children.split(highlight);
    return (
      <h2 className="text-4xl md:text-5xl font-bold">
        <span className="text-white">{parts[0]}</span>
        <span className="text-yellow-400">{highlight}</span>
        <span className="text-white">{parts[1]}</span>
      </h2>
    );
  }
  
  return (
    <h2 className="text-4xl md:text-5xl font-bold text-white">
      {children}
    </h2>
  );
};

const NewsletterSection = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      // Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setStatus({ type: 'success', message: "✅ Thank you! You're now subscribed!" });
      setEmail("");
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      setStatus({ type: 'error', message: "❌ Something went wrong. Please try again." });
    }
  }, [email]);

  return (
    <section className="py-20 px-5 bg-slate-800/30 border-y border-slate-700">
      <div className="max-w-2xl mx-auto text-center">
        <SectionBadge color="amber">📬 Stay Updated</SectionBadge>
        <SectionTitle highlight="Newsletter">Subscribe to Our Newsletter</SectionTitle>
        <p className="text-gray-300 mb-8 mt-4">
          Get word of the day, learning tips, and new features directly in your inbox.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="flex-1 p-4 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-gray-400 focus:outline-none focus:border-yellow-400 transition"
          />
          <button
            type="submit"
            className="px-6 py-4 bg-yellow-400 text-slate-900 rounded-xl font-bold hover:bg-yellow-300 transition"
          >
            Subscribe 🔔
          </button>
        </form>

        {status && (
          <p className={`mt-4 font-semibold animate-fadeIn ${
            status.type === 'success' ? 'text-green-400' : 'text-red-400'
          }`}>
            {status.message}
          </p>
        )}
      </div>
    </section>
  );
};

// ============================================
// MAIN PAGE COMPONENT
// ============================================
export default function AboutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { stats, loading: statsLoading } = useWordStats();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = useCallback(async () => {
    setIsSigningIn(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      console.log("✅ Signed in:", result.user.displayName);
      router.push("/dictionary");
    } catch (error: any) {
      console.error("❌ Sign in error:", error);
      const errorMessages: Record<string, string> = {
        "auth/popup-closed-by-user": "Sign-in cancelled. Please try again.",
        "auth/popup-blocked": "Popup blocked! Please allow popups for this site.",
      };
      alert(errorMessages[error.code] || "Failed to sign in. Please try again.");
    } finally {
      setIsSigningIn(false);
    }
  }, [router]);

  const handleGetStarted = useCallback(() => {
    if (user) {
      router.push("/dictionary");
    } else {
      handleSignIn();
    }
  }, [user, router, handleSignIn]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* ===== HERO SECTION ===== */}
      <section className="relative py-24 px-5 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-yellow-400 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-5xl mx-auto">
          <div className="inline-block px-6 py-2 bg-yellow-400/20 border border-yellow-400/30 rounded-full text-yellow-400 font-semibold text-sm mb-6 animate-pulse">
            📚 Welcome to WordHub
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
            <span className="text-white">Learn Smarter.</span>
            <span className="text-yellow-400 block mt-2">Play Better.</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400 block mt-2">
              Build Your Vocabulary.
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            WordHub is an all-in-one English dictionary, word finder, and 
            vocabulary learning platform designed for students, writers, 
            teachers, gamers, and English learners.
          </p>
          
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <button
              onClick={handleGetStarted}
              disabled={isSigningIn || authLoading}
              className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 rounded-xl font-bold text-lg hover:from-yellow-300 hover:to-yellow-400 transition transform hover:scale-105 disabled:opacity-50 shadow-lg shadow-yellow-500/30"
            >
              {isSigningIn ? (
                <>
                  <span className="inline-block animate-spin mr-2">⟳</span>
                  Signing in...
                </>
              ) : user ? (
                "🚀 Go to Dictionary"
              ) : (
                "🚀 Sign in with Google"
              )}
            </button>
            
            <button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 bg-slate-700 border border-slate-600 rounded-xl font-bold text-lg hover:bg-slate-600 transition text-white"
            >
              📖 Learn More
            </button>
          </div>

          {user && (
            <div className="mt-6 text-sm text-gray-300 animate-fadeIn">
              👋 Welcome, <span className="text-yellow-400 font-bold">{user.displayName}</span>!
            </div>
          )}
        </div>
      </section>

      {/* ===== STATISTICS ===== */}
      <section className="bg-slate-800/30 py-16 px-5 border-y border-slate-700">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <AnimatedCounter target={stats.total || 0} label="Words Available" />
          <AnimatedCounter target={stats.categories || 0} label="Categories" />
          <AnimatedCounter target={100} label="Free to Use" suffix="%" />
          <AnimatedCounter target={24} label="Always Available" suffix="/7" />
        </div>
      </section>

      {/* ===== MISSION SECTION ===== */}
      <section className="py-20 px-5 max-w-5xl mx-auto text-center">
        <SectionBadge color="blue">🎯 Our Mission</SectionBadge>
        <SectionTitle highlight="Simple">Making Learning Simple, Fast & Enjoyable</SectionTitle>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed mt-6">
          We believe everyone should have access to a free, powerful, and modern 
          dictionary with interactive learning tools that make vocabulary building 
          fun and effective.
        </p>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="py-20 px-5 bg-slate-800/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <SectionBadge color="purple">✨ What You Can Do</SectionBadge>
            <SectionTitle highlight="Platform">All-in-One Word Platform</SectionTitle>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-2xl border ${feature.color} backdrop-blur-sm hover:scale-105 transition duration-300`}
              >
                <div className="text-yellow-400 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                <ul className="space-y-2 text-gray-300">
                  {feature.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckBadgeIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-gray-200">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WHY CHOOSE ===== */}
      <section className="py-20 px-5 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <SectionBadge color="green">⭐ Why Choose Us</SectionBadge>
          <SectionTitle highlight="WordHub">Why WordHub?</SectionTitle>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {REASONS.map((reason, idx) => (
            <div
              key={idx}
              className="bg-slate-800/50 p-6 rounded-xl text-center hover:bg-slate-700/50 transition hover:scale-105 border border-slate-700/50"
            >
              <div className="text-3xl mb-2">{reason.icon}</div>
              <h4 className="font-bold text-white">{reason.title}</h4>
              <p className="text-sm text-gray-400">{reason.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-20 px-5 bg-slate-800/20">
        <div className="max-w-5xl mx-auto text-center">
          <SectionBadge color="pink">💬 Testimonials</SectionBadge>
          <SectionTitle highlight="Users">What Our Users Say</SectionTitle>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {TESTIMONIALS.map((testimonial, idx) => (
              <div
                key={idx}
                className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 hover:border-yellow-400/50 transition"
              >
                <div className="text-4xl mb-3">{testimonial.avatar}</div>
                <p className="text-gray-200 text-sm italic">"{testimonial.text}"</p>
                <h4 className="font-bold text-white mt-4">{testimonial.name}</h4>
                <p className="text-gray-400 text-xs">{testimonial.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TEAM ===== */}
      <section className="py-20 px-5 max-w-4xl mx-auto text-center">
        <SectionBadge color="indigo">👥 Meet the Team</SectionBadge>
        <SectionTitle highlight="❤️">Built with ❤️ by</SectionTitle>

        <div className="flex flex-wrap justify-center gap-6 mt-12">
          {TEAM_MEMBERS.map((member, idx) => (
            <div
              key={idx}
              className={`${member.color} p-6 rounded-2xl border border-slate-700 min-w-[150px] hover:scale-105 transition`}
            >
              <div className="text-4xl mb-2">{member.icon}</div>
              <h4 className="font-bold text-white">{member.name}</h4>
              <p className="text-gray-300 text-xs">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== ROADMAP ===== */}
      <section className="py-20 px-5 bg-slate-800/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <SectionBadge color="orange">🚀 Roadmap</SectionBadge>
            <SectionTitle highlight="Journey">Our Journey Ahead</SectionTitle>
          </div>

          <div className="space-y-4">
            {ROADMAP.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 bg-slate-800/60 p-4 rounded-xl hover:bg-slate-700/50 transition border border-slate-700"
              >
                <span className="text-2xl">
                  {item.status === "completed" ? "✅" : item.status === "in-progress" ? "🔄" : "⏳"}
                </span>
                <div className="flex-1 text-left">
                  <h4 className="font-bold text-white">{item.title}</h4>
                  <p className="text-sm text-gray-300">{item.description}</p>
                </div>
                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                  item.status === "completed" 
                    ? "bg-green-500/20 text-green-400" 
                    : item.status === "in-progress"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-gray-500/20 text-gray-400"
                }`}>
                  {item.status === "completed" ? "Live" : item.status === "in-progress" ? "In Progress" : "Planned"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== VISION ===== */}
      <section className="py-20 px-5 max-w-4xl mx-auto text-center">
        <SectionBadge color="cyan">🌍 Our Vision</SectionBadge>
        <SectionTitle highlight="Global">A Global Word-Learning Ecosystem</SectionTitle>
        <p className="text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto mt-6">
          Our vision is to become one of the world's most useful word-learning 
          platforms by combining dictionaries, vocabulary tools, AI, and 
          educational games in one place.
        </p>
      </section>

      {/* ===== WHO USES ===== */}
      <section className="py-20 px-5 bg-slate-800/20">
        <div className="max-w-4xl mx-auto text-center">
          <SectionBadge color="pink">👥 Who Uses WordHub</SectionBadge>
          <SectionTitle highlight="Everyone">Built for Everyone</SectionTitle>

          <div className="flex flex-wrap justify-center gap-4 mt-12">
            {USERS.map((user, idx) => (
              <div
                key={idx}
                className="bg-slate-800 px-6 py-4 rounded-xl border border-slate-700 hover:border-yellow-400/50 transition hover:scale-105"
              >
                <span className="text-2xl mr-2">{user.icon}</span>
                <span className="font-medium text-white">{user.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TECH STACK ===== */}
      <section className="py-20 px-5 max-w-4xl mx-auto text-center">
        <SectionBadge color="cyan">⚙️ Technologies</SectionBadge>
        <SectionTitle highlight="Tech">Built with Modern Tech</SectionTitle>

        <div className="flex flex-wrap justify-center gap-4 mt-12">
          {TECH_STACK.map((tech, idx) => (
            <div
              key={idx}
              className="bg-slate-800 px-6 py-4 rounded-xl border border-slate-700 flex items-center gap-3 hover:scale-105 transition"
            >
              <span className={`text-2xl ${tech.color}`}>{tech.icon}</span>
              <span className="font-semibold text-white">{tech.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ===== NEWSLETTER ===== */}
      <NewsletterSection />

      {/* ===== CONTACT ===== */}
      <section className="py-20 px-5 bg-slate-800/20">
        <div className="max-w-2xl mx-auto text-center">
          <SectionBadge color="red">📬 Contact Us</SectionBadge>
          <SectionTitle highlight="Help">Need Help?</SectionTitle>
          
          <div className="space-y-4 mt-6">
            <p className="flex items-center justify-center gap-3 text-gray-200">
              <EnvelopeIcon className="w-6 h-6 text-yellow-400" />
              support@wordhub.com
            </p>
            <p className="flex items-center justify-center gap-3 text-gray-200">
              <EnvelopeIcon className="w-6 h-6 text-yellow-400" />
              feedback@wordhub.com
            </p>
          </div>

          <div className="mt-8 p-6 bg-slate-800/50 rounded-xl border border-slate-700">
            <p className="text-gray-300 text-sm">
              💡 Have suggestions? We'd love to hear from you!
            </p>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-8 px-5 text-center border-t border-slate-700/50 bg-slate-900">
        <div className="flex justify-center gap-6 text-2xl mb-4">
          <span className="hover:scale-125 transition cursor-pointer" role="button" aria-label="Twitter">🐦</span>
          <span className="hover:scale-125 transition cursor-pointer" role="button" aria-label="Facebook">📘</span>
          <span className="hover:scale-125 transition cursor-pointer" role="button" aria-label="Instagram">📸</span>
          <span className="hover:scale-125 transition cursor-pointer" role="button" aria-label="LinkedIn">💼</span>
        </div>
        <p className="text-gray-400">
          Made with <HeartIcon className="w-4 h-4 inline text-red-500" /> for English learners.
        </p>
        <p className="text-sm text-gray-500 mt-1">
          WordHub © {new Date().getFullYear()}
        </p>
      </footer>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </main>
  );
}