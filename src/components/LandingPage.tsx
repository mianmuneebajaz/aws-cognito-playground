import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Database,
  Settings,
  LogIn,
  UserPlus,
  KeyRound,
  Shield,
  Bug,
  ArrowRight,
  CheckCircle,
  Zap,
  Eye,
  Lock,
  Github,
  Linkedin,
  Sparkles,
  Code,
  Terminal,
  Cpu,
} from "lucide-react";
import { ParticleField } from "./animations/ParticleField";
import { GlowingCard } from "./animations/GlowingCard";
import { FloatingElements } from "./animations/FloatingElements";
import { TypewriterText } from "./animations/TypewriterText";
import { InteractiveButton } from "./animations/InteractiveButton";

interface LandingPageProps {
  onEnterTool: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterTool }) => {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const features = [
    {
      icon: Settings,
      title: "Smart Configuration",
      description:
        "Intelligent configuration management with auto-detection and validation for seamless AWS Cognito setup.",
      color: "blue",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: LogIn,
      title: "Advanced Authentication",
      description:
        "Comprehensive authentication testing with real-time token analysis and detailed flow debugging.",
      color: "purple",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: UserPlus,
      title: "User Management",
      description:
        "Streamlined user registration flows with intelligent validation and automated testing capabilities.",
      color: "green",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: KeyRound,
      title: "Security Protocols",
      description:
        "Enterprise-grade password recovery testing with multi-factor authentication and security auditing.",
      color: "pink",
      gradient: "from-pink-500 to-rose-500",
    },
    {
      icon: Shield,
      title: "MFA & Security",
      description:
        "Advanced multi-factor authentication testing with TOTP support and comprehensive security validation.",
      color: "blue",
      gradient: "from-indigo-500 to-blue-500",
    },
    {
      icon: Bug,
      title: "Debug Console",
      description:
        "Powerful debugging console with detailed API logging and comprehensive error analysis tools.",
      color: "purple",
      gradient: "from-violet-500 to-purple-500",
    },
  ];

  const benefits = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "High-performance processing with zero-latency debugging",
      metric: "99.9%",
      metricLabel: "Uptime",
    },
    {
      icon: Eye,
      title: "Crystal Clear",
      description: "Advanced data visualization with real-time insights",
      metric: "100%",
      metricLabel: "Accuracy",
    },
    {
      icon: Lock,
      title: "Secure Testing",
      description: "Military-grade encryption with secure local storage",
      metric: "256-bit",
      metricLabel: "Encryption",
    },
  ];

  const typewriterTexts = [
    "Debug Like a Pro",
    "Test with Confidence",
    "Deploy with Certainty",
    "Scale with Ease",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <ParticleField />
      <FloatingElements />

      {/* Animated Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      {/* Header */}
      <motion.header
        className="relative z-50 bg-black/20 backdrop-blur-xl border-b border-white/10"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
            >
              <div className="relative">
                <Database className="w-8 h-8 text-blue-400" />
                <motion.div
                  className="absolute inset-0 bg-blue-400 rounded-full blur-lg opacity-30"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  AWS Cognito Debug Tool
                </h1>
                <p className="text-sm text-slate-400">
                  Professional Authentication Testing
                </p>
              </div>
            </motion.div>

            <InteractiveButton onClick={onEnterTool} size="md">
              Launch Tool
            </InteractiveButton>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="mb-8"
          >
            <motion.div
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-full text-blue-300 text-sm font-medium mb-8 backdrop-blur-sm"
              whileHover={{ scale: 1.05 }}
            >
              <Sparkles className="w-4 h-4" />
              <span>Powered by AWS Amplify v6.15.1</span>
            </motion.div>

            <h1 className="text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
                Debug AWS Cognito
              </span>
              <br />
              <TypewriterText
                texts={typewriterTexts}
                className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
              />
            </h1>

            <motion.p
              className="text-xl text-slate-300 mb-12 max-w-4xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              Experience the future of AWS Cognito debugging with our
              revolutionary platform. Featuring advanced analysis tools,
              real-time 3D visualizations, and high-speed processing for the
              most comprehensive authentication testing suite ever created.
            </motion.p>
          </motion.div>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <InteractiveButton onClick={onEnterTool} size="lg">
              <Cpu className="w-5 h-5 mr-2" />
              Launch Debug Matrix
            </InteractiveButton>

            <motion.div
              className="flex items-center space-x-2 text-slate-300"
              whileHover={{ scale: 1.05 }}
            >
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span>Zero installation • Secure testing</span>
            </motion.div>
          </motion.div>

          {/* Interactive Demo Preview */}
          <motion.div
            className="relative max-w-6xl mx-auto"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            <GlowingCard className="overflow-hidden" glowColor="blue">
              <div className="bg-gradient-to-br from-slate-900/90 to-purple-900/90 backdrop-blur-xl">
                <div className="bg-black/40 px-6 py-4 flex items-center space-x-2 border-b border-white/10">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-slate-300 text-sm ml-4 font-mono">
                    cognito-debug-matrix.exe
                  </span>
                </div>
                <div className="p-12 min-h-96 flex items-center justify-center relative">
                  <motion.div
                    className="text-center"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <motion.div
                      className="relative mb-6"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      <Database className="w-20 h-20 text-blue-400 mx-auto" />
                      <motion.div
                        className="absolute inset-0 bg-blue-400 rounded-full blur-xl opacity-30"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-white mb-4">
                      Advanced Debug Interface
                    </h3>
                    <p className="text-slate-300 mb-6">
                      Click "Launch Debug Matrix" to enter the testing
                      environment
                    </p>
                    <motion.div
                      className="flex items-center justify-center space-x-4 text-sm text-slate-400"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.5 }}
                    >
                      <div className="flex items-center space-x-1">
                        <Terminal className="w-4 h-4" />
                        <span>Real-time</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Code className="w-4 h-4" />
                        <span>Interactive</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Zap className="w-4 h-4" />
                        <span>High-performance</span>
                      </div>
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </GlowingCard>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Advanced Features
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Professional capabilities that redefine authentication debugging
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <GlowingCard
                  key={index}
                  delay={index * 0.1}
                  glowColor={feature.color}
                  className="p-8 group cursor-pointer"
                  onMouseEnter={() => setHoveredFeature(index)}
                  onMouseLeave={() => setHoveredFeature(null)}
                >
                  <motion.div
                    animate={
                      hoveredFeature === index ? { scale: 1.1 } : { scale: 1 }
                    }
                    transition={{ duration: 0.3 }}
                  >
                    <div
                      className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 relative`}
                    >
                      <Icon className="w-8 h-8 text-white" />
                      <motion.div
                        className="absolute inset-0 bg-white rounded-2xl blur-lg opacity-20"
                        animate={
                          hoveredFeature === index
                            ? { scale: 1.2 }
                            : { scale: 1 }
                        }
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </motion.div>

                  <h3 className="text-xl font-bold text-white mb-4 group-hover:text-blue-300 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-slate-300 leading-relaxed group-hover:text-slate-200 transition-colors">
                    {feature.description}
                  </p>
                </GlowingCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Why Choose Our Debug Tool?
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Experience the next evolution of debugging technology
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <GlowingCard
                  key={index}
                  delay={index * 0.2}
                  className="p-8 text-center group"
                >
                  <motion.div
                    className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 relative"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.8 }}
                  >
                    <Icon className="w-10 h-10 text-white" />
                    <motion.div
                      className="absolute inset-0 bg-white rounded-full blur-xl opacity-20"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.div>

                  <motion.div
                    className="text-3xl font-bold text-blue-400 mb-2"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {benefit.metric}
                  </motion.div>
                  <div className="text-sm text-slate-400 mb-4">
                    {benefit.metricLabel}
                  </div>

                  <h3 className="text-xl font-bold text-white mb-4">
                    {benefit.title}
                  </h3>
                  <p className="text-slate-300">{benefit.description}</p>
                </GlowingCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <GlowingCard className="p-16" glowColor="purple">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  Ready to Start Debugging?
                </span>
              </h2>
              <p className="text-xl text-slate-300 mb-12">
                Join the professional debugging revolution and test like never
                before
              </p>

              <InteractiveButton
                onClick={onEnterTool}
                size="lg"
                className="text-xl px-12 py-6"
              >
                <Sparkles className="w-6 h-6 mr-3" />
                Launch Debug Tool
              </InteractiveButton>
            </motion.div>
          </GlowingCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-black/40 backdrop-blur-xl border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <motion.div
              className="flex items-center space-x-3 mb-6 md:mb-0"
              whileHover={{ scale: 1.05 }}
            >
              <Database className="w-6 h-6 text-blue-400" />
              <span className="text-slate-300 font-medium">
                AWS Cognito Debug Tool
              </span>
            </motion.div>

            <div className="flex items-center space-x-8">
              <span className="text-slate-400 text-sm">
                Developed by{" "}
                <span className="text-white font-medium">Muneeb Ajaz</span>
              </span>
              <div className="flex items-center space-x-4">
                <motion.a
                  href="https://github.com/mianmuneebajaz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Github className="w-5 h-5" />
                  <span className="text-sm">GitHub</span>
                </motion.a>
                <motion.a
                  href="https://linkedin.com/in/mianmuneebajaz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Linkedin className="w-5 h-5" />
                  <span className="text-sm">LinkedIn</span>
                </motion.a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
