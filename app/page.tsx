"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Check, X, Sparkles, Users, Target, Rocket, Award, ChevronRight, Menu, Play, ArrowRight } from "lucide-react"
import USP from "@/components/USP";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Mentors from "@/components/Mentors";
import Benefits from "@/components/Benefits";
import Skills from "@/components/Skills";
import Pricing from "@/components/Pricing";
import Certificate from "@/components/Certificate";
import Authority from "@/components/Authority";
import FinalCTA from "@/components/FinalCTA";
import FAQ from "@/components/FAQ";
import AboutPage from "@/components/AboutPage";
import { ScrollDownButton } from "@radix-ui/react-select";
import Footer from "@/components/Footer";

export default function DigitalMadarsaLanding() {
  const [isScrolled, setIsScrolled] = useState(false)

  const tools = [
    "MailChimp",
    "Yoast SEO",
    "Elementor",
    "DaVinci Resolve",
    "Photoshop",
    "Substack",
    "Snovio",
    "WordPress",
    "Kit",
    "HubSpot",
    "Payoneer",
    "Calendly",
    "RankMath",
    "Smartlead",
    "Klaviyo",
    "Clipchamp",
  ]

  const aiTools = [
    "ChatGPT",
    "DeepSeek",
    "Google Gemini",
    "Claude",
    "Midjourney",
    "Runway",
    "Adobe Firefly",
    "DALL·E",
    "Descript",
    "ElevenLabs",
    "Leonardo AI",
    "Perplexity",
    "Jasper",
    "Notion AI",
    "Canva AI",
  ]

  const skills = [
    {
      number: "1",
      title: "Content Creation King",
      icon: "🎬",
      description: "Learn the science of attention. Script writing. Viral storytelling. Reel mastery.",
      tagline: "Become the creator brands want to hire in 2026.",
    },
    {
      number: "2",
      title: "YouTube Thumbnail Champ",
      icon: "🎨",
      description: "Thumbnails that stop the scroll. Design psychology. CTR strategy. AI-enhanced workflow.",
      tagline: "Dominate YouTube visuals like a pro.",
    },
    {
      number: "3",
      title: "Social Media Manager Pro",
      icon: "📱",
      description: "Master content calendars, brand identity, growth systems, and analytics.",
      tagline: "Learn how top agencies manage ₹1 crore+ brand accounts.",
    },
    {
      number: "4",
      title: "WordPress Domination",
      icon: "💻",
      description: "Build websites that look expensive. From landing pages to full business sites.",
      tagline: "Learn from a global full-stack engineer.",
    },
    {
      number: "5",
      title: "Email Boss",
      icon: "✉️",
      description: "Email marketing. Automation. Copywriting. Retention systems used by million-dollar brands.",
      tagline: "Because email will still be king in 2026.",
    },
  ]

  const mentors = [
    {
      name: "Shruti Singh",
      role: "Social Media & Email Marketing Strategist",
      bio: "Being an Indian and living in Canada as a Freelancer is the best decision of my life. I've managed global clients across multiple industries.",
      image: "/placeholder.svg?height=400&width=400",
    },
    {
      name: "Saima Riyaz",
      role: "YouTube Thumbnail & Visual Design Expert",
      bio: "For me Niqab never became a barrier from becoming an expert in this skill. I've worked with international creators, producing high-CTR thumbnails.",
      image: "/placeholder.svg?height=400&width=400",
    },
    {
      name: "Sohel Shaikh",
      role: "Senior Full Stack Engineer & WordPress Expert",
      bio: "Since last 4 years I've been part of this industry. I've built high-end websites for clients in the US, UK, and UAE.",
      image: "/placeholder.svg?height=400&width=400",
    },
    {
      name: "Tipu Khan",
      role: "Content Creation Specialist & Founder",
      bio: "I'm a content creator with 8 years of experience in creating videos, short-movies, ads, scroll-stopping ideas, scripts, and storytelling.",
      image: "/placeholder.svg?height=400&width=400",
    },
  ]

  const faqs = [
    {
      question: "Is this platform for Everyone?",
      answer: "Yes, it's for everyone who wants to work hard and achieve financial freedom.",
    },
    {
      question: "Do I need experience?",
      answer: "No. Everything starts from beginner level.",
    },
    {
      question: "Will I learn AI?",
      answer: "Yes. Every skill includes AI training.",
    },
    {
      question: "Can I get international clients?",
      answer: "Absolutely. We teach proven global client acquisition methods.",
    },
    {
      question: "Is this a one-time payment?",
      answer: "Yes. One yearly payment → access to all skills + all future skills.",
    },
    {
      question: "Is the content updated?",
      answer: "Yes. Regular updates for 2026 and beyond.",
    },
    {
      question: "Can I learn from phone?",
      answer: "Yes. 100% mobile-friendly.",
    },
  ]

  const [activeView, setActiveView] = useState<'home' | 'about'>('home');
  const [featuredPlan, setFeaturedPlan] = useState<any>(null);

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#about') {
        setActiveView('about');
        window.scrollTo(0, 0);
      } else {
        setActiveView('home');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial check

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Fetch featured plan
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await fetch('https://dm-backend.copybykhan.workers.dev/api/v1/subscription-plans');
        if (res.ok) {
          const data = await res.json();
          // Find featured plan or first one
          const featured = data.items.find((p: any) => p.is_featured) || data.items[0];
          setFeaturedPlan(featured);
        }
      } catch (err) {
        console.error("Failed to fetch plans", err);
      }
    };
    fetchPlan();
  }, []);


  return (
    <div className="min-h-screen flex flex-col w-full bg-offWhite">
      <Navbar onNavigate={(view) => setActiveView(view)} currentView={activeView} />

      <main className="flex-grow">
        {activeView === 'home' ? (
          <>
            <Hero />
            <Skills />
            <USP />
            <Mentors />
            <Benefits />
            <Pricing plan={featuredPlan} />
            <Certificate />
            <Authority />
            <FinalCTA plan={featuredPlan} />
            <FAQ />
          </>
        ) : (
          <AboutPage />
        )}
      </main>

      {/*<ScrollDownButton />*/}
      <Footer />
    </div>
  )
}
