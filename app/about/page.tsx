"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
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
  UserGroupIcon,
  GlobeAltIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";

interface WordStats {
  total: number;
  categories: number;
}

// ============================
// COUNTER ANIMATION
// ============================
const AnimatedCounter = ({ target, label, suffix = "" }: { target: number; label: string; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

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
};

// ============================
// TESTIMONIALS
// ============================
const testimonials = [
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

// ============================
// TEAM MEMBERS
// ============================
const teamMembers = [
  { name: "Aman Khanna", role: "Founder & Developer", icon: "👨‍💻", color: "bg-blue-500/20" },
  { name: "Simran Kaur", role: "UX Designer", icon: "👩‍🎨", color: "bg-purple-500/20" },
  { name: "Raj Singh", role: "Content Manager", icon: "📝", color: "bg-green-500/20" },
];

// ============================
// MAIN COMPONENT
// ============================
export default function AboutPage() {
  const router = useRouter();
  const [stats, setStats] = useState<WordStats>({ total: 0, categories: 0 });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState("");

  // ── Auth State ──
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // ── Fetch Stats ──
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const snapshot = await getDocs(collection(db, "words"));
        const words = snapshot.docs.map((doc) => doc.data());
        
        const categories = new Set(
          words.map((w) => w.category || "General")
        );

        setStats({
          total: snapshot.size,
          categories: categories.size,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
        setStats({ total: 12500, categories: 48 });
      }
      setLoading(false);
    };

    fetchStats();
  }, []);

  // ── Sign in with Google ──
  const signInWithGoogle = async () => {
    setAuthLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("✅ Signed in:", user.displayName);
      router.push("/dictionary");
    } catch (error: any) {
      console.error("❌ Sign in error:", error);
      if (error.code === "auth/popup-closed-by-user") {
        alert("Sign-in cancelled. Please try again.");
      } else if (error.code === "auth/popup-blocked") {
        alert("Popup blocked! Please allow popups for this site.");
      } else {
        alert("Failed to sign in. Please try again.");
      }
    }
    setAuthLoading(false);
  };

  // ── Navigation ──
  const goToDictionary = () => {
    if (user) {
      router.push("/dictionary");
    } else {
      signInWithGoogle();
    }
  };

  // ── Newsletter Signup ──
  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setNewsletterStatus("✅ Thank you! You're now subscribed!");
      setEmail("");
      setTimeout(() => setNewsletterStatus(""), 3000);
    }
  };

  // ── Features Data ──
  const features = [
    {
      icon: <BookOpenIcon className="w-8 h-8" />,
      title: "📖 Dictionary",
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
      title: "🎮 Word Games",
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
      title: "✍ Writing Tools",
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
      title: "🎓 Learning",
      items: [
        "Vocabulary Builder",
        "Flashcards System",
        "Daily Quiz",
        "Word of the Day",
      ],
      color: "bg-yellow-500/20 border-yellow-500/30",
    },
  ];

  const reasons = [
    { icon: "⚡", title: "Fast Search", desc: "Instant results" },
    { icon: "📚", title: "100K+ Words", desc: "Huge database" },
    { icon: "🔍", title: "Powerful Filters", desc: "Advanced search" },
    { icon: "🌙", title: "Dark Mode", desc: "Easy on eyes" },
    { icon: "📱", title: "Mobile Friendly", desc: "Responsive design" },
    { icon: "⭐", title: "Save Favorites", desc: "Bookmark words" },
    { icon: "🎯", title: "Free to Use", desc: "No hidden charges" },
    { icon: "🔄", title: "Sync Anywhere", desc: "Across devices" },
  ];

  const roadmap = [
    { status: "✅", title: "Dictionary", desc: "Complete word lookup" },
    { status: "✅", title: "Word Finder", desc: "Search & filter" },
    { status: "✅", title: "Unscrambler", desc: "Word games" },
    { status: "🔄", title: "AI Assistant", desc: "Smart suggestions" },
    { status: "🔄", title: "Grammar Checker", desc: "Writing help" },
    { status: "🔄", title: "Mobile App", desc: "iOS & Android" },
    { status: "🔄", title: "Browser Extension", desc: "Chrome & Firefox" },
  ];

  const users = [
    { icon: "👨‍🎓", label: "Students" },
    { icon: "📝", label: "Writers" },
    { icon: "👨‍🏫", label: "Teachers" },
    { icon: "🎮", label: "Gamers" },
    { icon: "📖", label: "English Learners" },
    { icon: "💼", label: "Professionals" },
  ];

  const techStack = [
    { name: "Next.js", icon: "▲", color: "text-white" },
    { name: "Firebase", icon: "🔥", color: "text-yellow-400" },
    { name: "TypeScript", icon: "TS", color: "text-blue-400" },
    { name: "Tailwind CSS", icon: "🎨", color: "text-cyan-400" },
    { name: "Dictionary API", icon: "📚", color: "text-green-400" },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      
      {/* ===== HERO SECTION ===== */}
      <section className="relative py-24 px-5 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-yellow-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
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
              onClick={goToDictionary}
              disabled={authLoading}
              className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 rounded-xl font-bold text-lg hover:from-yellow-300 hover:to-yellow-400 transition transform hover:scale-105 disabled:opacity-50 shadow-lg shadow-yellow-500/30"
            >
              {authLoading ? (
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

      {/* ===== STATISTICS (Animated Counters) ===== */}
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
        <div className="inline-block px-6 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-400 font-semibold text-sm mb-6">
          🎯 Our Mission
        </div>
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          <span className="text-white">Making Learning</span>
          <span className="text-yellow-400"> Simple</span>, 
          <span className="text-green-400"> Fast</span> & 
          <span className="text-blue-400"> Enjoyable</span>
        </h2>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
          We believe everyone should have access to a free, powerful, and modern 
          dictionary with interactive learning tools that make vocabulary building 
          fun and effective.
        </p>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="py-20 px-5 bg-slate-800/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block px-6 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-400 font-semibold text-sm mb-4">
              ✨ What You Can Do
            </div>
            <h2 className="text-4xl md:text-5xl font-bold">
              <span className="text-white">All-in-One</span>
              <span className="text-yellow-400"> Word Platform</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-2xl border ${feature.color} backdrop-blur-sm hover:scale-105 transition duration-300`}
              >
                <div className="text-yellow-400 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                <ul className="space-y-2 text-gray-300">
                  {feature.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckBadgeIcon className="w-4 h-4 text-green-400" />
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
          <div className="inline-block px-6 py-2 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 font-semibold text-sm mb-4">
            ⭐ Why Choose Us
          </div>
          <h2 className="text-4xl md:text-5xl font-bold">
            <span className="text-white">Why</span>
            <span className="text-yellow-400"> WordHub</span>?
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {reasons.map((reason, idx) => (
            <div
              key={idx}
              className="bg-slate-800/50 p-6 rounded-xl text-center hover:bg-slate-700/50 transition hover:scale-105 border border-slate-700/50"
            >
              <div className="text-3xl mb-2">{reason.icon}</div>
              <h4 className="font-bold text-white">{reason.title}</h4>
              <p className="text-sm text-gray-400">{reason.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-20 px-5 bg-slate-800/20">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block px-6 py-2 bg-pink-500/20 border border-pink-500/30 rounded-full text-pink-400 font-semibold text-sm mb-4">
            💬 Testimonials
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-12">
            <span className="text-white">What Our</span>
            <span className="text-yellow-400"> Users Say</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, idx) => (
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
        <div className="inline-block px-6 py-2 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-indigo-400 font-semibold text-sm mb-4">
          👥 Meet the Team
        </div>
        <h2 className="text-4xl md:text-5xl font-bold mb-12">
          <span className="text-white">Built with</span>
          <span className="text-yellow-400"> ❤️</span>
          <span className="text-white"> by</span>
        </h2>

        <div className="flex flex-wrap justify-center gap-6">
          {teamMembers.map((member, idx) => (
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
            <div className="inline-block px-6 py-2 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-400 font-semibold text-sm mb-4">
              🚀 Roadmap
            </div>
            <h2 className="text-4xl md:text-5xl font-bold">
              <span className="text-white">Our</span>
              <span className="text-yellow-400"> Journey</span>
              <span className="text-white"> Ahead</span>
            </h2>
          </div>

          <div className="space-y-4">
            {roadmap.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 bg-slate-800/60 p-4 rounded-xl hover:bg-slate-700/50 transition border border-slate-700"
              >
                <span className="text-2xl">{item.status}</span>
                <div className="flex-1 text-left">
                  <h4 className="font-bold text-white">{item.title}</h4>
                  <p className="text-sm text-gray-300">{item.desc}</p>
                </div>
                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                  item.status === "✅" 
                    ? "bg-green-500/20 text-green-400" 
                    : "bg-yellow-500/20 text-yellow-400"
                }`}>
                  {item.status === "✅" ? "Live" : "Coming Soon"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== VISION ===== */}
      <section className="py-20 px-5 max-w-4xl mx-auto text-center">
        <div className="inline-block px-6 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-cyan-400 font-semibold text-sm mb-6">
          🌍 Our Vision
        </div>
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          <span className="text-white">A</span>
          <span className="text-yellow-400"> Global</span>
          <span className="text-white"> Word-Learning</span>
          <span className="text-green-400"> Ecosystem</span>
        </h2>
        <p className="text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto">
          Our vision is to become one of the world's most useful word-learning 
          platforms by combining dictionaries, vocabulary tools, AI, and 
          educational games in one place.
        </p>
      </section>

      {/* ===== WHO USES ===== */}
      <section className="py-20 px-5 bg-slate-800/20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block px-6 py-2 bg-pink-500/20 border border-pink-500/30 rounded-full text-pink-400 font-semibold text-sm mb-4">
            👥 Who Uses WordHub
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-12">
            <span className="text-white">Built for</span>
            <span className="text-yellow-400"> Everyone</span>
          </h2>

          <div className="flex flex-wrap justify-center gap-4">
            {users.map((user, idx) => (
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
        <div className="inline-block px-6 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-cyan-400 font-semibold text-sm mb-6">
          ⚙️ Technologies
        </div>
        <h2 className="text-4xl md:text-5xl font-bold mb-12">
          <span className="text-white">Built with</span>
          <span className="text-yellow-400"> Modern</span>
          <span className="text-white"> Tech</span>
        </h2>

        <div className="flex flex-wrap justify-center gap-4">
          {techStack.map((tech, idx) => (
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
      <section className="py-20 px-5 bg-slate-800/30 border-y border-slate-700">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-block px-6 py-2 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-400 font-semibold text-sm mb-6">
            📬 Stay Updated
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-white">Subscribe to Our</span>
            <span className="text-yellow-400"> Newsletter</span>
          </h2>
          <p className="text-gray-300 mb-8">
            Get word of the day, learning tips, and new features directly in your inbox.
          </p>

          <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
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

          {newsletterStatus && (
            <p className="mt-4 text-green-400 font-semibold animate-fadeIn">{newsletterStatus}</p>
          )}
        </div>
      </section>

      {/* ===== CONTACT ===== */}
      <section className="py-20 px-5 bg-slate-800/20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-block px-6 py-2 bg-red-500/20 border border-red-500/30 rounded-full text-red-400 font-semibold text-sm mb-6">
            📬 Contact Us
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-white">Need</span>
            <span className="text-yellow-400"> Help</span>?
          </h2>
          
          <div className="space-y-4">
            <p className="flex items-center justify-center gap-3 text-gray-200">
              <EnvelopeIcon className="w-6 h-6 text-yellow-400" />
              support@wordhub.com
            </p>
            <p className="flex items-center justify-center gap-3 text-gray-200">
              <ChatBubbleLeftRightIcon className="w-6 h-6 text-yellow-400" />
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
          <span className="hover:scale-125 transition cursor-pointer">🐦</span>
          <span className="hover:scale-125 transition cursor-pointer">📘</span>
          <span className="hover:scale-125 transition cursor-pointer">📸</span>
          <span className="hover:scale-125 transition cursor-pointer">💼</span>
        </div>
        <p className="text-gray-400">
          Made with <HeartIcon className="w-4 h-4 inline text-red-500" /> for English learners.
        </p>
        <p className="text-sm text-gray-500 mt-1">
          WordHub © {new Date().getFullYear()}
        </p>
      </footer>

      {/* ── Custom Animations ── */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </main>
  );
}