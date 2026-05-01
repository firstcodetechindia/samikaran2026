import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Home, Search, ArrowLeft, BookOpen, GraduationCap } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
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
            {i % 3 === 0 && <BookOpen className="w-12 h-12 text-primary/20" />}
            {i % 3 === 1 && <GraduationCap className="w-16 h-16 text-purple-400/20" />}
            {i % 3 === 2 && <Search className="w-10 h-10 text-pink-400/20" />}
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
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <rect x="100" y="80" width="200" height="160" rx="10" fill="currentColor" className="text-primary/90" />
              <rect x="110" y="90" width="180" height="130" rx="5" fill="currentColor" className="text-white dark:text-gray-800" />
              <rect x="140" y="220" width="120" height="10" rx="2" fill="currentColor" className="text-gray-400" />
              <rect x="180" y="230" width="40" height="30" fill="currentColor" className="text-gray-400" />
            </motion.g>

            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <text x="200" y="145" textAnchor="middle" className="fill-primary text-4xl font-bold" style={{ fontSize: "48px" }}>
                404
              </text>
              <motion.text
                x="200"
                y="175"
                textAnchor="middle"
                className="fill-muted-foreground"
                style={{ fontSize: "14px" }}
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Page not found
              </motion.text>
            </motion.g>

            <motion.g
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ transformOrigin: "60px 120px" }}
            >
              <circle cx="60" cy="120" r="25" fill="currentColor" className="text-yellow-400" />
              <circle cx="52" cy="115" r="3" fill="currentColor" className="text-gray-800" />
              <circle cx="68" cy="115" r="3" fill="currentColor" className="text-gray-800" />
              <path d="M 50 130 Q 60 125 70 130" stroke="currentColor" strokeWidth="2" fill="none" className="text-gray-800" />
            </motion.g>

            <motion.path
              d="M 320 100 L 340 80 M 350 120 L 370 120 M 330 150 L 350 170"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              className="text-primary/60"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.8, duration: 1 }}
            />

            <motion.circle
              cx="350"
              cy="60"
              r="8"
              fill="currentColor"
              className="text-yellow-400"
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </svg>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Oops! Lost in the Learning Journey
          </h1>
          <p className="text-muted-foreground mb-8 text-lg">
            The page you're looking for seems to have taken a study break. 
            Let's get you back on track!
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="gap-2" data-testid="button-go-home">
              <Link href="/">
                <Home className="w-4 h-4" />
                Go to Homepage
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="gap-2" 
              data-testid="button-go-back"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 text-sm text-muted-foreground"
        >
          Need help? Contact{" "}
          <a href="mailto:support@samikaranolympiad.com" className="text-primary hover:underline">
            support@samikaranolympiad.com
          </a>
        </motion.p>
      </div>
    </div>
  );
}
