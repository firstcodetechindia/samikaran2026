import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Home, LogIn, KeyRound, User, Shield } from "lucide-react";
import { Link } from "wouter";

export default function Unauthorized() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 30}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          >
            {i % 3 === 0 && <KeyRound className="w-12 h-12 text-blue-400/20" />}
            {i % 3 === 1 && <User className="w-16 h-16 text-indigo-400/20" />}
            {i % 3 === 2 && <Shield className="w-10 h-10 text-purple-400/20" />}
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 max-w-lg mx-4 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="mb-8"
        >
          <svg viewBox="0 0 400 300" className="w-full max-w-md mx-auto">
            <motion.ellipse
              cx="200"
              cy="260"
              rx="120"
              ry="20"
              fill="currentColor"
              className="text-gray-200 dark:text-gray-700"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.3 }}
            />
            
            <motion.g
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <rect x="120" y="80" width="160" height="160" rx="20" fill="#6366F1" />
              <rect x="130" y="90" width="140" height="120" rx="10" fill="white" />
              
              <motion.g
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <circle cx="200" cy="140" r="25" fill="#EEF2FF" stroke="#6366F1" strokeWidth="3" />
                <circle cx="200" cy="135" r="8" fill="#6366F1" />
                <path d="M185 155 Q200 170 215 155" fill="#6366F1" />
              </motion.g>
              
              <motion.rect
                x="165"
                y="175"
                width="70"
                height="25"
                rx="5"
                fill="#E0E7FF"
                stroke="#6366F1"
                strokeWidth="2"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <text x="200" y="192" textAnchor="middle" fill="#6366F1" fontSize="10" fontWeight="bold">LOGIN</text>
              
              <rect x="180" y="220" width="40" height="30" fill="#9CA3AF" />
            </motion.g>
            
            <motion.g
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6, type: "spring" }}
            >
              <circle cx="300" cy="100" r="25" fill="#F59E0B" />
              <rect x="295" y="85" width="10" height="20" fill="white" rx="2" />
              <circle cx="300" cy="115" r="4" fill="white" />
            </motion.g>
          </svg>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            Authentication Required
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
            Please log in to access this page.
            <br />
            Your session may have expired.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/login">
            <Button size="lg" className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white">
              <LogIn className="w-4 h-4" />
              Log In
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" size="lg" className="gap-2">
              <Home className="w-4 h-4" />
              Go to Homepage
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
