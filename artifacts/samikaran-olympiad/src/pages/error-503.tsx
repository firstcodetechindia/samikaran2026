import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Home, RefreshCw, Clock, Wrench, HardDrive } from "lucide-react";
import { Link } from "wouter";

export default function ServiceUnavailable() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
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
              rotate: [0, 360],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          >
            {i % 3 === 0 && <Clock className="w-12 h-12 text-amber-400/20" />}
            {i % 3 === 1 && <Wrench className="w-16 h-16 text-yellow-400/20" />}
            {i % 3 === 2 && <HardDrive className="w-10 h-10 text-orange-400/20" />}
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
              <rect x="140" y="100" width="120" height="140" rx="10" fill="#F59E0B" />
              <rect x="150" y="110" width="100" height="80" rx="5" fill="#1F2937" />
              
              <motion.g
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <circle cx="165" cy="125" r="5" fill="#EF4444" />
                <circle cx="180" cy="125" r="5" fill="#F59E0B" />
                <circle cx="195" cy="125" r="5" fill="#10B981" />
              </motion.g>
              
              <motion.text
                x="200"
                y="170"
                textAnchor="middle"
                fill="#F59E0B"
                fontSize="24"
                fontWeight="bold"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                503
              </motion.text>
              
              <rect x="160" y="200" width="80" height="8" rx="2" fill="#374151" />
              <rect x="160" y="212" width="80" height="8" rx="2" fill="#374151" />
              <rect x="160" y="224" width="80" height="8" rx="2" fill="#374151" />
            </motion.g>
            
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "320px 150px" }}
            >
              <circle cx="320" cy="150" r="30" fill="none" stroke="#F59E0B" strokeWidth="4" strokeDasharray="10 5" />
              <circle cx="320" cy="150" r="15" fill="#F59E0B" />
            </motion.g>
            
            <motion.g
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <rect x="60" y="140" width="50" height="30" rx="5" fill="#F59E0B" />
              <circle cx="75" cy="155" r="8" fill="white" />
              <rect x="88" y="150" width="15" height="10" fill="white" />
            </motion.g>
          </svg>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            Under Maintenance
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
            We're performing scheduled maintenance.
            <br />
            Please check back in a few minutes!
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button 
            size="lg" 
            className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
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
