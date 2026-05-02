import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, ShieldX, Lock, Ban } from "lucide-react";
import { Link } from "wouter";

export default function Forbidden() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
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
            {i % 3 === 0 && <ShieldX className="w-12 h-12 text-red-400/20" />}
            {i % 3 === 1 && <Lock className="w-16 h-16 text-orange-400/20" />}
            {i % 3 === 2 && <Ban className="w-10 h-10 text-pink-400/20" />}
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
              <rect x="120" y="80" width="160" height="160" rx="20" fill="#EF4444" />
              <rect x="130" y="90" width="140" height="120" rx="10" fill="white" />
              
              <motion.g
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <circle cx="200" cy="150" r="35" fill="#FEE2E2" stroke="#EF4444" strokeWidth="3" />
                <line x1="180" y1="130" x2="220" y2="170" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" />
                <line x1="220" y1="130" x2="180" y2="170" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" />
              </motion.g>
              
              <rect x="180" y="220" width="40" height="30" fill="#9CA3AF" />
            </motion.g>
            
            <motion.g
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <circle cx="80" cy="120" r="30" fill="#F97316" />
              <rect x="70" y="110" width="20" height="20" fill="white" rx="2" />
              <circle cx="80" cy="145" r="4" fill="white" />
            </motion.g>
          </svg>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            Access Denied!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
            You don't have permission to access this resource.
            <br />
            Please contact support if you believe this is an error.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/">
            <Button size="lg" className="gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white">
              <Home className="w-4 h-4" />
              Go to Homepage
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="lg" 
            className="gap-2"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
